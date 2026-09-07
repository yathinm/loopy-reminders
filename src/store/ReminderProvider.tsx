import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React, { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { advanceRule, nextOccurrence } from '@/domain/recurrence';
import { Reminder, ReminderDraft, ReminderList } from '@/domain/types';
import { fetchAppSetting, fetchLists, fetchReminders, INBOX_ID, removeOrphanedTags, saveAppSetting } from '@/data/database';
import { addNotificationResponseListener, cancelReminderNotification, COMPLETE_ACTION, configureNotifications, getScheduledNotificationIds, scheduleReminderNotification, snoozeNotification, SNOOZE_ACTION } from '@/services/notifications';

type ReminderContextValue = {
  reminders: Reminder[];
  deletedReminders: Reminder[];
  lists: ReminderList[];
  notepad: string;
  loading: boolean;
  error: string | null;
  saveReminder: (draft: ReminderDraft, id?: string) => Promise<string>;
  deleteReminder: (id: string) => Promise<void>;
  restoreReminder: (id: string) => Promise<void>;
  permanentlyDeleteReminder: (id: string) => Promise<void>;
  toggleReminder: (id: string, completed?: boolean) => Promise<void>;
  toggleFlag: (id: string) => Promise<void>;
  createList: (name: string, color: string, symbol: string) => Promise<string>;
  updateList: (id: string, name: string, color: string, symbol: string) => Promise<void>;
  deleteList: (id: string) => Promise<void>;
  saveNotepad: (content: string) => Promise<void>;
};

const ReminderContext = createContext<ReminderContextValue | null>(null);

export function ReminderProvider({ children }: PropsWithChildren) {
  const router = useRouter();
  const db = useSQLiteContext();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [deletedReminders, setDeletedReminders] = useState<Reminder[]>([]);
  const [lists, setLists] = useState<ReminderList[]>([]);
  const [notepad, setNotepad] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      await db.runAsync("DELETE FROM reminders WHERE deleted_at IS NOT NULL AND deleted_at <= datetime('now', '-30 days')");
      await removeOrphanedTags(db);
      const [nextReminders, nextDeletedReminders, nextLists, nextNotepad] = await Promise.all([
        fetchReminders(db), fetchReminders(db, true), fetchLists(db), fetchAppSetting(db, 'notepad'),
      ]);
      setReminders(nextReminders); setDeletedReminders(nextDeletedReminders); setLists(nextLists); setNotepad(nextNotepad); setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load reminders.');
    } finally { setLoading(false); }
  }, [db]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const updateNotificationId = useCallback(async (id: string, notificationId: string | null) => {
    await db.runAsync('UPDATE reminders SET notification_id = ? WHERE id = ?', notificationId, id);
  }, [db]);

  const reconcileNotifications = useCallback(async () => {
    const pendingIds = new Set(await getScheduledNotificationIds());
    for (const reminder of await fetchReminders(db)) {
      const shouldSchedule = Boolean(reminder.dueAt && reminder.hasTime && !reminder.isCompleted && new Date(reminder.dueAt).getTime() > Date.now());
      if (shouldSchedule && (!reminder.notificationId || !pendingIds.has(reminder.notificationId))) {
        const notificationId = await scheduleReminderNotification(reminder, false);
        await updateNotificationId(reminder.id, notificationId);
      } else if (!shouldSchedule && reminder.notificationId) {
        await cancelReminderNotification(reminder.notificationId);
        await updateNotificationId(reminder.id, null);
      }
    }
  }, [db, updateNotificationId]);

  const saveReminder = useCallback(async (draft: ReminderDraft, existingId?: string) => {
    const title = draft.title.trim();
    if (!title) throw new Error('A reminder title is required.');
    const id = existingId ?? Crypto.randomUUID();
    const existing = reminders.find((item) => item.id === id);
    const now = new Date().toISOString();
    const dueAt = draft.dueAt?.toISOString() ?? null;
    const seriesId = draft.recurrence ? existing?.seriesId ?? Crypto.randomUUID() : null;

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT INTO reminders (id,title,notes,created_at,updated_at,due_at,has_time,is_completed,completed_at,priority,is_flagged,sort_order,list_id,recurrence_json,series_id,notification_id)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
         ON CONFLICT(id) DO UPDATE SET title=excluded.title,notes=excluded.notes,updated_at=excluded.updated_at,due_at=excluded.due_at,has_time=excluded.has_time,priority=excluded.priority,is_flagged=excluded.is_flagged,list_id=excluded.list_id,recurrence_json=excluded.recurrence_json,series_id=excluded.series_id`,
        id, title, draft.notes.trim(), existing?.createdAt ?? now, now, dueAt, draft.hasTime ? 1 : 0,
        existing?.isCompleted ? 1 : 0, existing?.completedAt ?? null, draft.priority, draft.isFlagged ? 1 : 0,
        existing?.sortOrder ?? Date.now(), draft.listId || INBOX_ID, draft.recurrence ? JSON.stringify(draft.recurrence) : null,
        seriesId, existing?.notificationId ?? null,
      );
      await db.runAsync('DELETE FROM reminder_tags WHERE reminder_id = ?', id);
      for (const rawName of [...new Set(draft.tagNames.map((name) => name.trim()).filter(Boolean))]) {
        const normalized = rawName.toLocaleLowerCase();
        const tag = await db.getFirstAsync<{ id: string }>('SELECT id FROM tags WHERE normalized_name = ?', normalized);
        const tagId = tag?.id ?? Crypto.randomUUID();
        if (!tag) await db.runAsync('INSERT INTO tags (id,name,normalized_name) VALUES (?,?,?)', tagId, rawName, normalized);
        await db.runAsync('INSERT INTO reminder_tags (reminder_id,tag_id) VALUES (?,?)', id, tagId);
      }
      await removeOrphanedTags(db);
    });

    const saved = (await fetchReminders(db)).find((item) => item.id === id)!;
    await cancelReminderNotification(existing?.notificationId ?? null);
    const notificationId = await scheduleReminderNotification(saved).catch(() => null);
    await updateNotificationId(id, notificationId);
    await refresh();
    const needsNotification = Boolean(saved.dueAt && saved.hasTime && !saved.isCompleted && new Date(saved.dueAt).getTime() > Date.now());
    if (needsNotification && !notificationId) throw new Error('Reminder saved, but notifications are unavailable. Allow notifications for Loopy and try again.');
    return id;
  }, [db, refresh, reminders, updateNotificationId]);

  const deleteReminder = useCallback(async (id: string) => {
    const existing = reminders.find((item) => item.id === id);
    await cancelReminderNotification(existing?.notificationId ?? null);
    await db.runAsync('UPDATE reminders SET deleted_at=?, notification_id=NULL, updated_at=? WHERE id=?', new Date().toISOString(), new Date().toISOString(), id);
    await refresh();
  }, [db, refresh, reminders]);

  const restoreReminder = useCallback(async (id: string) => {
    await db.runAsync('UPDATE reminders SET deleted_at=NULL, updated_at=? WHERE id=?', new Date().toISOString(), id);
    await refresh(); await reconcileNotifications();
  }, [db, refresh, reconcileNotifications]);

  const permanentlyDeleteReminder = useCallback(async (id: string) => {
    await db.runAsync('DELETE FROM reminders WHERE id=?', id);
    await removeOrphanedTags(db); await refresh();
  }, [db, refresh]);

  const toggleReminder = useCallback(async (id: string, completed?: boolean) => {
    const item = (await fetchReminders(db)).find((reminder) => reminder.id === id);
    if (!item) return;
    const nextCompleted = completed ?? !item.isCompleted;
    const now = new Date().toISOString();
    await db.withTransactionAsync(async () => {
      if (!nextCompleted && item.recurrence && item.seriesId) {
        const spawned = await db.getFirstAsync<{ id: string; created_at: string; updated_at: string }>(
          'SELECT id, created_at, updated_at FROM reminders WHERE series_id=? AND due_at>? AND is_completed=0 ORDER BY due_at ASC LIMIT 1',
          item.seriesId, item.dueAt ?? now,
        );
        if (spawned && spawned.created_at === spawned.updated_at) await db.runAsync('DELETE FROM reminders WHERE id=?', spawned.id);
      }
      await db.runAsync('UPDATE reminders SET is_completed=?, completed_at=?, updated_at=?, notification_id=NULL WHERE id=?', nextCompleted ? 1 : 0, nextCompleted ? now : null, now, id);
      if (nextCompleted && item.recurrence && item.dueAt) {
        let cursor = new Date(item.dueAt);
        let nextRule = item.recurrence;
        let nextDate = nextOccurrence(cursor, nextRule);
        while (nextDate && nextDate.getTime() <= Date.now()) {
          cursor = nextDate;
          nextRule = advanceRule(nextRule);
          nextDate = nextOccurrence(cursor, nextRule);
        }
        const staleSpawned = await db.getAllAsync<{ id: string }>(
          'SELECT id FROM reminders WHERE series_id=? AND due_at<=? AND is_completed=0 AND created_at=updated_at',
          item.seriesId, now,
        );
        for (const stale of staleSpawned) await db.runAsync('DELETE FROM reminders WHERE id=?', stale.id);
        const existingNext = item.seriesId ? await db.getFirstAsync<{ id: string }>(
          'SELECT id FROM reminders WHERE series_id=? AND due_at>? LIMIT 1', item.seriesId, now,
        ) : null;
        if (nextDate && !existingNext) {
          const nextId = Crypto.randomUUID();
          nextRule = advanceRule(nextRule);
          await db.runAsync(
            `INSERT INTO reminders (id,title,notes,created_at,updated_at,due_at,has_time,priority,is_flagged,sort_order,list_id,recurrence_json,series_id)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            nextId, item.title, item.notes, now, now, nextDate.toISOString(), item.hasTime ? 1 : 0,
            item.priority, item.isFlagged ? 1 : 0, Date.now(), item.listId, JSON.stringify(nextRule), item.seriesId ?? Crypto.randomUUID(),
          );
          for (const tag of item.tags) await db.runAsync('INSERT INTO reminder_tags (reminder_id,tag_id) VALUES (?,?)', nextId, tag.id);
        }
      }
    });
    await cancelReminderNotification(item.notificationId);
    if (nextCompleted) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await reconcileNotifications(); await refresh();
 }, [db, reconcileNotifications, refresh]);

  const toggleFlag = useCallback(async (id: string) => {
    await db.runAsync('UPDATE reminders SET is_flagged = CASE is_flagged WHEN 1 THEN 0 ELSE 1 END, updated_at=? WHERE id=?', new Date().toISOString(), id);
    await refresh();
  }, [db, refresh]);

  useEffect(() => {
    void configureNotifications().then(reconcileNotifications).catch(() => undefined);
    const subscription = addNotificationResponseListener((actionIdentifier, reminderId) => {
      if (actionIdentifier !== COMPLETE_ACTION && actionIdentifier !== SNOOZE_ACTION) {
        router.push(`/reminder/${reminderId}`);
        return;
      }
      if (actionIdentifier === COMPLETE_ACTION) void toggleReminder(reminderId, true);
      if (actionIdentifier === SNOOZE_ACTION) {
        const reminder = reminders.find((item) => item.id === reminderId);
        if (reminder) void snoozeNotification(reminder).then((notificationId) => updateNotificationId(reminder.id, notificationId)).then(refresh);
      }
    });
    return () => subscription.remove();
  }, [reconcileNotifications, refresh, reminders, router, toggleReminder, updateNotificationId]);

  const createList = useCallback(async (name: string, color: string, symbol: string) => {
    const id = Crypto.randomUUID(); const now = new Date().toISOString();
    await db.runAsync('INSERT INTO lists (id,name,color,symbol,sort_order,is_inbox,created_at,updated_at) VALUES (?,?,?,?,?,0,?,?)', id, name.trim(), color, symbol, Date.now(), now, now);
    await refresh(); return id;
  }, [db, refresh]);

  const updateList = useCallback(async (id: string, name: string, color: string, symbol: string) => {
    await db.runAsync('UPDATE lists SET name=?,color=?,symbol=?,updated_at=? WHERE id=?', name.trim(), color, symbol, new Date().toISOString(), id);
    await refresh();
  }, [db, refresh]);

  const deleteList = useCallback(async (id: string) => {
    if (id === INBOX_ID) return;
    await db.withTransactionAsync(async () => {
      await db.runAsync('UPDATE reminders SET list_id=? WHERE list_id=?', INBOX_ID, id);
      await db.runAsync('DELETE FROM lists WHERE id=?', id);
    });
    await refresh();
  }, [db, refresh]);

  const saveNotepad = useCallback(async (content: string) => {
    setNotepad(content);
    await saveAppSetting(db, 'notepad', content);
  }, [db]);

  const value = useMemo(() => ({ reminders, deletedReminders, lists, notepad, loading, error, saveReminder, deleteReminder, restoreReminder, permanentlyDeleteReminder, toggleReminder, toggleFlag, createList, updateList, deleteList, saveNotepad }), [reminders, deletedReminders, lists, notepad, loading, error, saveReminder, deleteReminder, restoreReminder, permanentlyDeleteReminder, toggleReminder, toggleFlag, createList, updateList, deleteList, saveNotepad]);
  return <ReminderContext.Provider value={value}>{children}</ReminderContext.Provider>;
}

export function useReminders(): ReminderContextValue {
  const context = useContext(ReminderContext);
  if (!context) throw new Error('useReminders must be used inside ReminderProvider');
  return context;
}
