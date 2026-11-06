import { useState } from 'react';
import { Heart, ShoppingCart } from 'lucide-react';
import { PRODUCTS, PRODUCT_CATEGORIES } from '@/data/products';
import { useAppStore } from '@/store/AppStoreContext';
import { useNavigation } from '@/store/NavigationContext';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { ProductImage } from '@/components/ui/ProductImage';
import type { ProductCategoryId } from '@/types';

type Filter = ProductCategoryId | 'all' | 'favorites';

export function ProductsScreen() {
  const { state, toggleFavorite } = useAppStore();
  const { navigate } = useNavigation();
  const [filter, setFilter] = useState<Filter>('all');

  const visible = PRODUCTS.filter((product) => {
    if (filter === 'all') return true;
    if (filter === 'favorites') return state.favoriteProductIds.includes(product.id);
    return product.categoryId === filter;
  });

  const chips: { value: Filter; label: string }[] = [
    { value: 'all', label: 'Wszystkie' },
    { value: 'favorites', label: 'Ulubione' },
    ...PRODUCT_CATEGORIES.map((category) => ({ value: category.id, label: category.name })),
  ];

  return (
    <>
      <ScreenHeader
        title="Produkty"
        subtitle="Katalog EcoMeans"
        actions={
          <button
            type="button"
            onClick={() => navigate({ name: 'shopping' })}
            aria-label="Lista zakupów"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink-800 shadow-card transition active:scale-95"
          >
            <ShoppingCart size={20} />
          </button>
        }
      />
      <div className="flex gap-2 overflow-x-auto px-5 pb-4 [scrollbar-width:none]">
        {chips.map((chip) => (
          <button
            key={chip.value}
            type="button"
            onClick={() => setFilter(chip.value)}
            aria-pressed={filter === chip.value}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
              filter === chip.value ? 'bg-brand-600 text-white' : 'bg-white text-ink-700 shadow-card'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <ul className="flex flex-col gap-3 px-5">
        {visible.length === 0 && (
          <li className="rounded-2xl bg-white p-5 text-sm text-ink-500 shadow-card">
            Nie masz jeszcze ulubionych produktów. Kliknij serce na wybranej karcie.
          </li>
        )}
        {visible.map((product) => {
          const favorite = state.favoriteProductIds.includes(product.id);
          return (
            <li key={product.id} className="relative">
              <button
                type="button"
                onClick={() => navigate({ name: 'product', productId: product.id })}
                className="flex w-full items-center gap-4 rounded-3xl bg-white p-3 pr-14 text-left shadow-card transition active:scale-[0.99]"
              >
                <ProductImage categoryId={product.categoryId} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                    {PRODUCT_CATEGORIES.find((category) => category.id === product.categoryId)?.name}
                  </p>
                  <p className="mt-0.5 font-bold text-ink-900">{product.name}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-ink-500">{product.shortUse}</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => toggleFavorite(product.id)}
                aria-label={favorite ? `Usuń z ulubionych: ${product.name}` : `Dodaj do ulubionych: ${product.name}`}
                aria-pressed={favorite}
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-ink-50 text-ink-500 transition active:scale-90"
              >
                <Heart size={18} className={favorite ? 'fill-danger-500 text-danger-500' : ''} />
              </button>
            </li>
          );
        })}
      </ul>

      <div className="px-5 pb-4 pt-6">
        <button
          type="button"
          onClick={() => navigate({ name: 'calculators' })}
          className="flex w-full items-center justify-between rounded-3xl bg-sand-100 p-5 text-left transition active:scale-[0.99]"
        >
          <span>
            <span className="block font-bold text-sand-900">Kalkulator dawkowania</span>
            <span className="mt-1 block text-sm text-sand-800">Sprawdź, ile koncentratu dodać do wody</span>
          </span>
        </button>
      </div>
    </>
  );
}
