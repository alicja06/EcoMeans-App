import { useState } from 'react';
import type {
  CleaningTask,
  CustomFrequencyRule,
  Frequency,
  RoomId,
} from '@/types';
import { ROOMS } from '@/data/rooms';
import { FREQUENCY_OPTIONS, frequencyLabel } from '@/lib/tasks';
import { useAppStore } from '@/store/AppStoreContext';
import { useToast } from '@/store/ToastContext';
import { todayISO } from '@/lib/dates';
import { Sheet } from '@/components/ui/Sheet';

const INPUT_CLASS =
  'w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

const WEEKDAYS = [
  { value: 0, label: 'Nd', full: 'Niedziela' },
  { value: 1, label: 'Pn', full: 'Poniedziałek' },
  { value: 2, label: 'Wt', full: 'Wtorek' },
  { value: 3, label: 'Śr', full: 'Środa' },
  { value: 4, label: 'Cz', full: 'Czwartek' },
  { value: 5, label: 'Pt', full: 'Piątek' },
  { value: 6, label: 'Sb', full: 'Sobota' },
] as const;

const ORDINAL_OPTIONS = [
  { value: 1, label: 'Pierwszy' },
  { value: 2, label: 'Drugi' },
  { value: 3, label: 'Trzeci' },
  { value: 4, label: 'Czwarty' },
  { value: -1, label: 'Ostatni' },
] as const;

function getInitialCustomRule(task: CleaningTask): CustomFrequencyRule {
  if (task.customRule) {
    return task.customRule;
  }

  return {
    unit: 'days',
    interval: task.customDays ?? 7,
  };
}

export function TaskSettingsSheet({
  task,
  onClose,
}: {
  task: CleaningTask;
  onClose: () => void;
}) {
  const {
    updateTask,
    updateTaskDueDate,
    skipTask,
    postponeTask,
    deleteTask,
  } = useAppStore();

  const { showToast } = useToast();

  const [title, setTitle] = useState(task.title);
  const [roomId, setRoomId] = useState<RoomId>(task.roomId);
  const [minutes, setMinutes] = useState(String(task.minutes));
  const [frequency, setFrequency] = useState<Frequency>(task.frequency);
  const [customRuleDraft, setCustomRuleDraft] = useState<CustomFrequencyRule>(
    getInitialCustomRule(task),
  );
  const [dueDate, setDueDate] = useState(task.dueDate);
  const [error, setError] = useState<string | null>(null);

  const updateCustomInterval = (value: number) => {
    setCustomRuleDraft((current) => ({
      ...current,
      interval: value,
    }));
  };

  const toggleCustomWeekday = (weekday: number) => {
    setCustomRuleDraft((current) => {
      if (current.unit !== 'weeks') return current;

      const selected = current.weekdays.includes(weekday);

      return {
        ...current,
        weekdays: selected
          ? current.weekdays.filter((day) => day !== weekday)
          : [...current.weekdays, weekday].sort((a, b) => a - b),
      };
    });
  };

  const changeCustomUnit = (unit: CustomFrequencyRule['unit']) => {
    setError(null);

    setCustomRuleDraft((current) => {
      if (current.unit === unit) return current;

      if (unit === 'days') {
        return {
          unit: 'days',
          interval: current.interval,
        };
      }

      if (unit === 'weeks') {
        return {
          unit: 'weeks',
          interval: current.interval,
          weekdays: [1],
        };
      }

      return {
        unit: 'months',
        interval: current.interval,
        monthlyPattern: {
          type: 'dayOfMonth',
          day: 1,
        },
      };
    });
  };

  const saveDetails = () => {
    const trimmed = title.trim();
    const parsedMinutes = Number(minutes);

    if (!trimmed) {
      setError('Podaj nazwę czynności.');
      return false;
    }

    if (
      !Number.isInteger(parsedMinutes) ||
      parsedMinutes < 1 ||
      parsedMinutes > 240
    ) {
      setError('Czas podaj w minutach, od 1 do 240.');
      return false;
    }

    let nextCustomDays: number | null = null;
    let nextCustomRule: CustomFrequencyRule | null = null;

    if (frequency === 'custom') {
      const interval = customRuleDraft.interval;

      if (!Number.isInteger(interval) || interval < 1) {
        setError('Podaj prawidłowy odstęp między powtórzeniami.');
        return false;
      }

      if (customRuleDraft.unit === 'days') {
        if (interval > 365) {
          setError('Odstęp w dniach może wynosić od 1 do 365.');
          return false;
        }

        nextCustomDays = interval;
        nextCustomRule = customRuleDraft;
      }

      if (customRuleDraft.unit === 'weeks') {
        if (interval > 52) {
          setError('Odstęp w tygodniach może wynosić od 1 do 52.');
          return false;
        }

        if (customRuleDraft.weekdays.length === 0) {
          setError('Wybierz przynajmniej jeden dzień tygodnia.');
          return false;
        }

        nextCustomRule = customRuleDraft;
      }

      if (customRuleDraft.unit === 'months') {
        if (interval > 24) {
          setError('Odstęp w miesiącach może wynosić od 1 do 24.');
          return false;
        }

        const pattern = customRuleDraft.monthlyPattern;

        if (
          pattern.type === 'dayOfMonth' &&
          (!Number.isInteger(pattern.day) ||
            pattern.day < 1 ||
            pattern.day > 31)
        ) {
          setError('Dzień miesiąca musi być liczbą od 1 do 31.');
          return false;
        }

        nextCustomRule = customRuleDraft;
      }
    }

    const previousRule = task.customRule ?? null;

    const ruleChanged =
      JSON.stringify(previousRule) !== JSON.stringify(nextCustomRule);

    const frequencyChanged =
      frequency !== task.frequency ||
      nextCustomDays !== task.customDays ||
      ruleChanged;

    updateTask(task.id, {
      title: trimmed,
      roomId,
      minutes: parsedMinutes,
      frequency,
      customDays: nextCustomDays,
      customRule: nextCustomRule,
      scheduleNote: frequencyChanged ? null : task.scheduleNote,
    });

    if (dueDate && dueDate !== task.dueDate) {
      updateTaskDueDate(task.id, dueDate);
    }

    return true;
  };

  const currentCustomUnit = customRuleDraft.unit;

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
          Możesz przesunąć termin, odłożyć czynność, pominąć ją tym razem albo
          zmienić częstotliwość. Brak wykonania niczego nie psuje.
        </p>

        <p className="text-xs font-semibold text-ink-500">
          Teraz:{' '}
          {frequencyLabel(
            task.frequency,
            task.customDays,
            task.scheduleNote,
            task.customRule,
          )}
        </p>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-ink-700">Nazwa</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={80}
            className={INPUT_CLASS}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-ink-700">
            Pomieszczenie
          </span>
          <select
            value={roomId}
            onChange={(event) => setRoomId(event.target.value as RoomId)}
            className={INPUT_CLASS}
          >
            {ROOMS.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-ink-700">
            Szacowany czas (minuty)
          </span>
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
          <input
            type="date"
            value={dueDate}
            min={todayISO()}
            onChange={(event) => setDueDate(event.target.value)}
            className={INPUT_CLASS}
          />
        </label>

        <div className="flex flex-col gap-3">
          <span className="text-sm font-semibold text-ink-700">
            Częstotliwość
          </span>

          <div className="grid grid-cols-2 gap-2">
            {FREQUENCY_OPTIONS.map((option) => {
              const active = option.value === frequency;

              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setFrequency(option.value);
                    setError(null);
                  }}
                  className={`rounded-2xl border px-3 py-3 text-left text-sm font-semibold transition ${
                    active
                      ? 'border-brand-600 bg-brand-50 text-brand-800'
                      : 'border-ink-200 bg-white text-ink-700'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          {frequency === 'custom' && (
            <div className="flex flex-col gap-4 rounded-2xl border border-brand-200 bg-brand-50/50 p-4">
              <div>
                <p className="text-sm font-bold text-ink-800">
                  Ustaw własną częstotliwość
                </p>
                <p className="mt-1 text-xs leading-relaxed text-ink-600">
                  Wybierz odstęp i określ, kiedy czynność ma się powtarzać.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { value: 'days', label: 'Dni' },
                    { value: 'weeks', label: 'Tygodnie' },
                    { value: 'months', label: 'Miesiące' },
                  ] as const
                ).map((unit) => {
                  const active = currentCustomUnit === unit.value;

                  return (
                    <button
                      key={unit.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => changeCustomUnit(unit.value)}
                      className={`rounded-xl border px-2 py-2.5 text-sm font-semibold transition ${
                        active
                          ? 'border-brand-600 bg-brand-600 text-white'
                          : 'border-ink-200 bg-white text-ink-700'
                      }`}
                    >
                      {unit.label}
                    </button>
                  );
                })}
              </div>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-ink-700">
                  Powtarzaj co
                </span>

                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={
                      currentCustomUnit === 'days'
                        ? 365
                        : currentCustomUnit === 'weeks'
                          ? 52
                          : 24
                    }
                    value={customRuleDraft.interval}
                    onChange={(event) =>
                      updateCustomInterval(Number(event.target.value))
                    }
                    className="w-24 rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-center text-ink-900 outline-none focus:border-brand-500"
                  />

                  <span className="text-sm text-ink-700">
                    {currentCustomUnit === 'days'
                      ? 'dni'
                      : currentCustomUnit === 'weeks'
                        ? 'tygodni'
                        : 'miesięcy'}
                  </span>
                </div>
              </label>

              {customRuleDraft.unit === 'weeks' && (
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-ink-700">
                    W które dni tygodnia?
                  </span>

                  <div className="grid grid-cols-7 gap-1.5">
                    {WEEKDAYS.map((day) => {
                      const active =
                        customRuleDraft.weekdays.includes(day.value);

                      return (
                        <button
                          key={day.value}
                          type="button"
                          aria-label={day.full}
                          aria-pressed={active}
                          onClick={() => toggleCustomWeekday(day.value)}
                          className={`rounded-xl border py-2 text-xs font-bold transition ${
                            active
                              ? 'border-brand-600 bg-brand-600 text-white'
                              : 'border-ink-200 bg-white text-ink-700'
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-xs text-ink-500">
                    Możesz zaznaczyć kilka dni.
                  </p>
                </div>
              )}

              {customRuleDraft.unit === 'months' && (
                <div className="flex flex-col gap-3">
                  <span className="text-sm font-semibold text-ink-700">
                    Kiedy w miesiącu?
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      aria-pressed={
                        customRuleDraft.monthlyPattern.type === 'dayOfMonth'
                      }
                      onClick={() =>
                        setCustomRuleDraft((current) => ({
                          unit: 'months',
                          interval: current.interval,
                          monthlyPattern: {
                            type: 'dayOfMonth',
                            day:
                              current.unit === 'months' &&
                              current.monthlyPattern.type === 'dayOfMonth'
                                ? current.monthlyPattern.day
                                : 1,
                          },
                        }))
                      }
                      className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                        customRuleDraft.monthlyPattern.type === 'dayOfMonth'
                          ? 'border-brand-600 bg-brand-600 text-white'
                          : 'border-ink-200 bg-white text-ink-700'
                      }`}
                    >
                      Dzień miesiąca
                    </button>

                    <button
                      type="button"
                      aria-pressed={
                        customRuleDraft.monthlyPattern.type ===
                        'weekdayOrdinal'
                      }
                      onClick={() =>
                        setCustomRuleDraft((current) => ({
                          unit: 'months',
                          interval: current.interval,
                          monthlyPattern: {
                            type: 'weekdayOrdinal',
                            ordinal: 1,
                            weekday: 1,
                          },
                        }))
                      }
                      className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                        customRuleDraft.monthlyPattern.type ===
                        'weekdayOrdinal'
                          ? 'border-brand-600 bg-brand-600 text-white'
                          : 'border-ink-200 bg-white text-ink-700'
                      }`}
                    >
                      Dzień tygodnia
                    </button>
                  </div>

                  {customRuleDraft.monthlyPattern.type === 'dayOfMonth' ? (
                    <label className="flex items-center gap-3 text-sm text-ink-700">
                      Dnia
                      <input
                        type="number"
                        min={1}
                        max={31}
                        value={customRuleDraft.monthlyPattern.day}
                        onChange={(event) => {
                          const day = Number(event.target.value);

                          setCustomRuleDraft((current) => {
                            if (
                              current.unit !== 'months' ||
                              current.monthlyPattern.type !== 'dayOfMonth'
                            ) {
                              return current;
                            }

                            return {
                              ...current,
                              monthlyPattern: {
                                type: 'dayOfMonth',
                                day,
                              },
                            };
                          });
                        }}
                        className="w-20 rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-center text-ink-900 outline-none focus:border-brand-500"
                      />
                      <span>każdego miesiąca</span>
                    </label>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <label className="flex flex-col gap-2">
                        <span className="text-sm text-ink-700">
                          Który tydzień?
                        </span>
                        <select
                          value={customRuleDraft.monthlyPattern.ordinal}
                          onChange={(event) => {
                            const ordinal = Number(
                              event.target.value,
                            ) as 1 | 2 | 3 | 4 | -1;

                            setCustomRuleDraft((current) => {
                              if (
                                current.unit !== 'months' ||
                                current.monthlyPattern.type !==
                                  'weekdayOrdinal'
                              ) {
                                return current;
                              }

                              return {
                                ...current,
                                monthlyPattern: {
                                  ...current.monthlyPattern,
                                  ordinal,
                                },
                              };
                            });
                          }}
                          className={INPUT_CLASS}
                        >
                          {ORDINAL_OPTIONS.map((option) => (
                            <option
                              key={option.value}
                              value={option.value}
                            >
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="flex flex-col gap-2">
                        <span className="text-sm text-ink-700">
                          Dzień tygodnia
                        </span>
                        <select
                          value={customRuleDraft.monthlyPattern.weekday}
                          onChange={(event) => {
                            const weekday = Number(event.target.value);

                            setCustomRuleDraft((current) => {
                              if (
                                current.unit !== 'months' ||
                                current.monthlyPattern.type !==
                                  'weekdayOrdinal'
                              ) {
                                return current;
                              }

                              return {
                                ...current,
                                monthlyPattern: {
                                  ...current.monthlyPattern,
                                  weekday,
                                },
                              };
                            });
                          }}
                          className={INPUT_CLASS}
                        >
                          {WEEKDAYS.map((day) => (
                            <option key={day.value} value={day.value}>
                              {day.full}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>
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
              showToast(
                task.enabled ? 'Czynność wyłączona' : 'Czynność włączona',
              );
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
          <p
            role="alert"
            className="rounded-2xl bg-danger-50 px-4 py-3 text-sm text-danger-700"
          >
            {error}
          </p>
        )}
      </div>
    </Sheet>
  );
}