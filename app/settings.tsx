import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, Alert, AppState, Linking, Pressable, Share, StyleSheet, Switch, Text, useColorScheme, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { ensureNotificationPermission } from '@/services/notifications';
import { colorsFor } from '@/theme/theme';
import { useReminders } from '@/store/ReminderProvider';

export default function SettingsScreen() {
  const colors = colorsFor(useColorScheme());
  const { reminders, lists, deleteAllData } = useReminders();
  const [notificationStatus, setNotificationStatus] = useState<Notifications.PermissionStatus>(Notifications.PermissionStatus.UNDETERMINED);
  const [reduceMotion, setReduceMotion] = useState(false);
  async function refreshSettings() {
    const [permissions, motion] = await Promise.all([Notifications.getPermissionsAsync(), AccessibilityInfo.isReduceMotionEnabled()]);
    setNotificationStatus(permissions.status); setReduceMotion(motion);
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
  async function exportData() {
    const data = { exportedAt: new Date().toISOString(), version: 1, lists, reminders: reminders.map(({ notificationId: _notificationId, ...item }) => item) };
    await Share.share({ title: 'Loopy Reminders export', message: JSON.stringify(data, null, 2) });
  }
  function confirmDeleteAll() {
    Alert.alert('Delete all reminder data?', 'This permanently deletes every reminder and custom list from this device.', [
      { text: 'Cancel', style: 'cancel' }, { text: 'Delete Everything', style: 'destructive', onPress: () => void deleteAllData() },
    ]);
  }
  return <Screen>
    <View style={styles.masthead}><Text style={[styles.title, { color: colors.text }]}>Loopy settings</Text><Text style={[styles.subtitle, { color: colors.secondaryText }]}>Your reminder content stays on this device.</Text></View>
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Row icon="notifications" label="Notifications" detail={notificationStatus === Notifications.PermissionStatus.DENIED ? 'Disabled in Settings' : undefined} colors={colors}><Switch value={granted} onValueChange={(value) => void toggleNotifications(value)} trackColor={{ true: colors.brand }} /></Row>
      <Row icon="accessibility" label="Reduce Motion" detail="Uses your iOS setting" colors={colors}><Switch value={reduceMotion} disabled /></Row>
      <Pressable onPress={() => void Linking.openSettings()} style={[styles.linkRow, { borderTopColor: colors.border }]}><Ionicons name="settings-outline" size={20} color={colors.accent} /><Text style={[styles.link, { color: colors.text }]}>Open iOS Settings</Text><Ionicons name="open-outline" size={17} color={colors.secondaryText} /></Pressable>
    </View>
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}><Row icon="shield-checkmark" label="Privacy" detail="No account, analytics, or cloud upload" colors={colors} /><Row icon="information-circle" label="Version" detail="1.0.0" colors={colors} /></View>
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}><Pressable onPress={() => void exportData()} style={styles.linkRow}><Ionicons name="share-outline" size={20} color={colors.accent} /><Text style={[styles.link, { color: colors.text }]}>Export reminder data</Text><Ionicons name="chevron-forward" size={17} color={colors.secondaryText} /></Pressable><Pressable onPress={confirmDeleteAll} style={[styles.linkRow, { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }]}><Ionicons name="trash-outline" size={20} color={colors.danger} /><Text style={[styles.link, { color: colors.danger }]}>Delete all data</Text></Pressable></View>
  </Screen>;
}

function Row({ icon, label, detail, colors, children }: { icon: keyof typeof Ionicons.glyphMap; label: string; detail?: string; colors: ReturnType<typeof colorsFor>; children?: React.ReactNode }) {
  return <View style={styles.row}><Ionicons name={icon} size={21} color={colors.accent} /><View style={styles.copy}><Text style={[styles.rowTitle, { color: colors.text }]}>{label}</Text>{detail && <Text style={[styles.detail, { color: colors.secondaryText }]}>{detail}</Text>}</View>{children}</View>;
}
const styles = StyleSheet.create({ masthead: { alignItems: 'center', paddingVertical: 20 }, title: { fontSize: 22, fontWeight: '800', marginTop: 8 }, subtitle: { fontSize: 14, marginTop: 4 }, card: { borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', marginBottom: 14, paddingHorizontal: 14 }, row: { minHeight: 61, flexDirection: 'row', alignItems: 'center', gap: 11 }, copy: { flex: 1 }, rowTitle: { fontSize: 16, fontWeight: '600' }, detail: { fontSize: 12, marginTop: 2 }, linkRow: { minHeight: 54, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 11 }, link: { flex: 1, fontSize: 16, fontWeight: '600' } });
