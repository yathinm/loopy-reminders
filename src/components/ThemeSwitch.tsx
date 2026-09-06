import React from 'react';
import { Platform, Pressable, StyleSheet, Switch, View } from 'react-native';
import { colorsFor } from '@/theme/theme';

type ThemeSwitchProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  colors: ReturnType<typeof colorsFor>;
  compact?: boolean;
};

export function ThemeSwitch({ value, onValueChange, colors, compact = false }: ThemeSwitchProps) {
  if (Platform.OS !== 'web') {
    return (
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.brand }}
        thumbColor={value ? colors.accent : colors.border}
        ios_backgroundColor={colors.border}
      />
    );
  }

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => onValueChange(!value)}
      style={[styles.track, compact && styles.compactTrack, { backgroundColor: value ? colors.brand : colors.border }]}
    >
      <View
        style={[
          styles.thumb,
          compact && styles.compactThumb,
          {
            backgroundColor: value ? colors.accent : colors.background,
            transform: [{ translateX: value ? (compact ? 22 : 26) : 0 }],
          },
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 52,
    height: 30,
    borderRadius: 15,
    padding: 2,
    justifyContent: 'center',
  },
  thumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  compactTrack: { width: 48, height: 28, borderRadius: 14 },
  compactThumb: { width: 24, height: 24, borderRadius: 12 },
});
