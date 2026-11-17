import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/AuthContext';

interface HouseholdContextType {
  householdId: string | null;
  onboardingComplete: boolean;
  loading: boolean;
  refreshHousehold: () => Promise<void>;
  setCurrentHousehold: (householdId: string) => void;
  clearHousehold: () => void;
}

const HouseholdContext = createContext<HouseholdContextType | undefined>(
  undefined
);

interface HouseholdProviderProps {
  children: ReactNode;
}

export function HouseholdProvider({ children }: HouseholdProviderProps) {
  const { user, loading: authLoading } = useAuth();

  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshHousehold = useCallback(async () => {
    if (!user) {
      setHouseholdId(null);
      setOnboardingComplete(false);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { data: membership, error: membershipError } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (membershipError) throw membershipError;

      const id = membership?.household_id ?? null;

      if (!id) {
        setHouseholdId(null);
        setOnboardingComplete(false);
        return;
      }

      const { data: household, error: householdError } = await supabase
        .from('households')
        .select('home_profile')
        .eq('id', id)
        .single();

      if (householdError) throw householdError;

      const homeProfile = household.home_profile as {
        onboardingComplete?: boolean;
      } | null;

      setHouseholdId(id);
      setOnboardingComplete(
        homeProfile?.onboardingComplete === true
      );
    } catch (error) {
      console.error('Nie udało się pobrać danych gospodarstwa:', error);
      setHouseholdId(null);
      setOnboardingComplete(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;

    void refreshHousehold();
  }, [authLoading, refreshHousehold]);

  const setCurrentHousehold = (id: string) => {
    setHouseholdId(id);
    setOnboardingComplete(false);
  };

  const clearHousehold = () => {
    setHouseholdId(null);
    setOnboardingComplete(false);
  };

  return (
    <HouseholdContext.Provider
      value={{
        householdId,
        onboardingComplete,
        loading: authLoading || loading,
        refreshHousehold,
        setCurrentHousehold,
        clearHousehold,
      }}
    >
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHousehold() {
  const context = useContext(HouseholdContext);

  if (!context) {
    throw new Error('useHousehold musi być użyty wewnątrz HouseholdProvider.');
  }

  return context;
}
