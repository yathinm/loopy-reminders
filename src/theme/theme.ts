import { ColorSchemeName, Platform } from 'react-native';

export const palette = {
  dustyRose: '#C97882',
  softPink: '#E89AA5',
  blushPink: '#F2B7BE',
  deepPlum: '#55142F',
  warmCoral: '#D95F5F',
  softGray: '#D8D1D3',
  creamWhite: '#FFF7F4',
  nearBlack: '#21171B',
};

export function colorsFor(scheme: ColorSchemeName) {
  const dark = Platform.OS !== 'web' && scheme === 'dark';
  return {
    background: dark ? palette.nearBlack : palette.creamWhite,
    surface: dark ? palette.deepPlum : palette.blushPink,
    text: dark ? palette.creamWhite : palette.nearBlack,
    secondaryText: dark ? palette.softGray : palette.deepPlum,
    border: palette.softGray,
    accent: dark ? palette.softPink : palette.deepPlum,
    brand: palette.dustyRose,
    softBrand: dark ? palette.deepPlum : palette.blushPink,
    warning: palette.warmCoral,
    danger: palette.warmCoral,
    onColor: palette.creamWhite,
  };
}

export const spacing = { md: 12, lg: 16 } as const;
