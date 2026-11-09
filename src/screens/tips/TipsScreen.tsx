import { useState } from 'react';
import { Bookmark, ChevronRight } from 'lucide-react';
import { TIPS, TIP_CATEGORIES } from '@/data/tips';
import { TIP_CATEGORY_ICONS } from '@/components/icons/categoryIcons';
import { useAppStore } from '@/store/AppStoreContext';
import { useNavigation } from '@/store/NavigationContext';
import { useToast } from '@/store/ToastContext';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import type { TipCategoryId } from '@/types';

export function TipsScreen() {
  const { state, toggleSavedTip } = useAppStore();
  const { navigate } = useNavigation();
  const { showToast } = useToast();
  const [category, setCategory] = useState<TipCategoryId | null>(null);

  const tips = TIPS.filter((tip) => !category || tip.categoryId === category);

  return (
    <>
      <ScreenHeader title="Porady" subtitle="Baza wiedzy o sprzątaniu" />
      <div className="grid grid-cols-2 gap-3 px-5 pb-6">
        {TIP_CATEGORIES.map((item) => {
          const Icon = TIP_CATEGORY_ICONS[item.id];
          const active = category === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={active}
              onClick={() => setCategory(active ? null : item.id)}
              className={`flex flex-col items-start gap-3 rounded-3xl border p-4 text-left transition active:scale-[0.97] ${
                active ? 'border-brand-600 bg-brand-50' : 'border-transparent bg-white shadow-card'
              }`}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sage-100 text-sage-700">
                <Icon size={20} />
              </span>
              <span>
                <span className="block text-sm font-bold text-ink-900">{item.name}</span>
                <span className="block text-xs text-ink-500">{item.description}</span>
              </span>
            </button>
          );
        })}
      </div>

      <ul className="flex flex-col gap-3 px-5">
        {tips.map((tip) => {
          const saved = state.savedTipIds.includes(tip.id);
          const categoryName = TIP_CATEGORIES.find((item) => item.id === tip.categoryId)?.name;
          return (
            <li key={tip.id} className="flex items-stretch gap-2">
              <button
                type="button"
                onClick={() => navigate({ name: 'tip', tipId: tip.id })}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-3xl bg-white p-4 text-left shadow-card transition active:scale-[0.99]"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-brand-700">
                    {categoryName} · {tip.readMinutes} min
                  </p>
                  <p className="mt-1 font-bold leading-snug text-ink-900">{tip.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-ink-500">{tip.summary}</p>
                </div>
                <ChevronRight size={18} className="shrink-0 text-ink-400" />
              </button>
              <button
                type="button"
                aria-label={saved ? 'Usuń z zapisanych' : 'Zapisz poradę'}
                aria-pressed={saved}
                onClick={() => {
                  toggleSavedTip(tip.id);
                  showToast(saved ? 'Usunięto z zapisanych' : 'Zapisano poradę');
                }}
                className="flex w-12 shrink-0 items-center justify-center rounded-3xl bg-white text-brand-700 shadow-card transition active:scale-90"
              >
                <Bookmark size={20} className={saved ? 'fill-brand-600' : ''} />
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
