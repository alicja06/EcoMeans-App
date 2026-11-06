import { useState } from 'react';
import { ListPlus, Plus, Trash2 } from 'lucide-react';
import { findRoom } from '@/data/rooms';
import { ROOM_ICONS } from '@/components/icons/categoryIcons';
import { useAppStore } from '@/store/AppStoreContext';
import { useToast } from '@/store/ToastContext';
import { useNavigation } from '@/store/NavigationContext';
import { todayISO } from '@/lib/dates';
import { compareByDueDate, isDoneToday } from '@/lib/tasks';
import type { RoomId } from '@/types';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { EmptyState } from '@/components/ui/controls';
import { TaskRow } from '@/components/tasks/TaskRow';
import { AddTaskSheet } from '@/screens/rooms/AddTaskSheet';

export function RoomDetailScreen({ roomId }: { roomId: RoomId }) {
  const { state, toggleTaskDone, deleteTask } = useAppStore();
  const { goBack } = useNavigation();
  const { showToast } = useToast();
  const [adding, setAdding] = useState(false);
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
  const tasks = state.tasks.filter((task) => task.roomId === roomId).sort(compareByDueDate);
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
                      onClick={() => {
                        deleteTask(task.id);
                        showToast('Usunięto zadanie');
                      }}
                      aria-label={`Usuń zadanie: ${task.title}`}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-400 transition hover:bg-danger-50 hover:text-danger-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  }
                />
              );
            })}
          </ul>
        )}
      </div>

      {adding && <AddTaskSheet roomId={roomId} onClose={() => setAdding(false)} />}
    </>
  );
}
