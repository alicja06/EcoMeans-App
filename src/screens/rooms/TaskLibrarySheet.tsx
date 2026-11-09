import { Check } from 'lucide-react';
import { findRoom } from '@/data/rooms';
import { TASK_LIBRARY } from '@/data/taskLibrary';
import { useAppStore } from '@/store/AppStoreContext';
import { useToast } from '@/store/ToastContext';
import { todayISO } from '@/lib/dates';
import { frequencyLabel } from '@/lib/tasks';
import { Sheet } from '@/components/ui/Sheet';
import { DemoNotice } from '@/components/ui/controls';

export function TaskLibrarySheet({ onClose }: { onClose: () => void }) {
  const { state, addTask } = useAppStore();
  const { showToast } = useToast();
  const today = todayISO();

  const isAdded = (libraryId: string, roomId: string, title: string) =>
    state.tasks.some((task) => task.libraryId === libraryId || (task.roomId === roomId && task.title === title));

  const groups = [
    { id: 'kitchen', name: 'Kuchnia', tasks: TASK_LIBRARY.filter((item) => item.id.startsWith('k-')) },
    { id: 'bathroom', name: 'Łazienka', tasks: TASK_LIBRARY.filter((item) => item.id.startsWith('b-')) },
    { id: 'appliances', name: 'Sprzęty AGD', tasks: TASK_LIBRARY.filter((item) => item.id.startsWith('a-')) },
    { id: 'other', name: 'Pozostałe pomieszczenia', tasks: TASK_LIBRARY.filter((item) => item.id.startsWith('o-')) },
  ];

  return (
    <Sheet title="Biblioteka czynności" onClose={onClose}>
      <div className="flex flex-col gap-6">
        <DemoNotice text="Częstotliwości i czasy są przykładowymi wartościami startowymi. Możesz je zmienić po dodaniu zadania." />
        {groups.map((group) => (
          <section key={group.id}>
            <h3 className="mb-2 text-sm font-bold text-ink-700">{group.name}</h3>
            <ul className="flex flex-col gap-2">
              {group.tasks.map((item) => {
                const added = isAdded(item.id, item.roomId, item.title);
                return (
                  <li key={item.id} className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-card">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-ink-900">{item.title}</p>
                      <p className="mt-0.5 text-xs text-ink-500">
                        {frequencyLabel(item.frequency, item.customDays, item.scheduleNote)} · ok. {item.minutes} min ·{' '}
                        {findRoom(item.roomId)?.name}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={added}
                      onClick={() => {
                        addTask({
                          roomId: item.roomId,
                          title: item.title,
                          frequency: item.frequency,
                          customDays: item.customDays,
                          startDate: today,
                          minutes: item.minutes,
                          libraryId: item.id,
                          scheduleNote: item.scheduleNote,
                        });
                        showToast(`Dodano: ${item.title}`);
                      }}
                      className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                        added ? 'bg-brand-50 text-brand-700' : 'bg-brand-600 text-white hover:bg-brand-700 active:scale-95'
                      }`}
                    >
                      {added && <Check size={14} strokeWidth={3} />}
                      {added ? 'Dodane' : 'Dodaj'}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </Sheet>
  );
}
