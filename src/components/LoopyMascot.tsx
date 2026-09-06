import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { palette } from '@/theme/theme';

type Mood = 'happy' | 'calm' | 'sleepy';

export function LoopyMascot({ size = 104, mood = 'happy' }: { size?: number; mood?: Mood }) {
  const eye = mood === 'sleepy' ? '﹀' : '●';
  return (
    <View accessibilityLabel={`Loopy looks ${mood}`} style={[styles.frame, { width: size, height: size }]}>
      <View style={[styles.ear, styles.leftEar, { width: size * 0.2, height: size * 0.2 }]} />
      <View style={[styles.ear, styles.rightEar, { width: size * 0.2, height: size * 0.2 }]} />
      <View style={[styles.head, { width: size * 0.78, height: size * 0.74, borderRadius: size * 0.38 }]}>
        <View style={styles.eyes}><Text style={[styles.eye, { fontSize: size * 0.11 }]}>{eye}</Text><Text style={[styles.eye, { fontSize: size * 0.11 }]}>{eye}</Text></View>
        <View style={[styles.nose, { width: size * 0.22, height: size * 0.15, borderRadius: size * 0.1 }]} />
        <Text style={[styles.mouth, { fontSize: size * 0.12 }]}>{mood === 'happy' ? '⌣' : '–'}</Text>
      </View>
      <View style={[styles.hair, { height: size * 0.22 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { alignItems: 'center', justifyContent: 'center' },
  head: { backgroundColor: palette.pink, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#C9788D', zIndex: 2 },
  ear: { position: 'absolute', top: '12%', borderRadius: 999, backgroundColor: palette.pink, borderWidth: 2, borderColor: '#C9788D' },
  leftEar: { left: '8%' }, rightEar: { right: '8%' },
  eyes: { flexDirection: 'row', gap: 22, marginTop: 10 },
  eye: { color: '#24101B', lineHeight: 18 },
  nose: { backgroundColor: palette.plum, marginTop: 3 },
  mouth: { color: palette.white, fontWeight: '900', lineHeight: 16 },
  hair: { position: 'absolute', top: 0, width: 3, backgroundColor: palette.plum, transform: [{ rotate: '12deg' }], zIndex: 3, borderRadius: 3 },
});

