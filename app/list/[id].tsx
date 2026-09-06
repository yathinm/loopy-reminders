import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { ReminderRow } from '@/components/ReminderRow';
import { Screen } from '@/components/Screen';
import { filterSmartList, sortReminders } from '@/domain/filters';
import { SmartList } from '@/domain/types';
import { useReminders } from '@/store/ReminderProvider';
import { colorsFor } from '@/theme/theme';

const smartTitles: Record<SmartList, string> = { today: 'Today', scheduled: 'Scheduled', all: 'All', flagged: 'Flagged', completed: 'Completed' };

export default function ListScreen() {
  const { id, smart } = useLocalSearchParams<{ id: string; smart?: string }>();
  const router = useRouter(); const colors = colorsFor(useColorScheme());
  const { reminders, lists, toggleReminder, toggleFlag, deleteReminder, deleteList } = useReminders();
  const [showCompleted, setShowCompleted] = useState(id === 'completed');
  const [undoId, setUndoId] = useState<string | null>(null);
  useEffect(() => {
    if (!undoId) return;
    const timeout = setTimeout(() => setUndoId(null), 4000);
    return () => clearTimeout(timeout);
  }, [undoId]);
  const list = lists.find((item) => item.id === id);
  const title = smart ? smartTitles[id as SmartList] ?? 'Reminders' : list?.name ?? 'Reminders';
  const items = useMemo(() => {
    const filtered = smart ? filterSmartList(reminders, id as SmartList) : reminders.filter((item) => item.listId === id && (showCompleted || !item.isCompleted));
    return sortReminders(filtered);
  }, [id, reminders, showCompleted, smart]);

  async function removeList() {
    if (!list || list.isInbox) return;
    await deleteList(list.id); router.back();
  }

  function confirmRemoveList() {
    Alert.alert('Delete this list?', 'Its reminders will be moved to Inbox.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void removeList() },
    ]);
  }

  async function toggle(id: string, wasCompleted: boolean) {
    await toggleReminder(id);
    setUndoId(wasCompleted ? null : id);
  }

  return (
    <Screen>
      <Stack.Screen options={{ title, headerRight: list && !list.isInbox ? () => <Pressable onPress={() => router.push({ pathname: '/list-editor', params: { id: list.id } })}><Text style={{ color: colors.accent, fontWeight: '700' }}>Edit</Text></Pressable> : undefined }} />
      {!smart && <Pressable accessibilityRole="switch" accessibilityState={{ checked: showCompleted }} onPress={() => setShowCompleted((value) => !value)} style={[styles.toggle, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={{ color: colors.text, flex: 1 }}>Show completed</Text><Ionicons name={showCompleted ? 'checkbox' : 'square-outline'} size={22} color={colors.accent} /></Pressable>}
      {items.length === 0 ? <EmptyState title={smart === 'completed' ? 'Nothing completed yet' : 'Nothing here yet'} /> : (
        <View style={[styles.list, { backgroundColor: colors.surface, borderColor: colors.border }]}>{items.map((item) => <ReminderRow key={item.id} reminder={item} onToggle={() => void toggle(item.id, item.isCompleted)} onFlag={() => void toggleFlag(item.id)} onDelete={() => void deleteReminder(item.id)} onPress={() => router.push(`/reminder/${item.id}`)} />)}</View>
      )}
      {undoId && <View accessibilityLiveRegion="polite" style={[styles.undo, { backgroundColor: colors.accent }]}><Text style={{ color: colors.onColor, flex: 1 }}>Reminder completed</Text><Pressable accessibilityRole="button" accessibilityLabel="Undo completing reminder" onPress={() => { void toggleReminder(undoId, false); setUndoId(null); }}><Text style={{ color: colors.softBrand, fontWeight: '800' }}>Undo</Text></Pressable></View>}
      {list && !list.isInbox && <Pressable onPress={confirmRemoveList} style={styles.delete}><Text style={{ color: colors.danger, fontWeight: '700' }}>Delete List</Text><Text style={{ color: colors.secondaryText, fontSize: 12 }}>Reminders will move to Inbox.</Text></Pressable>}
      {id !== 'completed' && <Pressable onPress={() => router.push({ pathname: '/reminder/new', params: { listId: smart ? undefined : id } })} style={[styles.add, { backgroundColor: colors.accent }]}><Ionicons name="add" size={22} color={colors.onColor} /><Text style={[styles.addText, { color: colors.onColor }]}>New Reminder</Text></Pressable>}
    </Screen>
  );
}
const styles = StyleSheet.create({ toggle: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, marginBottom: 12 }, list: { borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' }, add: { height: 52, borderRadius: 16, marginTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }, addText: { fontSize: 16, fontWeight: '800' }, delete: { alignItems: 'center', padding: 20, gap: 3 }, undo: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, marginTop: 12 } });
