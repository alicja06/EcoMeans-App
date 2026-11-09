import type { LucideIcon } from 'lucide-react';
import {
  Baby,
  Bath,
  BedDouble,
  Brush,
  ChefHat,
  DoorOpen,
  Droplets,
  FlaskConical,
  Flower2,
  Home,
  Layers,
  Leaf,
  Package,
  Sofa,
  Warehouse,
} from 'lucide-react';
import type { ProductCategoryId, RoomId, TipCategoryId } from '@/types';

export const ROOM_ICONS: Record<RoomId, LucideIcon> = {
  kitchen: ChefHat,
  bathroom: Bath,
  toilet: Droplets,
  living: Sofa,
  bedroom: BedDouble,
  hallway: DoorOpen,
  kids: Baby,
  utility: Warehouse,
  balcony: Flower2,
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
