import { BookOpen, Home, LayoutGrid, Leaf, User, type LucideIcon } from 'lucide-react';
import { useNavigation } from '@/store/NavigationContext';
import type { Route } from '@/types';

type TabRoute = Extract<Route, { name: 'home' | 'rooms' | 'products' | 'tips' | 'profile' }>;

interface TabItem {
  route: TabRoute;
  label: string;
  icon: LucideIcon;
}

const TABS: TabItem[] = [
  { route: { name: 'home' }, label: 'Start', icon: Home },
  { route: { name: 'rooms' }, label: 'Mój dom', icon: LayoutGrid },
  { route: { name: 'products' }, label: 'Produkty', icon: Leaf },
  { route: { name: 'tips' }, label: 'Porady', icon: BookOpen },
  { route: { name: 'profile' }, label: 'Profil', icon: User },
];

const TAB_ROUTE_NAMES: Route['name'][] = TABS.map((tab) => tab.route.name);

export function BottomNav() {
  const { route, resetTo } = useNavigation();

  if (!TAB_ROUTE_NAMES.includes(route.name)) return null;

  return (
    <nav
      aria-label="Główna nawigacja"
      className="absolute inset-x-0 bottom-0 z-40 border-t border-ink-200/80 bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),12px)] pt-2 backdrop-blur-md"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-between">
        {TABS.map((tab) => {
          const active = route.name === tab.route.name;
          const Icon = tab.icon;
          return (
            <li key={tab.route.name} className="flex-1">
              <button
                type="button"
                onClick={() => resetTo(tab.route)}
                aria-current={active ? 'page' : undefined}
                className="group flex w-full flex-col items-center gap-1 rounded-2xl py-1.5 transition"
              >
                <span
                  className={`flex h-8 w-14 items-center justify-center rounded-full transition-all duration-300 ${
                    active ? 'bg-brand-100 text-brand-700' : 'text-ink-500 group-hover:text-ink-700'
                  }`}
                >
                  <Icon size={20} strokeWidth={active ? 2.4 : 2} />
                </span>
                <span
                  className={`text-[11px] leading-none ${active ? 'font-bold text-brand-700' : 'font-semibold text-ink-500'}`}
                >
                  {tab.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
