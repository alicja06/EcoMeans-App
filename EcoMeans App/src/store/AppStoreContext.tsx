import { createContext, useCallback, useContext, useMemo, useReducer, useEffect, type ReactNode } from 'react';
import type { AppState, CleaningTask, Frequency, HomeProfile, Profile, RoomId, ShoppingItem } from '@/types';
import { appReducer } from '@/store/appReducer';
import { createInitialState } from '@/data/initialState';
import { loadState, saveState } from '@/lib/storage';
import { createId } from '@/lib/ids';
import { todayISO, weekdayIndex } from '@/lib/dates';
import { resolveCalendar } from '@/lib/schedule';

export interface NewTaskInput {
  roomId: RoomId;
  title: string;
  frequency: Frequency;
  customDays: number | null;
  startDate: string;
  minutes?: number;
  libraryId?: string | null;
  scheduleNote?: string | null;
}

export type TaskPatch = Partial<
  Pick<CleaningTask, 'title' | 'roomId' | 'frequency' | 'customDays' | 'dueDate' | 'minutes' | 'enabled' | 'scheduleNote'>
>;

export interface AppStore {
  state: AppState;
  toggleTaskDone: (taskId: string) => void;
  addTask: (input: NewTaskInput) => void;
  updateTaskDueDate: (taskId: string, dueDate: string) => void;
  updateTask: (taskId: string, patch: TaskPatch) => void;
  skipTask: (taskId: string) => void;
  postponeTask: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  toggleFavorite: (productId: string) => void;
  toggleSavedTip: (tipId: string) => void;
  addShoppingItem: (name: string, productId: string | null) => void;
  toggleShoppingItem: (itemId: string) => void;
  removeShoppingItem: (itemId: string) => void;
  clearBoughtShoppingItems: () => void;
  updateProfile: (patch: Partial<Profile>) => void;
  updateHome: (patch: Partial<HomeProfile>) => void;
  acceptPlan: (tasks: CleaningTask[], home: HomeProfile) => void;
  resetState: () => void;
}

const AppStoreContext = createContext<AppStore | null>(null);

function initialAppState(): AppState {
  return loadState() ?? createInitialState(todayISO());
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, initialAppState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const toggleTaskDone = useCallback(
    (taskId: string) => dispatch({ type: 'toggleTaskDone', taskId, today: todayISO(), historyId: createId() }),
    [],
  );

  const addTask = useCallback((input: NewTaskInput) => {
    const task: CleaningTask = {
      id: createId(),
      roomId: input.roomId,
      title: input.title,
      frequency: input.frequency,
      customDays: input.frequency === 'custom' ? input.customDays : null,
      dueDate: input.startDate,
      lastDoneDate: null,
      previousDueDate: null,
      minutes: input.minutes ?? 15,
      enabled: true,
      libraryId: input.libraryId ?? null,
      scheduleNote: input.scheduleNote ?? null,
      source: 'user',
    };
    dispatch({ type: 'addTask', task });
  }, []);

  const updateTaskDueDate = useCallback(
    (taskId: string, dueDate: string) => dispatch({ type: 'updateTaskDueDate', taskId, dueDate }),
    [],
  );

  const updateTask = useCallback((taskId: string, patch: TaskPatch) => {
    const next = { ...patch };
    if (next.frequency && next.frequency !== 'custom') next.customDays = null;
    dispatch({ type: 'updateTask', taskId, patch: next });
  }, []);

  const skipTask = useCallback(
    (taskId: string) => dispatch({ type: 'skipTask', taskId, today: todayISO() }),
    [],
  );

  const postponeTask = useCallback(
    (taskId: string) => dispatch({ type: 'postponeTask', taskId, today: todayISO() }),
    [],
  );

  const deleteTask = useCallback((taskId: string) => dispatch({ type: 'deleteTask', taskId }), []);

  const toggleFavorite = useCallback(
    (productId: string) => dispatch({ type: 'toggleFavorite', productId }),
    [],
  );

  const toggleSavedTip = useCallback((tipId: string) => dispatch({ type: 'toggleSavedTip', tipId }), []);

  const addShoppingItem = useCallback((name: string, productId: string | null) => {
    const item: ShoppingItem = { id: createId(), name, productId, bought: false };
    dispatch({ type: 'addShoppingItem', item });
  }, []);

  const toggleShoppingItem = useCallback(
    (itemId: string) => dispatch({ type: 'toggleShoppingItem', itemId }),
    [],
  );

  const removeShoppingItem = useCallback(
    (itemId: string) => dispatch({ type: 'removeShoppingItem', itemId }),
    [],
  );

  const clearBoughtShoppingItems = useCallback(() => dispatch({ type: 'clearBoughtShoppingItems' }), []);

  const updateProfile = useCallback(
    (patch: Partial<Profile>) => dispatch({ type: 'updateProfile', patch }),
    [],
  );

  const updateHome = useCallback(
    (patch: Partial<HomeProfile>) => dispatch({ type: 'updateHome', patch }),
    [],
  );

  const acceptPlan = useCallback((tasks: CleaningTask[], home: HomeProfile) => {
    const calendar = resolveCalendar(home);
    const cleaningDay = calendar.bigWeekdays[0] ?? calendar.openWeekdays[0] ?? weekdayIndex(todayISO());
    const stamped = tasks.map((task) => ({ ...task, id: createId() }));
    dispatch({ type: 'acceptPlan', tasks: stamped, home, cleaningDay });
  }, []);

  const resetState = useCallback(
    () => dispatch({ type: 'reset', state: createInitialState(todayISO()) }),
    [],
  );

  const store = useMemo<AppStore>(
    () => ({
      state,
      toggleTaskDone,
      addTask,
      updateTaskDueDate,
      updateTask,
      skipTask,
      postponeTask,
      deleteTask,
      toggleFavorite,
      toggleSavedTip,
      addShoppingItem,
      toggleShoppingItem,
      removeShoppingItem,
      clearBoughtShoppingItems,
      updateProfile,
      updateHome,
      acceptPlan,
      resetState,
    }),
    [
      state,
      toggleTaskDone,
      addTask,
      updateTaskDueDate,
      updateTask,
      skipTask,
      postponeTask,
      deleteTask,
      toggleFavorite,
      toggleSavedTip,
      addShoppingItem,
      toggleShoppingItem,
      removeShoppingItem,
      clearBoughtShoppingItems,
      updateProfile,
      updateHome,
      acceptPlan,
      resetState,
    ],
  );

  return <AppStoreContext.Provider value={store}>{children}</AppStoreContext.Provider>;
}

export function useAppStore(): AppStore {
  const store = useContext(AppStoreContext);
  if (!store) throw new Error('useAppStore must be used inside AppStoreProvider');
  return store;
}
