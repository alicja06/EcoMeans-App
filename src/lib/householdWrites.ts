
import type {
  CleaningTask,
  HomeProfile,
  ShoppingItem,
} from '@/types';
import { supabase } from '@/lib/supabase';

interface RpcResult {
  status: string;
  id?: string;
  client_id?: string;
  row_version?: number;
  household_id?: string;
  deleted_count?: number;
}

async function runRpc(
  name: string,
  params: Record<string, unknown>,
): Promise<RpcResult> {
  const { data, error } = await supabase.rpc(name, params);

  if (error) {
    throw error;
  }

  if (!data || typeof data !== 'object') {
    throw new Error(`Nieprawidłowa odpowiedź funkcji ${name}.`);
  }

  return data as RpcResult;
}

function taskToDatabase(task: CleaningTask) {
  return {
    title: task.title,
    description: null,
    room_id: task.roomId,
    frequency: task.frequency,
    custom_days: task.customDays,
    custom_rule: task.customRule ?? null,
    next_due_date: task.dueDate,
    last_done_date: task.lastDoneDate,
    previous_due_date: task.previousDueDate,
    minutes: task.minutes,
    is_active: task.enabled,
    library_id: task.libraryId,
    schedule_note: task.scheduleNote,
    assigned_to: task.assignedTo ?? null,
    source: task.source,
  };
}

export async function saveHouseholdTask(
  householdId: string,
  task: CleaningTask,
  expectedVersion: number | null,
): Promise<RpcResult> {
  return runRpc('save_household_task', {
    p_household_id: householdId,
    p_client_id: task.id,
    p_expected_version: expectedVersion,
    p_task: taskToDatabase(task),
  });
}

export async function deleteHouseholdTask(
  householdId: string,
  clientId: string,
  expectedVersion: number,
): Promise<RpcResult> {
  return runRpc('delete_household_task', {
    p_household_id: householdId,
    p_client_id: clientId,
    p_expected_version: expectedVersion,
  });
}

export async function saveShoppingItem(
  householdId: string,
  item: ShoppingItem,
  expectedVersion: number | null,
): Promise<RpcResult> {
  return runRpc('save_shopping_item', {
    p_household_id: householdId,
    p_client_id: item.id,
    p_expected_version: expectedVersion,
    p_item: {
      name: item.name,
      product_id: item.productId,
      bought: item.bought,
    },
  });
}

export async function deleteShoppingItem(
  householdId: string,
  clientId: string,
  expectedVersion: number,
): Promise<RpcResult> {
  return runRpc('delete_shopping_item', {
    p_household_id: householdId,
    p_client_id: clientId,
    p_expected_version: expectedVersion,
  });
}

export async function clearBoughtShoppingItems(
  householdId: string,
): Promise<RpcResult> {
  return runRpc('clear_bought_shopping_items', {
    p_household_id: householdId,
  });
}

export async function updateHouseholdSettings(
  householdId: string,
  expectedVersion: number,
  home: HomeProfile,
  excludedLibraryTaskIds: string[],
): Promise<RpcResult> {
  return runRpc('update_household_settings', {
    p_household_id: householdId,
    p_expected_version: expectedVersion,
    p_home_profile: home,
    p_excluded_library_task_ids: excludedLibraryTaskIds,
  });
}

export async function setTaskCompletion(params: {
  householdId: string;
  taskClientId: string;
  expectedVersion: number;
  historyClientId: string;
  completedDate: string;
  nextDueDate?: string | null;
  previousDueDate?: string | null;
  undo?: boolean;
}): Promise<RpcResult> {
  return runRpc('set_task_completion', {
    p_household_id: params.householdId,
    p_task_client_id: params.taskClientId,
    p_expected_version: params.expectedVersion,
    p_history_client_id: params.historyClientId,
    p_completed_date: params.completedDate,
    p_next_due_date: params.nextDueDate ?? null,
    p_previous_due_date: params.previousDueDate ?? null,
    p_undo: params.undo ?? false,
  });
}


export async function applyHouseholdPlan(
  householdId: string,
  expectedVersion: number,
  home: HomeProfile,
  excludedLibraryTaskIds: string[],
  tasks: CleaningTask[],
): Promise<RpcResult> {
  const planTasks = tasks.filter(
    (task) => task.source === 'plan',
  );

  return runRpc('apply_household_plan', {
    p_household_id: householdId,
    p_expected_version: expectedVersion,
    p_home_profile: home,
    p_excluded_library_task_ids: excludedLibraryTaskIds,
    p_tasks: planTasks.map((task) => ({
      client_id: task.id,
      title: task.title,
      room_id: task.roomId,
      frequency: task.frequency,
      custom_days: task.customDays,
      custom_rule: task.customRule ?? null,
      next_due_date: task.dueDate,
      last_done_date: task.lastDoneDate,
      previous_due_date: task.previousDueDate,
      minutes: task.minutes,
      is_active: task.enabled,
      library_id: task.libraryId,
      schedule_note: task.scheduleNote,
      assigned_to: task.assignedTo ?? null,
      source: task.source,
    })),
  });
}
