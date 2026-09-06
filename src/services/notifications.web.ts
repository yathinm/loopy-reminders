import { Reminder } from '@/domain/types';

export const REMINDER_CATEGORY = 'REMINDER_DUE';
export const COMPLETE_ACTION = 'COMPLETE_REMINDER';
export const SNOOZE_ACTION = 'SNOOZE_REMINDER';

function notifications() {
  return typeof window === 'undefined' ? undefined : window.loopyDesktop?.notifications;
}

export async function configureNotifications(): Promise<void> {}

export async function ensureNotificationPermission(): Promise<boolean> {
  return Boolean(notifications());
}

export async function getNotificationPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  return notifications() ? 'granted' : 'denied';
}

export async function getScheduledNotificationIds(): Promise<string[]> {
  return (await notifications()?.list()) ?? [];
}

export function addNotificationResponseListener(listener: (actionIdentifier: string, reminderId: string) => void) {
  const unsubscribe = notifications()?.onClick((reminderId) => listener('DEFAULT', reminderId));
  return { remove: () => unsubscribe?.() };
}

export async function cancelReminderNotification(notificationId: string | null): Promise<void> {
  if (notificationId) await notifications()?.cancel(notificationId);
}

export async function cancelAllReminderNotifications(): Promise<void> {
  await notifications()?.cancelAll();
}

export async function scheduleReminderNotification(reminder: Reminder): Promise<string | null> {
  if (!reminder.dueAt || !reminder.hasTime || reminder.isCompleted) return null;
  const dueAt = new Date(reminder.dueAt).getTime();
  if (dueAt <= Date.now() || !notifications()) return null;
  const id = `desktop:${reminder.id}`;
  return notifications()!.schedule({ id, reminderId: reminder.id, title: 'A little nudge from Loopy', body: reminder.title, dueAt });
}

export async function snoozeNotification(reminder: Reminder, minutes = 10): Promise<string> {
  const bridge = notifications();
  if (!bridge) throw new Error('Desktop notifications are unavailable.');
  const id = `desktop:${reminder.id}`;
  return bridge.schedule({ id, reminderId: reminder.id, title: 'Loopy is back', body: reminder.title, dueAt: Date.now() + minutes * 60_000 });
}
