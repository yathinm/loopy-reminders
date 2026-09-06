import { RecurrenceRule } from './types';

function endOfMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function nextOccurrence(from: Date, rule: RecurrenceRule): Date | null {
  if (rule.remainingOccurrences !== undefined && rule.remainingOccurrences <= 1) return null;

  const next = new Date(from);
  const interval = Math.max(1, Math.floor(rule.interval));

  switch (rule.frequency) {
    case 'daily':
      next.setDate(next.getDate() + interval);
      break;
    case 'weekly': {
      const selected = rule.weekdays?.length ? [...new Set(rule.weekdays)].sort() : [from.getDay()];
      let offset = 1;
      while (offset <= interval * 7 + 7) {
        const candidate = new Date(from);
        candidate.setDate(candidate.getDate() + offset);
        const weekDistance = Math.floor((offset + from.getDay()) / 7);
        if (weekDistance % interval === 0 && selected.includes(candidate.getDay())) {
          next.setTime(candidate.getTime());
          break;
        }
        offset += 1;
      }
      if (offset > interval * 7 + 7) return null;
      break;
    }
    case 'monthly': {
      const originalDay = from.getDate();
      next.setDate(1);
      next.setMonth(next.getMonth() + interval);
      next.setDate(Math.min(originalDay, endOfMonth(next.getFullYear(), next.getMonth())));
      break;
    }
    case 'yearly': {
      const month = from.getMonth();
      const day = from.getDate();
      next.setDate(1);
      next.setFullYear(next.getFullYear() + interval);
      next.setMonth(month);
      next.setDate(Math.min(day, endOfMonth(next.getFullYear(), month)));
      break;
    }
  }

  if (rule.endsAt && next > new Date(rule.endsAt)) return null;
  return next;
}

export function advanceRule(rule: RecurrenceRule): RecurrenceRule {
  if (rule.remainingOccurrences === undefined) return rule;
  return { ...rule, remainingOccurrences: Math.max(0, rule.remainingOccurrences - 1) };
}

export function recurrenceLabel(rule: RecurrenceRule | null): string {
  if (!rule) return 'Never';
  const units: Record<RecurrenceRule['frequency'], string> = { daily: 'day', weekly: 'week', monthly: 'month', yearly: 'year' };
  const unit = units[rule.frequency];
  return rule.interval === 1 ? `Every ${unit}` : `Every ${rule.interval} ${unit}s`;
}
