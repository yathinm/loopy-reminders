import { Reminder, SmartList } from './types';

export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function isToday(value: string | null, now = new Date()): boolean {
  if (!value) return false;
  const date = new Date(value);
  return startOfDay(date).getTime() === startOfDay(now).getTime();
}

export function filterSmartList(reminders: Reminder[], smart: SmartList, now = new Date()): Reminder[] {
  return reminders.filter((item) => {
    switch (smart) {
      case 'today': return !item.isCompleted && isToday(item.dueAt, now);
      case 'scheduled': return !item.isCompleted && item.dueAt !== null;
      case 'all': return !item.isCompleted;
      case 'flagged': return !item.isCompleted && item.isFlagged;
      case 'completed': return item.isCompleted;
    }
  });
}

export function sortReminders(reminders: Reminder[]): Reminder[] {
  return [...reminders].sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
    if (a.dueAt && b.dueAt) return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
    if (a.dueAt) return -1;
    if (b.dueAt) return 1;
    return a.sortOrder - b.sortOrder || a.title.localeCompare(b.title);
  });
}
