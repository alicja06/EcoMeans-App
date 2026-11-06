import { createContext, useCallback, useContext, useMemo, useReducer, useEffect, type ReactNode } from 'react';
import type { AppState, CleaningTask, Frequency, Profile, RoomId, ShoppingItem } from '@/types';
import { appReducer } from '@/store/appReducer';
import { createInitialState } from '@/data/initialState';
import { loadState, saveState } from '@/lib/storage';
import { createId } from '@/lib/ids';
import { todayISO } from '@/lib/dates';

export interface NewTaskInput {
  roomId: RoomId;
  title: string;
  frequency: Frequency;
  customDays: number | null;
  startDate: string;
}

export interface AppStore {
  state: AppState;
  toggleTaskDone: (taskId: string) => void;
  addTask: (input: NewTaskInput) => void;
  updateTaskDueDate: (taskId: string, dueDate: string) => void;
  deleteTask: (taskId: string) => void;
  toggleFavorite: (productId: string) => void;
  toggleSavedTip: (tipId: string) => void;
  addShoppingItem: (name: string, productId: string | null) => void;
  toggleShoppingItem: (itemId: string) => void;
  removeShoppingItem: (itemId: string) => void;
  clearBoughtShoppingItems: () => void;
  updateProfile: (patch: Partial<Profile>) => void;
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
    };
    dispatch({ type: 'addTask', task });
  }, []);

  const updateTaskDueDate = useCallback(
    (taskId: string, dueDate: string) => dispatch({ type: 'updateTaskDueDate', taskId, dueDate }),
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
      deleteTask,
      toggleFavorite,
      toggleSavedTip,
      addShoppingItem,
      toggleShoppingItem,
      removeShoppingItem,
      clearBoughtShoppingItems,
      updateProfile,
      resetState,
    }),
    [
      state,
      toggleTaskDone,
      addTask,
      updateTaskDueDate,
      deleteTask,
      toggleFavorite,
      toggleSavedTip,
      addShoppingItem,
      toggleShoppingItem,
      removeShoppingItem,
      clearBoughtShoppingItems,
      updateProfile,
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
