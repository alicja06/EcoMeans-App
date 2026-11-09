import type { AppState, CleaningTask, HistoryEntry, HomeProfile, Profile, ShoppingItem } from '@/types';
import { addDays } from '@/lib/dates';
import { nextScheduledDate } from '@/lib/schedule';

export type AppAction =
  | { type: 'toggleTaskDone'; taskId: string; today: string; historyId: string }
  | { type: 'addTask'; task: CleaningTask }
  | { type: 'updateTaskDueDate'; taskId: string; dueDate: string }
  | { type: 'updateTask'; taskId: string; patch: Partial<CleaningTask> }
  | { type: 'skipTask'; taskId: string; today: string }
  | { type: 'postponeTask'; taskId: string; today: string }
  | { type: 'deleteTask'; taskId: string }
  | { type: 'toggleFavorite'; productId: string }
  | { type: 'toggleSavedTip'; tipId: string }
  | { type: 'addShoppingItem'; item: ShoppingItem }
  | { type: 'toggleShoppingItem'; itemId: string }
  | { type: 'removeShoppingItem'; itemId: string }
  | { type: 'clearBoughtShoppingItems' }
  | { type: 'updateProfile'; patch: Partial<Profile> }
  | { type: 'updateHome'; patch: Partial<HomeProfile> }
  | { type: 'acceptPlan'; tasks: CleaningTask[]; home: HomeProfile; cleaningDay: number }
  | { type: 'reset'; state: AppState };

function toggleInList(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

function toggleTaskDone(state: AppState, action: Extract<AppAction, { type: 'toggleTaskDone' }>): AppState {
  const task = state.tasks.find((item) => item.id === action.taskId);
  if (!task) return state;

  if (task.lastDoneDate === action.today) {
    const entryIndex = state.history.findIndex(
      (entry) => entry.taskId === task.id && entry.doneDate === action.today,
    );
    return {
      ...state,
      tasks: state.tasks.map((item) =>
        item.id === task.id
          ? {
              ...item,
              lastDoneDate: null,
              dueDate: item.previousDueDate ?? action.today,
              previousDueDate: null,
            }
          : item,
      ),
      history: state.history.filter((_, index) => index !== entryIndex),
    };
  }

  const entry: HistoryEntry = {
    id: action.historyId,
    taskId: task.id,
    title: task.title,
    roomId: task.roomId,
    doneDate: action.today,
    doneAt: Date.now(),
  };

  return {
    ...state,
    tasks: state.tasks.map((item) =>
      item.id === task.id
        ? {
            ...item,
            lastDoneDate: action.today,
            previousDueDate: item.dueDate,
            dueDate: nextScheduledDate(action.today, item.frequency, item.customDays, state.home),
          }
        : item,
    ),
    history: [entry, ...state.history],
  };
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'toggleTaskDone':
      return toggleTaskDone(state, action);
    case 'addTask':
      return { ...state, tasks: [...state.tasks, action.task] };
    case 'updateTaskDueDate':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.taskId ? { ...task, dueDate: action.dueDate, previousDueDate: null } : task,
        ),
      };
    case 'updateTask':
      return {
        ...state,
        tasks: state.tasks.map((task) => (task.id === action.taskId ? { ...task, ...action.patch, id: task.id } : task)),
      };
    case 'skipTask':
      return {
        ...state,
        tasks: state.tasks.map((task) => {
          if (task.id !== action.taskId) return task;
          const base = task.dueDate > action.today ? task.dueDate : action.today;
          return {
            ...task,
            dueDate: nextScheduledDate(base, task.frequency, task.customDays, state.home),
            previousDueDate: null,
          };
        }),
      };
    case 'postponeTask':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.taskId ? { ...task, dueDate: addDays(action.today, 1), previousDueDate: null } : task,
        ),
      };
    case 'deleteTask':
      return { ...state, tasks: state.tasks.filter((task) => task.id !== action.taskId) };
    case 'toggleFavorite':
      return { ...state, favoriteProductIds: toggleInList(state.favoriteProductIds, action.productId) };
    case 'toggleSavedTip':
      return { ...state, savedTipIds: toggleInList(state.savedTipIds, action.tipId) };
    case 'addShoppingItem':
      return { ...state, shoppingItems: [action.item, ...state.shoppingItems] };
    case 'toggleShoppingItem':
      return {
        ...state,
        shoppingItems: state.shoppingItems.map((item) =>
          item.id === action.itemId ? { ...item, bought: !item.bought } : item,
        ),
      };
    case 'removeShoppingItem':
      return { ...state, shoppingItems: state.shoppingItems.filter((item) => item.id !== action.itemId) };
    case 'clearBoughtShoppingItems':
      return { ...state, shoppingItems: state.shoppingItems.filter((item) => !item.bought) };
    case 'updateProfile':
      return { ...state, profile: { ...state.profile, ...action.patch } };
    case 'updateHome':
      return { ...state, home: { ...state.home, ...action.patch } };
    case 'acceptPlan': {
      const kept = state.tasks.filter((task) => {
        if (task.source !== 'user') return false;
        if (task.libraryId && action.tasks.some((item) => item.libraryId === task.libraryId)) return false;
        return true;
      });
      return {
        ...state,
        tasks: [...action.tasks, ...kept],
        home: { ...action.home, onboardingComplete: true },
        profile: { ...state.profile, cleaningDay: action.cleaningDay },
      };
    }
    case 'reset':
      return action.state;
  }
}
