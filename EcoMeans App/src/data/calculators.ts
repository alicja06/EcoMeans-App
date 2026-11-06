import type { SoilLevel, WaterHardness } from '@/types';

export const FLOOR_BASE_WATER_LITERS = 5;

export const FLOOR_DOSAGE_OPTIONS = [
  {
    id: 'light',
    label: 'Standardowe – lżejsze',
    detail: 'Regularne mycie podłogi',
    mlPerBase: 25,
  },
  {
    id: 'standard',
    label: 'Standardowe – pełne',
    detail: 'Standardowe zabrudzenia',
    mlPerBase: 50,
  },
  {
    id: 'strong',
    label: 'Silniejsze zabrudzenia',
    detail: 'Trudniejsze, uporczywe zabrudzenia',
    mlPerBase: 100,
  },
] as const;

export type FloorDosageId = (typeof FLOOR_DOSAGE_OPTIONS)[number]['id'];

export const WATER_HARDNESS_OPTIONS: { id: WaterHardness; label: string; hint: string }[] = [
  { id: 'soft', label: 'Miękka', hint: 'Mało kamienia w czajniku' },
  { id: 'medium', label: 'Średnia', hint: 'Umiarkowany osad' },
  { id: 'hard', label: 'Twarda', hint: 'Widoczny osad i kamień' },
];

export const SOIL_LEVEL_OPTIONS: { id: SoilLevel; label: string; hint: string }[] = [
  { id: 'light', label: 'Lekkie', hint: 'Po posiłku, bez przypaleń' },
  { id: 'medium', label: 'Średnie', hint: 'Zaschnięte resztki jedzenia' },
  { id: 'heavy', label: 'Silne', hint: 'Przypalenia i tłuste naczynia' },
];

// Wartości poglądowe: prototyp nie zawiera zatwierdzonych danych dawkowania.
export const DEMO_DISH_ML_PER_LITER: Record<SoilLevel, number> = {
  light: 0.5,
  medium: 1,
  heavy: 1.5,
};

export const DEMO_DISH_HARDNESS_FACTOR: Record<WaterHardness, number> = {
  soft: 0.8,
  medium: 1,
  hard: 1.25,
};
