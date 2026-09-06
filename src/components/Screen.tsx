import React, { PropsWithChildren } from 'react';
import { ScrollView, StyleProp, StyleSheet, useColorScheme, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colorsFor } from '@/theme/theme';

export function Screen({ children, scroll = true, contentStyle, backgroundColor }: PropsWithChildren<{ scroll?: boolean; contentStyle?: StyleProp<ViewStyle>; backgroundColor?: string }>) {
  const colors = colorsFor(useColorScheme());
  const surfaceColor = backgroundColor ?? colors.background;
  if (!scroll) return <SafeAreaView edges={['bottom']} style={[styles.safe, { backgroundColor: surfaceColor }, contentStyle]}>{children}</SafeAreaView>;
  return (
    <SafeAreaView edges={['bottom']} style={[styles.safe, { backgroundColor: surfaceColor }]}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { backgroundColor: surfaceColor }, contentStyle]}>{children}</ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({ safe: { flex: 1 }, content: { padding: 16, paddingBottom: 48 } });
