import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useState } from 'react';
import { AppState, Linking, Pressable, StyleSheet, Switch, Text, useColorScheme, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { ensureNotificationPermission } from '@/services/notifications';
import { colorsFor } from '@/theme/theme';

export default function SettingsScreen() {
  const colors = colorsFor(useColorScheme());
  const [notificationStatus, setNotificationStatus] = useState<Notifications.PermissionStatus>(Notifications.PermissionStatus.UNDETERMINED);
  async function refreshSettings() {
    const permissions = await Notifications.getPermissionsAsync();
    setNotificationStatus(permissions.status);
  }
  useEffect(() => {
    void refreshSettings();
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') void refreshSettings(); });
    return () => subscription.remove();
  }, []);

  async function toggleNotifications(value: boolean) {
    if (value) { const allowed = await ensureNotificationPermission(); setNotificationStatus(allowed ? Notifications.PermissionStatus.GRANTED : Notifications.PermissionStatus.DENIED); }
    else await Linking.openSettings();
  }

  const granted = notificationStatus === Notifications.PermissionStatus.GRANTED;
  return <Screen>
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Row icon="notifications" label="Notifications" detail={notificationStatus === Notifications.PermissionStatus.DENIED ? 'Disabled in Settings' : undefined} colors={colors}><Switch value={granted} onValueChange={(value) => void toggleNotifications(value)} trackColor={{ true: colors.brand }} /></Row>
      <Pressable onPress={() => void Linking.openSettings()} style={[styles.linkRow, { borderTopColor: colors.border }]}><Ionicons name="settings-outline" size={20} color={colors.accent} /><Text style={[styles.link, { color: colors.text }]}>Open iOS Settings</Text><Ionicons name="open-outline" size={17} color={colors.secondaryText} /></Pressable>
    </View>
  </Screen>;
}

function Row({ icon, label, detail, colors, children }: { icon: keyof typeof Ionicons.glyphMap; label: string; detail?: string; colors: ReturnType<typeof colorsFor>; children?: React.ReactNode }) {
  return <View style={styles.row}><Ionicons name={icon} size={21} color={colors.accent} /><View style={styles.copy}><Text style={[styles.rowTitle, { color: colors.text }]}>{label}</Text>{detail && <Text style={[styles.detail, { color: colors.secondaryText }]}>{detail}</Text>}</View>{children}</View>;
}
const styles = StyleSheet.create({ card: { borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', marginBottom: 14, paddingHorizontal: 14 }, row: { minHeight: 61, flexDirection: 'row', alignItems: 'center', gap: 11 }, copy: { flex: 1 }, rowTitle: { fontSize: 16, fontWeight: '600' }, detail: { fontSize: 12, marginTop: 2 }, linkRow: { minHeight: 54, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 11 }, link: { flex: 1, fontSize: 16, fontWeight: '600' } });
