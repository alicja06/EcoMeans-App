import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from "react";

import type {
  AppState,
  CleaningTask,
  Frequency,
  HomeProfile,
  Profile,
  RoomId,
  ShoppingItem,
} from "@/types";

import { appReducer, type AppAction } from "@/store/appReducer";
import { createInitialState } from "@/data/initialState";
import { createId } from "@/lib/ids";
import { todayISO } from "@/lib/dates";
import { useHousehold } from "@/auth/HouseholdContext";
import { useAuth } from "@/auth/AuthContext";
import {
  loadHouseholdSnapshot,
  type HouseholdSyncVersions,
} from "@/lib/householdSync";

import {
  saveHouseholdTask,
  deleteHouseholdTask,
  saveShoppingItem,
  deleteShoppingItem,
  clearBoughtShoppingItems as clearBoughtShoppingItemsRpc,
  updateHouseholdSettings,
  setTaskCompletion,
  applyHouseholdPlan,
} from "@/lib/householdWrites";

import {
  subscribeToHouseholdChanges,
  unsubscribeFromHouseholdChanges,
} from "@/lib/householdRealtime";

import { supabase } from "@/lib/supabase";

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
  Pick<
    CleaningTask,
    | "title"
    | "roomId"
    | "frequency"
    | "customDays"
    | "dueDate"
    | "minutes"
    | "enabled"
    | "scheduleNote"
    | "customRule"
  >
>;

export interface AppStore {
  state: AppState;
  loading: boolean;
  loadError: string | null;
  operationError: string | null;
  dismissOperationError: () => void;
  retryLoading: () => void;
  toggleTaskDone: (taskId: string) => void;
  addTask: (input: NewTaskInput) => void;
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
  acceptPlan: (
    tasks: CleaningTask[],
    home: HomeProfile,
    excludedLibraryTaskIds?: string[],
  ) => Promise<boolean>;
  resetState: () => void;
}

const AppStoreContext = createContext<AppStore | null>(null);

function createEmptyState(): AppState {
  return createInitialState();
}

function readVersion(value: number | undefined): number {
  const version = Number(value);

  if (!Number.isSafeInteger(version) || version < 1) {
    throw new Error("Serwer nie zwrócił prawidłowego numeru wersji.");
  }

  return version;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Nie udało się zapisać zmian.";
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const { householdId, loading: householdLoading } = useHousehold();
  const { user } = useAuth();

  const [state, dispatch] = useReducer(appReducer, undefined, createEmptyState);

  const stateRef = useRef(state);
  stateRef.current = state;

  const versionsRef = useRef<HouseholdSyncVersions>({
    household: 0,
    tasks: {},
    shoppingItems: {},
  });

  const [loadedHouseholdId, setLoadedHouseholdId] = useState<
    string | null | undefined
  >(undefined);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const loadRequestRef = useRef(0);

  // Aktualizacja lokalnego stanu dopiero po potwierdzeniu zapisu.
  const commitAction = useCallback((action: AppAction): AppState => {
    const nextState = appReducer(stateRef.current, action);

    stateRef.current = nextState;
    dispatch(action);

    return nextState;
  }, []);

  // Pobranie pełnego stanu i wszystkich aktualnych wersji z Supabase.
  const refreshCloudState = useCallback(async () => {
    if (!householdId || !user?.id) return;

    const requestId = ++loadRequestRef.current;

    try {
      const snapshot = await loadHouseholdSnapshot(
        householdId,
        user.id,
        createEmptyState(),
      );

      if (requestId !== loadRequestRef.current) return;

      versionsRef.current = snapshot.versions;
      stateRef.current = snapshot.state;

      dispatch({
        type: "reset",
        state: snapshot.state,
      });

      setLoadError(null);
      setLoadedHouseholdId(householdId);
    } catch (error) {
      if (requestId !== loadRequestRef.current) return;

      console.error("Błąd pobierania danych gospodarstwa:", error);

      setLoadError(getErrorMessage(error));
      setLoadedHouseholdId(undefined);
    }
  }, [householdId, user?.id]);

  // Obsługa pierwszego pobrania danych i zmiany gospodarstwa.
  useEffect(() => {
    if (householdLoading) {
      setLoadedHouseholdId(undefined);
      return;
    }

    if (!householdId) {
      loadRequestRef.current += 1;

      versionsRef.current = {
        household: 0,
        tasks: {},
        shoppingItems: {},
      };

      const emptyState = createEmptyState();
      stateRef.current = emptyState;

      dispatch({
        type: "reset",
        state: emptyState,
      });

      setLoadError(null);
      setOperationError(null);
      setLoadedHouseholdId(null);
      return;
    }

    if (!user?.id) {
      loadRequestRef.current += 1;

      setLoadError("Nie udało się ustalić zalogowanego użytkownika.");
      setLoadedHouseholdId(undefined);
      return;
    }

    setLoadedHouseholdId(undefined);
    setLoadError(null);
    setOperationError(null);

    void refreshCloudState();

    return () => {
      loadRequestRef.current += 1;
    };
  }, [householdId, householdLoading, user?.id, retryCount, refreshCloudState]);

  const stateReady = householdId
    ? loadedHouseholdId === householdId
    : loadedHouseholdId === null;

  // Nasłuchiwanie zmian wprowadzonych przez innych domowników.
  useEffect(() => {
    if (householdLoading || !householdId || !user?.id || !stateReady) {
      return;
    }

    let refreshTimer: ReturnType<typeof setTimeout> | undefined;

    const scheduleRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);

      refreshTimer = setTimeout(() => {
        void refreshCloudState();
      }, 150);
    };

    const channel = subscribeToHouseholdChanges(
      householdId,
      scheduleRefresh,
      scheduleRefresh,
    );

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      void unsubscribeFromHouseholdChanges(channel);
    };
  }, [householdId, householdLoading, user?.id, stateReady, refreshCloudState]);

  const retryLoading = useCallback(() => {
    setRetryCount((count) => count + 1);
  }, []);

  const dismissOperationError = useCallback(() => {
    setOperationError(null);
  }, []);

  // Po błędzie nie ponawiamy zapisu automatycznie.
  // Najpierw pobieramy aktualny stan serwera.
  const handleWriteError = useCallback(
    async (error: unknown) => {
      console.error("Nie udało się zapisać zmian:", error);

      const message = getErrorMessage(error);

      await refreshCloudState();

      if (message.includes("VERSION_CONFLICT")) {
        setOperationError(
          "Ktoś zmienił te dane w międzyczasie. Pobraliśmy najnowszy stan. Sprawdź dane i spróbuj ponownie.",
        );
      } else {
        setOperationError(`Nie udało się zapisać zmian. ${message}`);
      }
    },
    [refreshCloudState],
  );

  // Wspólna obsługa zapisu zadania.
  const persistTaskAction = useCallback(
    async (action: AppAction, taskId: string) => {
      if (!householdId) {
        commitAction(action);
        return;
      }

      try {
        const currentTask = stateRef.current.tasks.find(
          (task) => task.id === taskId,
        );

        if (!currentTask) return;

        const expectedVersion = versionsRef.current.tasks[taskId];

        if (expectedVersion === undefined) {
          throw new Error("Brakuje wersji zadania. Odśwież dane.");
        }

        const nextState = appReducer(stateRef.current, action);

        const updatedTask = nextState.tasks.find((task) => task.id === taskId);

        if (!updatedTask) {
          throw new Error("Nie udało się przygotować zmiany zadania.");
        }

        const result = await saveHouseholdTask(
          householdId,
          updatedTask,
          expectedVersion,
        );

        versionsRef.current.tasks[taskId] = readVersion(result.row_version);

        stateRef.current = nextState;
        dispatch(action);
      } catch (error) {
        await handleWriteError(error);
      }
    },
    [householdId, commitAction, handleWriteError],
  );

  // Wykonanie zadania i cofnięcie wykonania.
  const toggleTaskDone = useCallback(
    async (taskId: string) => {
      if (!householdId) return;

      const currentState = stateRef.current;
      const task = currentState.tasks.find((item) => item.id === taskId);

      if (!task) return;

      const today = todayISO();
      const isUndo = task.lastDoneDate === today;

      const existingHistory = isUndo
        ? currentState.history.find(
            (entry) => entry.taskId === taskId && entry.doneDate === today,
          )
        : undefined;

      if (isUndo && !existingHistory) {
        setOperationError(
          "Nie znaleziono wpisu historii potrzebnego do cofnięcia wykonania.",
        );
        return;
      }

      const historyId = isUndo ? existingHistory!.id : createId();

      const action: AppAction = {
        type: "toggleTaskDone",
        taskId,
        today,
        historyId,
      };

      try {
        const expectedVersion = versionsRef.current.tasks[taskId];

        if (expectedVersion === undefined) {
          throw new Error("Brakuje wersji zadania. Odśwież dane.");
        }

        const nextState = appReducer(currentState, action);

        const nextTask = nextState.tasks.find((item) => item.id === taskId);

        if (!nextTask) {
          throw new Error("Nie udało się przygotować zmiany zadania.");
        }

        const result = await setTaskCompletion({
          householdId,
          taskClientId: taskId,
          expectedVersion,
          historyClientId: historyId,
          completedDate: today,
          nextDueDate: isUndo ? null : nextTask.dueDate,
          previousDueDate: task.previousDueDate ?? task.dueDate,
          undo: isUndo,
        });

        versionsRef.current.tasks[taskId] = readVersion(result.row_version);

        stateRef.current = nextState;
        dispatch(action);
      } catch (error) {
        await handleWriteError(error);
      }
    },
    [householdId, handleWriteError],
  );

  const addTask = useCallback(
    async (input: NewTaskInput) => {
      const task: CleaningTask = {
        id: createId(),
        roomId: input.roomId,
        title: input.title,
        frequency: input.frequency,
        customDays: input.frequency === "custom" ? input.customDays : null,
        dueDate: input.startDate,
        lastDoneDate: null,
        previousDueDate: null,
        minutes: input.minutes ?? 15,
        enabled: true,
        libraryId: input.libraryId ?? null,
        scheduleNote: input.scheduleNote ?? null,
        source: "user",
      };

      const action: AppAction = {
        type: "addTask",
        task,
      };

      if (!householdId) {
        commitAction(action);
        return;
      }

      try {
        const result = await saveHouseholdTask(householdId, task, null);

        versionsRef.current.tasks[task.id] = readVersion(result.row_version);

        commitAction(action);
      } catch (error) {
        await handleWriteError(error);
      }
    },
    [householdId, commitAction, handleWriteError],
  );

  const updateTask = useCallback(
    (taskId: string, patch: TaskPatch) => {
      const next = { ...patch };

      if (next.frequency && next.frequency !== "custom") {
        next.customDays = null;
      }

      return persistTaskAction(
        {
          type: "updateTask",
          taskId,
          patch: next,
        },
        taskId,
      );
    },
    [persistTaskAction],
  );

  const skipTask = useCallback(
    (taskId: string) =>
      persistTaskAction(
        {
          type: "skipTask",
          taskId,
          today: todayISO(),
        },
        taskId,
      ),
    [persistTaskAction],
  );

  const postponeTask = useCallback(
    (taskId: string) =>
      persistTaskAction(
        {
          type: "postponeTask",
          taskId,
          today: todayISO(),
        },
        taskId,
      ),
    [persistTaskAction],
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      if (!householdId) {
        commitAction({ type: "deleteTask", taskId });
        return;
      }

      try {
        const expectedVersion = versionsRef.current.tasks[taskId];

        if (expectedVersion === undefined) {
          throw new Error("Brakuje wersji zadania. Odśwież dane.");
        }

        await deleteHouseholdTask(householdId, taskId, expectedVersion);

        delete versionsRef.current.tasks[taskId];

        commitAction({
          type: "deleteTask",
          taskId,
        });

        // Usunięcie zadania bibliotecznego może również
        // zmienić excluded_library_task_ids w gospodarstwie.
        await refreshCloudState();
      } catch (error) {
        await handleWriteError(error);
      }
    },
    [householdId, commitAction, refreshCloudState, handleWriteError],
  );

  // Ulubione produkty – dane indywidualne użytkownika.
  const toggleFavorite = useCallback(
    async (productId: string) => {
      if (!user?.id) return;

      const current = stateRef.current.favoriteProductIds;

      const next = current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId];

      try {
        const { error } = await supabase
          .from("profiles")
          .update({ favorite_product_ids: next })
          .eq("id", user.id);

        if (error) throw error;

        commitAction({
          type: "toggleFavorite",
          productId,
        });
      } catch (error) {
        await handleWriteError(error);
      }
    },
    [user?.id, commitAction, handleWriteError],
  );

  // Zapisane porady – dane indywidualne użytkownika.
  const toggleSavedTip = useCallback(
    async (tipId: string) => {
      if (!user?.id) return;

      const current = stateRef.current.savedTipIds;

      const next = current.includes(tipId)
        ? current.filter((id) => id !== tipId)
        : [...current, tipId];

      try {
        const { error } = await supabase
          .from("profiles")
          .update({ saved_tip_ids: next })
          .eq("id", user.id);

        if (error) throw error;

        commitAction({
          type: "toggleSavedTip",
          tipId,
        });
      } catch (error) {
        await handleWriteError(error);
      }
    },
    [user?.id, commitAction, handleWriteError],
  );

  const addShoppingItem = useCallback(
    async (name: string, productId: string | null) => {
      if (!householdId) return;

      const item: ShoppingItem = {
        id: createId(),
        name,
        productId,
        bought: false,
      };

      try {
        const result = await saveShoppingItem(householdId, item, null);

        versionsRef.current.shoppingItems[item.id] = readVersion(
          result.row_version,
        );

        commitAction({
          type: "addShoppingItem",
          item,
        });
      } catch (error) {
        await handleWriteError(error);
      }
    },
    [householdId, commitAction, handleWriteError],
  );

  const toggleShoppingItem = useCallback(
    async (itemId: string) => {
      if (!householdId) return;

      try {
        const item = stateRef.current.shoppingItems.find(
          (entry) => entry.id === itemId,
        );

        if (!item) return;

        const expectedVersion = versionsRef.current.shoppingItems[itemId];

        if (expectedVersion === undefined) {
          throw new Error("Brakuje wersji produktu na liście zakupów.");
        }

        const updatedItem: ShoppingItem = {
          ...item,
          bought: !item.bought,
        };

        const result = await saveShoppingItem(
          householdId,
          updatedItem,
          expectedVersion,
        );

        versionsRef.current.shoppingItems[itemId] = readVersion(
          result.row_version,
        );

        commitAction({
          type: "toggleShoppingItem",
          itemId,
        });
      } catch (error) {
        await handleWriteError(error);
      }
    },
    [householdId, commitAction, handleWriteError],
  );

  const removeShoppingItem = useCallback(
    async (itemId: string) => {
      if (!householdId) return;

      try {
        const expectedVersion = versionsRef.current.shoppingItems[itemId];

        if (expectedVersion === undefined) {
          throw new Error("Brakuje wersji produktu na liście zakupów.");
        }

        await deleteShoppingItem(householdId, itemId, expectedVersion);

        delete versionsRef.current.shoppingItems[itemId];

        commitAction({
          type: "removeShoppingItem",
          itemId,
        });
      } catch (error) {
        await handleWriteError(error);
      }
    },
    [householdId, commitAction, handleWriteError],
  );

  const clearBoughtShoppingItems = useCallback(async () => {
    if (!householdId) return;

    try {
      await clearBoughtShoppingItemsRpc(householdId);

      // Usuwamy lokalnie wersje kupionych pozycji.
      const boughtIds = stateRef.current.shoppingItems
        .filter((item) => item.bought)
        .map((item) => item.id);

      boughtIds.forEach((id) => {
        delete versionsRef.current.shoppingItems[id];
      });

      commitAction({
        type: "clearBoughtShoppingItems",
      });

      await refreshCloudState();
    } catch (error) {
      await handleWriteError(error);
    }
  }, [householdId, commitAction, refreshCloudState, handleWriteError]);

  // Zmiany profilu są indywidualne, nie współdzielone.
  const updateProfile = useCallback(
    async (patch: Partial<Profile>) => {
      if (!user?.id) return;

      const action: AppAction = {
        type: "updateProfile",
        patch,
      };

      const nextState = appReducer(stateRef.current, action);

      const update: {
        display_name?: string;
        notifications?: Profile["notifications"];
      } = {};

      if (patch.name !== undefined) {
        update.display_name = nextState.profile.name;
      }

      if (patch.notifications !== undefined) {
        update.notifications = nextState.profile.notifications;
      }

      if (Object.keys(update).length === 0) return;

      try {
        const { error } = await supabase
          .from("profiles")
          .update(update)
          .eq("id", user.id);

        if (error) throw error;

        stateRef.current = nextState;
        dispatch(action);
      } catch (error) {
        await handleWriteError(error);
      }
    },
    [user?.id, handleWriteError],
  );

  // Ustawienia gospodarstwa są wspólne dla domowników.
  const updateHome = useCallback(
    async (patch: Partial<HomeProfile>) => {
      if (!householdId) return;

      const action: AppAction = {
        type: "updateHome",
        patch,
      };

      try {
        const nextState = appReducer(stateRef.current, action);
        const expectedVersion = versionsRef.current.household;

        const result = await updateHouseholdSettings(
          householdId,
          expectedVersion,
          nextState.home,
          nextState.excludedLibraryTaskIds ?? [],
        );

        versionsRef.current.household = readVersion(result.row_version);

        stateRef.current = nextState;
        dispatch(action);
      } catch (error) {
        await handleWriteError(error);
      }
    },
    [householdId, handleWriteError],
  );

  // Zatwierdzenie planu w jednej transakcji SQL.
  const acceptPlan = useCallback(
    async (
      tasks: CleaningTask[],
      home: HomeProfile,
      excludedLibraryTaskIds?: string[],
    ): Promise<boolean> => {
      if (!householdId) return false;

      const action: AppAction = {
        type: "acceptPlan",
        tasks,
        home,
        excludedLibraryTaskIds:
          excludedLibraryTaskIds ??
          stateRef.current.excludedLibraryTaskIds ??
          [],
      };

      try {
        const nextState = appReducer(stateRef.current, action);
        const expectedVersion = versionsRef.current.household;

        await applyHouseholdPlan(
          householdId,
          expectedVersion,
          nextState.home,
          nextState.excludedLibraryTaskIds ?? [],
          nextState.tasks,
        );

        await refreshCloudState();

        return true;
      } catch (error) {
        await handleWriteError(error);
        return false;
      }
    },
    [householdId, refreshCloudState, handleWriteError],
  );

  const resetState = useCallback(() => {
    const emptyState = createEmptyState();

    stateRef.current = emptyState;

    dispatch({
      type: "reset",
      state: emptyState,
    });
  }, []);

  const store = useMemo<AppStore>(
    () => ({
      state,
      loading: householdLoading || !stateReady,
      loadError,
      operationError,
      dismissOperationError,
      retryLoading,
      toggleTaskDone,
      addTask,
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
      householdLoading,
      stateReady,
      loadError,
      operationError,
      dismissOperationError,
      retryLoading,
      toggleTaskDone,
      addTask,
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

  if (householdLoading || !stateReady) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f5e6ce] px-6">
        {loadError ? (
          <div className="w-full max-w-sm text-center">
            <h2 className="mb-3 text-3xl text-[#3b742f]">
              Nie udało się załadować danych
            </h2>

            <p className="mb-6 text-sm text-[#4e4d4d]">{loadError}</p>

            <button
              type="button"
              onClick={retryLoading}
              className="w-full rounded-2xl bg-[#3b742f] px-6 py-4 font-bold text-white"
            >
              Spróbuj ponownie
            </button>
          </div>
        ) : (
          <p className="text-lg text-[#3b742f]">Ładowanie EcoMeans...</p>
        )}
      </div>
    );
  }

  return (
    <AppStoreContext.Provider value={store}>
      {operationError && (
        <div
          role="alert"
          className="fixed left-4 right-4 top-4 z-[100] mx-auto flex max-w-xl items-start justify-between gap-4 rounded-2xl border border-[#c58b45] bg-[#fff8eb] p-4 text-sm text-[#4e4d4d] shadow-lg"
        >
          <p>{operationError}</p>

          <button
            type="button"
            onClick={dismissOperationError}
            className="shrink-0 font-bold text-[#3b742f]"
            aria-label="Zamknij komunikat"
          >
            Zamknij
          </button>
        </div>
      )}

      {children}
    </AppStoreContext.Provider>
  );
}

export function useAppStore(): AppStore {
  const store = useContext(AppStoreContext);

  if (!store) {
    throw new Error("useAppStore must be used inside AppStoreProvider");
  }

  return store;
}
