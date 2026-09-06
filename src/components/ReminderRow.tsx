import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { Alert, Animated, PanResponder, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { Reminder } from '@/domain/types';
import { colorsFor, spacing } from '@/theme/theme';

export function ReminderRow({ reminder, onToggle, onPress, onFlag, onDelete }: { reminder: Reminder; onToggle: () => void; onPress: () => void; onFlag?: () => void; onDelete?: () => void }) {
  const colors = colorsFor(useColorScheme()); const [renderedAt] = useState(() => Date.now()); const [, setOpen] = useState(false); const openRef = useRef(false); const offset = useRef(new Animated.Value(0)).current;
  const setOpenState = (value: boolean) => { openRef.current = value; setOpen(value); };
  const due = reminder.dueAt ? new Date(reminder.dueAt) : null; const overdue = due && !reminder.isCompleted && due.getTime() < renderedAt;
  const close = () => Animated.spring(offset, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start(() => setOpenState(false));
  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > Math.abs(gesture.dy) && Math.abs(gesture.dx) > 8,
    onMoveShouldSetPanResponderCapture: (_, gesture) => Math.abs(gesture.dx) > Math.abs(gesture.dy) && Math.abs(gesture.dx) > 8,
    onPanResponderTerminationRequest: () => false,
    onPanResponderMove: (_, gesture) => offset.setValue(Math.max(-210, Math.min(0, gesture.dx + (openRef.current ? -210 : 0)))),
    onPanResponderRelease: (_, gesture) => { const shouldOpen = openRef.current ? gesture.dx <= -80 : gesture.dx < -80; Animated.spring(offset, { toValue: shouldOpen ? -210 : 0, useNativeDriver: true, bounciness: 0 }).start(() => setOpenState(shouldOpen)); },
    onPanResponderTerminate: () => close(),
  })).current;
  return <View style={[styles.container, { borderBottomColor: colors.border, backgroundColor: colors.surface }]} {...panResponder.panHandlers}>
    <View style={styles.actions}>
      <Pressable accessibilityRole="button" accessibilityLabel="Open reminder details" onPress={() => { close(); onPress(); }} style={[styles.action, { backgroundColor: colors.border }]}><Ionicons name="information" size={23} color={colors.onColor} /><Text style={{ color: colors.onColor }}>Details</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={reminder.isFlagged ? 'Remove flag' : 'Flag reminder'} onPress={() => { close(); onFlag?.(); }} style={[styles.action, { backgroundColor: colors.softBrand }]}><Ionicons name={reminder.isFlagged ? 'flag' : 'flag-outline'} size={23} color={colors.onColor} /><Text style={{ color: colors.onColor }}>Flag</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Delete reminder" onPress={() => { close(); Alert.alert('Delete reminder?', 'This reminder will move to Recently Deleted.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: onDelete }]); }} style={[styles.action, { backgroundColor: colors.danger }]}><Ionicons name="trash" size={23} color={colors.onColor} /><Text style={{ color: colors.onColor }}>Delete</Text></Pressable>
    </View>
    <Animated.View style={[styles.content, { transform: [{ translateX: offset }], backgroundColor: colors.surface }]}><Pressable accessibilityRole="checkbox" accessibilityState={{ checked: reminder.isCompleted }} accessibilityLabel={'Mark ' + reminder.title + ' ' + (reminder.isCompleted ? 'incomplete' : 'complete')} hitSlop={10} onPress={onToggle} style={[styles.check, { borderColor: reminder.priority ? colors.warning : colors.brand, backgroundColor: reminder.isCompleted ? colors.brand : 'transparent' }]}>{reminder.isCompleted && <Ionicons name="checkmark" size={17} color={colors.onColor} />}</Pressable><Pressable accessibilityRole="button" onPress={onPress} style={styles.body}><View style={styles.titleLine}><Text numberOfLines={2} style={[styles.title, { color: colors.text, textDecorationLine: reminder.isCompleted ? 'line-through' : 'none', opacity: reminder.isCompleted ? 0.55 : 1 }]}>{reminder.title}</Text>{reminder.isFlagged && <Ionicons name="flag" size={15} color={colors.warning} />}</View>{!!reminder.notes && <Text numberOfLines={1} style={[styles.notes, { color: colors.secondaryText }]}>{reminder.notes}</Text>}<View style={styles.meta}>{due && <Text style={[styles.due, { color: overdue ? colors.danger : colors.secondaryText }]}>{formatDue(due, reminder.hasTime)}</Text>}{reminder.recurrence && <Ionicons name="repeat" size={13} color={colors.secondaryText} />}{reminder.tags.map((tag) => <Text key={tag.id} style={[styles.tag, { color: colors.accent, backgroundColor: colors.softBrand }]}>#{tag.name}</Text>)}</View></Pressable></Animated.View>
  </View>;
}

function formatDue(date: Date, hasTime: boolean) { const dateText = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date); return hasTime ? dateText + ', ' + new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date) : dateText; }

const styles = StyleSheet.create({
  container: { minHeight: 72, borderBottomWidth: StyleSheet.hairlineWidth, overflow: 'hidden' }, content: { width: '100%', flexDirection: 'row', paddingVertical: 13, paddingHorizontal: 14, gap: spacing.md, zIndex: 1 },
  actions: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 210, flexDirection: 'row', zIndex: 2 }, action: { width: 70, alignItems: 'center', justifyContent: 'center', gap: 3 },
  check: { width: 25, height: 25, borderRadius: 13, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 1 }, body: { flex: 1 }, titleLine: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  title: { fontSize: 17, lineHeight: 22, flexShrink: 1 }, notes: { fontSize: 14, marginTop: 2 }, meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 5 }, due: { fontSize: 13, fontWeight: '600' }, tag: { fontSize: 12, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 7 },
});
