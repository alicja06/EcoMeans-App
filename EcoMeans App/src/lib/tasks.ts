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

export function frequencyLabel(frequency: Frequency, customDays: number | null): string {
  if (frequency === 'custom') return `Co ${customDays ?? 7} dni`;
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
  if (diff < 0) return diff === -1 ? 'Zaległe od wczoraj' : `Zaległe od ${formatShortDate(dueDate)}`;
  if (diff === 0) return 'Dziś';
  if (diff === 1) return 'Jutro';
  return formatShortDate(dueDate);
}

export function compareByDueDate(a: CleaningTask, b: CleaningTask): number {
  return a.dueDate.localeCompare(b.dueDate);
}
