import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Route } from '@/types';

interface NavigationContextValue {
  route: Route;
  canGoBack: boolean;
  navigate: (route: Route) => void;
  goBack: () => void;
  resetTo: (route: Route) => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<Route[]>([{ name: 'home' }]);

  const navigate = useCallback((route: Route) => setStack((current) => [...current, route]), []);
  const goBack = useCallback(
    () => setStack((current) => (current.length > 1 ? current.slice(0, -1) : current)),
    [],
  );
  const resetTo = useCallback((route: Route) => setStack([route]), []);

  const value = useMemo<NavigationContextValue>(
    () => ({
      route: stack[stack.length - 1],
      canGoBack: stack.length > 1,
      navigate,
      goBack,
      resetTo,
    }),
    [stack, navigate, goBack, resetTo],
  );

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useNavigation(): NavigationContextValue {
  const value = useContext(NavigationContext);
  if (!value) throw new Error('useNavigation must be used inside NavigationProvider');
  return value;
}
