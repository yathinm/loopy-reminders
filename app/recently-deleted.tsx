import { Stack } from 'expo-router';
import React from 'react';
import { Alert, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { useReminders } from '@/store/ReminderProvider';
import { colorsFor } from '@/theme/theme';

export default function RecentlyDeletedScreen() {
  const colors = colorsFor(useColorScheme());
  const { deletedReminders, lists, restoreReminder, permanentlyDeleteReminder } = useReminders();

  function confirmPermanentDelete(id: string, title: string) {
    Alert.alert('Delete permanently?', '“' + title + '” cannot be recovered after this.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void permanentlyDeleteReminder(id) },
    ]);
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Recently Deleted' }} />
      {deletedReminders.length === 0 ? <EmptyState title="Recently Deleted is empty" message="Deleted reminders will appear here." /> : (
        <View style={[styles.list, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {deletedReminders.map((reminder) => (
            <View key={reminder.id} style={[styles.row, { borderBottomColor: colors.border }]}>
              <Text style={[styles.title, { color: colors.text }]}>{reminder.title}</Text>
              {!!reminder.notes && <Text style={[styles.notes, { color: colors.secondaryText }]}>{reminder.notes}</Text>}
              <View style={styles.details}>
                <Text style={[styles.detail, { color: colors.secondaryText }]}>List: {lists.find((list) => list.id === reminder.listId)?.name ?? 'Reminders'}</Text>
                {reminder.dueAt && <Text style={[styles.detail, { color: colors.secondaryText }]}>Due: {formatDate(reminder.dueAt, reminder.hasTime)}</Text>}
                <Text style={[styles.detail, { color: colors.secondaryText }]}>Status: {reminder.isCompleted ? 'Completed' : 'Incomplete'}</Text>
                {reminder.priority > 0 && <Text style={[styles.detail, { color: colors.secondaryText }]}>Priority: {reminder.priority === 1 ? 'Low' : reminder.priority === 2 ? 'Medium' : 'High'}</Text>}
                {reminder.isFlagged && <Text style={[styles.detail, { color: colors.secondaryText }]}>Flagged</Text>}
                {reminder.tags.length > 0 && <Text style={[styles.detail, { color: colors.secondaryText }]}>Tags: {reminder.tags.map((tag) => '#' + tag.name).join(', ')}</Text>}
              </View>
              <View style={styles.actions}>
                <Pressable accessibilityRole="button" onPress={() => void restoreReminder(reminder.id)} hitSlop={8}>
                  <Text style={[styles.action, { color: colors.accent }]}>Restore</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => confirmPermanentDelete(reminder.id, reminder.title)} hitSlop={8}>
                  <Text style={[styles.action, { color: colors.danger }]}>Delete</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  row: { paddingHorizontal: 14, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, gap: 8 },
 title: { fontSize: 17, fontWeight: '600' },
  notes: { fontSize: 15, lineHeight: 20 },
  details: { gap: 2 },
  detail: { fontSize: 13 },
 actions: { flexDirection: 'row', gap: 18 },
 action: { fontSize: 14, fontWeight: '800' },
});

function formatDate(value: string, hasTime: boolean) {
  const date = new Date(value);
  const dateText = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
  return hasTime ? dateText + ', ' + new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date) : dateText;
}
