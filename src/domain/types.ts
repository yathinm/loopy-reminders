export type Priority = 0 | 1 | 2 | 3;
export type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurrenceRule {
  frequency: Frequency;
  interval: number;
  weekdays?: number[];
  endsAt?: string;
  remainingOccurrences?: number;
}

export interface ReminderList {
  id: string;
  name: string;
  color: string;
  symbol: string;
  sortOrder: number;
  isInbox: boolean;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ReminderTag {
  id: string;
  name: string;
}

export interface Reminder {
  id: string;
  title: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  dueAt: string | null;
  hasTime: boolean;
  isCompleted: boolean;
  completedAt: string | null;
  priority: Priority;
  isFlagged: boolean;
  sortOrder: number;
  listId: string;
  recurrence: RecurrenceRule | null;
  seriesId: string | null;
  notificationId: string | null;
  tags: ReminderTag[];
}

export interface ReminderDraft {
  title: string;
  notes: string;
  dueAt: Date | null;
  hasTime: boolean;
  priority: Priority;
  isFlagged: boolean;
  listId: string;
  recurrence: RecurrenceRule | null;
  tagNames: string[];
}

export type SmartList = 'today' | 'scheduled' | 'all' | 'flagged' | 'completed';
