import { Stack } from 'expo-router';
import React from 'react';
import { Alert, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { useReminders } from '@/store/ReminderProvider';
import { colorsFor } from '@/theme/theme';

export default function RecentlyDeletedScreen() {
  const colors = colorsFor(useColorScheme());
  const { deletedReminders, restoreReminder, permanentlyDeleteReminder } = useReminders();

  function confirmPermanentDelete(id: string, title: string) {
    Alert.alert('Delete permanently?', '“' + title + '” cannot be recovered after this.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void permanentlyDeleteReminder(id) },
    ]);
  }

  function showActions(id: string, title: string) {
    Alert.alert(title, 'Choose an action for this deleted reminder.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Restore', onPress: () => void restoreReminder(id) },
      { text: 'Delete Permanently', style: 'destructive', onPress: () => confirmPermanentDelete(id, title) },
    ]);
  }

  return <Screen>
    <Stack.Screen options={{ title: 'Recently Deleted' }} />
    <Text style={[styles.description, { color: colors.secondaryText }]}>Reminders are available here for 30 days. After that time, reminders will be permanently deleted.</Text>
    {deletedReminders.length === 0 ? <EmptyState title="Recently Deleted is empty" message="Deleted reminders will appear here." /> : (
      <View style={styles.rows}>
        {deletedReminders.map((reminder) => (
          <Pressable key={reminder.id} onPress={() => showActions(reminder.id, reminder.title)} style={[styles.row, { backgroundColor: colors.softBrand, borderColor: colors.border }]} accessibilityRole="button" accessibilityLabel={reminder.title}>
            <View style={[styles.circle, { borderColor: colors.border }]} />
            <View style={styles.content}>
              <Text style={[styles.title, { color: colors.text }]}>{reminder.title}</Text>
              {reminder.dueAt && <Text style={[styles.due, { color: colors.danger }]}>{formatDate(reminder.dueAt, reminder.hasTime)}</Text>}

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
  content: { flex: 1, gap: 5 },
  title: { fontSize: 18, lineHeight: 23 },
  due: { fontSize: 17, lineHeight: 22 },
});
