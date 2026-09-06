import React from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';
import { colorsFor } from '@/theme/theme';

export function EmptyState({ title = 'All clear!', message = 'Loopy is taking a tiny break. Add a reminder whenever you are ready.' }: { title?: string; message?: string }) {
  const colors = colorsFor(useColorScheme());
  return <View style={styles.container}><View style={[styles.mark, { backgroundColor: colors.softBrand }]} /><Text style={[styles.title, { color: colors.text }]}>{title}</Text><Text style={[styles.message, { color: colors.secondaryText }]}>{message}</Text></View>;
}
const styles = StyleSheet.create({ container: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 }, mark: { width: 40, height: 8, borderRadius: 4 }, title: { fontSize: 22, fontWeight: '800', marginTop: 12 }, message: { textAlign: 'center', fontSize: 15, lineHeight: 21, marginTop: 6 } });
