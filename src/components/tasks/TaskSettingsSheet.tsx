import { useState } from 'react';
import type { CleaningTask, Frequency, RoomId } from '@/types';
import { ROOMS } from '@/data/rooms';
import { FREQUENCY_OPTIONS, frequencyLabel } from '@/lib/tasks';
import { useAppStore } from '@/store/AppStoreContext';
import { useToast } from '@/store/ToastContext';
import { todayISO } from '@/lib/dates';
import { Sheet } from '@/components/ui/Sheet';

const INPUT_CLASS =
  'w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

export function TaskSettingsSheet({ task, onClose }: { task: CleaningTask; onClose: () => void }) {
  const { updateTask, updateTaskDueDate, skipTask, postponeTask, deleteTask } = useAppStore();
  const { showToast } = useToast();
  const [title, setTitle] = useState(task.title);
  const [roomId, setRoomId] = useState<RoomId>(task.roomId);
  const [minutes, setMinutes] = useState(String(task.minutes));
  const [frequency, setFrequency] = useState<Frequency>(task.frequency);
  const [customDays, setCustomDays] = useState(String(task.customDays ?? 7));
  const [dueDate, setDueDate] = useState(task.dueDate);
  const [error, setError] = useState<string | null>(null);

  const saveDetails = () => {
    const trimmed = title.trim();
    const parsedMinutes = Number(minutes);
    if (!trimmed) {
      setError('Podaj nazwę czynności.');
      return false;
    }
    if (!Number.isInteger(parsedMinutes) || parsedMinutes < 1 || parsedMinutes > 240) {
      setError('Czas podaj w minutach, od 1 do 240.');
      return false;
    }
    let nextCustom: number | null = null;
    if (frequency === 'custom') {
      const days = Number(customDays);
      if (!Number.isInteger(days) || days < 1 || days > 365) {
        setError('Własną częstotliwość podaj jako liczbę dni od 1 do 365.');
        return false;
      }
      nextCustom = days;
    }
    updateTask(task.id, {
      title: trimmed,
      roomId,
      minutes: parsedMinutes,
      frequency,
      customDays: nextCustom,
      scheduleNote: frequency === task.frequency && nextCustom === task.customDays ? task.scheduleNote : null,
    });
    if (dueDate && dueDate !== task.dueDate) updateTaskDueDate(task.id, dueDate);
    return true;
  };

  return (
    <Sheet
      title="Ustawienia czynności"
      onClose={onClose}
      footer={
        <button
          type="button"
          onClick={() => {
            if (!saveDetails()) return;
            showToast('Zapisano ustawienia');
            onClose();
          }}
          className="w-full rounded-2xl bg-brand-600 py-3.5 text-sm font-bold text-white shadow-card transition hover:bg-brand-700 active:scale-[0.98]"
        >
          Zapisz zmiany
        </button>
      }
    >
      <div className="flex flex-col gap-5">
        <p className="text-sm leading-relaxed text-ink-600">
          Możesz przesunąć termin, odłożyć czynność, pominąć ją tym razem albo zmienić częstotliwość. Brak wykonania niczego nie
          psuje.
        </p>
        <p className="text-xs font-semibold text-ink-500">
          Teraz: {frequencyLabel(task.frequency, task.customDays, task.scheduleNote)}
        </p>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-ink-700">Nazwa</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={80} className={INPUT_CLASS} />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-ink-700">Pomieszczenie</span>
          <select value={roomId} onChange={(event) => setRoomId(event.target.value as RoomId)} className={INPUT_CLASS}>
            {ROOMS.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-ink-700">Szacowany czas (minuty)</span>
          <input
            type="number"
            min={1}
            max={240}
            value={minutes}
            onChange={(event) => setMinutes(event.target.value)}
            className={INPUT_CLASS}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-ink-700">Termin</span>
          <input type="date" value={dueDate} min={todayISO()} onChange={(event) => setDueDate(event.target.value)} className={INPUT_CLASS} />
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-ink-700">Częstotliwość</span>
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
                    active ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-ink-200 bg-white text-ink-700'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          {frequency === 'custom' && (
            <label className="mt-1 flex items-center gap-3 text-sm text-ink-700">
              Co
              <input
                type="number"
                min={1}
                max={365}
                value={customDays}
                onChange={(event) => setCustomDays(event.target.value)}
                className="w-24 rounded-2xl border border-ink-200 bg-white px-3 py-2.5 text-center text-ink-900 outline-none focus:border-brand-500"
              />
              dni
            </label>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2">
          <button
            type="button"
            onClick={() => {
              postponeTask(task.id);
              showToast('Przeniesione na jutro');
              onClose();
            }}
            className="rounded-2xl bg-ink-100 px-4 py-3 text-left text-sm font-semibold text-ink-800"
          >
            Zrób później, jutro
          </button>
          <button
            type="button"
            onClick={() => {
              skipTask(task.id);
              showToast('Pominięte tym razem');
              onClose();
            }}
            className="rounded-2xl bg-ink-100 px-4 py-3 text-left text-sm font-semibold text-ink-800"
          >
            Pomiń tym razem
          </button>
          <button
            type="button"
            onClick={() => {
              updateTask(task.id, { enabled: !task.enabled });
              showToast(task.enabled ? 'Czynność wyłączona' : 'Czynność włączona');
              onClose();
            }}
            className="rounded-2xl bg-ink-100 px-4 py-3 text-left text-sm font-semibold text-ink-800"
          >
            {task.enabled ? 'Wyłącz na razie' : 'Włącz z powrotem'}
          </button>
          <button
            type="button"
            onClick={() => {
              deleteTask(task.id);
              showToast('Usunięto czynność');
              onClose();
            }}
            className="rounded-2xl bg-danger-50 px-4 py-3 text-left text-sm font-semibold text-danger-700"
          >
            Usuń czynność
          </button>
        </div>

        {error && (
          <p role="alert" className="rounded-2xl bg-danger-50 px-4 py-3 text-sm text-danger-700">
            {error}
          </p>
        )}
      </div>
    </Sheet>
  );
}
