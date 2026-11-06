import type { AppState, CleaningTask, HistoryEntry, Profile, ShoppingItem } from '@/types';
import { frequencyDays } from '@/lib/tasks';
import { addDays } from '@/lib/dates';

export type AppAction =
  | { type: 'toggleTaskDone'; taskId: string; today: string; historyId: string }
  | { type: 'addTask'; task: CleaningTask }
  | { type: 'updateTaskDueDate'; taskId: string; dueDate: string }
  | { type: 'deleteTask'; taskId: string }
  | { type: 'toggleFavorite'; productId: string }
  | { type: 'toggleSavedTip'; tipId: string }
  | { type: 'addShoppingItem'; item: ShoppingItem }
  | { type: 'toggleShoppingItem'; itemId: string }
  | { type: 'removeShoppingItem'; itemId: string }
  | { type: 'clearBoughtShoppingItems' }
  | { type: 'updateProfile'; patch: Partial<Profile> }
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
            dueDate: addDays(action.today, frequencyDays(item.frequency, item.customDays)),
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
    case 'reset':
      return action.state;
  }
}
