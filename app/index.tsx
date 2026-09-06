import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { WelcomeSheet } from '@/components/WelcomeSheet';
import { Screen } from '@/components/Screen';
import { filterSmartList } from '@/domain/filters';
import { SmartList } from '@/domain/types';
import { useReminders } from '@/store/ReminderProvider';
import { colorsFor, palette, spacing } from '@/theme/theme';

const smartLists: { id: SmartList; title: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { id: 'today', title: 'Today', icon: 'calendar', color: palette.dustyRose },
  { id: 'scheduled', title: 'Scheduled', icon: 'time', color: palette.softPink },
  { id: 'all', title: 'All', icon: 'file-tray-full', color: palette.deepPlum },
  { id: 'flagged', title: 'Flagged', icon: 'flag', color: palette.warmCoral },
  { id: 'completed', title: 'Completed', icon: 'checkmark-circle', color: palette.dustyRose },
];

export default function HomeScreen() {
  const router = useRouter(); const colors = colorsFor(useColorScheme());
  const { reminders, lists, loading, error, onboardingComplete, completeOnboarding } = useReminders();
  if (loading) return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.accent} /></View>;
  return (
    <Screen>
      <WelcomeSheet visible={!onboardingComplete} onFinish={completeOnboarding} />
      <View style={[styles.hero, { backgroundColor: colors.softBrand }]}>
        <View style={styles.heroCopy}><Text style={[styles.greeting, { color: colors.text }]}>Hi, I’m Loopy!</Text><Text style={[styles.subheading, { color: colors.secondaryText }]}>{reminders.some((r) => !r.isCompleted) ? 'Let’s make today feel lighter.' : 'You’re all caught up. Nice work!'}</Text></View>
      </View>
      {error && <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger, backgroundColor: colors.surface }]}>{error}</Text>}
      <View style={styles.smartGrid}>
        {smartLists.map((item) => (
          <Pressable key={item.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/list/[id]', params: { id: item.id, smart: '1' } })} style={({ pressed }) => [styles.smartCard, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.72 : 1 }]}>
            <View style={[styles.iconCircle, { backgroundColor: item.color }]}><Ionicons name={item.icon} size={19} color={colors.onColor} /></View>
            <Text style={[styles.count, { color: colors.text }]}>{filterSmartList(reminders, item.id).length}</Text>
            <Text style={[styles.cardTitle, { color: colors.secondaryText }]}>{item.title}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: colors.text }]}>My Lists</Text><Pressable accessibilityLabel="Create a new list" hitSlop={10} onPress={() => router.push('/list-editor')}><Ionicons name="add-circle" size={27} color={colors.accent} /></Pressable></View>
      <View style={[styles.listBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {lists.map((list, index) => (
          <Pressable key={list.id} onPress={() => router.push({ pathname: '/list/[id]', params: { id: list.id } })} style={[styles.listRow, index < lists.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
            <View style={[styles.listIcon, { backgroundColor: list.color }]}><Ionicons name={list.symbol as keyof typeof Ionicons.glyphMap} size={18} color={colors.onColor} /></View>
            <Text style={[styles.listName, { color: colors.text }]}>{list.name}</Text>
            <Text style={{ color: colors.secondaryText }}>{reminders.filter((r) => r.listId === list.id && !r.isCompleted).length}</Text>
            <Ionicons name="chevron-forward" size={17} color={colors.secondaryText} />
          </Pressable>
        ))}
      </View>
      <View style={styles.actions}>
        <Pressable onPress={() => router.push('/search')} style={[styles.secondaryButton, { borderColor: colors.border, backgroundColor: colors.surface }]}><Ionicons name="search" size={19} color={colors.accent} /><Text style={[styles.buttonText, { color: colors.accent }]}>Search</Text></Pressable>
        <Pressable onPress={() => router.push('/settings')} style={[styles.secondaryButton, { borderColor: colors.border, backgroundColor: colors.surface }]}><Ionicons name="settings-outline" size={19} color={colors.accent} /><Text style={[styles.buttonText, { color: colors.accent }]}>Settings</Text></Pressable>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Add reminder" onPress={() => router.push('/reminder/new')} style={({ pressed }) => [styles.addButton, { backgroundColor: colors.accent, opacity: pressed ? 0.8 : 1 }]}><Ionicons name="add" size={24} color={colors.onColor} /><Text style={[styles.addText, { color: colors.onColor }]}>New Reminder</Text></Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' }, hero: { borderRadius: 24, padding: 18, flexDirection: 'row', alignItems: 'center', minHeight: 126 }, heroCopy: { flex: 1 }, greeting: { fontSize: 25, fontWeight: '900' }, subheading: { fontSize: 15, lineHeight: 21, marginTop: 6 }, error: { padding: 12, borderRadius: 12, marginTop: 12 },
  smartGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 }, smartCard: { width: '48%', flexGrow: 1, padding: 14, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth }, iconCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }, count: { fontSize: 26, fontWeight: '800', position: 'absolute', right: 14, top: 14 }, cardTitle: { fontWeight: '700', marginTop: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 26, marginBottom: 9 }, sectionTitle: { fontSize: 22, fontWeight: '800' }, listBox: { borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' }, listRow: { minHeight: 55, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 11 }, listIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, listName: { fontSize: 17, fontWeight: '600', flex: 1 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: 18 }, secondaryButton: { flex: 1, height: 46, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center' }, buttonText: { fontWeight: '700' },
  addButton: { minHeight: 54, borderRadius: 17, marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, addText: { fontSize: 17, fontWeight: '800' },
});
