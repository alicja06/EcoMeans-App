import type { CleaningTask, Frequency, HomeProfile, ScheduleStyle, TimeBudget } from '@/types';
import { libraryTasksForHome } from '@/data/taskLibrary';
import { dayPartsLabel, timeBudgetLabel } from '@/data/home';
import { addDays, daysBetween, formatShortDate, formatWeekdayName, weekdayIndex } from '@/lib/dates';
import { frequencyDays } from '@/lib/tasks';

export type DayKind = 'open' | 'big' | 'rest' | 'off';

export interface CalendarRules {
  openWeekdays: number[];
  bigWeekdays: number[];
  restWeekdays: number[];
  baseMinutes: number;
  bigMinutes: number;
  flexible: boolean;
  style: Exclude<ScheduleStyle, 'auto'>;
}

export interface PlannedDay {
  date: string;
  kind: DayKind;
  capacity: number;
  tasks: CleaningTask[];
}

function resolveStyle(home: HomeProfile): Exclude<ScheduleStyle, 'auto'> {
  if (home.style === 'spread' || home.style === 'block' || home.style === 'mix') return home.style;
  if (home.timeBudget === 'one-day' || home.timeBudget === 'few-days') return 'block';
  if (home.timeBudget === 'flexible') return 'spread';
  return 'mix';
}

function selectedWeekdays(home: HomeProfile): number[] {
  const days: number[] = [];
  if (home.weekdays) days.push(1, 2, 3, 4, 5);
  if (home.weekends) days.push(6, 0);
  if (days.length === 0) days.push(1, 2, 3, 4, 5, 6, 0);
  return days;
}

function minutesFor(budget: TimeBudget | null): { base: number; big: number; flexible: boolean } {
  switch (budget) {
    case 'm10':
      return { base: 15, big: 45, flexible: false };
    case 'few-days':
      return { base: 0, big: 90, flexible: false };
    case 'one-day':
      return { base: 0, big: 150, flexible: false };
    case 'flexible':
      return { base: 40, big: 50, flexible: true };
    case 'm20':
    default:
      return { base: 25, big: 60, flexible: false };
  }
}

export function resolveCalendar(home: HomeProfile): CalendarRules {
  const selected = selectedWeekdays(home);
  const style = resolveStyle(home);
  const minutes = minutesFor(home.timeBudget);
  const preferBig = selected.includes(6) ? 6 : selected.includes(0) ? 0 : selected[selected.length - 1];

  let bigWeekdays: number[] = [];
  let restWeekdays: number[] = [];
  let openWeekdays: number[] = [];

  if (style === 'spread') {
    openWeekdays = selected;
  } else if (style === 'block' && home.timeBudget === 'few-days') {
    const prefer = [2, 4, 6, 3, 5, 1, 0];
    bigWeekdays = prefer.filter((day) => selected.includes(day)).slice(0, 3);
    if (bigWeekdays.length === 0) bigWeekdays = selected.slice(0, Math.min(3, selected.length));
    restWeekdays = selected.filter((day) => !bigWeekdays.includes(day));
  } else if (style === 'block') {
    bigWeekdays = [preferBig];
    restWeekdays = selected.filter((day) => day !== preferBig);
  } else {
    bigWeekdays = [preferBig];
    restWeekdays = selected.includes(0) && preferBig !== 0 ? [0] : [];
    openWeekdays = selected.filter((day) => !bigWeekdays.includes(day) && !restWeekdays.includes(day));
  }

  return {
    openWeekdays,
    bigWeekdays,
    restWeekdays,
    baseMinutes: minutes.base,
    bigMinutes: minutes.big,
    flexible: minutes.flexible,
    style,
  };
}

export function dayKind(date: string, calendar: CalendarRules): DayKind {
  const weekday = weekdayIndex(date);
  if (calendar.bigWeekdays.includes(weekday)) return 'big';
  if (calendar.openWeekdays.includes(weekday)) return 'open';
  if (calendar.restWeekdays.includes(weekday)) return 'rest';
  return 'off';
}

export function dayCapacity(date: string, calendar: CalendarRules): number {
  const kind = dayKind(date, calendar);
  if (kind === 'big') return calendar.bigMinutes;
  if (kind === 'open') return calendar.baseMinutes;
  return 0;
}

export function horizonDates(today: string): string[] {
  return Array.from({ length: 7 }, (_, index) => addDays(today, index));
}

export function nextScheduledDate(fromDate: string, frequency: Frequency, customDays: number | null, home: HomeProfile): string {
  const step = Math.max(1, frequencyDays(frequency, customDays));
  const calendar = resolveCalendar(home);
  for (let offset = step; offset <= step + 28; offset += step) {
    const date = addDays(fromDate, offset);
    const kind = dayKind(date, calendar);
    if (kind === 'open' || kind === 'big') return date;
  }
  return addDays(fromDate, step);
}

export function isScheduledOn(task: CleaningTask, date: string, calendar: CalendarRules): boolean {
  if (!task.enabled) return false;
  if (date < task.dueDate) return false;
  if (task.dueDate === date) return true;
  const step = Math.max(1, frequencyDays(task.frequency, task.customDays));
  if (daysBetween(task.dueDate, date) % step !== 0) return false;
  const kind = dayKind(date, calendar);
  return kind === 'open' || kind === 'big';
}

export function tasksForDay(
  tasks: CleaningTask[],
  date: string,
  today: string,
  calendar: CalendarRules,
  doneTaskIds: ReadonlySet<string>,
): CleaningTask[] {
  return tasks.filter((task) => {
    if (doneTaskIds.has(task.id) || task.lastDoneDate === date) return true;
    if (!task.enabled) return false;
    if (date < today) return task.dueDate === date;
    return isScheduledOn(task, date, calendar);
  });
}

function remainingDays(today: string, calendar: CalendarRules): string[] {
  return horizonDates(today).filter((date) => {
    const kind = dayKind(date, calendar);
    return kind === 'open' || kind === 'big';
  });
}

function stepOf(frequency: Frequency, customDays: number | null): number {
  return Math.max(1, frequencyDays(frequency, customDays));
}

export function buildPlanTasks(home: HomeProfile, today: string, excludedLibraryIds: string[] = []): CleaningTask[] {
  const calendar = resolveCalendar(home);
  const days = remainingDays(today, calendar);
  const load = new Map<string, number>();
  const roomLeft = (date: string) => dayCapacity(date, calendar) - (load.get(date) ?? 0);
  const take = (date: string, minutes: number) => load.set(date, (load.get(date) ?? 0) + minutes);

  const library = libraryTasksForHome(home)
    .filter((item) => !excludedLibraryIds.includes(item.id))
    .sort((a, b) => a.priority - b.priority);

  const created: CleaningTask[] = [];

  const push = (
    item: (typeof library)[number],
    dueDate: string,
  ) => {
    created.push({
      id: `plan-${item.id}`,
      roomId: item.roomId,
      title: item.title,
      frequency: item.frequency,
      customDays: item.customDays,
      dueDate,
      lastDoneDate: null,
      previousDueDate: null,
      minutes: item.minutes,
      enabled: true,
      libraryId: item.id,
      scheduleNote: item.scheduleNote,
      source: 'plan',
    });
  };

  for (const item of library) {
    const step = stepOf(item.frequency, item.customDays);
    if (days.length === 0) {
      push(item, addDays(today, step));
      continue;
    }

    if (step >= 28) {
      const anchor = [...days].reverse().find((date) => dayKind(date, calendar) === 'big') ?? days[days.length - 1];
      push(item, addDays(anchor, step));
      continue;
    }

    if (step >= 7) {
      const ranked = [...days].sort((a, b) => {
        const bigA = dayKind(a, calendar) === 'big' ? 1 : 0;
        const bigB = dayKind(b, calendar) === 'big' ? 1 : 0;
        if (bigA !== bigB) return bigB - bigA;
        return roomLeft(b) - roomLeft(a);
      });
      const fit =
        ranked.find((date) => roomLeft(date) >= item.minutes - (dayKind(date, calendar) === 'big' ? 10 : 0)) ?? null;
      if (!fit) {
        const anchor = ranked[0];
        push(item, addDays(anchor, 7));
        continue;
      }
      take(fit, item.minutes);
      push(item, fit);
      continue;
    }

    let placed: string | null = null;
    for (let offset = 0; offset < days.length; offset += 1) {
      const start = days[offset];
      if (roomLeft(start) < item.minutes) continue;
      const hits = days.filter((date) => date >= start && daysBetween(start, date) % step === 0);
      const fits = hits.every((date) => roomLeft(date) + (dayKind(date, calendar) === 'big' ? 8 : 0) >= item.minutes);
      if (!fits) continue;
      hits.forEach((date) => take(date, item.minutes));
      placed = start;
      break;
    }
    if (!placed) {
      const loosest = [...days].sort((a, b) => roomLeft(b) - roomLeft(a))[0];
      if (roomLeft(loosest) >= Math.min(item.minutes, 10)) {
        take(loosest, item.minutes);
        placed = loosest;
      } else {
        placed = addDays(days[days.length - 1], step);
      }
    }
    push(item, placed);
  }

  return created.sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.title.localeCompare(b.title, 'pl'));
}

export function planSubtitle(home: HomeProfile, today: string): string {
  const dates = horizonDates(today);
  const start = formatWeekdayName(dates[0]);
  const end = formatWeekdayName(dates[dates.length - 1]);
  const range = `${start.charAt(0).toUpperCase()}${start.slice(1)} – ${end}`;
  const budget = home.timeBudget === 'flexible' ? 'wtedy, kiedy masz czas' : timeBudgetLabel(home.timeBudget).toLowerCase();
  return `${range} · ${budget} · ${dayPartsLabel(home.dayParts)}`;
}

export function dayHeadline(kind: DayKind, minutes: number, flexible: boolean): string {
  if (kind === 'rest') return 'Według potrzeb';
  if (kind === 'off') return 'Poza wybranymi dniami';
  if (flexible) return minutes > 0 ? 'Według potrzeb' : 'Według potrzeb';
  if (minutes <= 0) return 'Lżej tego dnia';
  return `${minutes} min`;
}

export function daySupport(kind: DayKind, taskCount: number): string | null {
  if (kind === 'rest') return taskCount > 0 ? 'Możesz tu przenieść coś, co nie wyszło wcześniej.' : 'Odpoczynek lub zadania zaległe.';
  if (kind === 'off') return 'Nic tu nie układam. Możesz dodać zadanie ręcznie, jeśli chcesz.';
  if (taskCount === 0) return 'Nic nie jest tu wpisane. To nie jest zaległość.';
  return null;
}

export function formatPlanRange(today: string): string {
  const dates = horizonDates(today);
  return `${formatShortDate(dates[0])} – ${formatShortDate(dates[dates.length - 1])}`;
}
