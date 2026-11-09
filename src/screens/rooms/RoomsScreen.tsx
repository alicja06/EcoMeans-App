import { useState } from 'react';
import { ListPlus, Plus } from 'lucide-react';
import { ROOMS } from '@/data/rooms';
import { ROOM_ICONS } from '@/components/icons/categoryIcons';
import { useAppStore } from '@/store/AppStoreContext';
import { useNavigation } from '@/store/NavigationContext';
import { todayISO } from '@/lib/dates';
import { isScheduledOn, resolveCalendar } from '@/lib/schedule';
import { isDoneToday, taskCountLabel } from '@/lib/tasks';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { EmptyState } from '@/components/ui/controls';
import { TaskLibrarySheet } from '@/screens/rooms/TaskLibrarySheet';

export function RoomsScreen() {
  const { state, updateHome } = useAppStore();
  const { navigate } = useNavigation();
  const [libraryOpen, setLibraryOpen] = useState(false);
  const today = todayISO();
  const calendar = resolveCalendar(state.home);
  const visibleRooms = ROOMS.filter((room) => {
    if (!state.home.onboardingComplete || state.home.places.length === 0) return true;
    return state.home.places.includes(room.id) || state.tasks.some((task) => task.roomId === room.id);
  });

  return (
    <>
      <ScreenHeader
        title="Mój dom"
        subtitle="Wybierz pomieszczenie"
        actions={
          <button
            type="button"
            onClick={() => setLibraryOpen(true)}
            aria-label="Biblioteka czynności"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-600 text-white shadow-card transition active:scale-95"
          >
            <ListPlus size={20} />
          </button>
        }
      />
      <div className="grid grid-cols-2 gap-3 px-5 pt-2">
        {visibleRooms.map((room) => {
          const Icon = ROOM_ICONS[room.id];
          const tasks = state.tasks.filter((task) => task.roomId === room.id && task.enabled);
          const dueCount = tasks.filter((task) => isScheduledOn(task, today, calendar) && !isDoneToday(task, today)).length;
          return (
            <button
              key={room.id}
              type="button"
              onClick={() => navigate({ name: 'room', roomId: room.id })}
              className="flex flex-col gap-4 rounded-3xl bg-white p-4 text-left shadow-card transition active:scale-[0.97]"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sage-100 text-sage-700">
                <Icon size={24} />
              </span>
              <div>
                <p className="font-bold text-ink-900">{room.name}</p>
                <p className="mt-0.5 text-xs text-ink-500">
                  {taskCountLabel(tasks.length)}
                  {dueCount > 0 && <span className="font-semibold text-brand-700"> · {dueCount} na dziś</span>}
                </p>
              </div>
            </button>
          );
        })}
      </div>
      <div className="px-5 pt-6">
        <EmptyState
          icon={Plus}
          title="Dodawaj zadania z biblioteki"
          text="Wybierz gotowe czynności jednym kliknięciem albo dodaj własne w wybranym pomieszczeniu."
        />
        <button
          type="button"
          onClick={() => updateHome({ onboardingComplete: false })}
          className="mt-4 w-full rounded-2xl py-3 text-sm font-semibold text-brand-700"
        >
          Zmień opis domu i ułóż plan od nowa
        </button>
      </div>
      {libraryOpen && <TaskLibrarySheet onClose={() => setLibraryOpen(false)} />}
    </>
  );
}
