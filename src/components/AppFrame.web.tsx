import React, { PropsWithChildren } from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';
import { colorsFor } from '@/theme/theme';

export function AppFrame({ children }: PropsWithChildren) {
  const colors = colorsFor(useColorScheme());
  return <View style={[styles.app, { backgroundColor: colors.background }]}><View pointerEvents="none" style={styles.dragRegion as never} />{children}</View>;
}

const styles = StyleSheet.create({
  app: { flex: 1, width: '100%', overflow: 'hidden', position: 'relative' },
  dragRegion: { position: 'absolute', top: 0, left: 0, right: 0, height: 68, zIndex: 100, WebkitAppRegion: 'drag' } as never,
});
