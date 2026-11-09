
import type { ApplianceId, DayPart, HomeProfile, HouseholdSize, ScheduleStyle, TimeBudget } from '@/types';

export interface LabeledOption<T extends string> {
  id: T;
  label: string;
  detail?: string;
}

export const HOUSEHOLD_OPTIONS: LabeledOption<HouseholdSize>[] = [
  { id: 'alone', label: 'Mieszkam sam/sama' },
  { id: 'one-other', label: 'Mieszkam z jedną osobą' },
  { id: 'several', label: 'Mieszkam z kilkoma osobami' },
];

export const TIME_BUDGET_OPTIONS: LabeledOption<TimeBudget>[] = [
  {
    id: 'm10',
    label: '10–15 minut dziennie',
    detail: 'Codziennie, ale krótko',
  },
  {
    id: 'few-days',
    label: 'Godzina kilka razy w tygodniu',
    detail: 'Więcej czasu na sprzątanie w wybrane dni',
  },
  {
    id: 'one-day',
    label: 'Kilka godzin w jeden dzień',
    detail: 'Zrób wszystko podczas jednego dnia porządków',
  },
];

export const DAY_PART_OPTIONS: LabeledOption<DayPart>[] = [
  { id: 'morning', label: 'Poranki' },
  { id: 'afternoon', label: 'Popołudnia' },
  { id: 'evening', label: 'Wieczory' },
];

export const STYLE_OPTIONS: LabeledOption<ScheduleStyle>[] = [
  {
    id: 'rooms',
    label: 'Pomieszczeniami',
    detail: 'Np. we wtorek kuchnia, w środę łazienka',
  },
  {
    id: 'tasks',
    label: 'Według rodzaju czynności',
    detail: 'Np. jednego dnia mycie zlewów w kuchni i łazience',
  },
  {
    id: 'auto',
    label: 'Bez preferencji',
    detail: 'Ułóż plan tak, jak będzie najwygodniej',
  },
];

export const APPLIANCE_OPTIONS: LabeledOption<ApplianceId>[] = [
  { id: 'washer', label: 'Pralka' },
  { id: 'dishwasher', label: 'Zmywarka' },
  { id: 'oven', label: 'Piekarnik' },
  { id: 'fridge', label: 'Lodówka' },
  { id: 'hood', label: 'Okap' },
  { id: 'coffee', label: 'Ekspres do kawy' },
  { id: 'vacuum', label: 'Odkurzacz' },
  { id: 'aircon', label: 'Klimatyzacja' },
];

export function emptyHome(): HomeProfile {
  return {
    household: null,
    smallChildren: null,
    pets: '',
    specialNeeds: '',
    places: [],
    appliances: [],
    timeBudget: null,
    weekdays: false,
    weekends: false,
    cleaningDays: [],
    dayParts: [],
    style: null,
    onboardingComplete: false,
  };
}

export function householdLabel(id: HouseholdSize | null): string {
  return HOUSEHOLD_OPTIONS.find((option) => option.id === id)?.label ?? 'Dom jeszcze nieopisany';
}

export function timeBudgetLabel(id: TimeBudget | null): string {
  return TIME_BUDGET_OPTIONS.find((option) => option.id === id)?.label ?? 'Czas do ustalenia';
}

export function dayPartsLabel(parts: DayPart[]): string {
  if (parts.length === 0) return 'Pora dnia dowolna';
  const labels = DAY_PART_OPTIONS.filter((option) => parts.includes(option.id)).map((option) => option.label.toLowerCase());
  return labels.join(', ');
}

export function hasPets(home: HomeProfile): boolean {
  const pets = home.pets.trim().toLowerCase();
  return pets.length > 0 && pets !== 'nie' && pets !== 'brak';
}

export function busyHome(home: HomeProfile): boolean {
  return (
    home.household === 'several' ||
    home.household === 'family' ||
    home.smallChildren === true ||
    hasPets(home)
  );
}
