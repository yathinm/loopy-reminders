import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, useColorScheme, View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { ReminderRow } from '@/components/ReminderRow';
import { filterSmartList, sortReminders } from '@/domain/filters';
import { Reminder, SmartList } from '@/domain/types';
import { useReminders } from '@/store/ReminderProvider';
import { colorsFor, palette } from '@/theme/theme';

type Selection = { kind: 'smart'; id: SmartList } | { kind: 'list'; id: string } | { kind: 'deleted' };

const smartLists: { id: SmartList; title: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { id: 'today', title: 'Today', icon: 'calendar', color: palette.dustyRose },
  { id: 'scheduled', title: 'Scheduled', icon: 'time', color: palette.softPink },
  { id: 'all', title: 'All', icon: 'file-tray-full', color: palette.deepPlum },
  { id: 'flagged', title: 'Flagged', icon: 'flag', color: palette.warmCoral },
  { id: 'completed', title: 'Completed', icon: 'checkmark', color: palette.dustyRose },
];

export default function DesktopHomeScreen() {
  const router = useRouter();
  const colors = colorsFor(useColorScheme());
  const { reminders, deletedReminders, lists, toggleReminder, toggleFlag, deleteReminder, restoreReminder, permanentlyDeleteReminder } = useReminders();
  const [selection, setSelection] = useState<Selection>({ kind: 'smart', id: 'today' });
  const [query, setQuery] = useState('');

  const selectedList = selection.kind === 'list' ? lists.find((list) => list.id === selection.id) : undefined;
  const title = query.trim()
    ? 'Search'
    : selection.kind === 'deleted'
      ? 'Recently Deleted'
      : selection.kind === 'smart'
        ? smartLists.find((item) => item.id === selection.id)?.title ?? 'Reminders'
        : selectedList?.name ?? 'Reminders';

  const visibleReminders = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (needle) {
      return sortReminders(reminders.filter((item) => [item.title, item.notes, ...item.tags.map((tag) => tag.name)].some((value) => value.toLocaleLowerCase().includes(needle))));
    }
    if (selection.kind === 'smart') return sortReminders(filterSmartList(reminders, selection.id));
    if (selection.kind === 'list') return sortReminders(reminders.filter((item) => item.listId === selection.id && !item.isCompleted));
    return [];
  }, [query, reminders, selection]);

  const canAddReminder = selection.kind !== 'deleted' && !(selection.kind === 'smart' && selection.id === 'completed');
  const newReminderParams = selection.kind === 'list' ? { listId: selection.id } : undefined;

  function choose(next: Selection) {
    setQuery('');
    setSelection(next);
  }

  function confirmPermanentDelete(reminder: Reminder) {
    Alert.alert('Delete permanently?', `“${reminder.title}” cannot be recovered after this.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void permanentlyDeleteReminder(reminder.id) },
    ]);
  }

  return (
    <View style={[styles.desktop, { backgroundColor: colors.background }]}> 
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.sidebar, { backgroundColor: colors.surface, borderRightColor: colors.border }]}> 
        <View style={styles.sidebarTop}>
          <Text style={[styles.brand, { color: colors.accent }]}>Loopy Reminders</Text>
          <View style={[styles.search, { backgroundColor: colors.background, borderColor: colors.border }]}> 
            <Ionicons name="search" size={20} color={colors.accent} />
            <TextInput
              accessibilityLabel="Search reminders"
              value={query}
              onChangeText={setQuery}
              clearButtonMode="while-editing"
              placeholder="Search"
              placeholderTextColor={colors.secondaryText}
              style={[styles.searchInput, { color: colors.text }]}
            />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.sidebarContent} showsVerticalScrollIndicator={false}>
          <View style={styles.smartGrid}>
            {smartLists.map((item) => {
              const selected = !query.trim() && selection.kind === 'smart' && selection.id === item.id;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  onPress={() => choose({ kind: 'smart', id: item.id })}
                  style={({ pressed }) => [styles.smartCard, { backgroundColor: selected ? colors.accent : colors.background, borderColor: selected ? colors.accent : colors.border, opacity: pressed ? 0.75 : 1 }]}
                >
                  <View style={[styles.smartIcon, { backgroundColor: item.color }]}><Ionicons name={item.icon} size={17} color={colors.onColor} /></View>
                  <Text style={[styles.smartCount, { color: selected ? colors.onColor : colors.text }]}>{filterSmartList(reminders, item.id).length}</Text>
                  <Text style={[styles.smartTitle, { color: selected ? colors.onColor : colors.text }]}>{item.title}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>My Lists</Text>
          <View style={styles.listNavigation}>
            {lists.map((list) => {
              const selected = !query.trim() && selection.kind === 'list' && selection.id === list.id;
              return (
                <Pressable key={list.id} onPress={() => choose({ kind: 'list', id: list.id })} style={[styles.navRow, selected && { backgroundColor: colors.background }]}>
                  <View style={[styles.navIcon, { backgroundColor: list.color }]}><Ionicons name={list.symbol as keyof typeof Ionicons.glyphMap} size={17} color={colors.onColor} /></View>
                  <Text numberOfLines={1} style={[styles.navLabel, { color: colors.text }]}>{list.name}</Text>
                  <Text style={{ color: colors.secondaryText }}>{reminders.filter((item) => item.listId === list.id && !item.isCompleted).length}</Text>
                </Pressable>
              );
            })}
            <Pressable onPress={() => choose({ kind: 'deleted' })} style={[styles.navRow, !query.trim() && selection.kind === 'deleted' && { backgroundColor: colors.background }]}> 
              <View style={[styles.navIcon, { backgroundColor: colors.softBrand }]}><Ionicons name="trash-outline" size={17} color={colors.accent} /></View>
              <Text style={[styles.navLabel, { color: colors.text }]}>Recently Deleted</Text>
              <Text style={{ color: colors.secondaryText }}>{deletedReminders.length}</Text>
            </Pressable>
          </View>
        </ScrollView>

        <Pressable onPress={() => router.push('/list-editor')} style={styles.addList}>
          <Ionicons name="add-circle-outline" size={20} color={colors.accent} />
          <Text style={[styles.addListText, { color: colors.accent }]}>Add List</Text>
        </Pressable>
      </View>

      <View style={[styles.workspace, { backgroundColor: colors.background }]}> 
        <View style={styles.workspaceHeader}>
          <View>
            <Text style={[styles.workspaceTitle, { color: colors.accent }]}>{title}</Text>
            {query.trim() && <Text style={[styles.resultCount, { color: colors.secondaryText }]}>{visibleReminders.length} results</Text>}
          </View>
          {canAddReminder && (
            <Pressable accessibilityRole="button" accessibilityLabel="Add reminder" onPress={() => router.push({ pathname: '/reminder/new', params: newReminderParams })} style={({ pressed }) => [styles.addReminder, { backgroundColor: colors.accent, opacity: pressed ? 0.75 : 1 }]}>
              <Ionicons name="add" size={27} color={colors.onColor} />
            </Pressable>
          )}
        </View>

        <ScrollView contentContainerStyle={styles.workspaceContent} showsVerticalScrollIndicator={false}>
          {selection.kind === 'deleted' && !query.trim() ? (
            <DeletedPane reminders={deletedReminders} onRestore={restoreReminder} onDelete={confirmPermanentDelete} />
          ) : visibleReminders.length === 0 ? (
            <EmptyState title={query.trim() ? 'No matches' : selection.kind === 'smart' && selection.id === 'completed' ? 'Nothing completed yet' : 'Nothing here yet'} message={query.trim() ? 'Try another title, note, or tag.' : undefined} />
          ) : (
            <View style={[styles.reminderList, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
              {visibleReminders.map((reminder) => (
                <ReminderRow
                  key={reminder.id}
                  reminder={reminder}
                  onToggle={() => void toggleReminder(reminder.id)}
                  onFlag={() => void toggleFlag(reminder.id)}
                  onDelete={() => void deleteReminder(reminder.id)}
                  onPress={() => router.push(`/reminder/${reminder.id}`)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

function DeletedPane({ reminders, onRestore, onDelete }: { reminders: Reminder[]; onRestore: (id: string) => Promise<void>; onDelete: (reminder: Reminder) => void }) {
  const colors = colorsFor(useColorScheme());
  if (reminders.length === 0) return <EmptyState title="Recently Deleted is empty" message="Deleted reminders will appear here for 30 days." />;
  return (
    <View>
      <Text style={[styles.deletedDescription, { color: colors.secondaryText }]}>Reminders remain available for 30 days before they are permanently deleted.</Text>
      <View style={styles.deletedRows}>{reminders.map((reminder) => (
        <View key={reminder.id} style={[styles.deletedRow, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <View style={[styles.deletedCircle, { borderColor: colors.brand }]} />
          <View style={styles.deletedBody}>
            <Text style={[styles.deletedTitle, { color: colors.text }]}>{reminder.title}</Text>
            {!!reminder.notes && <Text numberOfLines={2} style={{ color: colors.secondaryText }}>{reminder.notes}</Text>}
            {reminder.dueAt && <Text style={{ color: colors.danger }}>{formatDue(reminder)}</Text>}
          </View>
          <Pressable onPress={() => void onRestore(reminder.id)}><Text style={[styles.deletedAction, { color: colors.accent }]}>Restore</Text></Pressable>
          <Pressable onPress={() => onDelete(reminder)}><Text style={[styles.deletedAction, { color: colors.danger }]}>Delete</Text></Pressable>
        </View>
      ))}</View>
    </View>
  );
}

function formatDue(reminder: Reminder) {
  const date = new Date(reminder.dueAt!);
  const dateText = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
  return reminder.hasTime ? `${dateText}, ${new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date)}` : dateText;
}

const styles = StyleSheet.create({
  desktop: { flex: 1, flexDirection: 'row' },
  sidebar: { width: '34%', minWidth: 320, maxWidth: 420, borderRightWidth: StyleSheet.hairlineWidth },
  sidebarTop: { paddingHorizontal: 18, paddingTop: 24, paddingBottom: 14, gap: 22 },
  brand: { fontSize: 22, fontWeight: '900' },
  search: { height: 46, borderWidth: StyleSheet.hairlineWidth, borderRadius: 13, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 9 },
  searchInput: { flex: 1, fontSize: 16, outlineStyle: 'none' } as never,
  sidebarContent: { paddingHorizontal: 14, paddingBottom: 18 },
  smartGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  smartCard: { width: '48%', flexGrow: 1, minHeight: 105, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, padding: 12 },
  smartIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  smartCount: { position: 'absolute', right: 12, top: 12, fontSize: 24, fontWeight: '900' },
  smartTitle: { marginTop: 14, fontSize: 15, fontWeight: '800' },
  sectionTitle: { marginTop: 26, marginBottom: 8, marginLeft: 8, fontSize: 14, fontWeight: '800' },
  listNavigation: { gap: 3 },
  navRow: { height: 52, borderRadius: 12, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 10 },
  navIcon: { width: 31, height: 31, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  navLabel: { flex: 1, fontSize: 16, fontWeight: '700' },
  addList: { height: 52, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 9 },
  addListText: { fontSize: 16, fontWeight: '800' },
  workspace: { flex: 1 },
  workspaceHeader: { minHeight: 122, paddingHorizontal: 32, paddingTop: 28, paddingBottom: 18, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  workspaceTitle: { fontSize: 42, lineHeight: 49, fontWeight: '900' },
  resultCount: { marginTop: 2, fontSize: 14 },
  addReminder: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  workspaceContent: { paddingHorizontal: 28, paddingBottom: 40 },
  reminderList: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, overflow: 'hidden' },
  deletedDescription: { fontSize: 16, lineHeight: 23, marginBottom: 20 },
  deletedRows: { gap: 10 },
  deletedRow: { minHeight: 82, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  deletedCircle: { width: 25, height: 25, borderRadius: 13, borderWidth: 2 },
  deletedBody: { flex: 1, gap: 3 },
  deletedTitle: { fontSize: 17, fontWeight: '700' },
  deletedAction: { fontSize: 14, fontWeight: '800', padding: 5 },
});
