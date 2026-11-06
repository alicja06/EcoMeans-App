import { Bookmark, Check } from 'lucide-react';
import { findTip, findTipCategory } from '@/data/tips';
import { useAppStore } from '@/store/AppStoreContext';
import { useNavigation } from '@/store/NavigationContext';
import { useToast } from '@/store/ToastContext';
import { ScreenHeader } from '@/components/layout/ScreenHeader';

export function TipDetailScreen({ tipId }: { tipId: string }) {
  const { state, toggleSavedTip } = useAppStore();
  const { goBack } = useNavigation();
  const { showToast } = useToast();
  const tip = findTip(tipId);

  if (!tip) return <ScreenHeader title="Nie znaleziono porady" onBack={goBack} />;

  const saved = state.savedTipIds.includes(tip.id);
  const category = findTipCategory(tip.categoryId);

  return (
    <>
      <ScreenHeader
        title={category?.name ?? 'Porada'}
        onBack={goBack}
        actions={
          <button
            type="button"
            aria-label={saved ? 'Usuń z zapisanych' : 'Zapisz poradę'}
            aria-pressed={saved}
            onClick={() => {
              toggleSavedTip(tip.id);
              showToast(saved ? 'Usunięto z zapisanych' : 'Zapisano poradę');
            }}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-brand-700 shadow-card transition active:scale-95"
          >
            <Bookmark size={20} className={saved ? 'fill-brand-600' : ''} />
          </button>
        }
      />
      <article className="px-5 pt-2">
        <p className="text-xs font-semibold text-brand-700">{tip.readMinutes} min czytania</p>
        <h2 className="mt-2 text-2xl font-bold leading-tight text-ink-900">{tip.title}</h2>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-600">{tip.intro}</p>

        <ul className="mt-6 flex flex-col gap-3">
          {tip.points.map((point) => (
            <li key={point} className="flex gap-3 rounded-2xl bg-white p-4 text-sm leading-relaxed text-ink-700 shadow-card">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                <Check size={14} strokeWidth={3} />
              </span>
              {point}
            </li>
          ))}
        </ul>
      </article>
    </>
  );
}
