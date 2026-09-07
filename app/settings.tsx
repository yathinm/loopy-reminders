import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { AppState, Linking, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { LoopyMascot } from '@/components/LoopyMascot';
import { Screen } from '@/components/Screen';
import { ThemeSwitch } from '@/components/ThemeSwitch';
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
    <View style={[styles.mascotBanner, { backgroundColor: colors.softBrand }]}><View style={styles.mascotCopy}><Text style={[styles.mascotTitle, { color: colors.text }]}>Loopy has your back</Text><Text style={[styles.mascotMessage, { color: colors.secondaryText }]}>Choose how you want to be reminded.</Text></View><LoopyMascot variant="resting" size={100} /></View>
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Row icon="notifications" label="Notifications" detail={notificationStatus === 'denied' ? 'Disabled in Settings' : undefined} colors={colors}><ThemeSwitch compact value={granted} onValueChange={(value) => void toggleNotifications(value)} colors={colors} /></Row>
      <Pressable onPress={() => void Linking.openSettings()} style={[styles.linkRow, { borderTopColor: colors.border }]}><Ionicons name="settings-outline" size={20} color={colors.accent} /><Text style={[styles.link, { color: colors.text }]}>Open iOS Settings</Text><Ionicons name="open-outline" size={17} color={colors.secondaryText} /></Pressable>
    </View>
  </Screen>;
}

function Row({ icon, label, detail, colors, children }: { icon: keyof typeof Ionicons.glyphMap; label: string; detail?: string; colors: ReturnType<typeof colorsFor>; children?: React.ReactNode }) {
  return <View style={styles.row}><Ionicons name={icon} size={21} color={colors.accent} /><View style={styles.copy}><Text style={[styles.rowTitle, { color: colors.text }]}>{label}</Text>{detail && <Text style={[styles.detail, { color: colors.secondaryText }]}>{detail}</Text>}</View>{children}</View>;
}
const styles = StyleSheet.create({ mascotBanner: { height: 108, borderRadius: 20, paddingLeft: 18, paddingRight: 8, marginBottom: 14, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' }, mascotCopy: { flex: 1 }, mascotTitle: { fontSize: 19, fontWeight: '800' }, mascotMessage: { fontSize: 14, lineHeight: 19, marginTop: 3 }, card: { borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', marginBottom: 14, paddingHorizontal: 14 }, row: { minHeight: 61, flexDirection: 'row', alignItems: 'center', gap: 11 }, copy: { flex: 1 }, rowTitle: { fontSize: 16, fontWeight: '600' }, detail: { fontSize: 12, marginTop: 2 }, linkRow: { minHeight: 54, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 11 }, link: { flex: 1, fontSize: 16, fontWeight: '600' } });
