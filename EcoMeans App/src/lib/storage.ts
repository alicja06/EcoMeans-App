import type { AppState } from '@/types';

const STORAGE_KEY = 'ecomeans-prototype-state-v1';

export function loadState(): AppState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    const isValid =
      Array.isArray(parsed.tasks) &&
      Array.isArray(parsed.history) &&
      Array.isArray(parsed.favoriteProductIds) &&
      Array.isArray(parsed.savedTipIds) &&
      Array.isArray(parsed.shoppingItems) &&
      parsed.profile !== undefined;
    return isValid ? (parsed as AppState) : null;
  } catch {
    return null;
  }
}

export function saveState(state: AppState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Brak dostępu do pamięci przeglądarki (np. tryb prywatny) – prototyp działa dalej bez zapisu.
  }
}
