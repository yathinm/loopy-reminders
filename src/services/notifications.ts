import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Reminder } from '@/domain/types';

export const REMINDER_CATEGORY = 'REMINDER_DUE';
export const COMPLETE_ACTION = 'COMPLETE_REMINDER';
export const SNOOZE_ACTION = 'SNOOZE_REMINDER';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function configureNotifications(): Promise<void> {
  await Notifications.setNotificationCategoryAsync(REMINDER_CATEGORY, [
    { identifier: COMPLETE_ACTION, buttonTitle: 'Complete', options: { opensAppToForeground: false } },
    { identifier: SNOOZE_ACTION, buttonTitle: 'Snooze 10 min', options: { opensAppToForeground: false } },
  ]);
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
}

export async function ensureNotificationPermission(): Promise<boolean> {
  let permissions = await Notifications.getPermissionsAsync();
  if (permissions.status === 'undetermined') permissions = await Notifications.requestPermissionsAsync();
  return isAllowed(permissions);
}

export async function getNotificationPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

function isAllowed(permissions: Notifications.NotificationPermissionsStatus): boolean {
  return permissions.granted || permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

export async function cancelReminderNotification(notificationId: string | null): Promise<void> {
  if (!notificationId) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId).catch(() => undefined);
}

export async function getScheduledNotificationIds(): Promise<string[]> {
  return (await Notifications.getAllScheduledNotificationsAsync()).map((item) => item.identifier);
}

export function addNotificationResponseListener(listener: (actionIdentifier: string, reminderId: string) => void) {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const reminderId = response.notification.request.content.data?.reminderId;
    if (typeof reminderId === 'string') listener(response.actionIdentifier, reminderId);
  });
}

export async function cancelAllReminderNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduleReminderNotification(reminder: Reminder, requestPermission = true): Promise<string | null> {
  if (!reminder.dueAt || !reminder.hasTime || reminder.isCompleted) return null;
  const date = new Date(reminder.dueAt);
  if (date.getTime() <= Date.now()) return null;
  const allowed = requestPermission ? await ensureNotificationPermission() : isAllowed(await Notifications.getPermissionsAsync());
  if (!allowed) return null;

  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'A little nudge from Loopy',
      body: reminder.title,
      sound: true,
      categoryIdentifier: REMINDER_CATEGORY,
      data: { reminderId: reminder.id, version: 1 },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: 'reminders' },
  });
}

export async function snoozeNotification(reminder: Reminder, minutes = 10): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Loopy is back', body: reminder.title, sound: true,
      categoryIdentifier: REMINDER_CATEGORY, data: { reminderId: reminder.id, version: 1 },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: minutes * 60,
      channelId: 'reminders',
    },
  });
}
