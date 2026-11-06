import { useState } from 'react';
import { Check, Plus, ShoppingBasket, Trash2 } from 'lucide-react';
import { PRODUCTS } from '@/data/products';
import { useAppStore } from '@/store/AppStoreContext';
import { useNavigation } from '@/store/NavigationContext';
import { useToast } from '@/store/ToastContext';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { EmptyState } from '@/components/ui/controls';
import { Sheet } from '@/components/ui/Sheet';

export function ShoppingListScreen() {
  const { state, addShoppingItem, toggleShoppingItem, removeShoppingItem, clearBoughtShoppingItems } = useAppStore();
  const { goBack, navigate } = useNavigation();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [catalogOpen, setCatalogOpen] = useState(false);

  const toBuy = state.shoppingItems.filter((item) => !item.bought);
  const bought = state.shoppingItems.filter((item) => item.bought);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    addShoppingItem(trimmed, null);
    setName('');
    showToast('Dodano do listy');
  };

  const renderItem = (id: string, label: string, isBought: boolean, productId: string | null) => (
    <li key={id} className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-card">
      <button
        type="button"
        aria-label={isBought ? `Oznacz jako do kupienia: ${label}` : `Oznacz jako kupione: ${label}`}
        aria-pressed={isBought}
        onClick={() => toggleShoppingItem(id)}
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition ${
          isBought ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink-300 text-transparent hover:border-brand-500'
        }`}
      >
        <Check size={15} strokeWidth={3} />
      </button>
      <div className="min-w-0 flex-1">
        {productId ? (
          <button
            type="button"
            onClick={() => navigate({ name: 'product', productId })}
            className={`truncate text-left font-semibold underline-offset-4 hover:underline ${isBought ? 'text-ink-400 line-through' : 'text-ink-900'}`}
          >
            {label}
          </button>
        ) : (
          <p className={`truncate font-semibold ${isBought ? 'text-ink-400 line-through' : 'text-ink-900'}`}>{label}</p>
        )}
        {productId && <p className="text-xs text-brand-700">EcoMeans</p>}
      </div>
      <button
        type="button"
        aria-label={`Usuń: ${label}`}
        onClick={() => removeShoppingItem(id)}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-400 transition hover:bg-danger-50 hover:text-danger-500"
      >
        <Trash2 size={18} />
      </button>
    </li>
  );

  return (
    <>
      <ScreenHeader title="Lista zakupów" subtitle={`Do kupienia: ${toBuy.length}`} onBack={goBack} />
      <div className="px-5 pt-2">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
          className="flex gap-2"
        >
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Dodaj własną pozycję"
            aria-label="Nazwa produktu"
            className="min-w-0 flex-1 rounded-2xl border border-ink-200 bg-white px-4 py-3 text-ink-900 outline-none focus:border-brand-500"
          />
          <button
            type="submit"
            aria-label="Dodaj pozycję"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white transition hover:bg-brand-700 active:scale-95"
          >
            <Plus size={20} />
          </button>
        </form>
        <button
          type="button"
          onClick={() => setCatalogOpen(true)}
          className="mt-3 w-full rounded-2xl border border-brand-200 bg-brand-50 py-3 text-sm font-semibold text-brand-800 transition hover:bg-brand-100"
        >
          Dodaj produkt z katalogu EcoMeans
        </button>

        {state.shoppingItems.length === 0 ? (
          <div className="mt-6">
            <EmptyState icon={ShoppingBasket} title="Lista jest pusta" text="Dodaj własną pozycję albo produkt z katalogu EcoMeans." />
          </div>
        ) : (
          <>
            <h2 className="mb-3 mt-6 text-sm font-bold text-ink-700">Do kupienia</h2>
            <ul className="flex flex-col gap-2.5">
              {toBuy.map((item) => renderItem(item.id, item.name, false, item.productId))}
              {toBuy.length === 0 && <li className="text-sm text-ink-500">Wszystko kupione.</li>}
            </ul>
            {bought.length > 0 && (
              <>
                <div className="mb-3 mt-7 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-ink-700">Kupione</h2>
                  <button
                    type="button"
                    onClick={() => {
                      clearBoughtShoppingItems();
                      showToast('Usunięto kupione pozycje');
                    }}
                    className="text-sm font-semibold text-brand-700 hover:underline"
                  >
                    Wyczyść kupione
                  </button>
                </div>
                <ul className="flex flex-col gap-2.5">
                  {bought.map((item) => renderItem(item.id, item.name, true, item.productId))}
                </ul>
              </>
            )}
          </>
        )}
      </div>

      {catalogOpen && (
        <Sheet title="Katalog EcoMeans" onClose={() => setCatalogOpen(false)}>
          <ul className="flex flex-col gap-2">
            {PRODUCTS.map((product) => {
              const onList = state.shoppingItems.some((item) => item.productId === product.id && !item.bought);
              return (
                <li key={product.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3.5 shadow-card">
                  <span className="min-w-0 font-semibold text-ink-900">{product.name}</span>
                  <button
                    type="button"
                    disabled={onList}
                    onClick={() => {
                      addShoppingItem(product.name, product.id);
                      showToast('Dodano do listy');
                    }}
                    className="shrink-0 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:bg-ink-200 disabled:text-ink-500"
                  >
                    {onList ? 'Na liście' : 'Dodaj'}
                  </button>
                </li>
              );
            })}
          </ul>
        </Sheet>
      )}
    </>
  );
}
