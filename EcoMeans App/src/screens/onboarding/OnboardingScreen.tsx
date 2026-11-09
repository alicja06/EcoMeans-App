import { useMemo, useState } from 'react';
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
import { buildPlanTasks, formatPlanRange, horizonDates, planSubtitle } from '@/lib/schedule';
import { WeekBoard } from '@/components/plan/WeekBoard';

const STAGES = [1, 1, 2, 3, 4, 5];

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
  const [customTasks, setCustomTasks] = useState<CleaningTask[]>([]);
  const [customTitle, setCustomTitle] = useState('');
  const today = todayISO();
  const dates = horizonDates(today);

  const generated = useMemo(
    () => (step === 6 ? buildPlanTasks(draft, today, excluded) : []),
    [draft, excluded, step, today],
  );
  const previewTasks = useMemo(() => [...generated, ...customTasks], [generated, customTasks]);
  const laterTasks = previewTasks.filter((task) => task.dueDate > dates[dates.length - 1]);

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

  const canContinue =
    (step === 0 && draft.household !== null) ||
    (step === 1 && draft.smallChildren !== null) ||
    (step === 2 && draft.places.length > 0) ||
    (step === 3 && draft.timeBudget !== null) ||
    (step === 4 && (draft.weekdays || draft.weekends) && draft.dayParts.length > 0) ||
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
            <p className="mt-2 text-sm leading-relaxed text-ink-600">Zaznacz pomieszczenia i sprzęty, które naprawdę masz.</p>
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
            <h2 className="mb-2 mt-6 text-sm font-bold text-ink-700">Dni</h2>
            <div className="flex flex-col gap-2">
              <ChoiceButton
                selected={draft.weekdays}
                label="Dni robocze"
                onClick={() => patch({ weekdays: !draft.weekdays })}
              />
              <ChoiceButton
                selected={draft.weekends}
                label="Weekendy"
                onClick={() => patch({ weekends: !draft.weekends })}
              />
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
            <h1 className="text-2xl font-bold leading-tight text-ink-900">Twój tydzień</h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">{planSubtitle(draft, today)}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">
              {formatPlanRange(today)}. To propozycja z Twoich odpowiedzi. Możesz ją zaakceptować albo zdjąć czynności, które nie
              pasują.
            </p>
            {draft.specialNeeds.trim() && (
              <p className="mt-3 rounded-2xl bg-sand-50 px-4 py-3 text-sm leading-relaxed text-sand-800">
                Biorę pod uwagę: {draft.specialNeeds.trim()}
              </p>
            )}
            <div className="mt-5">
              <WeekBoard tasks={previewTasks} home={draft} today={today} dates={dates} />
            </div>

            <h2 className="mb-2 mt-6 text-sm font-bold text-ink-700">Czynności w planie</h2>
            <ul className="flex flex-col gap-2">
              {generated.map((task) => (
                <li key={task.libraryId} className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-card">
                  <span className="text-sm font-semibold text-ink-900">{task.title}</span>
                  <button
                    type="button"
                    onClick={() => task.libraryId && setExcluded((current) => [...current, task.libraryId as string])}
                    className="shrink-0 text-xs font-bold text-ink-500"
                  >
                    Usuń
                  </button>
                </li>
              ))}
              {customTasks.map((task) => (
                <li key={task.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-card">
                  <span className="text-sm font-semibold text-ink-900">{task.title}</span>
                  <button
                    type="button"
                    onClick={() => setCustomTasks((current) => current.filter((item) => item.id !== task.id))}
                    className="shrink-0 text-xs font-bold text-ink-500"
                  >
                    Usuń
                  </button>
                </li>
              ))}
            </ul>

            {excluded.length > 0 && (
              <div className="mt-4">
                <h2 className="mb-2 text-sm font-bold text-ink-700">Zdjęte z planu</h2>
                <div className="flex flex-wrap gap-2">
                  {excluded.map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setExcluded((current) => current.filter((item) => item !== id))}
                      className="rounded-full bg-ink-100 px-3 py-1.5 text-xs font-semibold text-ink-700"
                    >
                      Przywróć: {TASK_LIBRARY.find((item) => item.id === id)?.title ?? 'czynność'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {laterTasks.length > 0 && (
              <p className="mt-4 text-sm leading-relaxed text-ink-500">
                Rzadsze czynności, takie jak sprzęt AGD czy okna, dostały dalszy termin. Nie wchodzą wszystkie naraz w ten tydzień.
              </p>
            )}

            <form
              className="mt-4 flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                addCustom();
              }}
            >
              <input
                value={customTitle}
                onChange={(event) => setCustomTitle(event.target.value)}
                placeholder="Własna czynność, np. przetrzeć drzwi"
                className="min-w-0 flex-1 rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500"
              />
              <button type="submit" className="rounded-2xl bg-ink-900 px-4 text-sm font-semibold text-white">
                Dodaj
              </button>
            </form>
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
