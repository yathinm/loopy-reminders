import { advanceRule, nextOccurrence, recurrenceLabel } from '@/domain/recurrence';

describe('recurrence', () => {
  test('advances daily intervals', () => {
    expect(nextOccurrence(new Date(2026, 8, 5, 9), { frequency: 'daily', interval: 3 }))
      .toEqual(new Date(2026, 8, 8, 9));
  });

  test('advances weekly to a selected weekday', () => {
    const monday = new Date(2026, 8, 7, 9);
    expect(nextOccurrence(monday, { frequency: 'weekly', interval: 1, weekdays: [3] }))
      .toEqual(new Date(2026, 8, 9, 9));
  });

  test('uses the last valid day of a shorter month', () => {
    expect(nextOccurrence(new Date(2027, 0, 31, 9), { frequency: 'monthly', interval: 1 }))
      .toEqual(new Date(2027, 1, 28, 9));
  });

  test('handles leap-day yearly reminders', () => {
    expect(nextOccurrence(new Date(2028, 1, 29, 9), { frequency: 'yearly', interval: 1 }))
      .toEqual(new Date(2029, 1, 28, 9));
  });

  test('honors occurrence and date limits', () => {
    expect(nextOccurrence(new Date(2026, 8, 5), { frequency: 'daily', interval: 1, remainingOccurrences: 1 })).toBeNull();
    expect(nextOccurrence(new Date(2026, 8, 5), { frequency: 'daily', interval: 1, endsAt: new Date(2026, 8, 5).toISOString() })).toBeNull();
  });

  test('decrements finite occurrence count', () => {
    expect(advanceRule({ frequency: 'daily', interval: 1, remainingOccurrences: 3 }).remainingOccurrences).toBe(2);
    expect(recurrenceLabel({ frequency: 'weekly', interval: 2 })).toBe('Every 2 weekly');
  });
});

