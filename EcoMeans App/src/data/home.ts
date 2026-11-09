import type { ApplianceId, DayPart, HomeProfile, HouseholdSize, ScheduleStyle, TimeBudget } from '@/types';

export interface LabeledOption<T extends string> {
  id: T;
  label: string;
  detail?: string;
}

export const HOUSEHOLD_OPTIONS: LabeledOption<HouseholdSize>[] = [
  { id: 'alone', label: 'Mieszkam sam/sama' },
  { id: 'partner', label: 'Mieszkam z partnerem/partnerką' },
  { id: 'several', label: 'Mieszkamy w kilka osób' },
  { id: 'family', label: 'Mieszkam z rodziną i dziećmi' },
];

export const TIME_BUDGET_OPTIONS: LabeledOption<TimeBudget>[] = [
  { id: 'm10', label: '10–15 minut dziennie', detail: 'Krótkie porządki, bez długich bloków' },
  { id: 'm20', label: '20–30 minut dziennie', detail: 'Spokojne tempo przez cały tydzień' },
  { id: 'few-days', label: '1–2 godziny kilka razy w tygodniu', detail: 'Mniej dni, dłuższe sprzątanie' },
  { id: 'one-day', label: 'Kilka godzin w jeden wybrany dzień', detail: 'Jeden większy dzień porządków' },
  { id: 'flexible', label: 'Wolę sprzątać tylko wtedy, kiedy mam czas', detail: 'Plan bez sztywnego limitu minut' },
];

export const DAY_PART_OPTIONS: LabeledOption<DayPart>[] = [
  { id: 'morning', label: 'Poranki' },
  { id: 'afternoon', label: 'Popołudnia' },
  { id: 'evening', label: 'Wieczory' },
];

export const STYLE_OPTIONS: LabeledOption<ScheduleStyle>[] = [
  { id: 'spread', label: 'Krótkie zadania rozłożone na cały tydzień' },
  { id: 'block', label: 'Większe sprzątanie w wybrane dni' },
  { id: 'mix', label: 'Połączenie obu sposobów' },
  { id: 'auto', label: 'Chcę, żeby aplikacja sama zaproponowała najlepszy układ' },
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
  return home.household === 'several' || home.household === 'family' || home.smallChildren === true || hasPets(home);
}
