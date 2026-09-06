import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ReminderEditor } from '@/features/ReminderEditor';
export default function NewReminderScreen() { const { listId } = useLocalSearchParams<{ listId?: string }>(); return <ReminderEditor initialListId={listId} />; }

