import React from 'react';
import { StyleSheet, TextInput, useColorScheme, View } from 'react-native';
import { useReminders } from '@/store/ReminderProvider';
import { colorsFor } from '@/theme/theme';

export default function NotesScreen() {
  const colors = colorsFor(useColorScheme());
  const { notepad, saveNotepad } = useReminders();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <TextInput
        accessibilityLabel="Notepad"
        multiline
        value={notepad}
        onChangeText={(content) => void saveNotepad(content)}
        placeholder="Write a note…"
        placeholderTextColor={colors.secondaryText}
        style={[styles.notepad, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
        textAlignVertical="top"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingBottom: 28 },
  notepad: { flex: 1, borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, padding: 18, fontSize: 17, lineHeight: 25, outlineStyle: 'none' } as never,
});
