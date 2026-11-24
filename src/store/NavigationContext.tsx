import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Route } from "@/types";

interface NavigationContextValue {
  route: Route;
  canGoBack: boolean;
  isEditingPlan: boolean;
  navigate: (route: Route) => void;
  goBack: () => void;
  resetTo: (route: Route) => void;
  startPlanEditing: () => void;
  finishPlanEditing: () => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

const NAVIGATION_STORAGE_KEY = 'ecomeans-navigation-stack';

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<Route[]>(() => {
  try {
    const saved = sessionStorage.getItem(NAVIGATION_STORAGE_KEY);

    if (saved) {
      const parsed: unknown = JSON.parse(saved);

      if (
        Array.isArray(parsed) &&
        parsed.length > 0 &&
        parsed.every(
          (item) =>
            item !== null &&
            typeof item === 'object' &&
            'name' in item &&
            typeof item.name === 'string',
        )
      ) {
        return parsed as Route[];
      }
    }
  } catch {
    // Przy braku poprawnego zapisu zaczynamy od ekranu głównego.
  }

  return [{ name: 'home' }];
});

useEffect(() => {
  try {
    sessionStorage.setItem(
      NAVIGATION_STORAGE_KEY,
      JSON.stringify(stack),
    );
  } catch {
    // Brak możliwości zapisu nie blokuje nawigacji.
  }
}, [stack]);
  const [isEditingPlan, setIsEditingPlan] = useState(false);

  const navigate = useCallback(
    (route: Route) => setStack((current) => [...current, route]),
    [],
  );

  const goBack = useCallback(
    () =>
      setStack((current) =>
        current.length > 1 ? current.slice(0, -1) : current,
      ),
    [],
  );

  const resetTo = useCallback((route: Route) => setStack([route]), []);

  const startPlanEditing = useCallback(() => {
    setIsEditingPlan(true);
  }, []);

  const finishPlanEditing = useCallback(() => {
    setIsEditingPlan(false);
  }, []);

  const value = useMemo<NavigationContextValue>(
    () => ({
      route: stack[stack.length - 1],
      canGoBack: stack.length > 1,
      isEditingPlan,
      navigate,
      goBack,
      resetTo,
      startPlanEditing,
      finishPlanEditing,
    }),
    [
      stack,
      isEditingPlan,
      navigate,
      goBack,
      resetTo,
      startPlanEditing,
      finishPlanEditing,
    ],
  );

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation(): NavigationContextValue {
  const value = useContext(NavigationContext);

  if (!value) {
    throw new Error("useNavigation must be used inside NavigationProvider");
  }

  return value;
}