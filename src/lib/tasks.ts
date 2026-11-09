import type { CleaningTask, Frequency } from '@/types';
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

export function frequencyDays(frequency: Frequency, customDays: number | null): number {
  const option = FREQUENCY_OPTIONS.find((item) => item.value === frequency);
  return option?.days ?? customDays ?? 7;
}

export function frequencyLabel(frequency: Frequency, customDays: number | null, scheduleNote?: string | null): string {
  if (scheduleNote) return scheduleNote;
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

export function nextDueAfterDone(frequency: Frequency, customDays: number | null, today: string): string {
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
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} zadania`;
  return `${count} zadań`;
}

export function compareByDueDate(a: CleaningTask, b: CleaningTask): number {
  return a.dueDate.localeCompare(b.dueDate);
}
