import { useState } from 'react';
import { FLOOR_BASE_WATER_LITERS, FLOOR_DOSAGE_OPTIONS } from '@/data/calculators';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { DemoNotice } from '@/components/ui/controls';

export function CalculatorsScreen() {
  const [dosageId, setDosageId] = useState<string>(FLOOR_DOSAGE_OPTIONS[1].id);
  const [waterInput, setWaterInput] = useState('5');

  const water = Number(waterInput.replace(',', '.'));
  const validWater = Number.isFinite(water) && water > 0 && water <= 200;
  const dosage = FLOOR_DOSAGE_OPTIONS.find((option) => option.id === dosageId) ?? FLOOR_DOSAGE_OPTIONS[1];
  const result = validWater ? Math.round((water / FLOOR_BASE_WATER_LITERS) * dosage.mlPerBase) : null;

  return (
    <>
      <ScreenHeader title="Kalkulator" subtitle="Dawkowanie EcoMeans Podłoga" />
      <div className="px-5 pt-2">
        <h2 className="mb-3 text-base font-bold text-ink-900">Sposób mycia</h2>
        <div className="flex flex-col gap-2">
          {FLOOR_DOSAGE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={option.id === dosageId}
              onClick={() => setDosageId(option.id)}
              className={`flex items-center justify-between rounded-2xl border px-4 py-3.5 text-left transition ${
                option.id === dosageId ? 'border-brand-600 bg-brand-50' : 'border-ink-200 bg-white'
              }`}
            >
              <span>
                <span className="block font-semibold text-ink-900">{option.label}</span>
                <span className="block text-xs text-ink-500">{option.detail}</span>
              </span>
              <span className="text-sm font-bold text-brand-700">{option.mlPerBase} ml / 5 l</span>
            </button>
          ))}
        </div>

        <label htmlFor="water" className="mb-2 mt-6 block text-base font-bold text-ink-900">
          Ile litrów wody?
        </label>
        <input
          id="water"
          inputMode="decimal"
          value={waterInput}
          onChange={(event) => setWaterInput(event.target.value)}
          className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3.5 text-lg font-semibold text-ink-900 outline-none focus:border-brand-500"
        />
        {!validWater && <p className="mt-2 text-sm font-semibold text-danger-500">Podaj liczbę litrów od 0,1 do 200.</p>}

        <div className="mt-6 rounded-3xl bg-brand-700 p-6 text-white shadow-lift">
          <p className="text-sm font-semibold text-brand-100">Potrzebny koncentrat</p>
          <p className="mt-2 text-4xl font-bold">{result !== null ? `${result} ml` : '—'}</p>
          <p className="mt-2 text-sm text-brand-100">
            {result !== null ? `Na ${waterInput.replace('.', ',')} l wody przy wybranym sposobie mycia.` : 'Wpisz poprawną ilość wody.'}
          </p>
        </div>
        <div className="mt-4">
          <DemoNotice text="Wyniki liczone są wyłącznie na podstawie zalecanego dawkowania: 25–50 ml lub 100 ml na 5 litrów wody." />
        </div>
      </div>
    </>
  );
}
