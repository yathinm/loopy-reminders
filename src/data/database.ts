import type { SQLiteDatabase } from 'expo-sqlite';
import { Reminder, ReminderList, ReminderTag } from '@/domain/types';

const INBOX_ID = '35a389b4-c524-48ac-ba7f-2dd4c7c49601';

export async function migrateDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY NOT NULL);
    CREATE TABLE IF NOT EXISTS lists (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      symbol TEXT NOT NULL,
      sort_order REAL NOT NULL,
      is_inbox INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL CHECK(length(trim(title)) > 0),
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      due_at TEXT,
      has_time INTEGER NOT NULL DEFAULT 0,
      is_completed INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT,
      priority INTEGER NOT NULL DEFAULT 0 CHECK(priority BETWEEN 0 AND 3),
      is_flagged INTEGER NOT NULL DEFAULT 0,
      sort_order REAL NOT NULL DEFAULT 0,
      list_id TEXT NOT NULL REFERENCES lists(id),
      recurrence_json TEXT,
      series_id TEXT,
      notification_id TEXT,
      snoozed_until TEXT,
      deleted_at TEXT
    );
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      normalized_name TEXT NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS reminder_tags (
      reminder_id TEXT NOT NULL REFERENCES reminders(id) ON DELETE CASCADE,
      tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (reminder_id, tag_id)
    );
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS reminders_due_at_idx ON reminders(due_at);
    CREATE INDEX IF NOT EXISTS reminders_list_id_idx ON reminders(list_id);
    CREATE INDEX IF NOT EXISTS reminders_completed_idx ON reminders(is_completed);
  `);

  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT OR IGNORE INTO lists
      (id, name, color, symbol, sort_order, is_inbox, created_at, updated_at)
      VALUES (?, 'Reminders', '#C97882', 'list', 0, 1, ?, ?)`,
    INBOX_ID, now, now,
  );
  await db.runAsync('INSERT OR IGNORE INTO schema_migrations(version) VALUES (1)');
  await db.runAsync("UPDATE lists SET color = '#C97882', updated_at = ? WHERE id = ? AND is_inbox = 1 AND color <> '#C97882'", now, INBOX_ID);
  await db.runAsync('INSERT OR IGNORE INTO schema_migrations(version) VALUES (2)');
  const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(reminders)');
  if (!columns.some((column) => column.name === 'deleted_at')) {
    await db.execAsync('ALTER TABLE reminders ADD COLUMN deleted_at TEXT');
  }
  await db.runAsync('INSERT OR IGNORE INTO schema_migrations(version) VALUES (3)');
  await db.runAsync(
    "UPDATE lists SET name='Reminders', symbol='list', updated_at=? WHERE id=? AND is_inbox=1",
    now, INBOX_ID,
  );
  await db.runAsync('INSERT OR IGNORE INTO schema_migrations(version) VALUES (4)');
}

type ListRow = {
  id: string; name: string; color: string; symbol: string;
  sort_order: number; is_inbox: number;
};

type ReminderRow = {
  id: string; title: string; notes: string; created_at: string; updated_at: string;
  due_at: string | null; has_time: number; is_completed: number; completed_at: string | null;
  priority: number; is_flagged: number; sort_order: number; list_id: string;
  recurrence_json: string | null; series_id: string | null; notification_id: string | null;
  snoozed_until: string | null; deleted_at: string | null;
};

export async function fetchLists(db: SQLiteDatabase): Promise<ReminderList[]> {
  const rows = await db.getAllAsync<ListRow>('SELECT * FROM lists ORDER BY sort_order, name COLLATE NOCASE');
  return rows.map((row) => ({
    id: row.id, name: row.name, color: row.color, symbol: row.symbol,
    sortOrder: row.sort_order, isInbox: Boolean(row.is_inbox),
  }));
}

export async function fetchReminders(db: SQLiteDatabase, includeDeleted = false): Promise<Reminder[]> {
  const rows = await db.getAllAsync<ReminderRow>(
    `SELECT * FROM reminders WHERE deleted_at ${includeDeleted ? 'IS NOT NULL' : 'IS NULL'} ORDER BY sort_order, created_at`,
  );
  const tagRows = await db.getAllAsync<{ reminder_id: string; id: string; name: string }>(
    `SELECT rt.reminder_id, t.id, t.name FROM reminder_tags rt
     JOIN tags t ON t.id = rt.tag_id ORDER BY t.name COLLATE NOCASE`,
  );
  const tags = new Map<string, ReminderTag[]>();
  tagRows.forEach((row) => tags.set(row.reminder_id, [...(tags.get(row.reminder_id) ?? []), { id: row.id, name: row.name }]));
  return rows.map((row) => ({
    id: row.id, title: row.title, notes: row.notes, createdAt: row.created_at,
    updatedAt: row.updated_at, dueAt: row.due_at, hasTime: Boolean(row.has_time),
    isCompleted: Boolean(row.is_completed), completedAt: row.completed_at,
    priority: row.priority as Reminder['priority'], isFlagged: Boolean(row.is_flagged),
    sortOrder: row.sort_order, listId: row.list_id,
    recurrence: parseRecurrence(row.recurrence_json),
    seriesId: row.series_id, notificationId: row.notification_id,
    snoozedUntil: row.snoozed_until, deletedAt: row.deleted_at, tags: tags.get(row.id) ?? [],
  }));
}

function parseRecurrence(value: string | null): Reminder['recurrence'] {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object') return null;
    const candidate = parsed as { frequency?: unknown; interval?: unknown };
    if (!['daily', 'weekly', 'monthly', 'yearly'].includes(String(candidate.frequency)) || typeof candidate.interval !== 'number' || candidate.interval < 1) return null;
    return parsed as Reminder['recurrence'];
  } catch { return null; }
}

export async function fetchTags(db: SQLiteDatabase): Promise<ReminderTag[]> {
  return db.getAllAsync<ReminderTag>('SELECT id, name FROM tags ORDER BY name COLLATE NOCASE');
}

export async function removeOrphanedTags(db: SQLiteDatabase): Promise<void> {
  await db.runAsync('DELETE FROM tags WHERE id NOT IN (SELECT tag_id FROM reminder_tags)');
}

export { INBOX_ID };
