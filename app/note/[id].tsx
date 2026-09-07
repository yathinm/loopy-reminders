import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, useColorScheme, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { useReminders } from '@/store/ReminderProvider';
import { colorsFor } from '@/theme/theme';

export default function NoteEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = colorsFor(useColorScheme());
  const { notes, saveNote, deleteNote } = useReminders();
  const existing = id === 'new' ? undefined : notes.find((note) => note.id === id);
  const [title, setTitle] = useState(existing?.title ?? '');
  const [body, setBody] = useState(existing?.body ?? '');
  const [saving, setSaving] = useState(false);
  const canSave = Boolean(title.trim() || body.trim()) && !saving;

  async function save() {
    if (!canSave) return;
    try {
      setSaving(true);
      await saveNote(title, body, existing?.id);
      router.back();
    } catch {
      setSaving(false);
      Alert.alert('Could not save note', 'Please try again.');
    }
  }

  function remove() {
    if (!existing) return;
    const performDelete = async () => { await deleteNote(existing.id); router.back(); };
    if (Platform.OS === 'web') {
      if (window.confirm(`Delete “${existing.title}”? It will move to Recently Deleted.`)) void performDelete();
      return;
    }
    Alert.alert('Delete note?', `“${existing.title}” will move to Recently Deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void performDelete() },
    ]);
  }

  return (
    <Screen scroll={false}>
      <View style={styles.content}>
        <View style={styles.actions}>
          <Pressable onPress={() => router.back()}><Text style={[styles.action, { color: colors.accent }]}>Cancel</Text></Pressable>
          <Pressable disabled={!canSave} onPress={save}><Text style={[styles.action, { color: colors.accent, opacity: canSave ? 1 : 0.4 }]}>{saving ? 'Saving…' : 'Save'}</Text></Pressable>
        </View>
        <View style={[styles.paper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput autoFocus accessibilityLabel="Note title" maxLength={100} value={title} onChangeText={setTitle} placeholder="Note title" placeholderTextColor={colors.secondaryText} style={[styles.title, { borderBottomColor: colors.border, color: colors.text }]} />
          <TextInput accessibilityLabel="Note body" multiline value={body} onChangeText={setBody} placeholder="Start writing…" placeholderTextColor={colors.secondaryText} style={[styles.body, { color: colors.text }]} textAlignVertical="top" />
        </View>
        {existing && <Pressable accessibilityRole="button" onPress={remove} style={[styles.delete, { borderColor: colors.danger }]}><Text style={[styles.deleteText, { color: colors.danger }]}>Delete Note</Text></Pressable>}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 16, paddingBottom: 28 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  action: { fontSize: 17, fontWeight: '700' },
  paper: { flex: 1, minHeight: 300, borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, padding: 18 },
  title: { fontSize: 22, fontWeight: '800', borderBottomWidth: StyleSheet.hairlineWidth, paddingBottom: 13, outlineStyle: 'none' } as never,
  body: { flex: 1, minHeight: 220, paddingTop: 16, fontSize: 17, lineHeight: 25, outlineStyle: 'none' } as never,
  delete: { height: 50, marginTop: 14, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  deleteText: { fontSize: 16, fontWeight: '800' },
});
