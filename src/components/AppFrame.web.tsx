import React, { PropsWithChildren } from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';
import { colorsFor } from '@/theme/theme';

export function AppFrame({ children }: PropsWithChildren) {
  const colors = colorsFor(useColorScheme());
  return (
    <View style={[styles.app, { backgroundColor: colors.background }]}>
      {children}
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.windowDragRegion} />
    </View>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, width: '100%', overflow: 'hidden' },
  windowDragRegion: {
    position: 'fixed',
    top: 0,
    right: 0,
    left: 128,
    height: 40,
    zIndex: 10_000,
    WebkitAppRegion: 'drag',
  } as never,
});
