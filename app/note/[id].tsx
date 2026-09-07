import * as Crypto from 'expo-crypto';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, useColorScheme, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { useReminders } from '@/store/ReminderProvider';
import { colorsFor } from '@/theme/theme';

export default function NoteEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = colorsFor(useColorScheme());
  const { notes, saveNote, deleteNote } = useReminders();
  const isNew = id === 'new';
  const existing = isNew ? undefined : notes.find((note) => note.id === id);
  const noteId = useRef(isNew ? Crypto.randomUUID() : id).current;
  const [title, setTitle] = useState(existing?.title ?? '');
  const [body, setBody] = useState(existing?.body ?? '');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const latest = useRef({ title, body });
  const lastSaved = useRef({ title, body });
  const hasBeenSaved = useRef(!isNew);
  latest.current = { title, body };

  const persist = useCallback(async (nextTitle: string, nextBody: string) => {
    if (!hasBeenSaved.current && !nextTitle.trim() && !nextBody.trim()) return true;
    try {
      setSaveState('saving');
      await saveNote(nextTitle, nextBody, noteId);
      lastSaved.current = { title: nextTitle, body: nextBody };
      hasBeenSaved.current = true;
      setSaveState('saved');
      return true;
    } catch {
      setSaveState('error');
      return false;
    }
  }, [noteId, saveNote]);

  useEffect(() => {
    if (title === lastSaved.current.title && body === lastSaved.current.body) {
      setSaveState(hasBeenSaved.current ? 'saved' : 'idle');
      return;
    }
    setSaveState('saving');
    const timer = setTimeout(() => void persist(title, body), 500);
    return () => clearTimeout(timer);
  }, [body, persist, title]);

  useEffect(() => () => {
    const pending = latest.current;
    if (pending.title !== lastSaved.current.title || pending.body !== lastSaved.current.body) {
      void saveNote(pending.title, pending.body, noteId);
    }
  }, [noteId, saveNote]);

  async function finish() {
    const pending = latest.current;
    const unchanged = pending.title === lastSaved.current.title && pending.body === lastSaved.current.body;
    if (unchanged || await persist(pending.title, pending.body)) router.back();
    else Alert.alert('Could not save note', 'Please try again.');
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
          <Pressable onPress={() => void finish()}><Text style={[styles.action, { color: colors.accent }]}>Done</Text></Pressable>
          <Text accessibilityLiveRegion="polite" style={[styles.saveStatus, { color: saveState === 'error' ? colors.danger : colors.secondaryText }]}>{saveState === 'saving' ? 'Saving…' : saveState === 'error' ? 'Not saved' : saveState === 'saved' ? 'Saved' : 'Auto-save on'}</Text>
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
  saveStatus: { fontSize: 15, fontWeight: '600' },
  paper: { flex: 1, minHeight: 300, borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, padding: 18 },
  title: { fontSize: 22, fontWeight: '800', borderBottomWidth: StyleSheet.hairlineWidth, paddingBottom: 13, outlineStyle: 'none' } as never,
  body: { flex: 1, minHeight: 220, paddingTop: 16, fontSize: 17, lineHeight: 25, outlineStyle: 'none' } as never,
  delete: { height: 50, marginTop: 14, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  deleteText: { fontSize: 16, fontWeight: '800' },
});
