import { useState, type FormEvent } from 'react';
import type { Frequency, RoomId } from '@/types';
import { TASK_SUGGESTIONS } from '@/data/initialState';
import { FREQUENCY_OPTIONS } from '@/lib/tasks';
import { todayISO } from '@/lib/dates';
import { useAppStore } from '@/store/AppStoreContext';
import { useToast } from '@/store/ToastContext';
import { Sheet } from '@/components/ui/Sheet';

interface AddTaskSheetProps {
  roomId: RoomId;
  onClose: () => void;
}

const INPUT_CLASS =
  'w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

export function AddTaskSheet({ roomId, onClose }: AddTaskSheetProps) {
  const { state, addTask } = useAppStore();
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('weekly');
  const [customInput, setCustomInput] = useState('7');
  const [minutes, setMinutes] = useState('15');
  const [error, setError] = useState<string | null>(null);

  const roomTitles = state.tasks.filter((task) => task.roomId === roomId).map((task) => task.title.toLowerCase());
  const suggestions = TASK_SUGGESTIONS.filter((suggestion) => !roomTitles.includes(suggestion.toLowerCase()));
  const trimmed = title.trim();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmed) {
      setError('Podaj nazwę zadania.');
      return;
    }
    if (roomTitles.includes(trimmed.toLowerCase())) {
      setError('Takie zadanie już jest w tym pomieszczeniu.');
      return;
    }
    let customDays: number | null = null;
    if (frequency === 'custom') {
      const days = Number(customInput);
      if (!Number.isInteger(days) || days < 1 || days > 365) {
        setError('Podaj liczbę dni od 1 do 365.');
        return;
      }
      customDays = days;
    }
    const parsedMinutes = Number(minutes);
    if (!Number.isInteger(parsedMinutes) || parsedMinutes < 1 || parsedMinutes > 240) {
      setError('Czas podaj w minutach, od 1 do 240.');
      return;
    }
    addTask({ roomId, title: trimmed, frequency, customDays, startDate: todayISO(), minutes: parsedMinutes });
    showToast(`Dodano: ${trimmed}`);
    onClose();
  };

  return (
    <Sheet
      title="Nowe zadanie"
      onClose={onClose}
      footer={
        <button
          type="submit"
          form="add-task-form"
          disabled={!trimmed}
          className="w-full rounded-2xl bg-brand-600 py-3.5 text-sm font-bold text-white shadow-card transition hover:bg-brand-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-ink-300"
        >
          Dodaj zadanie
        </button>
      }
    >
      <form id="add-task-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-ink-700">Nazwa zadania</span>
          <input
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setError(null);
            }}
            maxLength={80}
            placeholder="Np. Wyczyścić filtr okapu"
            className={INPUT_CLASS}
          />
        </label>

        {suggestions.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-ink-700">Podpowiedzi</span>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    setTitle(suggestion);
                    setError(null);
                  }}
                  className="rounded-full bg-ink-100 px-3 py-1.5 text-xs font-semibold text-ink-700 transition hover:bg-brand-50 hover:text-brand-700"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-ink-700">Szacowany czas (minuty)</span>
          <input
            type="number"
            min={1}
            max={240}
            value={minutes}
            onChange={(event) => {
              setMinutes(event.target.value);
              setError(null);
            }}
            className={INPUT_CLASS}
          />
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-ink-700">Jak często?</span>
          <div className="grid grid-cols-2 gap-2">
            {FREQUENCY_OPTIONS.map((option) => {
              const active = option.value === frequency;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFrequency(option.value)}
                  className={`rounded-2xl border px-3 py-3 text-left text-sm font-semibold transition ${
                    active ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          {frequency === 'custom' && (
            <label className="mt-2 flex items-center gap-3 text-sm text-ink-700">
              Co
              <input
                type="number"
                min={1}
                max={365}
                value={customInput}
                onChange={(event) => {
                  setCustomInput(event.target.value);
                  setError(null);
                }}
                className="w-24 rounded-2xl border border-ink-200 bg-white px-3 py-2.5 text-center text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
              dni
            </label>
          )}
        </div>

        {error && (
          <p role="alert" className="rounded-2xl bg-danger-50 px-4 py-3 text-sm text-danger-700">
            {error}
          </p>
        )}
      </form>
    </Sheet>
  );
}
