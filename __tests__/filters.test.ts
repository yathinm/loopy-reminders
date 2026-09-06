import { filterSmartList, isToday, sortReminders } from '@/domain/filters';
import { Reminder } from '@/domain/types';

const base: Reminder = {
  id: '1', title: 'Task', notes: '', createdAt: '2026-09-05T10:00:00.000Z', updatedAt: '2026-09-05T10:00:00.000Z',
  dueAt: null, hasTime: false, isCompleted: false, completedAt: null, priority: 0, isFlagged: false,
  sortOrder: 1, listId: 'inbox', recurrence: null, seriesId: null, notificationId: null, snoozedUntil: null, tags: [],
};

describe('smart list filters', () => {
  const now = new Date(2026, 8, 5, 12);
  test('recognizes same local calendar day', () => expect(isToday(new Date(2026, 8, 5, 22).toISOString(), now)).toBe(true));
  test('filters flagged and completed independently', () => {
    const flagged = { ...base, id: 'flag', isFlagged: true };
    const completed = { ...base, id: 'done', isCompleted: true };
    expect(filterSmartList([flagged, completed], 'flagged', now)).toEqual([flagged]);
    expect(filterSmartList([flagged, completed], 'completed', now)).toEqual([completed]);
  });
  test('sorts dated reminders before undated reminders', () => {
    const dated = { ...base, id: 'dated', dueAt: new Date(2026, 8, 6).toISOString() };
    expect(sortReminders([base, dated]).map((item) => item.id)).toEqual(['dated', '1']);
  });
});
