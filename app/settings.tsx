import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { AppState, Linking, Platform, Pressable, StyleSheet, Switch, Text, useColorScheme, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { ensureNotificationPermission, getNotificationPermissionStatus } from '@/services/notifications';
import { colorsFor } from '@/theme/theme';

export default function SettingsScreen() {
  const colors = colorsFor(useColorScheme());
  const [notificationStatus, setNotificationStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  async function refreshSettings() {
    setNotificationStatus(await getNotificationPermissionStatus());
  }
  useEffect(() => {
    void refreshSettings();
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') void refreshSettings(); });
    return () => subscription.remove();
  }, []);

  async function toggleNotifications(value: boolean) {
    if (value) { const allowed = await ensureNotificationPermission(); setNotificationStatus(allowed ? 'granted' : 'denied'); }
    else await Linking.openSettings();
  }

  const granted = notificationStatus === 'granted';
  return <Screen>
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Row icon="notifications" label="Notifications" detail={notificationStatus === 'denied' ? 'Disabled in Settings' : undefined} colors={colors}><ThemeSwitch value={granted} onValueChange={(value) => void toggleNotifications(value)} colors={colors} /></Row>
      <Pressable onPress={() => void Linking.openSettings()} style={[styles.linkRow, { borderTopColor: colors.border }]}><Ionicons name="settings-outline" size={20} color={colors.accent} /><Text style={[styles.link, { color: colors.text }]}>Open iOS Settings</Text><Ionicons name="open-outline" size={17} color={colors.secondaryText} /></Pressable>
    </View>
  </Screen>;
}

function Row({ icon, label, detail, colors, children }: { icon: keyof typeof Ionicons.glyphMap; label: string; detail?: string; colors: ReturnType<typeof colorsFor>; children?: React.ReactNode }) {
  return <View style={styles.row}><Ionicons name={icon} size={21} color={colors.accent} /><View style={styles.copy}><Text style={[styles.rowTitle, { color: colors.text }]}>{label}</Text>{detail && <Text style={[styles.detail, { color: colors.secondaryText }]}>{detail}</Text>}</View>{children}</View>;
}
function ThemeSwitch({ value, onValueChange, colors }: { value: boolean; onValueChange: (value: boolean) => void; colors: ReturnType<typeof colorsFor> }) {
  if (Platform.OS === 'web') return <Pressable accessibilityRole="switch" accessibilityState={{ checked: value }} onPress={() => onValueChange(!value)} style={[styles.switchTrack, { backgroundColor: value ? colors.brand : colors.border }]}><View style={[styles.switchThumb, { backgroundColor: value ? colors.accent : colors.background, transform: [{ translateX: value ? 22 : 0 }] }]} /></Pressable>;
  return <Switch value={value} onValueChange={onValueChange} trackColor={{ false: colors.border, true: colors.brand }} thumbColor={value ? colors.accent : colors.border} ios_backgroundColor={colors.border} />;
}
const styles = StyleSheet.create({ card: { borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', marginBottom: 14, paddingHorizontal: 14 }, row: { minHeight: 61, flexDirection: 'row', alignItems: 'center', gap: 11 }, copy: { flex: 1 }, switchTrack: { width: 48, height: 28, borderRadius: 14, padding: 2, justifyContent: 'center' }, switchThumb: { width: 24, height: 24, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.16, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } }, rowTitle: { fontSize: 16, fontWeight: '600' }, detail: { fontSize: 12, marginTop: 2 }, linkRow: { minHeight: 54, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 11 }, link: { flex: 1, fontSize: 16, fontWeight: '600' } });
