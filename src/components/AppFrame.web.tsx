import React, { PropsWithChildren } from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';
import { colorsFor } from '@/theme/theme';

export function AppFrame({ children }: PropsWithChildren) {
  const colors = colorsFor(useColorScheme());
  return (
    <View style={[styles.window, { backgroundColor: colors.softBrand }]}> 
      <View style={[styles.app, { backgroundColor: colors.background, borderColor: colors.border }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  window: { flex: 1, alignItems: 'center' },
  app: {
    flex: 1,
    width: '100%',
    maxWidth: 960,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
});
