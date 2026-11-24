
import type { AppState, CleaningTask, HomeProfile, TaskSource } from '@/types';
import { createInitialState } from '@/data/initialState';

const STORAGE_KEY_PREFIX = 'ecomeans-household-state-v1';

function getStorageKey(householdId: string): string {
  return `${STORAGE_KEY_PREFIX}-${householdId}`;
}

function normalizeTask(task: Partial<CleaningTask>, index: number): CleaningTask | null {
  if (
    !task ||
    typeof task.title !== 'string' ||
    typeof task.roomId !== 'string' ||
    typeof task.dueDate !== 'string'
  ) {
    return null;
  }

  const id = typeof task.id === 'string' ? task.id : `restored-${index}`;
  const source: TaskSource = task.source ?? (id.startsWith('seed-') ? 'plan' : 'user');

  return {
    id,
    roomId: task.roomId,
    title: task.title,
    frequency: task.frequency ?? 'weekly',
    customDays: task.customDays ?? null,
    dueDate: task.dueDate,
    lastDoneDate: task.lastDoneDate ?? null,
    previousDueDate: task.previousDueDate ?? null,
    minutes: typeof task.minutes === 'number' ? task.minutes : 15,
    enabled: task.enabled ?? true,
    libraryId: task.libraryId ?? null,
    scheduleNote: task.scheduleNote ?? null,
    source,
  };
}

function normalizeHome(home: Partial<HomeProfile> | undefined, base: HomeProfile): HomeProfile {
  if (!home) return base;

  const cleaningDays = Array.isArray(home.cleaningDays)
    ? [...new Set(home.cleaningDays.filter(
        (day) => Number.isInteger(day) && day >= 0 && day <= 6
      ))]
    : [
        ...(home.weekdays ? [1, 2, 3, 4, 5] : []),
        ...(home.weekends ? [0, 6] : []),
      ];

  return {
    ...base,
    ...home,
    pets: home.pets ?? '',
    specialNeeds: home.specialNeeds ?? '',
    places: Array.isArray(home.places) ? home.places : [],
    appliances: Array.isArray(home.appliances) ? home.appliances : [],
    cleaningDays,
    dayParts: Array.isArray(home.dayParts) ? home.dayParts : [],
    weekdays: home.weekdays ?? false,
    weekends: home.weekends ?? false,
    onboardingComplete: home.onboardingComplete ?? false,
  };
}

export function loadState(householdId: string): AppState | null {
  try {
    const raw = window.localStorage.getItem(getStorageKey(householdId));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<AppState>;

    if (!Array.isArray(parsed.tasks) || !parsed.profile || !Array.isArray(parsed.history)) {
      return null;
    }

    const base = createInitialState();

    const tasks = parsed.tasks
      .map((task, index) => normalizeTask(task, index))
      .filter((task): task is CleaningTask => task !== null);

    return {
      ...base,
      ...parsed,
      tasks,
      history: parsed.history ?? [],
      favoriteProductIds: parsed.favoriteProductIds ?? [],
      savedTipIds: parsed.savedTipIds ?? [],
      shoppingItems: parsed.shoppingItems ?? [],
      profile: {
        ...base.profile,
        ...parsed.profile,
        notifications: {
          ...base.profile.notifications,
          ...parsed.profile.notifications,
        },
      },
      home: normalizeHome(parsed.home, base.home),
    };
  } catch {
    return null;
  }
}

export function saveState(householdId: string, state: AppState): void {
  try {
    window.localStorage.setItem(
      getStorageKey(householdId),
      JSON.stringify(state)
    );
  } catch {
    // Brak dostępu do pamięci przeglądarki – aplikacja działa dalej.
  }
}
