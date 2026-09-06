import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, useColorScheme, View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { ReminderRow } from '@/components/ReminderRow';
import { filterSmartList, sortReminders } from '@/domain/filters';
import { Reminder, SmartList } from '@/domain/types';
import { useReminders } from '@/store/ReminderProvider';
import { colorsFor, palette } from '@/theme/theme';

type Selection = { kind: 'smart'; id: SmartList } | { kind: 'list'; id: string } | { kind: 'deleted' };
type ContextMenuState = { listId: string; x: number; y: number } | null;
type SortMode = 'due' | 'title' | 'manual';

function readDesktopStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try { const value = window.localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback; } catch { return fallback; }
}

function writeDesktopStorage(key: string, value: unknown) {
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage is optional */ }
}

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
  const { reminders, deletedReminders, lists, toggleReminder, toggleFlag, deleteReminder, restoreReminder, permanentlyDeleteReminder, deleteList } = useReminders();
  const [selection, setSelection] = useState<Selection>({ kind: 'smart', id: 'today' });
  const [query, setQuery] = useState('');
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const [submenu, setSubmenu] = useState<'sort' | null>(null);
  const [pinnedLists, setPinnedLists] = useState<string[]>(() => readDesktopStorage('loopy:pinned-lists', []));
  const [showCompletedLists, setShowCompletedLists] = useState<string[]>(() => readDesktopStorage('loopy:show-completed-lists', []));
  const [sortMode, setSortMode] = useState<SortMode>(() => readDesktopStorage('loopy:sort-mode', 'due'));

  useEffect(() => writeDesktopStorage('loopy:pinned-lists', pinnedLists), [pinnedLists]);
  useEffect(() => writeDesktopStorage('loopy:show-completed-lists', showCompletedLists), [showCompletedLists]);
  useEffect(() => writeDesktopStorage('loopy:sort-mode', sortMode), [sortMode]);

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
      return sortDesktopReminders(reminders.filter((item) => [item.title, item.notes, ...item.tags.map((tag) => tag.name)].some((value) => value.toLocaleLowerCase().includes(needle))), sortMode);
    }
    if (selection.kind === 'smart') return sortReminders(filterSmartList(reminders, selection.id));
    if (selection.kind === 'list') return sortDesktopReminders(reminders.filter((item) => item.listId === selection.id && (showCompletedLists.includes(selection.id) || !item.isCompleted)), sortMode);
    return [];
  }, [query, reminders, selection, showCompletedLists, sortMode]);

  const orderedLists = useMemo(() => [...lists].sort((a, b) => {
    const aPinned = pinnedLists.indexOf(a.id); const bPinned = pinnedLists.indexOf(b.id);
    if (aPinned === -1 && bPinned === -1) return 0;
    if (aPinned === -1) return 1;
    if (bPinned === -1) return -1;
    return aPinned - bPinned;
  }), [lists, pinnedLists]);

  const canAddReminder = selection.kind !== 'deleted' && !(selection.kind === 'smart' && selection.id === 'completed');
  const newReminderParams = selection.kind === 'list' ? { listId: selection.id } : undefined;

  function choose(next: Selection) {
    setQuery('');
    setSelection(next);
    setContextMenu(null);
    setSubmenu(null);
  }

  function openContextMenu(event: any, listId: string) {
    event.preventDefault?.();
    const native = event.nativeEvent ?? event;
    setContextMenu({ listId, x: native.pageX ?? native.clientX ?? 160, y: native.pageY ?? native.clientY ?? 160 });
    setSubmenu(null);
  }

  function closeContextMenu() { setContextMenu(null); setSubmenu(null); }

  async function deleteSelectedList(listId: string) {
    const list = lists.find((item) => item.id === listId); if (!list || list.isInbox) return;
    const confirmed = typeof window !== 'undefined'
      ? window.confirm(`Delete “${list.name}”? Its reminders will move to Reminders.`)
      : true;
    closeContextMenu();
    if (!confirmed) return;
    await deleteList(listId);
    if (selection.kind === 'list' && selection.id === listId) choose({ kind: 'smart', id: 'all' });
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
            {orderedLists.map((list) => {
              const selected = !query.trim() && selection.kind === 'list' && selection.id === list.id;
              return (
                <Pressable key={list.id} onPress={() => choose({ kind: 'list', id: list.id })} {...({ onContextMenu: (event: any) => openContextMenu(event, list.id) } as any)} style={[styles.navRow, selected && { backgroundColor: colors.background }]}>
                  <View style={[styles.navIcon, { backgroundColor: list.color }]}><Ionicons name={list.symbol as keyof typeof Ionicons.glyphMap} size={17} color={colors.onColor} /></View>
                  <Text numberOfLines={1} style={[styles.navLabel, { color: colors.text }]}>{list.name}</Text>
                  <Text style={{ color: colors.secondaryText }}>{reminders.filter((item) => item.listId === list.id && (showCompletedLists.includes(list.id) || !item.isCompleted)).length}</Text>
                </Pressable>
              );
            })}
            <Pressable onPress={() => choose({ kind: 'deleted' })} style={[styles.navRow, !query.trim() && selection.kind === 'deleted' && { backgroundColor: colors.background }]}> 
              <View style={[styles.navIcon, { backgroundColor: colors.brand }]}><Ionicons name="trash-outline" size={17} color={colors.onColor} /></View>
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
      {contextMenu && <DesktopContextMenu
        list={lists.find((list) => list.id === contextMenu.listId)!}
        x={contextMenu.x}
        y={contextMenu.y}
        colors={colors}
        submenu={submenu}
        isPinned={pinnedLists.includes(contextMenu.listId)}
        showingCompleted={showCompletedLists.includes(contextMenu.listId)}
        sortMode={sortMode}
        onClose={closeContextMenu}
        onSubmenu={setSubmenu}
        onPin={() => { setPinnedLists((current) => current.includes(contextMenu.listId) ? current.filter((id) => id !== contextMenu.listId) : [contextMenu.listId, ...current]); closeContextMenu(); }}
        onCompleted={() => { setShowCompletedLists((current) => current.includes(contextMenu.listId) ? current.filter((id) => id !== contextMenu.listId) : [...current, contextMenu.listId]); closeContextMenu(); }}
        onOpenWindow={() => { void window.loopyDesktop?.openListWindow?.(contextMenu.listId); closeContextMenu(); }}
        onSort={(mode: SortMode) => { setSortMode(mode); closeContextMenu(); }}
        onRename={() => { closeContextMenu(); router.push({ pathname: '/list-editor', params: { id: contextMenu.listId } }); }}
        onDelete={() => void deleteSelectedList(contextMenu.listId)}
      />}
    </View>
  );
}

function DesktopContextMenu({ list, x, y, colors, submenu, isPinned, showingCompleted, sortMode, onClose, onSubmenu, onPin, onCompleted, onOpenWindow, onSort, onRename, onDelete }: any) {
  if (!list) return null;
  const left = Math.max(8, Math.min(x, (typeof window !== 'undefined' ? window.innerWidth : 900) - 300));
  const top = Math.max(8, Math.min(y, (typeof window !== 'undefined' ? window.innerHeight : 700) - 510));
  return <>
    <Pressable onPress={onClose} style={styles.menuBackdrop} />
    <View style={[styles.contextMenu, { left, top, backgroundColor: colors.surface, borderColor: colors.border }]}>
      <MenuItem label={isPinned ? 'Unpin List' : 'Pin List'} colors={colors} onPress={onPin} />
      <MenuItem label={showingCompleted ? 'Hide Completed' : 'Show Completed'} colors={colors} shortcut="⇧⌘H" onPress={onCompleted} />
      <MenuDivider colors={colors} />
      <MenuItem label="Open List in New Window" colors={colors} onPress={onOpenWindow} />
      <MenuDivider colors={colors} />
      <MenuItem label="Sort By" colors={colors} arrow onPress={() => onSubmenu(submenu === 'sort' ? null : 'sort')} />
      {submenu === 'sort' && <View style={[styles.submenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <MenuItem label="Due Date" colors={colors} selected={sortMode === 'due'} onPress={() => onSort('due')} />
        <MenuItem label="Title" colors={colors} selected={sortMode === 'title'} onPress={() => onSort('title')} />
        <MenuItem label="Manual" colors={colors} selected={sortMode === 'manual'} onPress={() => onSort('manual')} />
      </View>}
      <MenuDivider colors={colors} />
      <MenuItem label="Edit" colors={colors} onPress={onRename} />
      <MenuItem label="Delete" colors={colors} onPress={onDelete} disabled={list.isInbox} />
    </View>
  </>;
}

function MenuItem({ label, colors, onPress, arrow, shortcut, selected, disabled }: any) {
  return <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.menuItem, { opacity: disabled ? 0.4 : pressed ? 0.65 : 1 }]}>
    <Text style={[styles.menuLabel, { color: colors.text }]}>{selected ? '✓ ' : ''}{label}</Text>
    {shortcut && <Text style={[styles.menuShortcut, { color: colors.secondaryText }]}>{shortcut}</Text>}
    {arrow && <Ionicons name="chevron-forward" size={17} color={colors.secondaryText} />}
  </Pressable>;
}

function MenuDivider({ colors }: { colors: ReturnType<typeof colorsFor> }) {
  return <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />;
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

function sortDesktopReminders(items: Reminder[], mode: SortMode) {
  if (mode === 'title') return [...items].sort((a, b) => a.title.localeCompare(b.title));
  if (mode === 'manual') return [...items].sort((a, b) => a.sortOrder - b.sortOrder);
  return sortReminders(items);
}

const styles = StyleSheet.create({
  desktop: { flex: 1, flexDirection: 'row' },
  sidebar: { width: '34%', minWidth: 320, maxWidth: 420, borderRightWidth: StyleSheet.hairlineWidth },
  sidebarTop: { paddingHorizontal: 18, paddingTop: 68, paddingBottom: 14, gap: 22 },
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
  workspaceHeader: { minHeight: 166, paddingHorizontal: 32, paddingTop: 68, paddingBottom: 18, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
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
  menuBackdrop: { ...StyleSheet.absoluteFillObject, zIndex: 20 },
  contextMenu: { position: 'absolute', width: 292, borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, paddingVertical: 8, zIndex: 21, shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 12 } as never,
  menuItem: { minHeight: 42, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 8 },
  menuLabel: { flex: 1, fontSize: 16, fontWeight: '600' },
  menuShortcut: { fontSize: 13 },
  menuDivider: { height: StyleSheet.hairlineWidth, marginHorizontal: 12, marginVertical: 5 },
  submenu: { position: 'absolute', left: 286, top: 185, width: 170, borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, paddingVertical: 8, zIndex: 22, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 14, shadowOffset: { width: 0, height: 7 } } as never,
});
