import type { AppState, Frequency, RoomId } from '@/types';
import { addDays } from '@/lib/dates';

interface SeedTask {
  roomId: RoomId;
  title: string;
  frequency: Frequency;
  offsetDays: number;
}

const SEED_TASKS: SeedTask[] = [
  { roomId: 'kitchen', title: 'Mycie blatów', frequency: 'daily', offsetDays: 0 },
  { roomId: 'kitchen', title: 'Czyszczenie zlewu', frequency: 'daily', offsetDays: 0 },
  { roomId: 'kitchen', title: 'Mycie podłogi', frequency: 'weekly', offsetDays: 2 },
  { roomId: 'bathroom', title: 'Czyszczenie toalety', frequency: 'weekly', offsetDays: 0 },
  { roomId: 'bathroom', title: 'Mycie umywalki', frequency: 'weekly', offsetDays: 1 },
  { roomId: 'bathroom', title: 'Czyszczenie kabiny prysznicowej', frequency: 'biweekly', offsetDays: 3 },
  { roomId: 'bathroom', title: 'Mycie luster', frequency: 'monthly', offsetDays: -2 },
  { roomId: 'living', title: 'Odkurzanie', frequency: 'weekly', offsetDays: 1 },
  { roomId: 'living', title: 'Ścieranie kurzu', frequency: 'weekly', offsetDays: 4 },
  { roomId: 'bedroom', title: 'Ścieranie kurzu', frequency: 'biweekly', offsetDays: 5 },
  { roomId: 'hallway', title: 'Mycie podłogi', frequency: 'weekly', offsetDays: 3 },
  { roomId: 'other', title: 'Mycie okien', frequency: 'quarterly', offsetDays: 14 },
];

export function createInitialState(today: string): AppState {
  return {
    tasks: SEED_TASKS.map((task, index) => ({
      id: `seed-${index}`,
      roomId: task.roomId,
      title: task.title,
      frequency: task.frequency,
      customDays: null,
      dueDate: addDays(today, task.offsetDays),
      lastDoneDate: null,
      previousDueDate: null,
    })),
    history: [],
    favoriteProductIds: ['floor-concentrate'],
    savedTipIds: [],
    shoppingItems: [],
    profile: {
      name: '',
      cleaningDay: 6,
      notifications: { reminders: true, dailySummary: false, newTips: false },
    },
  };
}

export const TASK_SUGGESTIONS = [
  'Mycie blatów',
  'Czyszczenie zlewu',
  'Mycie podłogi',
  'Czyszczenie toalety',
  'Mycie umywalki',
  'Czyszczenie kabiny prysznicowej',
  'Odkurzanie',
  'Ścieranie kurzu',
  'Mycie luster',
];
