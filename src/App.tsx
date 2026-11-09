import { AppStoreProvider, useAppStore } from '@/store/AppStoreContext';
import { NavigationProvider } from '@/store/NavigationContext';
import { ToastProvider } from '@/store/ToastContext';
import { PhoneFrame } from '@/components/layout/PhoneFrame';
import { BottomNav } from '@/components/layout/BottomNav';
import { ScreenRouter } from '@/components/layout/ScreenRouter';
import { OnboardingScreen } from '@/screens/onboarding/OnboardingScreen';

function AppShell() {
  const { state } = useAppStore();
  if (!state.home.onboardingComplete) return <OnboardingScreen />;
  return (
    <>
      <ScreenRouter />
      <BottomNav />
    </>
  );
}

export default function App() {
  return (
    <AppStoreProvider>
      <NavigationProvider>
        <PhoneFrame>
          <ToastProvider>
            <AppShell />
          </ToastProvider>
        </PhoneFrame>
      </NavigationProvider>
    </AppStoreProvider>
  );
}
