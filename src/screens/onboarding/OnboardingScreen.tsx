import { useEffect, useState } from 'react';
import type { ApplianceId, CleaningTask, DayPart, HomeProfile, HouseholdSize, RoomId, ScheduleStyle, TimeBudget } from '@/types';
import {
  APPLIANCE_OPTIONS,
  DAY_PART_OPTIONS,
  HOUSEHOLD_OPTIONS,
  STYLE_OPTIONS,
  TIME_BUDGET_OPTIONS,
} from '@/data/home';
import { ROOMS } from '@/data/rooms';
import { useAppStore } from '@/store/AppStoreContext';
import { todayISO } from '@/lib/dates';
import { createId } from '@/lib/ids';
import { TASK_LIBRARY } from '@/data/taskLibrary';
import { buildSuggestedTasks } from '@/lib/schedule';

const STAGES = [1, 1, 2, 3, 4, 5];

const CLEANING_DAY_OPTIONS = [
  { id: 1, label: 'Pon' },
  { id: 2, label: 'Wt' },
  { id: 3, label: 'Śr' },
  { id: 4, label: 'Czw' },
  { id: 5, label: 'Pt' },
  { id: 6, label: 'Sob' },
  { id: 0, label: 'Niedz' },
];

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Codziennie' },
  { value: '2days', label: 'Co 2 dni' },
  { value: '3days', label: 'Co 3 dni' },
  { value: 'weekly', label: 'Co tydzień' },
  { value: 'biweekly', label: 'Co 2 tygodnie' },
  { value: 'monthly', label: 'Co miesiąc' },
  { value: 'quarterly', label: 'Co 3 miesiące' },
];

function getFrequencyValue(task: CleaningTask): string {
  if (task.frequency === 'custom') {
    if (task.customDays === 2) return '2days';
    if (task.customDays === 3) return '3days';
  }

  return task.frequency;
}

function getTaskGroup(task: CleaningTask): 'daily' | 'regular' | 'periodic' {
  if (task.frequency === 'daily') return 'daily';

  if (
    task.frequency === 'monthly' ||
    task.frequency === 'quarterly' ||
    (task.frequency === 'custom' && (task.customDays ?? 0) >= 28)
  ) {
    return 'periodic';
  }

  return 'regular';
}

const TASK_GROUPS = [
  { id: 'daily', title: 'Codzienne', description: 'Krótkie czynności utrzymujące porządek na bieżąco.' },
  { id: 'regular', title: 'Regularne', description: 'Czynności powtarzane co kilka dni lub tygodni.' },
  { id: 'periodic', title: 'Okresowe', description: 'Rzadsze porządki i czyszczenie sprzętów.' },
] as const;

function ChoiceButton({
  selected,
  label,
  detail,
  onClick,
}: {
  selected: boolean;
  label: string;
  detail?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`w-full rounded-2xl border px-4 py-3.5 text-left transition ${
        selected ? 'border-brand-600 bg-brand-50 shadow-card' : 'border-ink-200 bg-white hover:border-ink-300'
      }`}
    >
      <span className="block text-sm font-semibold text-ink-900">{label}</span>
      {detail && <span className="mt-0.5 block text-xs leading-relaxed text-ink-500">{detail}</span>}
    </button>
  );
}

export function OnboardingScreen() {
  const { state, acceptPlan } = useAppStore();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<HomeProfile>(state.home);
  const [excluded, setExcluded] = useState<string[]>([]);
  const [suggestedTasks, setSuggestedTasks] = useState<CleaningTask[]>([]);
  const [customTasks, setCustomTasks] = useState<CleaningTask[]>([]);
  const [customTitle, setCustomTitle] = useState('');
  const today = todayISO();

  useEffect(() => {
    if (step !== 6) return;

    const allExcluded = Array.from(
      new Set([
        ...(state.excludedLibraryTaskIds ?? []),
        ...excluded,
      ]),
    );

    setSuggestedTasks(buildSuggestedTasks(draft, today, allExcluded));
  }, [step, draft, today, excluded, state.excludedLibraryTaskIds]);

  const previewTasks = [...suggestedTasks, ...customTasks];

  const patch = (partial: Partial<HomeProfile>) => setDraft((current) => ({ ...current, ...partial }));

  const toggleList = <T extends string>(key: 'places' | 'appliances' | 'dayParts', id: T) => {
    setDraft((current) => {
      const list = current[key] as T[];
      const next = list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
      return { ...current, [key]: next };
    });
  };

  const togglePlace = (id: RoomId) => toggleList('places', id);
  const toggleAppliance = (id: ApplianceId) => toggleList('appliances', id);
  const toggleDayPart = (id: DayPart) => toggleList('dayParts', id);

  const toggleCleaningDay = (day: number) => {
  setDraft((current) => {
    const selected = current.cleaningDays ?? [];

    const next = selected.includes(day)
      ? selected.filter((item) => item !== day)
      : [...selected, day];

    return {
      ...current,
      cleaningDays: next,
    };
  });
};

  const canContinue =
    (step === 0 && draft.household !== null) ||
    (step === 1 && draft.smallChildren !== null) ||
    (step === 2 && draft.places.length > 0) ||
    (step === 3 && draft.timeBudget !== null) ||
    (step === 4 && (draft.cleaningDays?.length ?? 0) > 0 && draft.dayParts.length > 0) ||
    (step === 5 && draft.style !== null) ||
    step === 6;

  const addCustom = () => {
    const title = customTitle.trim();
    if (!title) return;
    const roomId = draft.places[0] ?? 'other';
    setCustomTasks((current) => [
      ...current,
      {
        id: createId(),
        roomId,
        title,
        frequency: 'weekly',
        customDays: null,
        dueDate: today,
        lastDoneDate: null,
        previousDueDate: null,
        minutes: 15,
        enabled: true,
        libraryId: null,
        scheduleNote: null,
        source: 'plan',
      },
    ]);
    setCustomTitle('');
  };

  const updateTask = (taskId: string, changes: Partial<CleaningTask>) => {
  setSuggestedTasks((current) =>
    current.map((task) =>
      task.id === taskId ? { ...task, ...changes } : task
    )
  );

  setCustomTasks((current) =>
    current.map((task) =>
      task.id === taskId ? { ...task, ...changes } : task
    )
  );
};

const changeFrequency = (task: CleaningTask, value: string) => {
  if (value === '2days' || value === '3days') {
    updateTask(task.id, {
      frequency: 'custom',
      customDays: Number(value.replace('days', '')),
    });
    return;
  }

  updateTask(task.id, {
    frequency: value as CleaningTask['frequency'],
    customDays: null,
  });
};

const removeTask = (task: CleaningTask) => {
  if (task.libraryId) {
    setExcluded((current) =>
      current.includes(task.libraryId!)
        ? current
        : [...current, task.libraryId!]
    );
  }

  setSuggestedTasks((current) =>
    current.filter((item) => item.id !== task.id)
  );

  setCustomTasks((current) =>
    current.filter((item) => item.id !== task.id)
  );
};

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="app-scroll flex-1 overflow-y-auto px-5 pb-6 pt-[max(env(safe-area-inset-top),24px)]">
        {step < 6 ? (
          <>
            <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Etap {STAGES[step]} z 5</p>
            <div className="mt-3 flex gap-1.5" aria-hidden="true">
              {[1, 2, 3, 4, 5].map((stage) => (
                <span
                  key={stage}
                  className={`h-1.5 flex-1 rounded-full ${stage <= STAGES[step] ? 'bg-brand-600' : 'bg-ink-200'}`}
                />
              ))}
            </div>
          </>
        ) : (
          <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Twój plan</p>
        )}

        {step === 0 && (
          <section className="mt-5">
            <h1 className="text-2xl font-bold leading-tight text-ink-900">Kto mieszka w domu?</h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              Od tego zależy, jak gęsto ułożę codzienne czynności. To punkt startowy, nie ocena.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              {HOUSEHOLD_OPTIONS.map((option) => (
                <ChoiceButton
                  key={option.id}
                  selected={draft.household === option.id}
                  label={option.label}
                  onClick={() =>
                    patch({
                      household: option.id as HouseholdSize,
                      smallChildren: option.id === 'family' && draft.smallChildren === null ? true : draft.smallChildren,
                    })
                  }
                />
              ))}
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="mt-5">
            <h1 className="text-2xl font-bold leading-tight text-ink-900">Jeszcze kilka rzeczy o domu</h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              Małe dzieci, zwierzęta i szczególne potrzeby zmieniają częstotliwość, ale nie dokładają obowiązków na siłę.
            </p>
            <h2 className="mb-2 mt-6 text-sm font-bold text-ink-700">Czy w domu są małe dzieci?</h2>
            <div className="grid grid-cols-2 gap-2">
              <ChoiceButton selected={draft.smallChildren === true} label="Tak" onClick={() => patch({ smallChildren: true })} />
              <ChoiceButton selected={draft.smallChildren === false} label="Nie" onClick={() => patch({ smallChildren: false })} />
            </div>
            <h2 className="mb-2 mt-6 text-sm font-bold text-ink-700">Czy mieszkają z Tobą zwierzęta?</h2>
            <input
              value={draft.pets}
              onChange={(event) => patch({ pets: event.target.value })}
              placeholder="Np. pies, kot. Zostaw puste, jeśli nie."
              className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 outline-none focus:border-brand-500"
            />
            <h2 className="mb-2 mt-6 text-sm font-bold text-ink-700">Szczególne potrzeby dotyczące czystości</h2>
            <textarea
              value={draft.specialNeeds}
              onChange={(event) => patch({ specialNeeds: event.target.value })}
              rows={3}
              placeholder="Opcjonalnie. Np. alergia, ktoś pracuje w domu, dużo gotowania."
              className="w-full resize-none rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 outline-none focus:border-brand-500"
            />
          </section>
        )}

        {step === 2 && (
          <section className="mt-5">
            <h1 className="text-2xl font-bold leading-tight text-ink-900">Jak wygląda Twój dom?</h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
  Zaznacz pomieszczenia i sprzęty, które naprawdę masz. Później możesz zmienić ten wybór, dodać własne pomieszczenia lub usunąć niepotrzebne.
</p>
            <h2 className="mb-2 mt-6 text-sm font-bold text-ink-700">Pomieszczenia</h2>
            <div className="flex flex-col gap-2">
              {ROOMS.map((room) => (
                <ChoiceButton
                  key={room.id}
                  selected={draft.places.includes(room.id)}
                  label={room.name}
                  onClick={() => togglePlace(room.id)}
                />
              ))}
            </div>
            <h2 className="mb-2 mt-6 text-sm font-bold text-ink-700">Urządzenia do okresowego czyszczenia</h2>
            <div className="flex flex-col gap-2">
              {APPLIANCE_OPTIONS.map((item) => (
                <ChoiceButton
                  key={item.id}
                  selected={draft.appliances.includes(item.id)}
                  label={item.label}
                  onClick={() => toggleAppliance(item.id)}
                />
              ))}
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="mt-5">
            <h1 className="text-2xl font-bold leading-tight text-ink-900">Ile czasu możesz przeznaczyć?</h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              Chodzi o realną dostępność, nie o idealny grafik. Plan zmieści się w tym czasie.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              {TIME_BUDGET_OPTIONS.map((option) => (
                <ChoiceButton
                  key={option.id}
                  selected={draft.timeBudget === option.id}
                  label={option.label}
                  detail={option.detail}
                  onClick={() => patch({ timeBudget: option.id as TimeBudget })}
                />
              ))}
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="mt-5">
            <h1 className="text-2xl font-bold leading-tight text-ink-900">Kiedy możesz sprzątać?</h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">Zaznacz dni i pory, które zwykle Ci pasują.</p>

<h2 className="mb-2 mt-6 text-sm font-bold text-ink-700">
  Dni, w które możesz sprzątać
</h2>
<p className="mb-3 text-sm leading-relaxed text-ink-500">
  Wybierz dowolne dni tygodnia. Możesz zaznaczyć cały tydzień albo tylko te dni, które najbardziej Ci odpowiadają.
</p>

<div className="grid grid-cols-4 gap-2">
  {CLEANING_DAY_OPTIONS.map((day) => {
    const selected = (draft.cleaningDays ?? []).includes(day.id);

    return (
      <button
        key={day.id}
        type="button"
        aria-pressed={selected}
        onClick={() => toggleCleaningDay(day.id)}
        className={`rounded-xl border px-2 py-3 text-sm font-semibold transition ${
          selected
            ? 'border-brand-600 bg-brand-50 text-brand-700'
            : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300'
        }`}
      >
        {day.label}
      </button>
    );
  })}
</div>

<h2 className="mb-2 mt-6 text-sm font-bold text-ink-700">Pory</h2>
<div className="flex flex-col gap-2">
  {DAY_PART_OPTIONS.map((option) => (
    <ChoiceButton
      key={option.id}
      selected={draft.dayParts.includes(option.id)}
      label={option.label}
      onClick={() => toggleDayPart(option.id)}
    />
  ))}
</div>
          </section>
        )}

        {step === 5 && (
          <section className="mt-5">
            <h1 className="text-2xl font-bold leading-tight text-ink-900">Jaki sposób sprzątania wolisz?</h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">Możesz to później zmienić. Plan da się ułożyć od nowa.</p>
            <div className="mt-5 flex flex-col gap-2">
              {STYLE_OPTIONS.map((option) => (
                <ChoiceButton
                  key={option.id}
                  selected={draft.style === option.id}
                  label={option.label}
                  onClick={() => patch({ style: option.id as ScheduleStyle })}
                />
              ))}
            </div>
          </section>
        )}


{step === 6 && (
  <section className="mt-5">
    <h1 className="text-2xl font-bold leading-tight text-ink-900">
      Jakie czynności uwzględnić w planie?
    </h1>

    <p className="mt-2 text-sm leading-relaxed text-ink-600">
      Przygotowałam listę na podstawie informacji o Twoim domu.
      Sprawdź propozycje, zmień nazwy lub częstotliwość i usuń
      czynności, których nie potrzebujesz.
    </p>

    {TASK_GROUPS.map((group) => {
      const groupTasks = previewTasks.filter(
        (task) => getTaskGroup(task) === group.id
      );

      if (groupTasks.length === 0) return null;

      return (
        <div key={group.id} className="mt-7">
          <h2 className="text-lg font-bold text-ink-900">
            {group.title}
          </h2>

          <p className="mt-1 text-sm text-ink-500">
            {group.description}
          </p>

          {ROOMS.filter((room) =>
            groupTasks.some((task) => task.roomId === room.id)
          ).map((room) => (
            <div key={room.id} className="mt-4">
              <h3 className="mb-2 text-sm font-bold text-ink-700">
                {room.name}
              </h3>

              <div className="flex flex-col gap-2">
                {groupTasks
                  .filter((task) => task.roomId === room.id)
                  .map((task) => (
                    <div
                      key={task.id}
                      className="rounded-2xl border border-ink-200 bg-white p-3"
                    >
                      <div className="flex items-start gap-2">
                        <input
                          value={task.title}
                          onChange={(event) =>
                            updateTask(task.id, {
                              title: event.target.value,
                            })
                          }
                          aria-label="Nazwa czynności"
                          className="min-w-0 flex-1 rounded-lg border border-ink-200 px-3 py-2 text-sm font-semibold text-ink-900 outline-none focus:border-brand-500"
                        />

                        <button
                          type="button"
                          onClick={() => removeTask(task)}
                          className="shrink-0 rounded-lg px-2 py-2 text-xs font-bold text-ink-500"
                        >
                          Usuń
                        </button>
                      </div>

                      <div className="mt-2">
                        <label className="mb-1 block text-xs font-medium text-ink-500">
                          Jak często?
                        </label>

                        <select
                          value={getFrequencyValue(task)}
                          onChange={(event) =>
                            changeFrequency(task, event.target.value)
                          }
                          className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-800 outline-none focus:border-brand-500"
                        >
                          {FREQUENCY_OPTIONS.map((option) => (
                            <option
                              key={option.value}
                              value={option.value}
                            >
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}

          {groupTasks.some(
            (task) => !ROOMS.some((room) => room.id === task.roomId)
          ) && (
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-bold text-ink-700">
                Pozostałe
              </h3>

              <div className="flex flex-col gap-2">
                {groupTasks
                  .filter(
                    (task) => !ROOMS.some((room) => room.id === task.roomId)
                  )
                  .map((task) => (
                    <div
                      key={task.id}
                      className="rounded-2xl border border-ink-200 bg-white p-3"
                    >
                      <input
                        value={task.title}
                        onChange={(event) =>
                          updateTask(task.id, {
                            title: event.target.value,
                          })
                        }
                        aria-label="Nazwa czynności"
                        className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm font-semibold text-ink-900"
                      />

                      <select
                        value={getFrequencyValue(task)}
                        onChange={(event) =>
                          changeFrequency(task, event.target.value)
                        }
                        className="mt-2 w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm"
                      >
                        {FREQUENCY_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => removeTask(task)}
                        className="mt-2 text-xs font-bold text-ink-500"
                      >
                        Usuń
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      );
    })}

    {previewTasks.length === 0 && (
      <p className="mt-5 rounded-2xl bg-ink-100 p-4 text-sm text-ink-600">
        Nie ma jeszcze żadnych czynności. Możesz dodać własne zadania poniżej.
      </p>
    )}

    {excluded.length > 0 && (
      <div className="mt-7">
        <h2 className="text-sm font-bold text-ink-700">
          Usunięte czynności
        </h2>

        <div className="mt-2 flex flex-col gap-2">
          {excluded.map((id) => (
            <div
              key={id}
              className="flex items-center justify-between gap-3 rounded-xl bg-ink-100 px-3 py-2"
            >
              <span className="text-sm text-ink-700">
                {TASK_LIBRARY.find((item) => item.id === id)?.title ?? 'Czynność'}
              </span>

              <button
                type="button"
                onClick={() =>
                  setExcluded((current) =>
                    current.filter((item) => item !== id)
                  )
                }
                className="shrink-0 text-xs font-bold text-brand-700"
              >
                Przywróć
              </button>
            </div>
          ))}
        </div>
      </div>
    )}

    <div className="mt-7 rounded-2xl border border-dashed border-ink-300 p-3">
      <h2 className="text-sm font-bold text-ink-800">
        Dodaj własną czynność
      </h2>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          addCustom();
        }}
      >
        <input
          value={customTitle}
          onChange={(event) => setCustomTitle(event.target.value)}
          placeholder="Np. czyszczenie drzwi"
          className="min-w-0 flex-1 rounded-xl border border-ink-200 bg-white px-3 py-3 text-sm outline-none focus:border-brand-500"
        />

        <button
          type="submit"
          disabled={!customTitle.trim()}
          className="rounded-xl bg-ink-900 px-4 text-sm font-semibold text-white disabled:bg-ink-300"
        >
          Dodaj
        </button>
      </form>
    </div>

    <p className="mt-5 text-xs leading-relaxed text-ink-500">
      Po sprawdzeniu listy przejdziesz do układania harmonogramu.
    </p>
  </section>
)}

      </div>

      <div className="border-t border-ink-200 bg-white px-5 py-4 pb-[max(env(safe-area-inset-bottom),16px)]">
        <div className="flex gap-2">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((current) => current - 1)}
              className="rounded-2xl bg-ink-100 px-4 py-3.5 text-sm font-bold text-ink-800"
            >
              Wstecz
            </button>
          )}
          {step < 6 ? (
            <button
              type="button"
              disabled={!canContinue}
              onClick={() => setStep((current) => current + 1)}
              className="flex-1 rounded-2xl bg-brand-600 py-3.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-ink-300"
            >
              Dalej
            </button>
          ) : (
            <button
              type="button"
              onClick={() => acceptPlan(previewTasks, draft)}
              className="flex-1 rounded-2xl bg-brand-600 py-3.5 text-sm font-bold text-white"
            >
              Akceptuję plan
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
