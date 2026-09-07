import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { Note } from '@/domain/types';
import { useReminders } from '@/store/ReminderProvider';
import { colorsFor } from '@/theme/theme';

export default function NotesScreen() {
  const router = useRouter();
  const colors = colorsFor(useColorScheme());
  const { notes, deleteNote } = useReminders();

  function confirmDelete(note: Note) {
    if (Platform.OS === 'web') {
      if (window.confirm(`Delete “${note.title}”? It will move to Recently Deleted.`)) void deleteNote(note.id);
      return;
    }
    Alert.alert('Delete note?', `“${note.title}” will move to Recently Deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void deleteNote(note.id) },
    ]);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {notes.length === 0 ? <EmptyState title="No notes yet" message="Create a note whenever inspiration strikes." /> : notes.map((note) => (
          <Pressable key={note.id} onPress={() => router.push(`/note/${note.id}`)} style={({ pressed }) => [styles.note, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.75 : 1 }]}>
            <View style={styles.noteCopy}>
              <Text numberOfLines={1} style={[styles.noteTitle, { color: colors.text }]}>{note.title}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={`Delete ${note.title}`} hitSlop={10} onPress={(event) => { event.stopPropagation(); confirmDelete(note); }} style={styles.deleteButton}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </Pressable>
          </Pressable>
        ))}
      </ScrollView>
      <Pressable accessibilityRole="button" accessibilityLabel="Add note" onPress={() => router.push('/note/new')} style={({ pressed }) => [styles.fab, { backgroundColor: colors.accent, opacity: pressed ? 0.78 : 1 }]}>
        <Ionicons name="add" size={28} color={colors.onColor} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 100, gap: 10 },
  note: { minHeight: 68, borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  noteCopy: { flex: 1 },
  noteTitle: { fontSize: 18, fontWeight: '800' },
  deleteButton: { padding: 6 },
  fab: { position: 'absolute', right: 16, bottom: 18, width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center' },
});
