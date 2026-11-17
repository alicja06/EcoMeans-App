
import type {
  AppState,
  CleaningTask,
  CustomFrequencyRule,
  HistoryEntry,
  HomeProfile,
  ShoppingItem,
} from '@/types';
import { supabase } from '@/lib/supabase';
import { todayISO } from '@/lib/dates';

interface HouseholdRow {
  id: string;
  home_profile: HomeProfile | null;
  excluded_library_task_ids: string[] | null;
  row_version: number;
}

interface TaskRow {
  id: string;
  client_id: string | null;
  title: string;
  description: string | null;
  room_id: string;
  frequency: string;
  custom_days: number | null;
  custom_rule: CustomFrequencyRule | null;
  next_due_date: string | null;
  last_done_date: string | null;
  previous_due_date: string | null;
  assigned_to: string | null;
  is_active: boolean;
  minutes: number | null;
  library_id: string | null;
  schedule_note: string | null;
  source: 'plan' | 'user';
  deleted_at: string | null;
  row_version: number;
};

interface HistoryRow {
  id: string;
  client_id: string | null;
  task_id: string;
  task_title: string | null;
  room_id: string | null;
  completed_date: string | null;
  completed_at: string;
  completed_by: string | null;
}

interface ShoppingItemRow {
  id: string;
  client_id: string | null;
  name: string;
  product_id: string | null;
  bought: boolean;
  row_version: number;
}

interface ProfileRow {
  id: string;
  display_name: string | null;
  notifications: {
    reminders: boolean;
    dailySummary: boolean;
    newTips: boolean;
  } | null;
  favorite_product_ids: string[] | null;
  saved_tip_ids: string[] | null;
}

export interface HouseholdSyncVersions {
  household: number;
  tasks: Record<string, number>;
  shoppingItems: Record<string, number>;
}

export interface HouseholdSnapshot {
  state: AppState;
  versions: HouseholdSyncVersions;
}

function mapTask(row: TaskRow): CleaningTask {
  return {
    id: row.client_id ?? row.id,
    roomId: row.room_id as CleaningTask['roomId'],
    title: row.title,
    frequency: row.frequency as CleaningTask['frequency'],
    customDays: row.custom_days,
    customRule: row.custom_rule,
    dueDate: row.next_due_date ?? todayISO(),
    lastDoneDate: row.last_done_date,
    previousDueDate: row.previous_due_date,
    assignedTo: row.assigned_to,
    minutes: row.minutes ?? 15,
    enabled: row.is_active,
    libraryId: row.library_id,
    scheduleNote: row.schedule_note,
    source: row.source,
  };
}

function mapHistory(
  row: HistoryRow,
  taskIdMap: Map<string, string>,
): HistoryEntry {
  return {
    id: row.client_id ?? row.id,
    taskId: taskIdMap.get(row.task_id) ?? row.task_id,
    title: row.task_title ?? 'Zadanie',
    roomId: (row.room_id ?? 'other') as HistoryEntry['roomId'],
    doneDate: row.completed_date ?? row.completed_at.slice(0, 10),
    doneAt: new Date(row.completed_at).getTime(),
    completedBy: row.completed_by,
  };
}

function mapShoppingItem(row: ShoppingItemRow): ShoppingItem {
  return {
    id: row.client_id ?? row.id,
    name: row.name,
    productId: row.product_id,
    bought: row.bought,
  };
}

function toVersion(value: number | string | null | undefined): number {
  const version = Number(value ?? 1);

  if (!Number.isSafeInteger(version) || version < 1) {
    throw new Error('Otrzymano nieprawidłowy numer wersji danych.');
  }

  return version;
}

export async function loadHouseholdSnapshot(
  householdId: string,
  userId: string,
  baseState: AppState,
): Promise<HouseholdSnapshot> {
  const [
    householdResult,
    tasksResult,
    historyResult,
    shoppingResult,
    profileResult,
  ] = await Promise.all([
    supabase
      .from('households')
      .select(
        'id, home_profile, excluded_library_task_ids, row_version',
      )
      .eq('id', householdId)
      .single(),

    // Pobieramy również usunięte zadania, aby zachować
    // prawidłowe powiązania wpisów historii.
    supabase
      .from('tasks')
      .select('*')
      .eq('household_id', householdId)
      .order('created_at', { ascending: true }),

    supabase
      .from('task_history')
      .select('*')
      .eq('household_id', householdId)
      .order('completed_at', { ascending: false }),

    supabase
      .from('shopping_items')
      .select('*')
      .eq('household_id', householdId)
      .order('created_at', { ascending: true }),

    supabase
      .from('profiles')
      .select(
        'id, display_name, notifications, favorite_product_ids, saved_tip_ids',
      )
      .eq('id', userId)
      .single(),
  ]);

  if (householdResult.error) throw householdResult.error;
  if (tasksResult.error) throw tasksResult.error;
  if (historyResult.error) throw historyResult.error;
  if (shoppingResult.error) throw shoppingResult.error;
  if (profileResult.error) throw profileResult.error;

  const household = householdResult.data as HouseholdRow;
  const allTaskRows = (tasksResult.data ?? []) as TaskRow[];
  const historyRows = (historyResult.data ?? []) as HistoryRow[];
  const shoppingRows = (shoppingResult.data ?? []) as ShoppingItemRow[];
  const profile = profileResult.data as ProfileRow;

  const activeTaskRows = allTaskRows.filter(
    (row) => row.deleted_at === null,
  );

  // Mapa obejmuje również usunięte zadania.
  const taskIdMap = new Map(
    allTaskRows.map((row) => [
      row.id,
      row.client_id ?? row.id,
    ]),
  );

  const home = {
    ...baseState.home,
    ...(household.home_profile ?? {}),
    onboardingComplete: Boolean(
      household.home_profile?.onboardingComplete,
    ),
  } as HomeProfile;

  const state: AppState = {
    ...baseState,
    tasks: activeTaskRows.map(mapTask),
    history: historyRows.map((row) =>
      mapHistory(row, taskIdMap),
    ),
    shoppingItems: shoppingRows.map(mapShoppingItem),
    excludedLibraryTaskIds:
      household.excluded_library_task_ids ?? [],
    home,
    profile: {
      ...baseState.profile,
      name: profile.display_name ?? '',
      notifications: {
        ...baseState.profile.notifications,
        ...(profile.notifications ?? {}),
      },
    },
    favoriteProductIds: profile.favorite_product_ids ?? [],
    savedTipIds: profile.saved_tip_ids ?? [],
  };

  const versions: HouseholdSyncVersions = {
    household: toVersion(household.row_version),
    tasks: Object.fromEntries(
      activeTaskRows.map((row) => [
        row.client_id ?? row.id,
        toVersion(row.row_version),
      ]),
    ),
    shoppingItems: Object.fromEntries(
      shoppingRows.map((row) => [
        row.client_id ?? row.id,
        toVersion(row.row_version),
      ]),
    ),
  };

  return { state, versions };
}

// Zachowanie zgodności ze starszym wywołaniem w AppStoreContext.
// W dalszym etapie przejdziemy na loadHouseholdSnapshot.
export async function loadHouseholdState(
  householdId: string,
  userId: string,
  baseState: AppState,
): Promise<AppState> {
  const snapshot = await loadHouseholdSnapshot(
    householdId,
    userId,
    baseState,
  );

  return snapshot.state;
}
