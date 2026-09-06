import { ColorSchemeName } from 'react-native';

export const palette = {
  pink: '#E78FA2',
  pinkLight: '#FBE7EC',
  plum: '#5A183E',
  plumLight: '#8D315F',
  cream: '#FFF8F4',
  white: '#FFFFFF',
  ink: '#2B1D26',
  muted: '#75666F',
  border: '#E9DDE3',
  success: '#3B8A63',
  warning: '#C07716',
  danger: '#C43C54',
  dark: '#171116',
  darkSurface: '#241B21',
  darkBorder: '#3A2E35',
};

export function colorsFor(scheme: ColorSchemeName) {
  const dark = scheme === 'dark';
  return {
    background: dark ? palette.dark : palette.cream,
    surface: dark ? palette.darkSurface : palette.white,
    text: dark ? '#FFF7FA' : palette.ink,
    secondaryText: dark ? '#CBBCC4' : palette.muted,
    border: dark ? palette.darkBorder : palette.border,
    accent: palette.plumLight,
    brand: palette.pink,
    softBrand: dark ? '#472A38' : palette.pinkLight,
    success: palette.success,
    warning: palette.warning,
    danger: dark ? '#FF8296' : palette.danger,
  };
}

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

