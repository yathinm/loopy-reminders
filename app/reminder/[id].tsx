import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ReminderEditor } from '@/features/ReminderEditor';
export default function EditReminderScreen() { const { id } = useLocalSearchParams<{ id: string }>(); return <ReminderEditor reminderId={id} />; }
