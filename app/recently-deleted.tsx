import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { useReminders } from '@/store/ReminderProvider';
import { colorsFor } from '@/theme/theme';

export default function RecentlyDeletedScreen() {
  const colors = colorsFor(useColorScheme());
  const { deletedReminders, deletedNotes, restoreReminder, permanentlyDeleteReminder, restoreNote, permanentlyDeleteNote } = useReminders();

  function confirmPermanentDelete(id: string, title: string, permanentlyDelete: (itemId: string) => Promise<void>) {
    if (Platform.OS === 'web') {
      if (window.confirm(`Delete “${title}” permanently? This cannot be undone.`)) void permanentlyDelete(id);
      return;
    }
    Alert.alert('Delete permanently?', `“${title}” cannot be recovered after this.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void permanentlyDelete(id) },
    ]);
  }

  function showActions(id: string, title: string, kind: 'reminder' | 'note') {
    const restore = kind === 'reminder' ? restoreReminder : restoreNote;
    const permanentlyDelete = kind === 'reminder' ? permanentlyDeleteReminder : permanentlyDeleteNote;
    if (Platform.OS === 'web') {
      if (window.confirm(`Restore “${title}”? Choose Cancel to leave it deleted.`)) void restore(id);
      else if (window.confirm(`Delete “${title}” permanently? This cannot be undone.`)) void permanentlyDelete(id);
      return;
    }
    Alert.alert(title, `Choose an action for this deleted ${kind}.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Restore', onPress: () => void restore(id) },
      { text: 'Delete Permanently', style: 'destructive', onPress: () => confirmPermanentDelete(id, title, permanentlyDelete) },
    ]);
  }

  return <Screen>
    <Stack.Screen options={{ title: 'Recently Deleted' }} />
    <Text style={[styles.description, { color: colors.secondaryText }]}>Reminders and notes are available here for 30 days. After that time, they will be permanently deleted.</Text>
    {deletedReminders.length === 0 && deletedNotes.length === 0 ? <EmptyState title="Recently Deleted is empty" message="Deleted reminders and notes will appear here." /> : (
      <View style={styles.rows}>
        {deletedReminders.map((reminder) => (
          <Pressable key={reminder.id} onPress={() => showActions(reminder.id, reminder.title, 'reminder')} style={[styles.row, { backgroundColor: colors.softBrand, borderColor: colors.border }]} accessibilityRole="button" accessibilityLabel={reminder.title}>
            <View style={[styles.circle, { borderColor: colors.border }]} />
            <View style={styles.content}>
              <Text style={[styles.title, { color: colors.text }]}>{reminder.title}</Text>
              {reminder.dueAt && <Text style={[styles.due, { color: colors.danger }]}>{formatDate(reminder.dueAt, reminder.hasTime)}</Text>}
            </View>
          </Pressable>
        ))}
        {deletedNotes.map((note) => (
          <Pressable key={note.id} onPress={() => showActions(note.id, note.title, 'note')} style={[styles.row, { backgroundColor: colors.softBrand, borderColor: colors.border }]} accessibilityRole="button" accessibilityLabel={note.title}>
            <View style={[styles.noteIcon, { backgroundColor: colors.brand }]}><Ionicons name="document-text-outline" size={18} color={colors.onColor} /></View>
            <View style={styles.content}>
              <Text style={[styles.title, { color: colors.text }]}>{note.title}</Text>
              {!!note.body && <Text numberOfLines={2} style={{ color: colors.secondaryText }}>{note.body}</Text>}
            </View>
          </Pressable>
        ))}
      </View>
    )}
  </Screen>;
}

function formatDate(value: string, hasTime: boolean) {
  const date = new Date(value);
  const dateText = new Intl.DateTimeFormat(undefined, { month: 'numeric', day: 'numeric', year: '2-digit' }).format(date);
  return hasTime ? dateText + ', ' + new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date) : dateText;
}

const styles = StyleSheet.create({
  description: { fontSize: 18, lineHeight: 27, marginBottom: 30 },
  rows: { gap: 0 },
  row: { flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 14, marginBottom: 12, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, gap: 14 },
  circle: { width: 25, height: 25, borderRadius: 13, borderWidth: 2, marginTop: 2 },
  noteIcon: { width: 29, height: 29, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, gap: 5 },
  title: { fontSize: 18, lineHeight: 23 },
  due: { fontSize: 17, lineHeight: 22 },
});
