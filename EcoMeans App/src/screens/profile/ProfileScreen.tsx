import { useState } from 'react';
import { Bell, ChevronRight, Info, Shield, Trash2, User } from 'lucide-react';
import { WEEKDAY_NAMES } from '@/lib/dates';
import { useAppStore } from '@/store/AppStoreContext';
import { useNavigation } from '@/store/NavigationContext';
import { useToast } from '@/store/ToastContext';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { DemoNotice, Toggle } from '@/components/ui/controls';
import { Sheet } from '@/components/ui/Sheet';
import { PRODUCTS } from '@/data/products';
import { TIPS } from '@/data/tips';

export function ProfileScreen() {
  const { state, updateProfile, resetState } = useAppStore();
  const { navigate } = useNavigation();
  const { showToast } = useToast();
  const [nameDraft, setNameDraft] = useState(state.profile.name);
  const [accountOpen, setAccountOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const favorites = PRODUCTS.filter((product) => state.favoriteProductIds.includes(product.id));
  const savedTips = TIPS.filter((tip) => state.savedTipIds.includes(tip.id));
  const { notifications } = state.profile;

  return (
    <>
      <ScreenHeader title="Profil" />
      <div className="flex flex-col gap-6 px-5 pt-2">
        <section className="rounded-3xl bg-white p-5 shadow-card">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-700">
              <User size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-ink-500">Twoje imię</p>
              <p className="truncate font-bold text-ink-900">{state.profile.name || 'Nie podano'}</p>
            </div>
          </div>
          <form
            className="mt-4 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              updateProfile({ name: nameDraft.trim() });
              showToast('Zapisano imię');
            }}
          >
            <input
              value={nameDraft}
              onChange={(event) => setNameDraft(event.target.value)}
              placeholder="Wpisz imię"
              aria-label="Imię"
              className="min-w-0 flex-1 rounded-2xl border border-ink-200 bg-ink-50 px-4 py-3 text-ink-900 outline-none focus:border-brand-500"
            />
            <button type="submit" className="rounded-2xl bg-brand-600 px-4 font-semibold text-white transition hover:bg-brand-700">
              Zapisz
            </button>
          </form>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-bold text-ink-700">Preferencje sprzątania</h2>
          <div className="rounded-3xl bg-white p-4 shadow-card">
            <label className="flex items-center justify-between gap-4">
              <span className="font-semibold text-ink-900">Generalne sprzątanie</span>
              <select
                value={state.profile.cleaningDay}
                onChange={(event) => updateProfile({ cleaningDay: Number(event.target.value) })}
                className="rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm font-semibold text-ink-800 outline-none"
              >
                {WEEKDAY_NAMES.map((day, index) => (
                  <option key={day} value={index}>
                    {day[0].toUpperCase() + day.slice(1)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-bold text-ink-700">Powiadomienia</h2>
          <div className="flex flex-col gap-1 rounded-3xl bg-white p-4 shadow-card">
            {(
              [
                ['reminders', 'Przypomnienia o zadaniach'],
                ['dailySummary', 'Podsumowanie dnia'],
                ['newTips', 'Nowe porady'],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between gap-4 py-2.5">
                <span className="text-sm font-semibold text-ink-900">{label}</span>
                <Toggle
                  label={label}
                  checked={notifications[key]}
                  onChange={(next) => updateProfile({ notifications: { ...notifications, [key]: next } })}
                />
              </div>
            ))}
          </div>
          <div className="mt-3">
            <DemoNotice text="Powiadomienia są na razie ustawieniami poglądowymi. Nie są wysyłane." />
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-bold text-ink-700">Ulubione produkty</h2>
          {favorites.length === 0 ? (
            <p className="text-sm text-ink-500">Brak ulubionych produktów.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {favorites.map((product) => (
                <li key={product.id}>
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'product', productId: product.id })}
                    className="flex w-full items-center justify-between rounded-2xl bg-white p-4 text-left shadow-card"
                  >
                    <span className="font-semibold text-ink-900">{product.name}</span>
                    <ChevronRight size={18} className="text-ink-400" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-bold text-ink-700">Zapisane porady</h2>
          {savedTips.length === 0 ? (
            <p className="text-sm text-ink-500">Nie zapisano jeszcze żadnych porad.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {savedTips.map((tip) => (
                <li key={tip.id}>
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'tip', tipId: tip.id })}
                    className="flex w-full items-center justify-between rounded-2xl bg-white p-4 text-left shadow-card"
                  >
                    <span className="pr-3 font-semibold text-ink-900">{tip.title}</span>
                    <ChevronRight size={18} className="shrink-0 text-ink-400" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="overflow-hidden rounded-3xl bg-white shadow-card">
          <div className="flex items-center gap-3 border-b border-ink-100 p-4">
            <Info size={18} className="text-ink-500" />
            <span className="text-sm font-semibold text-ink-900">EcoMeans, prototyp 0.1</span>
          </div>
          <button
            type="button"
            onClick={() => navigate({ name: 'privacy' })}
            className="flex w-full items-center justify-between border-b border-ink-100 p-4 text-left"
          >
            <span className="flex items-center gap-3 text-sm font-semibold text-ink-900">
              <Shield size={18} className="text-ink-500" /> Polityka prywatności
            </span>
            <ChevronRight size={18} className="text-ink-400" />
          </button>
          <button
            type="button"
            onClick={() => setAccountOpen(true)}
            className="flex w-full items-center justify-between p-4 text-left"
          >
            <span className="flex items-center gap-3 text-sm font-semibold text-ink-900">
              <Bell size={18} className="text-ink-500" /> Zarządzanie kontem
            </span>
            <ChevronRight size={18} className="text-ink-400" />
          </button>
        </section>
      </div>

      {accountOpen && (
        <Sheet title="Zarządzanie kontem" onClose={() => setAccountOpen(false)}>
          <p className="text-sm leading-relaxed text-ink-600">
            Konta użytkowników pojawią się w kolejnym etapie. Dane prototypu są zapisane tylko w tej przeglądarce.
          </p>
          <button
            type="button"
            onClick={() => {
              if (!confirmReset) return setConfirmReset(true);
              resetState();
              setConfirmReset(false);
              setAccountOpen(false);
              setNameDraft('');
              showToast('Dane prototypu zostały zresetowane');
            }}
            className={`mt-6 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-semibold transition ${
              confirmReset ? 'bg-danger-500 text-white' : 'bg-danger-50 text-danger-700'
            }`}
          >
            <Trash2 size={18} />
            {confirmReset ? 'Kliknij ponownie, aby potwierdzić' : 'Resetuj dane prototypu'}
          </button>
        </Sheet>
      )}
    </>
  );
}
