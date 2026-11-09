const pad = (value: number) => String(value).padStart(2, '0');

export const WEEKDAY_NAMES = [
  'niedziela',
  'poniedziałek',
  'wtorek',
  'środa',
  'czwartek',
  'piątek',
  'sobota',
];

const dayMonthFormatter = new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'long' });
const shortDateFormatter = new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'short' });
const timeFormatter = new Intl.DateTimeFormat('pl-PL', { hour: '2-digit', minute: '2-digit' });

export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(iso: string, days: number): string {
  const date = parseISODate(iso);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function daysBetween(fromISO: string, toISO: string): number {
  const diff = parseISODate(toISO).getTime() - parseISODate(fromISO).getTime();
  return Math.round(diff / 86_400_000);
}

export function weekdayIndex(iso: string): number {
  return parseISODate(iso).getDay();
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatWeekdayName(iso: string): string {
  return WEEKDAY_NAMES[weekdayIndex(iso)];
}

export function formatFullDate(iso: string): string {
  const date = parseISODate(iso);
  const weekday = new Intl.DateTimeFormat('pl-PL', { weekday: 'long' }).format(date);
  return `${capitalize(weekday)}, ${dayMonthFormatter.format(date)}`;
}

export function formatShortDate(iso: string): string {
  return shortDateFormatter.format(parseISODate(iso));
}

export function formatTime(timestamp: number): string {
  return timeFormatter.format(new Date(timestamp));
}
