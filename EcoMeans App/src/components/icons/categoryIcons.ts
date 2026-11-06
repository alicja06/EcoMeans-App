import type { LucideIcon } from 'lucide-react';
import { Bath, BedDouble, Brush, ChefHat, DoorOpen, Droplets, FlaskConical, Home, Layers, Leaf, Package, Sofa } from 'lucide-react';
import type { ProductCategoryId, RoomId, TipCategoryId } from '@/types';

export const ROOM_ICONS: Record<RoomId, LucideIcon> = {
  kitchen: ChefHat,
  bathroom: Bath,
  living: Sofa,
  bedroom: BedDouble,
  hallway: DoorOpen,
  other: Package,
};

export const PRODUCT_CATEGORY_ICONS: Record<ProductCategoryId, LucideIcon> = {
  kitchen: ChefHat,
  bathroom: Bath,
  floors: Layers,
  dishes: Droplets,
};

export const TIP_CATEGORY_ICONS: Record<TipCategoryId, LucideIcon> = {
  kitchen: ChefHat,
  bathroom: Bath,
  floors: Brush,
  'whole-home': Home,
  eco: Leaf,
  products: FlaskConical,
};
