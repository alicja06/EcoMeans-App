import { useState } from 'react';
import type { CleaningTask } from '@/types';
import { useAppStore } from '@/store/AppStoreContext';
import { useNavigation } from '@/store/NavigationContext';
import { useToast } from '@/store/ToastContext';
import { todayISO } from '@/lib/dates';
import { horizonDates, planSubtitle } from '@/lib/schedule';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { WeekBoard } from '@/components/plan/WeekBoard';
import { TaskSettingsSheet } from '@/components/tasks/TaskSettingsSheet';

export function WeekPlanScreen() {
  const { state, toggleTaskDone } = useAppStore();
  const { goBack } = useNavigation();
  const { showToast } = useToast();
  const [selected, setSelected] = useState<CleaningTask | null>(null);
  const today = todayISO();
  const dates = horizonDates(today);
  const active = state.tasks.filter((task) => task.enabled);
  const upcoming = state.tasks
    .filter((task) => task.enabled && task.dueDate > dates[dates.length - 1])
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return (
    <>
      <ScreenHeader title="Twój tydzień" subtitle={planSubtitle(state.home, today)} onBack={goBack} />
      <div className="flex flex-col gap-5 px-5 pb-8 pt-2">
        <p className="text-sm leading-relaxed text-ink-600">
          Zadania są rozłożone według czasu, częstotliwości i tego, co masz w domu. Jeśli jakiś dzień nie wyjdzie, przesuń
          czynność albo pomiń ją tym razem.
        </p>
        {state.home.specialNeeds.trim() && (
          <p className="rounded-2xl bg-sand-50 px-4 py-3 text-sm leading-relaxed text-sand-800">
            W planie jest miejsce na to: {state.home.specialNeeds.trim()}
          </p>
        )}
        <WeekBoard
          tasks={active}
          home={state.home}
          today={today}
          dates={dates}
          history={state.history}
          interactive
          onToggle={(task, done) => {
            toggleTaskDone(task.id);
            showToast(done ? 'Cofnięto zaznaczenie' : 'Zrobione.');
          }}
          onOpen={(task) => setSelected(state.tasks.find((item) => item.id === task.id) ?? task)}
        />
        {upcoming.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-bold text-ink-700">Później, bez pośpiechu</h2>
            <ul className="flex flex-col gap-2">
              {upcoming.slice(0, 8).map((task) => (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(task)}
                    className="w-full rounded-2xl bg-white px-4 py-3 text-left shadow-card"
                  >
                    <span className="block text-sm font-semibold text-ink-900">{task.title}</span>
                    <span className="mt-0.5 block text-xs text-ink-500">{task.scheduleNote ?? 'Rzadsza czynność'}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
      {selected && <TaskSettingsSheet task={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
