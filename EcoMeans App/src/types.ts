export type RoomId =
  | 'kitchen'
  | 'bathroom'
  | 'toilet'
  | 'living'
  | 'bedroom'
  | 'hallway'
  | 'kids'
  | 'utility'
  | 'balcony'
  | 'other';

export type Frequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'custom';

export type HouseholdSize = 'alone' | 'partner' | 'several' | 'family';

export type TimeBudget = 'm10' | 'm20' | 'few-days' | 'one-day' | 'flexible';

export type DayPart = 'morning' | 'afternoon' | 'evening';

export type ScheduleStyle = 'spread' | 'block' | 'mix' | 'auto';

export type ApplianceId =
  | 'washer'
  | 'dishwasher'
  | 'oven'
  | 'fridge'
  | 'hood'
  | 'coffee'
  | 'vacuum'
  | 'aircon';

export type TaskSource = 'plan' | 'user';

export type ProductCategoryId = 'kitchen' | 'bathroom' | 'floors' | 'dishes';

export type TipCategoryId = 'kitchen' | 'bathroom' | 'floors' | 'whole-home' | 'eco' | 'products';

export type SoilLevel = 'light' | 'medium' | 'heavy';

export type WaterHardness = 'soft' | 'medium' | 'hard';

export interface Room {
  id: RoomId;
  name: string;
}

export interface CleaningTask {
  id: string;
  roomId: RoomId;
  title: string;
  frequency: Frequency;
  customDays: number | null;
  dueDate: string;
  lastDoneDate: string | null;
  previousDueDate: string | null;
  minutes: number;
  enabled: boolean;
  libraryId: string | null;
  scheduleNote: string | null;
  source: TaskSource;
}

export interface HomeProfile {
  household: HouseholdSize | null;
  smallChildren: boolean | null;
  pets: string;
  specialNeeds: string;
  places: RoomId[];
  appliances: ApplianceId[];
  timeBudget: TimeBudget | null;
  weekdays: boolean;
  weekends: boolean;
  dayParts: DayPart[];
  style: ScheduleStyle | null;
  onboardingComplete: boolean;
}

export interface HistoryEntry {
  id: string;
  taskId: string;
  title: string;
  roomId: RoomId;
  doneDate: string;
  doneAt: number;
}

export interface ShoppingItem {
  id: string;
  name: string;
  productId: string | null;
  bought: boolean;
}

export interface NotificationSettings {
  reminders: boolean;
  dailySummary: boolean;
  newTips: boolean;
}

export interface Profile {
  name: string;
  cleaningDay: number;
  notifications: NotificationSettings;
}

export interface AppState {
  tasks: CleaningTask[];
  history: HistoryEntry[];
  favoriteProductIds: string[];
  savedTipIds: string[];
  shoppingItems: ShoppingItem[];
  profile: Profile;
  home: HomeProfile;
}

export interface ProductCategory {
  id: ProductCategoryId;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  categoryId: ProductCategoryId;
  shortUse: string;
  description: string;
  purpose: string;
  usageSteps: string[];
  dosage: string;
  composition: string;
  tips: string[];
}

export interface TipCategory {
  id: TipCategoryId;
  name: string;
  description: string;
}

export interface Tip {
  id: string;
  categoryId: TipCategoryId;
  title: string;
  summary: string;
  readMinutes: number;
  intro: string;
  points: string[];
}

export type Route =
  | { name: 'home' }
  | { name: 'rooms' }
  | { name: 'room'; roomId: RoomId }
  | { name: 'products' }
  | { name: 'product'; productId: string }
  | { name: 'calculators' }
  | { name: 'tips' }
  | { name: 'tip'; tipId: string }
  | { name: 'shopping' }
  | { name: 'profile' }
  | { name: 'privacy' }
  | { name: 'plan' };
