import React, { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colorsFor } from '@/theme/theme';

export function Screen({ children, scroll = true }: PropsWithChildren<{ scroll?: boolean }>) {
  const colors = colorsFor(useColorScheme());
  if (!scroll) return <SafeAreaView edges={['bottom']} style={[styles.safe, { backgroundColor: colors.background }]}>{children}</SafeAreaView>;
  return (
    <SafeAreaView edges={['bottom']} style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { backgroundColor: colors.background }]}>{children}</ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({ safe: { flex: 1 }, content: { padding: 16, paddingBottom: 48 } });
