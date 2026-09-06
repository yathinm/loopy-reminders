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

  return <Screen backgroundColor={colors.softBrand}>
    <Stack.Screen options={{ title: 'Recently Deleted', headerStyle: { backgroundColor: colors.softBrand }, headerTintColor: colors.accent, headerShadowVisible: false }} />
    <Text style={[styles.description, { color: colors.secondaryText }]}>Reminders are available here for 30 days. After that time, reminders will be permanently deleted.</Text>
    {deletedReminders.length === 0 ? <EmptyState title="Recently Deleted is empty" message="Deleted reminders will appear here." /> : (
      <View style={styles.rows}>
        {deletedReminders.map((reminder) => (
          <View key={reminder.id} style={[styles.row, { borderBottomColor: colors.border }]}>
            <View style={[styles.circle, { borderColor: colors.border }]} />
            <View style={styles.content}>
              <Text style={[styles.title, { color: colors.text }]}>{reminder.title}</Text>
              {reminder.dueAt && <Text style={[styles.due, { color: colors.danger }]}>{formatDate(reminder.dueAt, reminder.hasTime)}</Text>}
              {!!reminder.notes && <Text style={[styles.notes, { color: colors.secondaryText }]} numberOfLines={2}>{reminder.notes}</Text>}
              <View style={styles.actions}>
                <Pressable accessibilityRole="button" onPress={() => void restoreReminder(reminder.id)} hitSlop={8}><Text style={[styles.action, { color: colors.accent }]}>Restore</Text></Pressable>
                <Pressable accessibilityRole="button" onPress={() => confirmPermanentDelete(reminder.id, reminder.title)} hitSlop={8}><Text style={[styles.action, { color: colors.danger }]}>Delete</Text></Pressable>
              </View>
            </View>
          </View>
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
  row: { flexDirection: 'row', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, gap: 14 },
  circle: { width: 25, height: 25, borderRadius: 13, borderWidth: 2, marginTop: 2 },
  content: { flex: 1, gap: 5 },
  title: { fontSize: 18, lineHeight: 23 },
  due: { fontSize: 17, lineHeight: 22 },
  notes: { fontSize: 14, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 20, marginTop: 4 },
  action: { fontSize: 15, fontWeight: '800' },
});
