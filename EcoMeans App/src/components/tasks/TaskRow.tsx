import type { ReactNode } from 'react';
import type { CleaningTask } from '@/types';
import { Check } from 'lucide-react';
import { findRoom } from '@/data/rooms';
import { dueLabel } from '@/lib/tasks';

interface TaskRowProps {
  task: CleaningTask;
  today: string;
  done: boolean;
  onToggle?: () => void;
  trailing?: ReactNode;
  whenLabel?: string;
}

export function TaskRow({ task, today, done, onToggle, trailing, whenLabel }: TaskRowProps) {
  const room = findRoom(task.roomId);
  const when = whenLabel ?? dueLabel(task.dueDate, today);
  const details = [room?.name, task.minutes ? `ok. ${task.minutes} min` : null, when].filter(Boolean).join(' · ');

  return (
    <li className={`flex items-center gap-4 rounded-2xl bg-white p-4 shadow-card ${task.enabled ? '' : 'opacity-60'}`}>
      <button
        type="button"
        onClick={onToggle}
        disabled={!onToggle}
        aria-label={done ? `Cofnij: ${task.title}` : `Oznacz jako wykonane: ${task.title}`}
        aria-pressed={done}
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 active:scale-90 disabled:cursor-default ${
          done ? 'border-brand-600 bg-brand-600 text-white animate-pop' : 'border-ink-300 bg-white text-transparent hover:border-brand-500'
        }`}
      >
        <Check size={16} strokeWidth={3} />
      </button>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-[15px] font-semibold ${done ? 'text-ink-400 line-through' : 'text-ink-900'}`}>
          {task.title}
        </p>
        <p className="mt-0.5 truncate text-xs text-ink-500">{details}</p>
      </div>
      {trailing}
    </li>
  );
}
