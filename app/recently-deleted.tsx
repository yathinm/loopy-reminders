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

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Recently Deleted' }} />
      {deletedReminders.length === 0 ? <EmptyState title="Recently Deleted is empty" message="Deleted reminders will appear here." /> : (
        <View style={[styles.list, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {deletedReminders.map((reminder) => (
            <View key={reminder.id} style={[styles.row, { borderBottomColor: colors.border }]}>
              <Text numberOfLines={2} style={[styles.title, { color: colors.text }]}>{reminder.title}</Text>
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
  row: { minHeight: 65, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, gap: 8 },
  title: { fontSize: 17, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 18 },
  action: { fontSize: 14, fontWeight: '800' },
});
