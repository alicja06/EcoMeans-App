
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface AuthScreenProps {
  onAuthenticated: () => void;
  onBack: () => void;
}

export function AuthScreen({ onAuthenticated, onBack }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        if (data.session) {
          onAuthenticated();
        } else {
          setMessage('Konto zostało utworzone. Sprawdź swoją skrzynkę e-mail i potwierdź adres.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        onAuthenticated();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Wystąpił błąd. Spróbuj ponownie.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh w-full flex-col items-center justify-center bg-[#f5e6ce] px-6 py-10">
      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={onBack}
          className="mb-8 text-sm font-medium text-[#3b742f]"
        >
          ← Wróć
        </button>

        <div className="mb-8 text-center">
          <img
            src="/logo-ecomeans-zielone.png"
            alt="EcoMeans"
            className="mx-auto mb-6 w-44 object-contain"
          />

          <h1 className="mb-2 text-4xl text-[#3b742f]">
            {mode === 'login' ? 'Witaj ponownie!' : 'Dołącz do EcoMeans'}
          </h1>

          <p className="text-sm text-[#4e4d4d]">
            {mode === 'login'
              ? 'Zaloguj się do swojego domu.'
              : 'Utwórz konto i zadbaj o dom po swojemu.'}
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-2xl bg-white/60 p-1">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
              setMessage('');
            }}
            className={`rounded-xl py-3 text-sm font-bold ${
              mode === 'login'
                ? 'bg-[#3b742f] text-white'
                : 'text-[#4e4d4d]'
            }`}
          >
            Logowanie
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
              setMessage('');
            }}
            className={`rounded-xl py-3 text-sm font-bold ${
              mode === 'register'
                ? 'bg-[#3b742f] text-white'
                : 'text-[#4e4d4d]'
            }`}
          >
            Rejestracja
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-3xl bg-white/80 p-6 shadow-sm"
        >

          <label className="block text-sm font-medium text-[#4e4d4d]">
            Adres e-mail
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              className="mt-2 w-full rounded-xl border border-[#d9d0bd] bg-white px-4 py-3 outline-none focus:border-[#3b742f]"
              placeholder="np. imie@email.com"
            />
          </label>

          <label className="block text-sm font-medium text-[#4e4d4d]">
            Hasło
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className="mt-2 w-full rounded-xl border border-[#d9d0bd] bg-white px-4 py-3 outline-none focus:border-[#3b742f]"
              placeholder="Minimum 6 znaków"
            />
          </label>

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          {message && (
            <p role="status" className="rounded-xl bg-green-50 p-3 text-sm text-green-800">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-[#3b742f] px-6 py-4 font-bold text-white transition hover:bg-[#315f27] disabled:opacity-60"
          >
            {loading
              ? 'Chwileczkę...'
              : mode === 'login'
                ? 'Zaloguj się'
                : 'Utwórz konto'}
          </button>
        </form>
      </div>
    </main>
  );
}
