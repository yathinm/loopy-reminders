import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { LoopyMascot } from './LoopyMascot';
import { colorsFor } from '@/theme/theme';

const pages = [
  { title: 'Meet Loopy', message: 'A cheerful little helper for everything you want to remember.', mood: 'happy' as const },
  { title: 'Gentle, useful nudges', message: 'Choose a date and time, and Loopy will remind you. Your reminders stay private on this device.', mood: 'calm' as const },
];

export function WelcomeSheet({ visible, onFinish }: { visible: boolean; onFinish: () => Promise<void> }) {
  const colors = colorsFor(useColorScheme()); const [page, setPage] = useState(0); const content = pages[page]!;
  return <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.art, { backgroundColor: colors.softBrand }]}><LoopyMascot size={170} mood={content.mood} /></View>
      <Text style={[styles.title, { color: colors.text }]}>{content.title}</Text><Text style={[styles.message, { color: colors.secondaryText }]}>{content.message}</Text>
      <View style={styles.dots}>{pages.map((_, index) => <View key={index} style={[styles.dot, { backgroundColor: index === page ? colors.accent : colors.border }]} />)}</View>
      <Pressable accessibilityRole="button" onPress={() => page < pages.length - 1 ? setPage(page + 1) : void onFinish()} style={[styles.button, { backgroundColor: colors.accent }]}><Text style={styles.buttonText}>{page < pages.length - 1 ? 'Continue' : 'Start remembering'}</Text></Pressable>
    </View>
  </Modal>;
}
const styles = StyleSheet.create({ container: { flex: 1, padding: 28, justifyContent: 'center' }, art: { height: 250, borderRadius: 36, alignItems: 'center', justifyContent: 'center' }, title: { fontSize: 31, textAlign: 'center', fontWeight: '900', marginTop: 30 }, message: { fontSize: 17, lineHeight: 25, textAlign: 'center', marginTop: 10 }, dots: { flexDirection: 'row', justifyContent: 'center', gap: 7, marginVertical: 28 }, dot: { width: 8, height: 8, borderRadius: 4 }, button: { height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }, buttonText: { color: 'white', fontSize: 17, fontWeight: '800' } });

