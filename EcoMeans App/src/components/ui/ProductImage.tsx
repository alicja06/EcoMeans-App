import type { LucideIcon } from 'lucide-react';
import { PRODUCT_CATEGORY_ICONS } from '@/components/icons/categoryIcons';
import type { ProductCategoryId } from '@/types';

const TINTS: Record<ProductCategoryId, string> = {
  kitchen: 'from-sage-100 to-sage-200 text-sage-700',
  bathroom: 'from-brand-50 to-brand-100 text-brand-700',
  floors: 'from-sand-100 to-sand-200 text-sand-700',
  dishes: 'from-ink-100 to-ink-200 text-ink-700',
};

export function ProductImage({
  categoryId,
  size = 'md',
  className = '',
}: {
  categoryId: ProductCategoryId;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const Icon: LucideIcon = PRODUCT_CATEGORY_ICONS[categoryId];
  const dimensions = {
    sm: 'h-20 w-20 rounded-2xl',
    md: 'h-full w-full rounded-2xl',
    lg: 'h-64 w-full rounded-3xl',
  }[size];
  const iconSize = size === 'lg' ? 72 : size === 'md' ? 32 : 28;

  return (
    <div
      role="img"
      aria-label="Zdjęcie demonstracyjne produktu"
      className={`relative flex shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br ${TINTS[categoryId]} ${dimensions} ${className}`}
    >
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/30" />
      <div className="absolute -bottom-8 -left-4 h-20 w-20 rounded-full bg-white/20" />
      <Icon size={iconSize} strokeWidth={1.6} className="relative" />
      {size === 'lg' && (
        <span className="absolute bottom-4 left-4 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-ink-700">
          Zdjęcie demonstracyjne
        </span>
      )}
    </div>
  );
}
