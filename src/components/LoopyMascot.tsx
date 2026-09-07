import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

const mascotSources = {
  angel: require('../../assets/mascot/loopy1.png'),
  driving: require('../../assets/mascot/loopy2.png'),
  resting: require('../../assets/mascot/loopy3.png'),
} as const;

export type LoopyMascotVariant = keyof typeof mascotSources;

export function LoopyMascot({ variant, size, style }: { variant: LoopyMascotVariant; size: number; style?: StyleProp<ImageStyle> }) {
  return <Image accessible={false} resizeMode="contain" source={mascotSources[variant]} style={[{ width: size, height: size }, style]} />;
}
