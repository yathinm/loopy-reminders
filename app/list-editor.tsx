import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, useColorScheme, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { useReminders } from '@/store/ReminderProvider';
import { colorsFor } from '@/theme/theme';

const palette = ['#E78FA2', '#8D315F', '#4E7AC7', '#A456A8', '#3B8A63', '#D37A2C'];
const symbols: (keyof typeof Ionicons.glyphMap)[] = ['list', 'home', 'school', 'fitness', 'cart', 'heart'];

export default function ListEditorScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>(); const router = useRouter();
  const colors = colorsFor(useColorScheme()); const { lists, createList, updateList } = useReminders();
  const existing = lists.find((list) => list.id === id);
  const [name, setName] = useState(existing?.name ?? '');
  const [color, setColor] = useState(existing?.color ?? palette[0]!);
  const [symbol, setSymbol] = useState<keyof typeof Ionicons.glyphMap>((existing?.symbol as keyof typeof Ionicons.glyphMap | undefined) ?? symbols[0]!);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) return;
    try { setSaving(true); if (existing) await updateList(existing.id, name, color, symbol); else await createList(name, color, symbol); router.back(); }
    catch { setSaving(false); Alert.alert('Could not save list', 'Please try again.'); }
  }

  return <Screen>
    <View style={styles.actions}><Pressable onPress={() => router.back()}><Text style={[styles.action, { color: colors.accent }]}>Cancel</Text></Pressable><Pressable disabled={!name.trim() || saving} onPress={save}><Text style={[styles.action, { color: colors.accent, opacity: !name.trim() || saving ? 0.4 : 1 }]}>{saving ? 'Saving…' : 'Save'}</Text></Pressable></View>
    <View style={[styles.preview, { backgroundColor: colors.softBrand }]}><View style={[styles.previewIcon, { backgroundColor: color }]}><Ionicons name={symbol} size={32} color="white" /></View><Text style={[styles.previewText, { color: colors.text }]}>{name.trim() || 'New List'}</Text></View>
    <TextInput autoFocus accessibilityLabel="List name" maxLength={60} value={name} onChangeText={setName} placeholder="List name" placeholderTextColor={colors.secondaryText} style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]} />
    <Text style={[styles.label, { color: colors.text }]}>Color</Text><View style={styles.choices}>{palette.map((value) => <Pressable accessibilityRole="radio" accessibilityState={{ selected: color === value }} accessibilityLabel={`Choose color ${value}`} key={value} onPress={() => setColor(value)} style={[styles.color, { backgroundColor: value }, color === value && styles.selected]}>{color === value && <Ionicons name="checkmark" size={21} color="white" />}</Pressable>)}</View>
    <Text style={[styles.label, { color: colors.text }]}>Symbol</Text><View style={styles.choices}>{symbols.map((value) => <Pressable accessibilityRole="radio" accessibilityState={{ selected: symbol === value }} key={value} onPress={() => setSymbol(value)} style={[styles.symbol, { backgroundColor: symbol === value ? colors.softBrand : colors.surface, borderColor: symbol === value ? colors.accent : colors.border }]}><Ionicons name={value} size={23} color={symbol === value ? colors.accent : colors.secondaryText} /></Pressable>)}</View>
  </Screen>;
}
const styles = StyleSheet.create({ actions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 }, action: { fontSize: 17, fontWeight: '700' }, preview: { height: 150, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }, previewIcon: { width: 62, height: 62, borderRadius: 19, alignItems: 'center', justifyContent: 'center' }, previewText: { fontSize: 22, fontWeight: '800', marginTop: 9 }, input: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, padding: 14, fontSize: 17 }, label: { fontSize: 17, fontWeight: '800', marginTop: 24, marginBottom: 12 }, choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 13 }, color: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }, selected: { borderWidth: 3, borderColor: 'white' }, symbol: { width: 50, height: 50, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' } });
