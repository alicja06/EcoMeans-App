import { AppStoreProvider } from '@/store/AppStoreContext';
import { NavigationProvider } from '@/store/NavigationContext';
import { ToastProvider } from '@/store/ToastContext';
import { PhoneFrame } from '@/components/layout/PhoneFrame';
import { BottomNav } from '@/components/layout/BottomNav';
import { ScreenRouter } from '@/components/layout/ScreenRouter';

export default function App() {
  return (
    <AppStoreProvider>
      <NavigationProvider>
        <PhoneFrame>
          <ToastProvider>
            <ScreenRouter />
            <BottomNav />
          </ToastProvider>
        </PhoneFrame>
      </NavigationProvider>
    </AppStoreProvider>
  );
}
