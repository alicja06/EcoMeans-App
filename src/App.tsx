
import { useState } from 'react';
import { AppStoreProvider } from '@/store/AppStoreContext';
import { NavigationProvider } from '@/store/NavigationContext';
import { ToastProvider } from '@/store/ToastContext';
import { AuthProvider, useAuth } from '@/auth/AuthContext';
import { HouseholdProvider, useHousehold } from '@/auth/HouseholdContext';
import { BottomNav } from '@/components/layout/BottomNav';
import { ScreenRouter } from '@/components/layout/ScreenRouter';
import { OnboardingScreen } from '@/screens/onboarding/OnboardingScreen';
import { WelcomeScreen } from '@/screens/welcome/WelcomeScreen';
import { AuthScreen } from '@/auth/AuthScreen';
import { HouseholdChoiceScreen } from '@/auth/HouseholdChoiceScreen';
import { useNavigation } from "@/store/NavigationContext";

function AppShell() {
  const { session, loading: authLoading } = useAuth();
  const { isEditingPlan } = useNavigation();

  const {
    householdId,
    onboardingComplete,
    loading: householdLoading,
    refreshHousehold,
  } = useHousehold();

  const [showWelcome, setShowWelcome] = useState(true);

  if (authLoading || (session && householdLoading)) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f5e6ce]">
        <p className="text-lg text-[#3b742f]">
          Ładowanie EcoMeans...
        </p>
      </div>
    );
  }

  if (!session) {
    if (showWelcome) {
      return <WelcomeScreen onStart={() => setShowWelcome(false)} />;
    }

    return (
      <AuthScreen
        onAuthenticated={() => setShowWelcome(false)}
        onBack={() => setShowWelcome(true)}
      />
    );
  }

  if (!householdId) {
    return (
      <HouseholdChoiceScreen
        onHouseholdCreated={async () => {
          await refreshHousehold();
        }}
        onHouseholdJoined={async () => {
          await refreshHousehold();
        }}
      />
    );
  }

  if (!onboardingComplete || isEditingPlan) {
    return (
      <div className="min-h-dvh w-full bg-canvas">
        <OnboardingScreen />
      </div>
    );
  }

  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-canvas">
      <ScreenRouter />
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HouseholdProvider>
        <AppStoreProvider>
          <NavigationProvider>
            <ToastProvider>
              <AppShell />
            </ToastProvider>
          </NavigationProvider>
        </AppStoreProvider>
      </HouseholdProvider>
    </AuthProvider>
  );
}
