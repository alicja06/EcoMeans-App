import { useEffect, useState } from "react";
import type {
  ApplianceId,
  CleaningTask,
  CustomAppliance,
  CustomFrequencyRule,
  CustomRoom,
  DayPart,
  HomeProfile,
  HouseholdSize,
  RoomId,
  TimeBudget,
} from "@/types";
import {
  APPLIANCE_OPTIONS,
  DAY_PART_OPTIONS,
  HOUSEHOLD_OPTIONS,
  TIME_BUDGET_OPTIONS,
} from "@/data/home";
import { ROOMS } from "@/data/rooms";
import { useAppStore } from "@/store/AppStoreContext";
import { todayISO, formatShortDate } from "@/lib/dates";
import { createId } from "@/lib/ids";
import {
  buildSuggestedTasks,
  generateEditedPlan,
  getTaskPreviewGroup,
} from "@/lib/schedule";
import { useNavigation } from "@/store/NavigationContext";
import { useHousehold } from "@/auth/HouseholdContext";

const STAGES = [1, 1, 2, 3, 4];

const FREQUENCY_OPTIONS = [
  { value: "daily", label: "Codziennie" },
  { value: "2days", label: "Co 2 dni" },
  { value: "3days", label: "Co 3 dni" },
  { value: "weekly", label: "Co tydzień" },
  { value: "biweekly", label: "Co 2 tygodnie" },
  { value: "monthly", label: "Co miesiąc" },
  { value: "quarterly", label: "Co 3 miesiące" },
  { value: "custom", label: "Niestandardowa" },
];

function getFrequencyValue(task: CleaningTask): string {
  if (task.frequency === "custom") {
    if (task.customRule) return "custom-current";
    if (task.customDays === 2) return "2days";
    if (task.customDays === 3) return "3days";
  }

  return task.frequency;
}

function getCustomFrequencyLabel(rule: CustomFrequencyRule): string {
  const getPlural = (
    value: number,
    singular: string,
    plural: string,
    genitive: string,
  ) => {
    if (value === 1) return singular;

    const lastDigit = value % 10;
    const lastTwoDigits = value % 100;

    if (
      lastDigit >= 2 &&
      lastDigit <= 4 &&
      !(lastTwoDigits >= 12 && lastTwoDigits <= 14)
    ) {
      return plural;
    }

    return genitive;
  };

  if (rule.unit === "days") {
    return `Co ${rule.interval} ${getPlural(
      rule.interval,
      "dzień",
      "dni",
      "dni",
    )}`;
  }

  if (rule.unit === "weeks") {
    const weekdays = [
      "niedziela",
      "poniedziałek",
      "wtorek",
      "środa",
      "czwartek",
      "piątek",
      "sobota",
    ];

    const selectedDays = [1, 2, 3, 4, 5, 6, 0]
      .filter((day) => rule.weekdays.includes(day))
      .map((day) => weekdays[day]);

    return `Co ${rule.interval} ${getPlural(
      rule.interval,
      "tydzień",
      "tygodnie",
      "tygodni",
    )}: ${selectedDays.join(", ")}`;
  }

  const monthInterval = `Co ${rule.interval} ${getPlural(
    rule.interval,
    "miesiąc",
    "miesiące",
    "miesięcy",
  )}`;

  if (rule.monthlyPattern.type === "dayOfMonth") {
    return `${monthInterval} – ${rule.monthlyPattern.day}. dzień miesiąca`;
  }

  const ordinals: Record<number, string> = {
    1: "pierwszy",
    2: "drugi",
    3: "trzeci",
    4: "czwarty",
    [-1]: "ostatni",
  };

  const weekdays = [
    "niedziela",
    "poniedziałek",
    "wtorek",
    "środa",
    "czwartek",
    "piątek",
    "sobota",
  ];

  return `${monthInterval} – ${ordinals[rule.monthlyPattern.ordinal]} ${weekdays[rule.monthlyPattern.weekday]}`;
}

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
        selected
          ? "border-brand-600 bg-brand-50 shadow-card"
          : "border-ink-200 bg-white hover:border-ink-300"
      }`}
    >
      <span className="block text-sm font-semibold text-ink-900">{label}</span>
      {detail && (
        <span className="mt-0.5 block text-xs leading-relaxed text-ink-500">
          {detail}
        </span>
      )}
    </button>
  );
}

export function OnboardingScreen() {
  const { state, acceptPlan } = useAppStore();
  const { isEditingPlan, finishPlanEditing } = useNavigation();
  const { refreshHousehold } = useHousehold();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<HomeProfile>(() => {
    const home = state.home;
    const places = home.places.filter(
      (id) => id !== "toilet" && id !== "other",
    );

    if (home.places.includes("toilet") && !places.includes("bathroom")) {
      places.push("bathroom");
    }

    return {
      ...home,
      places,
      customRooms: home.customRooms ?? [],
      customAppliances: home.customAppliances ?? [],
    };
  });

  const [excluded, setExcluded] = useState<string[]>(
    isEditingPlan ? (state.excludedLibraryTaskIds ?? []) : [],
  );

  const [suggestedTasks, setSuggestedTasks] = useState<CleaningTask[]>(
    isEditingPlan ? state.tasks.filter((task) => task.libraryId !== null) : [],
  );

  const [customTasks, setCustomTasks] = useState<CleaningTask[]>(
    isEditingPlan
      ? state.tasks.filter(
          (task) => task.libraryId === null && task.source === "plan",
        )
      : [],
  );

  const [removedTasks, setRemovedTasks] = useState<CleaningTask[]>([]);
  const [plannedTasks, setPlannedTasks] = useState<CleaningTask[]>([]);
  const [generationMessage, setGenerationMessage] = useState(0);
  const [customFrequencyTask, setCustomFrequencyTask] =
    useState<CleaningTask | null>(null);

  const [customRuleDraft, setCustomRuleDraft] = useState<CustomFrequencyRule>({
    unit: "days",
    interval: 1,
  });
  useEffect(() => {
    if (step !== 6) return;

    const first = window.setTimeout(() => setGenerationMessage(1), 900);
    const second = window.setTimeout(() => setGenerationMessage(2), 1800);
    const finish = window.setTimeout(() => setStep(7), 2800);

    return () => {
      window.clearTimeout(first);
      window.clearTimeout(second);
      window.clearTimeout(finish);
    };
  }, [step]);
  const [customTitle, setCustomTitle] = useState("");
  const [addingToRoom, setAddingToRoom] = useState<RoomId | null>(null);
  const [customRoomName, setCustomRoomName] = useState("");
  const [customApplianceName, setCustomApplianceName] = useState("");

  const today = todayISO();

  const previewTasks = [...suggestedTasks, ...customTasks];

  const selectableRooms = [
    ...ROOMS.filter((room) => room.id !== "toilet" && room.id !== "other"),
    ...(draft.customRooms ?? []),
  ];

  const getRoomName = (roomId: RoomId): string => {
    if (roomId === "toilet") return "Łazienka";

    return selectableRooms.find((room) => room.id === roomId)?.name ?? "Dom";
  };

  const customApplianceTaskIds = new Set(
    (draft.customAppliances ?? []).map(
      (appliance) => `custom-appliance-${appliance.id}`,
    ),
  );

  const selectedRoomIds = new Set(draft.places);

  const roomGroups = selectableRooms
    .filter((room) => selectedRoomIds.has(room.id))
    .map((room) => ({
      id: room.id,
      name: room.name,
      tasks: previewTasks.filter((task) => {
        const taskRoomId = task.roomId === "toilet" ? "bathroom" : task.roomId;

        return taskRoomId === room.id && !customApplianceTaskIds.has(task.id);
      }),
    }));

  const applianceTasks = previewTasks.filter((task) =>
    customApplianceTaskIds.has(task.id),
  );

  const remainingTasks = previewTasks.filter((task) => {
    if (customApplianceTaskIds.has(task.id)) return false;

    const taskRoomId = task.roomId === "toilet" ? "bathroom" : task.roomId;

    return !selectedRoomIds.has(taskRoomId);
  });

  const patch = (partial: Partial<HomeProfile>) =>
    setDraft((current) => ({ ...current, ...partial }));

  const toggleList = <T extends string>(
    key: "places" | "appliances" | "dayParts",
    id: T,
  ) => {
    setDraft((current) => {
      const list = current[key] as T[];
      const next = list.includes(id)
        ? list.filter((item) => item !== id)
        : [...list, id];
      return { ...current, [key]: next };
    });
  };

  const togglePlace = (id: RoomId) => toggleList("places", id);
  const toggleAppliance = (id: ApplianceId) => toggleList("appliances", id);
  const addCustomRoom = () => {
    const name = customRoomName.trim();

    if (!name) return;

    const exists = selectableRooms.some(
      (room) => room.name.toLowerCase() === name.toLowerCase(),
    );

    if (exists) return;

    const room: CustomRoom = {
      id: `custom:${createId()}`,
      name,
    };

    setDraft((current) => ({
      ...current,
      customRooms: [...(current.customRooms ?? []), room],
      places: [...current.places, room.id],
    }));

    setCustomRoomName("");
  };

  const addCustomAppliance = () => {
    const name = customApplianceName.trim();

    if (!name) return;

    const exists = (draft.customAppliances ?? []).some(
      (item) => item.name.toLowerCase() === name.toLowerCase(),
    );

    if (exists) return;

    const appliance: CustomAppliance = {
      id: createId(),
      name,
    };

    setDraft((current) => ({
      ...current,
      customAppliances: [...(current.customAppliances ?? []), appliance],
    }));

    setCustomApplianceName("");
  };

  const removeCustomAppliance = (applianceId: string) => {
    setDraft((current) => ({
      ...current,
      customAppliances: (current.customAppliances ?? []).filter(
        (item) => item.id !== applianceId,
      ),
    }));

    const taskId = `custom-appliance-${applianceId}`;

    setCustomTasks((current) => current.filter((task) => task.id !== taskId));

    setRemovedTasks((current) => current.filter((task) => task.id !== taskId));
  };
  const toggleDayPart = (id: DayPart) => toggleList("dayParts", id);

  const canContinue =
    (step === 0 && draft.household !== null) ||
    (step === 1 && draft.smallChildren !== null) ||
    (step === 2 && draft.places.length > 0) ||
    (step === 3 && draft.timeBudget !== null) ||
    (step === 4 && draft.dayParts.length > 0) ||
    step === 5;

  const addCustom = (roomId: RoomId) => {
    const title = customTitle.trim();

    if (!title) return;

    setCustomTasks((current) => [
      ...current,
      {
        id: createId(),
        roomId,
        title,
        frequency: "weekly",
        customDays: null,
        dueDate: today,
        lastDoneDate: null,
        previousDueDate: null,
        minutes: 15,
        enabled: true,
        libraryId: null,
        scheduleNote: null,
        source: "plan",
      },
    ]);

    setCustomTitle("");
    setAddingToRoom(null);
  };

  const updateTask = (taskId: string, changes: Partial<CleaningTask>) => {
    setSuggestedTasks((current) =>
      current.map((task) =>
        task.id === taskId ? { ...task, ...changes } : task,
      ),
    );

    setCustomTasks((current) =>
      current.map((task) =>
        task.id === taskId ? { ...task, ...changes } : task,
      ),
    );
  };

  const changeFrequency = (task: CleaningTask, value: string) => {
    if (value === "custom") {
      openCustomFrequency(task);
      return;
    }

    if (value === "2days" || value === "3days") {
      updateTask(task.id, {
        frequency: "custom",
        customDays: Number(value.replace("days", "")),
        customRule: null,
      });
      return;
    }

    updateTask(task.id, {
      frequency: value as CleaningTask["frequency"],
      customDays: null,
      customRule: null,
    });
  };

  const removeTask = (task: CleaningTask) => {
    setRemovedTasks((current) => [
      ...current.filter((item) => item.id !== task.id),
      task,
    ]);

    if (task.libraryId) {
      setExcluded((current) =>
        current.includes(task.libraryId!)
          ? current
          : [...current, task.libraryId!],
      );
    }

    setSuggestedTasks((current) =>
      current.filter((item) => item.id !== task.id),
    );

    setCustomTasks((current) => current.filter((item) => item.id !== task.id));
  };
const handleGeneratePlan = () => {
  const generated = generateEditedPlan(previewTasks, draft, today);

  setPlannedTasks(generated);
  setGenerationMessage(0);
  setStep(6);
};

  const handleAcceptPlan = async () => {
    const saved = await acceptPlan(plannedTasks, draft, excluded);
    if (!saved) return;

    await refreshHousehold();
    finishPlanEditing();
  };

  const openCustomFrequency = (task: CleaningTask) => {
    setCustomFrequencyTask(task);

    setCustomRuleDraft(
      task.customRule ?? {
        unit: "days",
        interval: 1,
      },
    );
  };

  const toggleCustomWeekday = (day: number) => {
    setCustomRuleDraft((current) => {
      if (current.unit !== "weeks") return current;

      const weekdays = current.weekdays.includes(day)
        ? current.weekdays.filter((item) => item !== day)
        : [...current.weekdays, day].sort((a, b) => a - b);

      return {
        ...current,
        weekdays,
      };
    });
  };

const saveCustomFrequency = () => {
  if (!customFrequencyTask) return;

  const interval = Math.max(
    1,
    Math.min(365, Math.floor(Number(customRuleDraft.interval) || 1)),
  );

  updateTask(customFrequencyTask.id, {
    frequency: "custom",
    customDays: null,
    customRule: {
      ...customRuleDraft,
      interval,
    },
  });

  setCustomFrequencyTask(null);
};

    const renderTaskCard = (task: CleaningTask) => (
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

        <div className="flex items-center gap-2">
          <select
            value={getFrequencyValue(task)}
            onChange={(event) =>
              changeFrequency(task, event.target.value)
            }
            className="min-w-0 flex-1 rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-800 outline-none focus:border-brand-500"
          >
            {task.frequency === "custom" && task.customRule && (
              <option value="custom-current" disabled>
                {getCustomFrequencyLabel(task.customRule)}
              </option>
            )}

            {FREQUENCY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {task.frequency === "custom" && task.customRule && (
            <button
              type="button"
              onClick={() => openCustomFrequency(task)}
              className="shrink-0 rounded-xl bg-brand-50 px-3 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-100"
            >
              Edytuj
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="app-scroll flex-1 overflow-y-auto px-5 pb-6 pt-[max(env(safe-area-inset-top),24px)]">
        {step < 5 ? (
          <>
            <p className="text-xs font-bold uppercase tracking-wide text-brand-700">
              Etap {STAGES[step]} z 5
            </p>
            <div className="mt-3 flex gap-1.5" aria-hidden="true">
              {[1, 2, 3, 4, 5].map((stage) => (
                <span
                  key={stage}
                  className={`h-1.5 flex-1 rounded-full ${stage <= STAGES[step] ? "bg-brand-600" : "bg-ink-200"}`}
                />
              ))}
            </div>
          </>
        ) : (
          <p className="text-xs font-bold uppercase tracking-wide text-brand-700">
            Twój plan
          </p>
        )}

        {step === 0 && (
          <section className="mt-5">
            <h1 className="text-2xl font-bold leading-tight text-ink-900">
              Kto mieszka w domu?
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              Od tego zależy, jak gęsto ułożę codzienne czynności. To punkt
              startowy, nie ocena.
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
                      smallChildren:
                        option.id === "family" && draft.smallChildren === null
                          ? true
                          : draft.smallChildren,
                    })
                  }
                />
              ))}
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="mt-5">
            <h1 className="text-2xl font-bold leading-tight text-ink-900">
              Jeszcze kilka rzeczy o domu
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              Małe dzieci, zwierzęta i szczególne potrzeby zmieniają
              częstotliwość, ale nie dokładają obowiązków na siłę.
            </p>
            <h2 className="mb-2 mt-6 text-sm font-bold text-ink-700">
              Czy w domu są małe dzieci?
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <ChoiceButton
                selected={draft.smallChildren === true}
                label="Tak"
                onClick={() => patch({ smallChildren: true })}
              />
              <ChoiceButton
                selected={draft.smallChildren === false}
                label="Nie"
                onClick={() => patch({ smallChildren: false })}
              />
            </div>
            <h2 className="mb-2 mt-6 text-sm font-bold text-ink-700">
              Czy mieszkają z Tobą zwierzęta?
            </h2>
            <input
              value={draft.pets}
              onChange={(event) => patch({ pets: event.target.value })}
              placeholder="Np. pies, kot. Zostaw puste, jeśli nie."
              className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 outline-none focus:border-brand-500"
            />
            <h2 className="mb-2 mt-6 text-sm font-bold text-ink-700">
              Szczególne potrzeby dotyczące czystości
            </h2>
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
            <h1 className="text-2xl font-bold leading-tight text-ink-900">
              Jak wygląda Twój dom?
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              Zaznacz pomieszczenia i sprzęty, które naprawdę masz. Później
              możesz zmienić ten wybór, dodać własne pomieszczenia lub usunąć
              niepotrzebne.
            </p>
            <h2 className="mb-2 mt-6 text-sm font-bold text-ink-700">
              Pomieszczenia
            </h2>
            <div className="flex flex-col gap-2">
              {selectableRooms.map((room) => (
                <ChoiceButton
                  key={room.id}
                  selected={draft.places.includes(room.id)}
                  label={room.name}
                  onClick={() => togglePlace(room.id)}
                />
              ))}
            </div>

            <form
              className="mt-3 flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                addCustomRoom();
              }}
            >
              <input
                value={customRoomName}
                onChange={(event) => setCustomRoomName(event.target.value)}
                placeholder="Nazwa pomieszczenia"
                aria-label="Nazwa własnego pomieszczenia"
                className="min-w-0 flex-1 rounded-xl border border-ink-200 bg-white px-3 py-3 text-sm text-ink-900 outline-none focus:border-brand-500"
              />

              <button
                type="submit"
                disabled={!customRoomName.trim()}
                className="shrink-0 rounded-xl bg-brand-50 px-4 py-3 text-sm font-bold text-brand-700 disabled:opacity-40"
              >
                + Dodaj
              </button>
            </form>
            <h2 className="mb-2 mt-6 text-sm font-bold text-ink-700">
              Urządzenia do okresowego czyszczenia
            </h2>
            <div className="flex flex-col gap-2">
              {APPLIANCE_OPTIONS.map((item) => (
                <ChoiceButton
                  key={item.id}
                  selected={draft.appliances.includes(item.id)}
                  label={item.label}
                  onClick={() => toggleAppliance(item.id)}
                />
              ))}
              {(draft.customAppliances ?? []).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 rounded-2xl border border-brand-200 bg-brand-50 p-3"
                >
                  <span className="min-w-0 flex-1 text-sm font-semibold text-ink-900">
                    {item.name}
                  </span>

                  <button
                    type="button"
                    onClick={() => removeCustomAppliance(item.id)}
                    className="shrink-0 rounded-lg px-2 py-1 text-xs font-bold text-ink-500"
                    aria-label={`Usuń urządzenie ${item.name}`}
                  >
                    Usuń
                  </button>
                </div>
              ))}
              <form
                className="mt-3 flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  addCustomAppliance();
                }}
              >
                <input
                  value={customApplianceName}
                  onChange={(event) =>
                    setCustomApplianceName(event.target.value)
                  }
                  placeholder="Nazwa urządzenia"
                  aria-label="Nazwa własnego urządzenia"
                  className="min-w-0 flex-1 rounded-xl border border-ink-200 bg-white px-3 py-3 text-sm text-ink-900 outline-none focus:border-brand-500"
                />

                <button
                  type="submit"
                  disabled={!customApplianceName.trim()}
                  className="shrink-0 rounded-xl bg-brand-50 px-4 py-3 text-sm font-bold text-brand-700 disabled:opacity-40"
                >
                  + Dodaj
                </button>
              </form>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="mt-5">
            <h1 className="text-2xl font-bold leading-tight text-ink-900">
              Ile czasu możesz przeznaczyć?
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              Chodzi o realną dostępność, nie o idealny grafik. Plan zmieści się
              w tym czasie.
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
            <h1 className="text-2xl font-bold leading-tight text-ink-900">
              Kiedy możesz sprzątać?
            </h1>

            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              Wybierz pory dnia, które zwykle najbardziej Ci odpowiadają.
              Poszczególnym czynnościom przypiszesz konkretne dni i terminy w
              ustawieniach harmonogramu.
            </p>

            <h2 className="mb-2 mt-6 text-sm font-bold text-ink-700">
              Pory dnia
            </h2>

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
            <h1 className="text-2xl font-bold leading-tight text-ink-900">
              Jakie czynności uwzględnić w planie?
            </h1>

            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              Przygotowałam listę na podstawie informacji o Twoim domu. Sprawdź
              propozycje, zmień nazwy lub częstotliwość i usuń czynności,
              których nie potrzebujesz.
            </p>

            <div className="mt-6 flex flex-col gap-6">
              {roomGroups.map((room) => (
                <div key={room.id}>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h2 className="text-lg font-bold text-ink-900">
                      {room.name}
                    </h2>

                    <button
                      type="button"
                      onClick={() => {
                        setCustomTitle("");
                        setAddingToRoom(room.id);
                      }}
                      className="shrink-0 rounded-xl bg-brand-50 px-3 py-2 text-xs font-bold text-brand-700"
                    >
                      <span className="mr-1 text-base">+</span>
                      Dodaj czynność
                    </button>
                  </div>

                  {room.tasks.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-ink-300 px-3 py-4 text-sm text-ink-500">
                      Brak czynności w tym pomieszczeniu. Możesz dodać własną.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {room.tasks.map(renderTaskCard)}
                    </div>
                  )}
                </div>
              ))}

              {applianceTasks.length > 0 && (
                <div>
                  <h2 className="mb-3 text-lg font-bold text-ink-900">
                    Urządzenia do okresowego czyszczenia
                  </h2>

                  <div className="flex flex-col gap-2">
                    {applianceTasks.map(renderTaskCard)}
                  </div>
                </div>
              )}

              {remainingTasks.length > 0 && (
                <div>
                  <h2 className="mb-3 text-lg font-bold text-ink-900">
                    Pozostałe czynności
                  </h2>

                  <div className="flex flex-col gap-2">
                    {remainingTasks.map((task) => (
                      <div key={task.id}>
                        <p className="mb-1 text-xs font-medium text-ink-500">
                          {getRoomName(task.roomId)}
                        </p>
                        {renderTaskCard(task)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {removedTasks.length > 0 && (
              <div className="mt-8">
                <h2 className="text-sm font-bold text-ink-700">
                  Usunięte czynności
                </h2>

                <div className="mt-2 flex flex-col gap-2">
                  {removedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between gap-3 rounded-xl bg-ink-100 px-3 py-2"
                    >
                      <span className="text-sm text-ink-700">{task.title}</span>

                      <button
                        type="button"
                        onClick={() => {
                          if (task.libraryId) {
                            setExcluded((current) =>
                              current.filter((id) => id !== task.libraryId),
                            );

                            setSuggestedTasks((current) => [...current, task]);
                          } else {
                            setCustomTasks((current) => [...current, task]);
                          }

                          setRemovedTasks((current) =>
                            current.filter((item) => item.id !== task.id),
                          );
                        }}
                        className="shrink-0 text-xs font-bold text-brand-700"
                      >
                        Przywróć
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {addingToRoom !== null && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5">
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="add-task-title"
                  className="w-full max-w-md rounded-3xl bg-white p-5 shadow-xl"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h2
                      id="add-task-title"
                      className="text-lg font-bold text-ink-900"
                    >
                      Dodaj czynność
                    </h2>

                    <button
                      type="button"
                      onClick={() => {
                        setAddingToRoom(null);
                        setCustomTitle("");
                      }}
                      aria-label="Zamknij okno"
                      className="rounded-lg px-2 py-1 text-xl text-ink-500"
                    >
                      ×
                    </button>
                  </div>

                  <p className="mt-2 text-sm text-ink-600">
                    Pomieszczenie:{" "}
                    <span className="font-semibold text-ink-900">
                      {getRoomName(addingToRoom)}
                    </span>
                  </p>

                  <form
                    className="mt-5"
                    onSubmit={(event) => {
                      event.preventDefault();
                      addCustom(addingToRoom);
                    }}
                  >
                    <label
                      htmlFor="custom-task-title"
                      className="mb-2 block text-sm font-medium text-ink-700"
                    >
                      Nazwa czynności
                    </label>

                    <input
                      id="custom-task-title"
                      autoFocus
                      value={customTitle}
                      onChange={(event) => setCustomTitle(event.target.value)}
                      placeholder="Np. czyszczenie drzwi"
                      className="w-full rounded-xl border border-ink-200 bg-white px-3 py-3 text-sm text-ink-900 outline-none focus:border-brand-500"
                    />

                    <div className="mt-5 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAddingToRoom(null);
                          setCustomTitle("");
                        }}
                        className="flex-1 rounded-xl bg-ink-100 px-3 py-3 text-sm font-bold text-ink-800"
                      >
                        Anuluj
                      </button>

                      <button
                        type="submit"
                        disabled={!customTitle.trim()}
                        className="flex-1 rounded-xl bg-brand-600 px-3 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-ink-300"
                      >
                        Dodaj
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <p className="mt-6 text-xs leading-relaxed text-ink-500">
              Po sprawdzeniu listy przejdziesz do układania harmonogramu.
            </p>

            {customFrequencyTask && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="custom-frequency-title"
                  className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
                >
                  <div className="mb-5 flex items-center justify-between">
                    <h2
                      id="custom-frequency-title"
                      className="text-xl font-semibold text-gray-900"
                    >
                      Niestandardowa częstotliwość
                    </h2>

                    <button
                      type="button"
                      onClick={() => setCustomFrequencyTask(null)}
                      className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                      aria-label="Zamknij"
                    >
                      ✕
                    </button>
                  </div>

                  <p className="mb-4 text-sm text-gray-600">
                    Ustaw, jak często czynność ma się powtarzać.
                  </p>

                  <div className="mb-5 grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="mb-1 block text-sm font-medium text-gray-700">
                        Powtarzaj co
                      </span>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={customRuleDraft.interval}
                        onChange={(event) => {
                          const interval = Math.max(
                            1,
                            Math.min(365, Number(event.target.value) || 1),
                          );

                          setCustomRuleDraft((current) => ({
                            ...current,
                            interval,
                          }));
                        }}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-sm font-medium text-gray-700">
                        Jednostka
                      </span>
                      <select
                        value={customRuleDraft.unit}
                        onChange={(event) => {
                          const unit = event.target.value;

                          if (unit === "days") {
                            setCustomRuleDraft({
                              unit: "days",
                              interval: customRuleDraft.interval,
                            });
                          } else if (unit === "weeks") {
                            setCustomRuleDraft({
                              unit: "weeks",
                              interval: customRuleDraft.interval,
                              weekdays: [1],
                            });
                          } else {
                            setCustomRuleDraft({
                              unit: "months",
                              interval: customRuleDraft.interval,
                              monthlyPattern: {
                                type: "dayOfMonth",
                                day: 1,
                              },
                            });
                          }
                        }}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      >
                        <option value="days">Dni</option>
                        <option value="weeks">Tygodnie</option>
                        <option value="months">Miesiące</option>
                      </select>
                    </label>
                  </div>

                  {customRuleDraft.unit === "days" && (
                    <p className="mb-5 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                      Czynność będzie powtarzać się co{" "}
                      {customRuleDraft.interval}{" "}
                      {customRuleDraft.interval === 1 ? "dzień" : "dni"}.
                    </p>
                  )}

                  {customRuleDraft.unit === "weeks" && (
                    <div className="mb-5">
                      <p className="mb-2 text-sm font-medium text-gray-700">
                        Powtarzaj w dniach:
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: 1, label: "Pn" },
                          { id: 2, label: "Wt" },
                          { id: 3, label: "Śr" },
                          { id: 4, label: "Cz" },
                          { id: 5, label: "Pt" },
                          { id: 6, label: "Sb" },
                          { id: 0, label: "Nd" },
                        ].map((day) => {
                          const selected = customRuleDraft.weekdays.includes(
                            day.id,
                          );

                          return (
                            <button
                              key={day.id}
                              type="button"
                              onClick={() => toggleCustomWeekday(day.id)}
                              className={`rounded-lg border px-3 py-2 text-sm ${
                                selected
                                  ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                                  : "border-gray-300 text-gray-600 hover:bg-gray-50"
                              }`}
                            >
                              {day.label}
                            </button>
                          );
                        })}
                      </div>

                      {customRuleDraft.weekdays.length === 0 && (
                        <p className="mt-2 text-sm text-red-600">
                          Wybierz przynajmniej jeden dzień tygodnia.
                        </p>
                      )}
                    </div>
                  )}

                  {customRuleDraft.unit === "months" && (
                    <div className="mb-5 space-y-4">
                      <label className="block">
                        <span className="mb-1 block text-sm font-medium text-gray-700">
                          Sposób powtarzania
                        </span>
                        <select
                          value={customRuleDraft.monthlyPattern.type}
                          onChange={(event) => {
                            const type = event.target.value;

                            setCustomRuleDraft((current) => {
                              if (current.unit !== "months") return current;

                              return {
                                ...current,
                                monthlyPattern:
                                  type === "dayOfMonth"
                                    ? { type: "dayOfMonth", day: 1 }
                                    : {
                                        type: "weekdayOrdinal",
                                        ordinal: 1,
                                        weekday: 1,
                                      },
                              };
                            });
                          }}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2"
                        >
                          <option value="dayOfMonth">
                            W konkretnym dniu miesiąca
                          </option>
                          <option value="weekdayOrdinal">
                            W określony dzień tygodnia
                          </option>
                        </select>
                      </label>

                      {customRuleDraft.monthlyPattern.type === "dayOfMonth" && (
                        <label className="block">
                          <span className="mb-1 block text-sm font-medium text-gray-700">
                            Dzień miesiąca
                          </span>
                          <select
                            value={customRuleDraft.monthlyPattern.day}
                            onChange={(event) => {
                              const day = Number(event.target.value);

                              setCustomRuleDraft((current) => {
                                if (
                                  current.unit !== "months" ||
                                  current.monthlyPattern.type !== "dayOfMonth"
                                ) {
                                  return current;
                                }

                                return {
                                  ...current,
                                  monthlyPattern: {
                                    type: "dayOfMonth",
                                    day,
                                  },
                                };
                              });
                            }}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2"
                          >
                            {Array.from(
                              { length: 31 },
                              (_, index) => index + 1,
                            ).map((day) => (
                              <option key={day} value={day}>
                                {day}. dzień miesiąca
                              </option>
                            ))}
                          </select>
                        </label>
                      )}

                      {customRuleDraft.monthlyPattern.type ===
                        "weekdayOrdinal" && (
                        <div className="grid grid-cols-2 gap-3">
                          <label className="block">
                            <span className="mb-1 block text-sm font-medium text-gray-700">
                              Który?
                            </span>
                            <select
                              value={customRuleDraft.monthlyPattern.ordinal}
                              onChange={(event) => {
                                const ordinal = Number(event.target.value) as
                                  | 1
                                  | 2
                                  | 3
                                  | 4
                                  | -1;

                                setCustomRuleDraft((current) => {
                                  if (
                                    current.unit !== "months" ||
                                    current.monthlyPattern.type !==
                                      "weekdayOrdinal"
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
                              className="w-full rounded-lg border border-gray-300 px-3 py-2"
                            >
                              <option value={1}>Pierwszy</option>
                              <option value={2}>Drugi</option>
                              <option value={3}>Trzeci</option>
                              <option value={4}>Czwarty</option>
                              <option value={-1}>Ostatni</option>
                            </select>
                          </label>

                          <label className="block">
                            <span className="mb-1 block text-sm font-medium text-gray-700">
                              Dzień tygodnia
                            </span>
                            <select
                              value={customRuleDraft.monthlyPattern.weekday}
                              onChange={(event) => {
                                const weekday = Number(event.target.value);

                                setCustomRuleDraft((current) => {
                                  if (
                                    current.unit !== "months" ||
                                    current.monthlyPattern.type !==
                                      "weekdayOrdinal"
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
                              className="w-full rounded-lg border border-gray-300 px-3 py-2"
                            >
                              <option value={1}>Poniedziałek</option>
                              <option value={2}>Wtorek</option>
                              <option value={3}>Środa</option>
                              <option value={4}>Czwartek</option>
                              <option value={5}>Piątek</option>
                              <option value={6}>Sobota</option>
                              <option value={0}>Niedziela</option>
                            </select>
                          </label>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                    <button
                      type="button"
                      onClick={() => setCustomFrequencyTask(null)}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Anuluj
                    </button>

                    <button
                      type="button"
                      onClick={saveCustomFrequency}
                      disabled={
                        customRuleDraft.unit === "weeks" &&
                        customRuleDraft.weekdays.length === 0
                      }
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Zapisz częstotliwość
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {step === 6 && (
          <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
            <div className="mb-6 h-16 w-16 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />

            <h2 className="text-xl font-bold text-ink-900">
              Przygotowujemy Twój plan
            </h2>

            <p className="mt-3 max-w-sm text-sm text-ink-500">
              {generationMessage === 0 &&
                "Analizujemy wybrane czynności i częstotliwość sprzątania…"}
              {generationMessage === 1 &&
                "Dopasowujemy zadania do dostępnego czasu…"}
              {generationMessage === 2 &&
                "Układamy harmonogram według Twoich preferencji…"}
            </p>

            <div className="mt-8 flex gap-2">
              {[0, 1, 2].map((item) => (
                <span
                  key={item}
                  className={`h-2 w-2 rounded-full ${
                    generationMessage >= item ? "bg-brand-600" : "bg-ink-200"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {step === 7 && (
          <section className="mt-5">
            <h1 className="text-2xl font-bold leading-tight text-ink-900">
              Twój plan sprzątania
            </h1>

            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              Tak może wyglądać Twój harmonogram. Sprawdź podział czynności.
              Jeśli chcesz coś zmienić, wróć do listy i wygeneruj plan ponownie.
            </p>

            {(
              [
                {
                  id: "daily",
                  label: "Codzienne",
                  color: "bg-emerald-50 text-emerald-800",
                },
                {
                  id: "regular",
                  label: "Regularne",
                  color: "bg-blue-50 text-blue-800",
                },
                {
                  id: "periodic",
                  label: "Okresowe",
                  color: "bg-amber-50 text-amber-800",
                },
              ] as const
            ).map((group) => {
              const tasks = plannedTasks.filter(
                (task) => getTaskPreviewGroup(task) === group.id,
              );

              return (
                <div key={group.id} className="mt-6">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-ink-900">
                      {group.label}
                    </h2>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${group.color}`}
                    >
                      {tasks.length}{" "}
                      {tasks.length === 1 ? "czynność" : "czynności"}
                    </span>
                  </div>

                  {tasks.length === 0 ? (
                    <p className="rounded-xl bg-ink-50 px-3 py-3 text-sm text-ink-500">
                      Brak czynności w tej grupie.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {tasks.map((task) => (
                          <div
                            key={task.id}
                            className="rounded-2xl border border-ink-200 bg-white p-3"
                          >
                            <p className="text-sm font-semibold text-ink-900">
                              {task.title}
                            </p>

                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
                              <span>{getRoomName(task.roomId)}</span>
                              <span>•</span>
                              <span>{formatShortDate(task.dueDate)}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}

            {plannedTasks.length === 0 && (
              <p className="mt-6 rounded-2xl bg-ink-50 p-4 text-sm text-ink-600">
                Nie ma jeszcze żadnych czynności do zaplanowania. Wróć do listy
                i dodaj przynajmniej jedną.
              </p>
            )}
          </section>
        )}
      </div>

      <div className="border-t border-ink-200 bg-white px-5 py-4 pb-[max(env(safe-area-inset-bottom),16px)]">
        <div className="flex gap-2">
          {step > 0 && step !== 6 && (
            <button
              type="button"
              onClick={() => setStep(step === 7 ? 5 : step - 1)}
              className="rounded-2xl bg-ink-100 px-4 py-3.5 text-sm font-bold text-ink-800"
            >
              Wstecz
            </button>
          )}

          {step < 5 ? (
            <button
              type="button"
              disabled={!canContinue}
              onClick={() => {
if (step === 4) {
const allExcluded = Array.from(
  new Set([
    ...(state.excludedLibraryTaskIds ?? []),
    ...excluded,
  ]),
);

const freshSuggestions = buildSuggestedTasks(
  draft,
  today,
  allExcluded,
);

setSuggestedTasks((current) => {
  const currentByLibraryId = new Map(
    current
      .filter((task) => task.libraryId)
      .map((task) => [task.libraryId!, task]),
  );

  return freshSuggestions.map((suggestion) => {
    const existing = currentByLibraryId.get(suggestion.libraryId!);

    if (!existing) return suggestion;

    return {
      ...suggestion,
      ...existing,
      roomId: suggestion.roomId,
    };
  });
});

  const applianceRoom =
    draft.places.find((id) => id === "utility") ??
    draft.places[0] ??
    "other";

  const activeApplianceTasks = (draft.customAppliances ?? []).map(
    (appliance): CleaningTask => ({
      id: `custom-appliance-${appliance.id}`,
      roomId: applianceRoom,
      title: `Czyszczenie: ${appliance.name}`,
      frequency: "quarterly",
      customDays: null,
      dueDate: today,
      lastDoneDate: null,
      previousDueDate: null,
      minutes: 15,
      enabled: true,
      libraryId: null,
      scheduleNote:
        "Przykładowa częstotliwość. Dostosuj ją do instrukcji producenta urządzenia.",
      source: "plan",
    }),
  );

  const activeIds = new Set(
    activeApplianceTasks.map((task) => task.id),
  );

  const removedIds = new Set(
    removedTasks.map((task) => task.id),
  );

  setCustomTasks((current) => {
    const existingIds = new Set(current.map((task) => task.id));

const retained = current
  .filter(
    (task) =>
      !task.id.startsWith("custom-appliance-") ||
      activeIds.has(task.id),
  )
  .map((task) =>
    task.id.startsWith("custom-appliance-")
      ? { ...task, roomId: applianceRoom }
      : task,
  );

    const missing = activeApplianceTasks.filter(
      (task) =>
        !existingIds.has(task.id) &&
        !removedIds.has(task.id),
    );

    return [...retained, ...missing];
  });
}

                setStep((current) => current + 1);
              }}
              className="flex-1 rounded-2xl bg-brand-600 py-3.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-ink-300"
            >
              Dalej
            </button>
          ) : step === 5 ? (
            <button
              type="button"
              onClick={handleGeneratePlan}
              className="flex-1 rounded-2xl bg-brand-600 py-3.5 text-sm font-bold text-white"
            >
              Ułóż mój harmonogram
            </button>
          ) : step === 7 ? (
            <button
              type="button"
              onClick={handleAcceptPlan}
              className="flex-1 rounded-2xl bg-brand-600 py-3.5 text-sm font-bold text-white"
            >
              Zatwierdź plan
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
