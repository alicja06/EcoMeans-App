import { SlidersHorizontal } from 'lucide-react';
import type { CleaningTask, HistoryEntry, HomeProfile } from '@/types';
import { formatWeekdayName } from '@/lib/dates';
import { dayHeadline, dayKind, daySupport, resolveCalendar, tasksForDay } from '@/lib/schedule';
import { TaskRow } from '@/components/tasks/TaskRow';

interface WeekBoardProps {
  tasks: CleaningTask[];
  home: HomeProfile;
  today: string;
  dates: string[];
  history?: HistoryEntry[];
  interactive?: boolean;
  onToggle?: (task: CleaningTask, done: boolean) => void;
  onOpen?: (task: CleaningTask) => void;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function WeekBoard({ tasks, home, today, dates, history = [], interactive = false, onToggle, onOpen }: WeekBoardProps) {
  const calendar = resolveCalendar(home);

  return (
    <div className="flex flex-col gap-3">
      {dates.map((date) => {
        const kind = dayKind(date, calendar);
        const doneIds = new Set(history.filter((entry) => entry.doneDate === date).map((entry) => entry.taskId));
        const dayTasks = tasksForDay(tasks, date, today, calendar, doneIds);
        const minutes = dayTasks.reduce((sum, task) => sum + (doneIds.has(task.id) ? 0 : task.minutes), 0);
        const support = daySupport(kind, dayTasks.length);
        const isToday = date === today;
        const isPast = date < today;

        return (
          <section key={date} className="rounded-3xl bg-white p-4 shadow-card">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-bold text-ink-900">
                {capitalize(formatWeekdayName(date))}
                {isToday ? ' · dziś' : ''}
              </h3>
              <p className="text-sm font-semibold text-brand-700">{dayHeadline(kind, minutes, calendar.flexible)}</p>
            </div>
            {support && dayTasks.length === 0 && <p className="mt-2 text-sm leading-relaxed text-ink-500">{support}</p>}
            {dayTasks.length > 0 && (
              <ul className="mt-3 flex flex-col gap-2">
                {dayTasks.map((task) => {
                  const done = doneIds.has(task.id) || task.lastDoneDate === date;
                  const canToggle = interactive && isToday && !isPast;
                  return (
                    <TaskRow
                      key={task.id}
                      task={task}
                      today={today}
                      done={done}
                      whenLabel={done ? 'Zrobione' : isToday ? 'Na dziś' : isPast ? 'Można wrócić do tego później' : 'Zaplanowane'}
                      onToggle={canToggle && onToggle ? () => onToggle(task, done) : undefined}
                      trailing={
                        interactive && onOpen ? (
                          <button
                            type="button"
                            onClick={() => onOpen(task)}
                            aria-label={`Ustawienia: ${task.title}`}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
                          >
                            <SlidersHorizontal size={16} />
                          </button>
                        ) : undefined
                      }
                    />
                  );
                })}
              </ul>
            )}
            {support && dayTasks.length > 0 && kind === 'rest' && (
              <p className="mt-3 text-xs leading-relaxed text-ink-500">{support}</p>
            )}
          </section>
        );
      })}
    </div>
  );
}
