import React, { PropsWithChildren } from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';
import { colorsFor } from '@/theme/theme';

export function AppFrame({ children }: PropsWithChildren) {
  const colors = colorsFor(useColorScheme());
  return <View style={[styles.app, { backgroundColor: colors.background }]}>{children}</View>;
}

const styles = StyleSheet.create({
  app: { flex: 1, width: '100%', overflow: 'hidden' },
});
