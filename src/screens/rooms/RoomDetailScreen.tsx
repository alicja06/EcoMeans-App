import { useState } from 'react';
import { ListPlus, Plus, SlidersHorizontal } from 'lucide-react';
import type { CleaningTask, RoomId } from '@/types';
import { findRoom } from '@/data/rooms';
import { ROOM_ICONS } from '@/components/icons/categoryIcons';
import { useAppStore } from '@/store/AppStoreContext';
import { useToast } from '@/store/ToastContext';
import { useNavigation } from '@/store/NavigationContext';
import { todayISO } from '@/lib/dates';
import { compareByDueDate, isDoneToday } from '@/lib/tasks';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { EmptyState } from '@/components/ui/controls';
import { TaskRow } from '@/components/tasks/TaskRow';
import { AddTaskSheet } from '@/screens/rooms/AddTaskSheet';
import { TaskSettingsSheet } from '@/components/tasks/TaskSettingsSheet';

export function RoomDetailScreen({ roomId }: { roomId: RoomId }) {
  const { state, toggleTaskDone } = useAppStore();
  const { goBack } = useNavigation();
  const { showToast } = useToast();
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<CleaningTask | null>(null);
  const today = todayISO();
  const room = findRoom(roomId);

  if (!room) {
    return (
      <>
        <ScreenHeader title="Pomieszczenie" onBack={goBack} />
        <div className="px-5 pt-2">
          <EmptyState icon={ListPlus} title="Nie znaleziono pomieszczenia" text="Wróć do listy i wybierz pomieszczenie ponownie." />
        </div>
      </>
    );
  }

  const Icon = ROOM_ICONS[roomId];
  const tasks = state.tasks.filter((task) => task.roomId === roomId && task.enabled).sort(compareByDueDate);
  const paused = state.tasks.filter((task) => task.roomId === roomId && !task.enabled);
  const doneCount = tasks.filter((task) => isDoneToday(task, today)).length;

  return (
    <>
      <ScreenHeader title={room.name} subtitle={`${doneCount} z ${tasks.length} zrobione dziś`} onBack={goBack} />

      <div className="flex flex-col gap-5 px-5 pt-2">
        <div className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-card">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sage-100 text-sage-700">
            <Icon size={24} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-ink-900">Zadania w pomieszczeniu</p>
            <p className="text-xs text-ink-500">Zaznacz, gdy coś zrobisz. Brak wykonania nikogo nie karze.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex items-center justify-center gap-2 rounded-2xl bg-brand-600 py-3.5 text-sm font-bold text-white shadow-card transition hover:bg-brand-700 active:scale-[0.98]"
        >
          <Plus size={18} />
          Dodaj zadanie
        </button>

        {tasks.length === 0 ? (
          <EmptyState
            icon={ListPlus}
            title="Brak zadań w tym pomieszczeniu"
            text="Dodaj własne zadanie albo wybierz gotowe z biblioteki na ekranie Mój dom."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {tasks.map((task) => {
              const done = isDoneToday(task, today);
              return (
                <TaskRow
                  key={task.id}
                  task={task}
                  today={today}
                  done={done}
                  onToggle={() => {
                    toggleTaskDone(task.id);
                    showToast(done ? 'Cofnięto zaznaczenie' : 'Zrobione. Dobra robota!');
                  }}
                  trailing={
                    <button
                      type="button"
                      onClick={() => setSelected(task)}
                      aria-label={`Ustawienia: ${task.title}`}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
                    >
                      <SlidersHorizontal size={16} />
                    </button>
                  }
                />
              );
            })}
          </ul>
        )}

        {paused.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-bold text-ink-700">Wyłączone</h2>
            <ul className="flex flex-col gap-2">
              {paused.map((task) => (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(task)}
                    className="w-full rounded-2xl bg-white px-4 py-3 text-left text-sm font-semibold text-ink-500 shadow-card"
                  >
                    {task.title}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {adding && <AddTaskSheet roomId={roomId} onClose={() => setAdding(false)} />}
      {selected && <TaskSettingsSheet task={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
