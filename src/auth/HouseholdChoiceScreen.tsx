
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface HouseholdChoiceScreenProps {
  onHouseholdCreated: (householdId: string) => void;
  onHouseholdJoined: (householdId: string) => void;
}

export function HouseholdChoiceScreen({
  onHouseholdCreated,
  onHouseholdJoined,
}: HouseholdChoiceScreenProps) {
  const [mode, setMode] = useState<'choice' | 'create' | 'join'>('choice');
  const [householdName, setHouseholdName] = useState('Moje gospodarstwo');
  const [invitationToken, setInvitationToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('create_household', {
        household_name: householdName.trim() || 'Moje gospodarstwo',
      });

      if (error) throw error;

      if (!data) {
        throw new Error('Nie udało się utworzyć gospodarstwa.');
      }

      onHouseholdCreated(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Nie udało się utworzyć gospodarstwa.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('accept_household_invitation', {
        invitation_token: invitationToken.trim(),
      });

      if (error) throw error;

      if (!data) {
        throw new Error('Zaproszenie nie zwróciło identyfikatora gospodarstwa.');
      }

      onHouseholdJoined(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Nie udało się dołączyć do gospodarstwa.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh w-full items-center justify-center bg-[#f5e6ce] px-6 py-10">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <img
            src="/logo-ecomeans-zielone.png"
            alt="EcoMeans"
            className="mx-auto mb-6 w-40 object-contain"
          />

          <h1 className="mb-3 text-4xl text-[#3b742f]">
            Zacznijmy od Twojego domu
          </h1>

          <p className="text-[#4e4d4d]">
            Wybierz, jak chcesz korzystać z EcoMeans.
          </p>
        </div>

        {mode === 'choice' && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => {
                setMode('create');
                setError('');
              }}
              className="w-full rounded-3xl bg-[#3b742f] p-6 text-left text-white shadow-sm transition hover:bg-[#315f27]"
            >
              <span className="mb-2 block text-2xl">🏡</span>
              <span className="block text-xl font-bold">
                Tworzę własny plan
              </span>
              <span className="mt-2 block text-sm text-white/85">
                Utwórz gospodarstwo i przygotuj plan sprzątania swojego domu.
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('join');
                setError('');
              }}
              className="w-full rounded-3xl border-2 border-[#3b742f]/30 bg-white/75 p-6 text-left text-[#4e4d4d] shadow-sm transition hover:border-[#3b742f]"
            >
              <span className="mb-2 block text-2xl">🤝</span>
              <span className="block text-xl font-bold text-[#3b742f]">
                Dołączam do istniejącego
              </span>
              <span className="mt-2 block text-sm">
                Masz zaproszenie? Dołącz do gospodarstwa i wspólnego planu.
              </span>
            </button>
          </div>
        )}

        {mode === 'create' && (
          <form
            onSubmit={handleCreate}
            className="space-y-5 rounded-3xl bg-white/80 p-6 shadow-sm"
          >
            <div>
              <h2 className="mb-2 text-3xl text-[#3b742f]">
                Twój dom, Twój plan
              </h2>
              <p className="text-sm text-[#4e4d4d]">
                Nadaj nazwę swojemu gospodarstwu. Później przejdziesz do
                konfiguracji domu i planu sprzątania.
              </p>
            </div>

            <label className="block text-sm font-medium text-[#4e4d4d]">
              Nazwa gospodarstwa
              <input
                type="text"
                value={householdName}
                onChange={(event) => setHouseholdName(event.target.value)}
                required
                maxLength={80}
                className="mt-2 w-full rounded-xl border border-[#d9d0bd] bg-white px-4 py-3 outline-none focus:border-[#3b742f]"
                placeholder="np. Nasz dom"
              />
            </label>

            {error && (
              <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-[#3b742f] px-6 py-4 font-bold text-white transition hover:bg-[#315f27] disabled:opacity-60"
            >
              {loading ? 'Tworzenie...' : 'Utwórz gospodarstwo'}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('choice');
                setError('');
              }}
              className="w-full py-2 text-sm font-medium text-[#3b742f]"
            >
              ← Wróć do wyboru
            </button>
          </form>
        )}

        {mode === 'join' && (
          <form
            onSubmit={handleJoin}
            className="space-y-5 rounded-3xl bg-white/80 p-6 shadow-sm"
          >
            <div>
              <h2 className="mb-2 text-3xl text-[#3b742f]">
                Dołącz do domu
              </h2>
              <p className="text-sm text-[#4e4d4d]">
                Wklej kod zaproszenia otrzymany od osoby, która utworzyła
                gospodarstwo.
              </p>
            </div>

            <label className="block text-sm font-medium text-[#4e4d4d]">
              Kod zaproszenia
              <input
                type="text"
                value={invitationToken}
                onChange={(event) => setInvitationToken(event.target.value)}
                required
                autoComplete="off"
                className="mt-2 w-full rounded-xl border border-[#d9d0bd] bg-white px-4 py-3 outline-none focus:border-[#3b742f]"
                placeholder="Wklej kod zaproszenia"
              />
            </label>

            {error && (
              <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-[#3b742f] px-6 py-4 font-bold text-white transition hover:bg-[#315f27] disabled:opacity-60"
            >
              {loading ? 'Dołączanie...' : 'Dołącz do gospodarstwa'}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('choice');
                setError('');
              }}
              className="w-full py-2 text-sm font-medium text-[#3b742f]"
            >
              ← Wróć do wyboru
            </button>
          </form>
        )}

        <p className="mt-8 text-center text-xs text-[#4e4d4d]/65">
          Wspólny dom, wspólny plan, mniej codziennego chaosu.
        </p>
      </div>
    </main>
  );
}
