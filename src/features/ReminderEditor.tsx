import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, useColorScheme, View } from 'react-native';
import { Frequency, Priority, ReminderDraft } from '@/domain/types';
import DateTimePicker from '@/components/DateTimeField';
import { recurrenceLabel } from '@/domain/recurrence';
import { useReminders } from '@/store/ReminderProvider';
import { colorsFor, spacing } from '@/theme/theme';

const priorities: Priority[] = [0, 1, 2, 3];
const priorityNames = ['None', 'Low', 'Medium', 'High'];
const frequencies: Frequency[] = ['daily', 'weekly', 'monthly', 'yearly'];
const weekdayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function ReminderEditor({ reminderId, initialListId }: { reminderId?: string; initialListId?: string }) {
  const router = useRouter(); const colors = colorsFor(useColorScheme());
  const { reminders, lists, saveReminder, deleteReminder } = useReminders();
  const reminder = useMemo(() => reminders.find((item) => item.id === reminderId), [reminderId, reminders]);
  const inbox = lists.find((item) => item.isInbox)?.id ?? lists[0]?.id ?? '';
  const [title, setTitle] = useState(reminder?.title ?? '');
  const [notes, setNotes] = useState(reminder?.notes ?? '');
  const [dueAt, setDueAt] = useState(() => reminder?.dueAt ? new Date(reminder.dueAt) : new Date(new Date().getTime() + 60 * 60 * 1000));
  const [hasDate, setHasDate] = useState(Boolean(reminder?.dueAt));
  const [hasTime, setHasTime] = useState(reminder?.hasTime ?? true);
  const [priority, setPriority] = useState<Priority>(reminder?.priority ?? 0);
  const [flagged, setFlagged] = useState(reminder?.isFlagged ?? false);
  const [listId, setListId] = useState(reminder?.listId ?? initialListId ?? inbox);
  const [recurrence, setRecurrence] = useState(reminder?.recurrence ?? null);
  const [tags, setTags] = useState(reminder?.tags.map((tag) => tag.name).join(', ') ?? '');
  const [saving, setSaving] = useState(false);

  async function save() {
    const draft: ReminderDraft = { title, notes, dueAt: hasDate ? dueAt : null, hasTime: hasDate && hasTime, priority, isFlagged: flagged, listId, recurrence: hasDate ? recurrence : null, tagNames: tags.split(',') };
    try { setSaving(true); await saveReminder(draft, reminderId); router.back(); }
    catch (reason) { Alert.alert('Could not save reminder', reason instanceof Error ? reason.message : 'Please try again.'); setSaving(false); }
  }

  function confirmDelete() {
    Alert.alert('Delete reminder?', 'This reminder will move to Recently Deleted.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => void deleteReminder(reminderId!).then(() => router.back()) }]);
  }

  function chooseQuickDate(days: number, hour = 9) {
    const next = new Date();
    next.setDate(next.getDate() + days); next.setHours(hour, 0, 0, 0);
    setDueAt(next); setHasDate(true); setHasTime(true);
  }

  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <View style={styles.topActions}><Pressable onPress={() => router.back()}><Text style={[styles.actionText, { color: colors.accent }]}>Cancel</Text></Pressable><Pressable disabled={!title.trim() || saving} onPress={save}><Text style={[styles.actionText, { color: colors.accent, opacity: !title.trim() || saving ? 0.4 : 1 }]}>{saving ? 'Saving…' : 'Save'}</Text></Pressable></View>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput accessibilityLabel="Reminder title" autoFocus={!reminderId} placeholder="What should Loopy remember?" placeholderTextColor={colors.secondaryText} value={title} onChangeText={setTitle} maxLength={500} style={[styles.titleInput, { color: colors.text, borderBottomColor: colors.border }]} />
          <TextInput accessibilityLabel="Notes" placeholder="Notes" placeholderTextColor={colors.secondaryText} value={notes} onChangeText={setNotes} multiline style={[styles.notesInput, { color: colors.text }]} />
        </View>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingRow icon="calendar" label="Date" colors={colors}><ThemeSwitch value={hasDate} onValueChange={setHasDate} colors={colors} /></SettingRow>
          {hasDate && <><View style={styles.quickDates}><Choice label="Today" active={false} onPress={() => chooseQuickDate(0, 18)} colors={colors} /><Choice label="Tomorrow" active={false} onPress={() => chooseQuickDate(1)} colors={colors} /><Choice label="Next week" active={false} onPress={() => chooseQuickDate(7)} colors={colors} /></View><View style={styles.pickerWrap}><DateTimePicker value={dueAt} mode="date" minimumDate={new Date()} onChange={(_, date) => date && setDueAt(date)} accentColor={colors.accent} /></View><SettingRow icon="time" label="Time" colors={colors}><ThemeSwitch value={hasTime} onValueChange={setHasTime} colors={colors} /></SettingRow>{hasTime && <View style={styles.pickerWrap}><DateTimePicker value={dueAt} mode="time" onChange={(_, date) => date && setDueAt(date)} accentColor={colors.accent} /></View>}</>}
        </View>
        {hasDate && <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.text }]}>Repeat · {recurrenceLabel(recurrence)}</Text>
          <View style={styles.chips}><Choice label="Never" active={!recurrence} onPress={() => setRecurrence(null)} colors={colors} />{frequencies.map((frequency) => <Choice key={frequency} label={frequency[0]!.toUpperCase() + frequency.slice(1)} active={recurrence?.frequency === frequency} onPress={() => setRecurrence({ frequency, interval: 1, weekdays: frequency === 'weekly' ? [dueAt.getDay()] : undefined })} colors={colors} />)}</View>
          {recurrence && <View style={[styles.intervalRow, { borderTopColor: colors.border }]}><Text style={[styles.rowLabel, { color: colors.text }]}>Every</Text><Pressable accessibilityLabel="Decrease repeat interval" onPress={() => setRecurrence({ ...recurrence, interval: Math.max(1, recurrence.interval - 1) })} style={[styles.step, { borderColor: colors.border }]}><Ionicons name="remove" size={18} color={colors.accent} /></Pressable><Text style={[styles.interval, { color: colors.text }]}>{recurrence.interval}</Text><Pressable accessibilityLabel="Increase repeat interval" onPress={() => setRecurrence({ ...recurrence, interval: Math.min(99, recurrence.interval + 1) })} style={[styles.step, { borderColor: colors.border }]}><Ionicons name="add" size={18} color={colors.accent} /></Pressable></View>}
          {recurrence?.frequency === 'weekly' && <View style={styles.weekdays}>{weekdayLabels.map((label, day) => { const active = recurrence.weekdays?.includes(day) ?? false; return <Pressable key={day} accessibilityLabel={new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(new Date(2026, 8, 6 + day))} accessibilityRole="checkbox" accessibilityState={{ checked: active }} onPress={() => { const selected = new Set(recurrence.weekdays ?? []); if (active && selected.size > 1) selected.delete(day); else selected.add(day); setRecurrence({ ...recurrence, weekdays: [...selected].sort() }); }} style={[styles.weekday, { backgroundColor: active ? colors.accent : colors.background, borderColor: active ? colors.accent : colors.border }]}><Text style={[styles.chipText, { color: active ? colors.onColor : colors.secondaryText, fontWeight: '700' }]}>{label}</Text></Pressable>; })}</View>}
        </View>}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.text }]}>List</Text><View style={styles.chips}>{lists.map((list) => <Choice key={list.id} label={list.name} active={listId === list.id} onPress={() => setListId(list.id)} colors={colors} />)}</View>
          <Text style={[styles.label, { color: colors.text, marginTop: 15 }]}>Priority</Text><View style={styles.chips}>{priorities.map((value) => <Choice key={value} label={priorityNames[value]!} active={priority === value} onPress={() => setPriority(value)} colors={colors} />)}</View>
          <SettingRow icon="flag" label="Flagged" colors={colors}><ThemeSwitch value={flagged} onValueChange={setFlagged} colors={colors} /></SettingRow>
        </View>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.label, { color: colors.text }]}>Tags</Text><TextInput accessibilityLabel="Tags separated by commas" placeholder="school, errands, health" placeholderTextColor={colors.secondaryText} value={tags} onChangeText={setTags} autoCapitalize="none" style={[styles.tagInput, { color: colors.text, borderColor: colors.border }]} /><Text style={[styles.hint, { color: colors.secondaryText }]}>Separate tags with commas.</Text></View>
        {reminderId && <Pressable onPress={confirmDelete} style={[styles.deleteButton, { borderColor: colors.danger }]}><Text style={{ color: colors.danger, fontWeight: '800' }}>Delete Reminder</Text></Pressable>}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SettingRow({ icon, label, colors, children }: { icon: keyof typeof Ionicons.glyphMap; label: string; colors: ReturnType<typeof colorsFor>; children: React.ReactNode }) {
  return <View style={styles.row}><Ionicons name={icon} size={20} color={colors.accent} /><Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>{children}</View>;
}
function ThemeSwitch({ value, onValueChange, colors }: { value: boolean; onValueChange: (value: boolean) => void; colors: ReturnType<typeof colorsFor> }) {
  return <Switch value={value} onValueChange={onValueChange} trackColor={{ false: colors.border, true: colors.brand }} thumbColor={value ? colors.accent : colors.border} ios_backgroundColor={colors.border} />;
}
function Choice({ label, active, onPress, colors }: { label: string; active: boolean; onPress: () => void; colors: ReturnType<typeof colorsFor> }) {
  return <Pressable accessibilityRole="radio" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.chip, { borderColor: active ? colors.accent : colors.border, backgroundColor: active ? colors.softBrand : colors.background }]}><Text style={[styles.chipText, { color: active ? colors.accent : colors.secondaryText, fontWeight: active ? '700' : '500' }]}>{label}</Text></Pressable>;
}
const systemFont = Platform.select({ web: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif', default: 'System' });
const styles = StyleSheet.create({ flex: { flex: 1 }, content: { padding: spacing.lg, paddingTop: spacing.lg, paddingBottom: 60, fontFamily: systemFont }, topActions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }, actionText: { fontSize: 17, fontWeight: '700', fontFamily: systemFont }, card: { borderRadius: 17, padding: 14, borderWidth: StyleSheet.hairlineWidth, marginBottom: 13 }, titleInput: { fontSize: 19, fontWeight: '700', paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth, fontFamily: systemFont }, notesInput: { minHeight: 72, fontSize: 16, paddingTop: 12, textAlignVertical: 'top', fontFamily: systemFont }, row: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10 }, rowLabel: { fontSize: 16, fontWeight: '600', flex: 1, fontFamily: systemFont }, pickerWrap: { alignItems: 'flex-start' }, quickDates: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }, label: { fontSize: 15, fontWeight: '800', marginBottom: 10, fontFamily: systemFont }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, chip: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9 }, chipText: { fontFamily: systemFont }, intervalRow: { marginTop: 14, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 9 }, step: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, interval: { minWidth: 25, textAlign: 'center', fontWeight: '800', fontSize: 17, fontFamily: systemFont }, weekdays: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }, weekday: { width: 35, height: 35, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, tagInput: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 11, padding: 11, fontSize: 16, fontFamily: systemFont }, hint: { fontSize: 12, marginTop: 6, fontFamily: systemFont }, deleteButton: { height: 50, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' } });
