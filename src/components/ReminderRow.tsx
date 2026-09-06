import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { Reminder } from '@/domain/types';
import { colorsFor, spacing } from '@/theme/theme';

export function ReminderRow({ reminder, onToggle, onPress }: { reminder: Reminder; onToggle: () => void; onPress: () => void }) {
  const colors = colorsFor(useColorScheme());
  const [renderedAt] = useState(() => Date.now());
  const due = reminder.dueAt ? new Date(reminder.dueAt) : null;
  const overdue = due && !reminder.isCompleted && due.getTime() < renderedAt;
  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: reminder.isCompleted }} accessibilityLabel={`Mark ${reminder.title} ${reminder.isCompleted ? 'incomplete' : 'complete'}`} hitSlop={10} onPress={onToggle} style={[styles.check, { borderColor: reminder.priority ? colors.warning : colors.brand, backgroundColor: reminder.isCompleted ? colors.brand : 'transparent' }]}>
        {reminder.isCompleted && <Ionicons name="checkmark" size={17} color="white" />}
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onPress} style={styles.body}>
        <View style={styles.titleLine}>
          <Text numberOfLines={2} style={[styles.title, { color: colors.text, textDecorationLine: reminder.isCompleted ? 'line-through' : 'none', opacity: reminder.isCompleted ? 0.55 : 1 }]}>{reminder.title}</Text>
          {reminder.isFlagged && <Ionicons name="flag" size={15} color={colors.warning} />}
        </View>
        {!!reminder.notes && <Text numberOfLines={1} style={[styles.notes, { color: colors.secondaryText }]}>{reminder.notes}</Text>}
        <View style={styles.meta}>
          {due && <Text style={[styles.due, { color: overdue ? colors.danger : colors.secondaryText }]}>{formatDue(due, reminder.hasTime)}</Text>}
          {reminder.recurrence && <Ionicons name="repeat" size={13} color={colors.secondaryText} />}
          {reminder.tags.map((tag) => <Text key={tag.id} style={[styles.tag, { color: colors.accent, backgroundColor: colors.softBrand }]}>#{tag.name}</Text>)}
        </View>
      </Pressable>
    </View>
  );
}

function formatDue(date: Date, hasTime: boolean) {
  const dateText = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
  return hasTime ? `${dateText}, ${new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date)}` : dateText;
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth, gap: spacing.md },
  check: { width: 25, height: 25, borderRadius: 13, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  body: { flex: 1 }, titleLine: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  title: { fontSize: 17, lineHeight: 22, flexShrink: 1 }, notes: { fontSize: 14, marginTop: 2 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 5 },
  due: { fontSize: 13, fontWeight: '600' }, tag: { fontSize: 12, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 7 },
});
