import type { AppState } from '@/types';
import { emptyHome } from '@/data/home';

export function createInitialState(_today: string): AppState {
  return {
    tasks: [],
    history: [],
    favoriteProductIds: ['floor-concentrate'],
    savedTipIds: [],
    shoppingItems: [],
    profile: {
      name: '',
      cleaningDay: 6,
      notifications: { reminders: true, dailySummary: false, newTips: false },
    },
    home: emptyHome(),
  };
}

export const TASK_SUGGESTIONS = [
  'Wyczyścić filtr okapu',
  'Umyć legowisko psa',
  'Przetrzeć drzwi wejściowe',
  'Mycie blatów',
  'Czyszczenie zlewu',
  'Mycie podłogi',
  'Czyszczenie toalety',
  'Mycie umywalki',
  'Odkurzanie',
  'Ścieranie kurzu',
];
