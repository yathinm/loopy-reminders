import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { WelcomeSheet } from '@/components/WelcomeSheet';
import { Screen } from '@/components/Screen';
import { filterSmartList } from '@/domain/filters';
import { SmartList } from '@/domain/types';
import { useReminders } from '@/store/ReminderProvider';
import { colorsFor, palette } from '@/theme/theme';

const smartLists: { id: SmartList; title: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { id: 'today', title: 'Today', icon: 'calendar', color: palette.dustyRose },
  { id: 'scheduled', title: 'Scheduled', icon: 'time', color: palette.softPink },
  { id: 'all', title: 'All', icon: 'file-tray-full', color: palette.deepPlum },
  { id: 'flagged', title: 'Flagged', icon: 'flag', color: palette.warmCoral },
  { id: 'completed', title: 'Completed', icon: 'checkmark-circle', color: palette.dustyRose },
];

export default function HomeScreen() {
  const router = useRouter(); const colors = colorsFor(useColorScheme());
  const { reminders, deletedReminders, lists, loading, error, onboardingComplete, completeOnboarding } = useReminders();
  if (loading) return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.accent} /></View>;
  return (
    <Screen scroll={false}>
      <WelcomeSheet visible={!onboardingComplete} onFinish={completeOnboarding} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <View style={styles.toolbar}>
        <Pressable accessibilityRole="button" accessibilityLabel="Search reminders" onPress={() => router.push('/search')} style={[styles.searchButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={22} color={colors.accent} /><Text style={[styles.searchLabel, { color: colors.secondaryText }]}>Search</Text>
        </Pressable>
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
        <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: colors.text }]}>My Lists</Text></View>
        <View style={[styles.listBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {lists.map((list, index) => (
          <Pressable key={list.id} onPress={() => router.push({ pathname: '/list/[id]', params: { id: list.id } })} style={[styles.listRow, index < lists.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
            <View style={[styles.listIcon, { backgroundColor: list.color }]}><Ionicons name={list.symbol as keyof typeof Ionicons.glyphMap} size={18} color={colors.onColor} /></View>
            <Text style={[styles.listName, { color: colors.text }]}>{list.name}</Text>
            <Text style={{ color: colors.secondaryText }}>{reminders.filter((r) => r.listId === list.id && !r.isCompleted).length}</Text>
            <Ionicons name="chevron-forward" size={17} color={colors.secondaryText} />
          </Pressable>
        ))}
        <Pressable onPress={() => router.push('/recently-deleted')} style={[styles.listRow, { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }]} accessibilityRole="button" accessibilityLabel={`Recently Deleted, ${deletedReminders.length} reminders`}>
          <View style={[styles.listIcon, { backgroundColor: colors.softBrand }]}><Ionicons name="trash-outline" size={18} color={colors.accent} /></View>
          <Text style={[styles.listName, { color: colors.text }]}>Recently Deleted</Text>
          <Text style={{ color: colors.secondaryText }}>{deletedReminders.length}</Text>
          <Ionicons name="chevron-forward" size={17} color={colors.secondaryText} />
        </Pressable>
        </View>
      </ScrollView>
      <Pressable accessibilityRole="button" accessibilityLabel="Add reminder" onPress={() => router.push('/reminder/new')} style={({ pressed }) => [styles.fab, { backgroundColor: colors.accent, opacity: pressed ? 0.78 : 1 }]}><Ionicons name="add" size={28} color={colors.onColor} /></Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' }, content: { padding: 16, paddingBottom: 110 }, toolbar: { width: '100%', marginBottom: 16 }, searchButton: { width: '100%', height: 50, borderRadius: 25, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 17, gap: 10 }, searchLabel: { fontSize: 16, fontWeight: '600' }, error: { padding: 12, borderRadius: 12, marginTop: 12 },
  smartGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, smartCard: { width: '48%', flexGrow: 1, minHeight: 126, padding: 14, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth }, iconCircle: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, count: { fontSize: 27, fontWeight: '800', position: 'absolute', right: 14, top: 14 }, cardTitle: { fontSize: 16, fontWeight: '700', marginTop: 18 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 26, marginBottom: 9 }, sectionTitle: { fontSize: 22, fontWeight: '800' }, listBox: { borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' }, listRow: { minHeight: 55, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 11 }, listIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, listName: { fontSize: 17, fontWeight: '600', flex: 1 },
  fab: { position: 'absolute', right: 16, bottom: 18, width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center' },
});
