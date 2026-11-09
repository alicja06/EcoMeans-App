import { ShoppingCart, Heart } from 'lucide-react';
import { findProduct, findProductCategory } from '@/data/products';
import { useAppStore } from '@/store/AppStoreContext';
import { useNavigation } from '@/store/NavigationContext';
import { useToast } from '@/store/ToastContext';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { DemoNotice } from '@/components/ui/controls';
import { ProductImage } from '@/components/ui/ProductImage';
import { Sheet } from '@/components/ui/Sheet';
import { useState } from 'react';

export function ProductDetailScreen({ productId }: { productId: string }) {
  const { state, toggleFavorite, addShoppingItem } = useAppStore();
  const { goBack, navigate } = useNavigation();
  const { showToast } = useToast();
  const [storeInfo, setStoreInfo] = useState(false);
  const product = findProduct(productId);

  if (!product) {
    return <ScreenHeader title="Nie znaleziono produktu" onBack={goBack} />;
  }

  const favorite = state.favoriteProductIds.includes(product.id);
  const inList = state.shoppingItems.some((item) => item.productId === product.id && !item.bought);
  const category = findProductCategory(product.categoryId);

  return (
    <>
      <ScreenHeader
        title={product.name}
        subtitle={category?.name}
        onBack={goBack}
        actions={
          <button
            type="button"
            onClick={() => toggleFavorite(product.id)}
            aria-label={favorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
            aria-pressed={favorite}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink-700 shadow-card transition active:scale-95"
          >
            <Heart size={20} className={favorite ? 'fill-danger-500 text-danger-500' : ''} />
          </button>
        }
      />
      <div className="px-5 pt-2">
        <ProductImage categoryId={product.categoryId} size="lg" />
        <div className="mt-4">
          <DemoNotice text="Opisy i wskazówki poniżej są przykładowe, do czasu zatwierdzenia kart produktów." />
        </div>

        <Section title="Opis">{product.description}</Section>
        <Section title="Przeznaczenie">{product.purpose}</Section>
        <Section title="Sposób użycia">
          <ol className="list-decimal space-y-2 pl-5">
            {product.usageSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </Section>
        <Section title="Dawkowanie">
          <p>{product.dosage}</p>
          {product.categoryId === 'floors' && (
            <button
              type="button"
              onClick={() => navigate({ name: 'calculators' })}
              className="mt-3 text-sm font-semibold text-brand-700 underline-offset-4 hover:underline"
            >
              Oblicz ilość w kalkulatorze
            </button>
          )}
        </Section>
        <Section title="Skład i oznaczenia">{product.composition}</Section>
        <Section title="Wskazówki">
          <ul className="list-disc space-y-2 pl-5">
            {product.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </Section>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-30 flex gap-3 border-t border-ink-200 bg-white/95 px-5 pb-[max(env(safe-area-inset-bottom),16px)] pt-4 backdrop-blur-md">
        <button
          type="button"
          onClick={() => {
            if (inList) {
              navigate({ name: 'shopping' });
              return;
            }
            addShoppingItem(product.name, product.id);
            showToast('Dodano do listy zakupów');
          }}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-brand-600 py-3.5 font-semibold text-white transition hover:bg-brand-700 active:scale-[0.98]"
        >
          <ShoppingCart size={18} />
          {inList ? 'Jest na liście zakupów' : 'Dodaj do listy zakupów'}
        </button>
        <button
          type="button"
          onClick={() => setStoreInfo(true)}
          className="rounded-2xl border border-ink-300 px-4 py-3.5 font-semibold text-ink-800 transition hover:bg-ink-50"
        >
          Sklep
        </button>
      </div>

      {storeInfo && (
        <Sheet title="Sklep EcoMeans" onClose={() => setStoreInfo(false)}>
          <p className="text-sm leading-relaxed text-ink-600">
            Link do sklepu z kartą produktu pojawi się po podłączeniu sklepu EcoMeans. Na tym etapie prototypu możesz
            dodać produkt do listy zakupów.
          </p>
        </Sheet>
      )}
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 text-base font-bold text-ink-900">{title}</h2>
      <div className="text-sm leading-relaxed text-ink-600">{children}</div>
    </section>
  );
}
