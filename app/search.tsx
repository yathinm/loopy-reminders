import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { StyleSheet, TextInput, useColorScheme, View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { ReminderRow } from '@/components/ReminderRow';
import { Screen } from '@/components/Screen';
import { sortReminders } from '@/domain/filters';
import { useReminders } from '@/store/ReminderProvider';
import { colorsFor } from '@/theme/theme';

export default function SearchScreen() {
  const router = useRouter(); const colors = colorsFor(useColorScheme()); const { reminders, toggleReminder } = useReminders();
  const [query, setQuery] = useState('');
  const results = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase(); if (!needle) return [];
    return sortReminders(reminders.filter((item) => [item.title, item.notes, ...item.tags.map((tag) => tag.name)].some((value) => value.toLocaleLowerCase().includes(needle))));
  }, [query, reminders]);
  return <Screen>
    <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}><Ionicons name="search" size={19} color={colors.secondaryText} /><TextInput autoFocus accessibilityLabel="Search reminders" value={query} onChangeText={setQuery} clearButtonMode="while-editing" placeholder="Titles, notes, and tags" placeholderTextColor={colors.secondaryText} style={[styles.input, { color: colors.text }]} /></View>
    {!query.trim() ? <EmptyState title="Find anything" message="Search titles, notes, and tags." /> : results.length === 0 ? <EmptyState title="No matches" message="Loopy looked everywhere. Try another word." /> : <View style={[styles.list, { backgroundColor: colors.surface, borderColor: colors.border }]}>{results.map((item) => <ReminderRow key={item.id} reminder={item} onToggle={() => void toggleReminder(item.id)} onPress={() => router.push(`/reminder/${item.id}`)} />)}</View>}
  </Screen>;
}
const styles = StyleSheet.create({ search: { height: 48, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, gap: 9, marginBottom: 13 }, input: { flex: 1, fontSize: 16 }, list: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 17, paddingHorizontal: 14, overflow: 'hidden' } });

