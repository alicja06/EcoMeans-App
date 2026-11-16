
import type { CleaningTask, CustomFrequencyRule, Frequency } from '@/types';
import { addDays, daysBetween, formatShortDate } from '@/lib/dates';

export interface FrequencyOption {
  value: Frequency;
  label: string;
  days: number | null;
}

export const FREQUENCY_OPTIONS: FrequencyOption[] = [
  { value: 'daily', label: 'Codziennie', days: 1 },
  { value: 'weekly', label: 'Co tydzień', days: 7 },
  { value: 'biweekly', label: 'Co dwa tygodnie', days: 14 },
  { value: 'monthly', label: 'Co miesiąc', days: 30 },
  { value: 'quarterly', label: 'Co kilka miesięcy', days: 90 },
  { value: 'custom', label: 'Własna częstotliwość', days: null },
];

const WEEKDAY_NAMES = [
  'niedziele',
  'poniedziałki',
  'wtorki',
  'środy',
  'czwartki',
  'piątki',
  'soboty',
];

const ORDINAL_NAMES: Record<number, string> = {
  1: 'pierwszy',
  2: 'drugi',
  3: 'trzeci',
  4: 'czwarty',
  [-1]: 'ostatni',
};

function safeInterval(interval: number): number {
  return Math.max(1, Math.floor(interval));
}

function parseDate(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addUtcDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function monthStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function monthDifference(a: Date, b: Date): number {
  return (
    (a.getUTCFullYear() - b.getUTCFullYear()) * 12 +
    a.getUTCMonth() -
    b.getUTCMonth()
  );
}

function getMonthlyDate(year: number, month: number, rule: CustomFrequencyRule): Date {
  if (rule.unit !== 'months') {
    return new Date(Date.UTC(year, month, 1));
  }

  const pattern = rule.monthlyPattern;

  if (pattern.type === 'dayOfMonth') {
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    return new Date(Date.UTC(year, month, Math.min(pattern.day, lastDay)));
  }

  const firstDay = new Date(Date.UTC(year, month, 1));
  const firstWeekday = firstDay.getUTCDay();

  if (pattern.ordinal === -1) {
    const lastDay = new Date(Date.UTC(year, month + 1, 0));
    const difference = (lastDay.getUTCDay() - pattern.weekday + 7) % 7;
    return addUtcDays(lastDay, -difference);
  }

  const difference = (pattern.weekday - firstWeekday + 7) % 7;
  const day = 1 + difference + (pattern.ordinal - 1) * 7;

  return new Date(Date.UTC(year, month, day));
}

function nextCustomDate(
  fromDate: string,
  rule: CustomFrequencyRule,
  anchorDate: string,
): string {
  const from = parseDate(fromDate);
  const anchor = parseDate(anchorDate);
  const interval = safeInterval(rule.interval);

  if (rule.unit === 'days') {
    return toISODate(addUtcDays(from, interval));
  }

  if (rule.unit === 'weeks') {
    const weekdays = [...new Set(rule.weekdays)].filter(
      (day) => Number.isInteger(day) && day >= 0 && day <= 6,
    );

    if (weekdays.length === 0) {
      return toISODate(addUtcDays(from, interval * 7));
    }

    const anchorMonday = addUtcDays(anchor, -((anchor.getUTCDay() + 6) % 7));
    const searchLimit = interval * 7 + 14;

    for (let offset = 1; offset <= searchLimit; offset += 1) {
      const candidate = addUtcDays(from, offset);
      const candidateMonday = addUtcDays(
        candidate,
        -((candidate.getUTCDay() + 6) % 7),
      );

      const weeksFromAnchor = Math.round(
        (candidateMonday.getTime() - anchorMonday.getTime()) / (7 * 24 * 60 * 60 * 1000),
      );

      if (
        weeksFromAnchor >= 0 &&
        weeksFromAnchor % interval === 0 &&
        weekdays.includes(candidate.getUTCDay())
      ) {
        return toISODate(candidate);
      }
    }

    return toISODate(addUtcDays(from, interval * 7));
  }

  const anchorMonth = monthStart(anchor);
  const fromMonth = monthStart(from);

  for (let offset = 0; offset <= interval + 2; offset += 1) {
    const candidateMonth = new Date(
      Date.UTC(fromMonth.getUTCFullYear(), fromMonth.getUTCMonth() + offset, 1),
    );

    const monthsFromAnchor = monthDifference(candidateMonth, anchorMonth);

    if (monthsFromAnchor < 0 || monthsFromAnchor % interval !== 0) {
      continue;
    }

    const candidate = getMonthlyDate(
      candidateMonth.getUTCFullYear(),
      candidateMonth.getUTCMonth(),
      rule,
    );

    if (candidate > from) {
      return toISODate(candidate);
    }
  }

  return toISODate(addUtcDays(from, interval * 30));
}

export function frequencyDays(
  frequency: Frequency,
  customDays: number | null,
  customRule?: CustomFrequencyRule | null,
): number {
  if (frequency === 'custom' && customRule) {
    const interval = safeInterval(customRule.interval);

    if (customRule.unit === 'days') return interval;
    if (customRule.unit === 'weeks') return interval * 7;
    return interval * 30;
  }

  const option = FREQUENCY_OPTIONS.find((item) => item.value === frequency);
  return option?.days ?? customDays ?? 7;
}

export function frequencyLabel(
  frequency: Frequency,
  customDays: number | null,
  scheduleNote?: string | null,
  customRule?: CustomFrequencyRule | null,
): string {
  if (scheduleNote) return scheduleNote;

  if (frequency === 'custom' && customRule) {
    const interval = safeInterval(customRule.interval);

    if (customRule.unit === 'days') {
      return `Co ${interval} dni`;
    }

    if (customRule.unit === 'weeks') {
      const weekdays = [...new Set(customRule.weekdays)]
        .filter((day) => day >= 0 && day <= 6)
        .sort((a, b) => a - b);

      const daysLabel = weekdays
        .map((day) => WEEKDAY_NAMES[day])
        .join(', ');

      return `Co ${interval} ${interval === 1 ? 'tydzień' : 'tygodnie'}${daysLabel ? ` – ${daysLabel}` : ''}`;
    }

    const pattern = customRule.monthlyPattern;

    if (pattern.type === 'dayOfMonth') {
      return `Co ${interval} mies. – ${pattern.day}. dzień miesiąca`;
    }

    return `Co ${interval} mies. – ${ORDINAL_NAMES[pattern.ordinal]} ${WEEKDAY_NAMES[pattern.weekday]}`;
  }

  if (frequency === 'custom') {
    const days = customDays ?? 7;
    if (days === 2 || days === 3) return 'Kilka razy w tygodniu';
    if (days === 60) return 'Co 1–3 miesiące';
    if (days === 90) return 'Co 3 miesiące';
    return `Co ${days} dni`;
  }

  if (frequency === 'quarterly') return 'Okresowo';

  return FREQUENCY_OPTIONS.find((item) => item.value === frequency)?.label ?? '';
}

export function nextDueAfterDone(
  frequency: Frequency,
  customDays: number | null,
  today: string,
  customRule?: CustomFrequencyRule | null,
  anchorDate?: string,
): string {
  if (frequency === 'custom' && customRule) {
    return nextCustomDate(today, customRule, anchorDate ?? today);
  }

  return addDays(today, frequencyDays(frequency, customDays));
}

export function isDueToday(task: CleaningTask, today: string): boolean {
  return task.dueDate <= today;
}

export function isDoneToday(task: CleaningTask, today: string): boolean {
  return task.lastDoneDate === today;
}

export function isOnToday(task: CleaningTask, today: string): boolean {
  return isDueToday(task, today) || isDoneToday(task, today);
}

export function dueLabel(dueDate: string, today: string): string {
  const diff = daysBetween(today, dueDate);
  if (diff < 0) return 'Możesz zrobić, kiedy pasuje';
  if (diff === 0) return 'Dziś';
  if (diff === 1) return 'Jutro';
  return formatShortDate(dueDate);
}

export function taskCountLabel(count: number): string {
  if (count === 1) return '1 zadanie';
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} zadania`;
  }
  return `${count} zadań`;
}

export function compareByDueDate(a: CleaningTask, b: CleaningTask): number {
  return a.dueDate.localeCompare(b.dueDate);
}
