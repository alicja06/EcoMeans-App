import type { ApplianceId, Frequency, HomeProfile, RoomId } from '@/types';
import { busyHome, hasPets } from '@/data/home';
import { hasPlace } from '@/data/rooms';

export interface LibraryTask {
  id: string;
  title: string;
  roomId: RoomId;
  frequency: Frequency;
  customDays: number | null;
  minutes: number;
  priority: number;
  scheduleNote: string | null;
  include: (home: HomeProfile) => boolean;
  tune?: (home: HomeProfile) => Partial<Pick<LibraryTask, 'title' | 'roomId' | 'frequency' | 'customDays' | 'minutes' | 'scheduleNote'>>;
}

function task(
  id: string,
  title: string,
  roomId: RoomId,
  frequency: Frequency,
  customDays: number | null,
  minutes: number,
  priority: number,
  include: (home: HomeProfile) => boolean,
  scheduleNote: string | null = null,
  tune?: LibraryTask['tune'],
): LibraryTask {
  return { id, title, roomId, frequency, customDays, minutes, priority, scheduleNote, include, tune };
}

function hasAppliance(home: HomeProfile, id: ApplianceId): boolean {
  return home.appliances.includes(id);
}

function serviceRoom(home: HomeProfile): RoomId {
  if (hasPlace(home.places, 'utility')) return 'utility';
  if (hasPlace(home.places, 'bathroom')) return 'bathroom';
  return 'other';
}

function vacuumTitle(home: HomeProfile): string {
  const names: string[] = [];
  if (hasPlace(home.places, 'living')) names.push('salonu');
  if (hasPlace(home.places, 'hallway')) names.push('przedpokoju');
  if (names.length >= 2) return `Odkurzanie ${names[0]} i ${names[1]}`;
  if (names.length === 1) return `Odkurzanie ${names[0]}`;
  if (hasPlace(home.places, 'bedroom')) return 'Odkurzanie sypialni';
  if (hasPlace(home.places, 'kids')) return 'Odkurzanie pokoju dziecięcego';
  return 'Odkurzanie';
}

function vacuumRoom(home: HomeProfile): RoomId {
  if (hasPlace(home.places, 'living')) return 'living';
  if (hasPlace(home.places, 'hallway')) return 'hallway';
  if (hasPlace(home.places, 'bedroom')) return 'bedroom';
  if (hasPlace(home.places, 'kids')) return 'kids';
  return 'other';
}

const livingSpaces = (home: HomeProfile) =>
  hasPlace(home.places, 'living') ||
  hasPlace(home.places, 'bedroom') ||
  hasPlace(home.places, 'hallway') ||
  hasPlace(home.places, 'kids');

// Częstotliwości są przykładowymi wartościami startowymi, a nie uniwersalnymi zaleceniami.
export const TASK_LIBRARY: LibraryTask[] = [
  task('k-blaty', 'Mycie blatów', 'kitchen', 'daily', null, 5, 1, (home) => hasPlace(home.places, 'kitchen')),
  task('k-zlew', 'Czyszczenie zlewu', 'kitchen', 'custom', 3, 5, 4, (home) => hasPlace(home.places, 'kitchen'), 'Kilka razy w tygodniu', (home) =>
    busyHome(home) ? { customDays: 2 } : {},
  ),
  task(
    'k-piekarnik',
    'Czyszczenie piekarnika',
    'kitchen',
    'quarterly',
    null,
    40,
    30,
    (home) => hasAppliance(home, 'oven'),
    'Okresowo, zależnie od używania',
  ),
  task('k-lodowka', 'Czyszczenie lodówki', 'kitchen', 'monthly', null, 30, 20, (home) => hasAppliance(home, 'fridge'), 'Raz w miesiącu'),
  task(
    'k-okap',
    'Czyszczenie okapu',
    'kitchen',
    'custom',
    60,
    20,
    24,
    (home) => hasAppliance(home, 'hood'),
    'Co 1–3 miesiące',
  ),
  task(
    'b-umywalka',
    'Mycie umywalki',
    'bathroom',
    'custom',
    3,
    5,
    3,
    (home) => hasPlace(home.places, 'bathroom'),
    'Kilka razy w tygodniu',
    (home) => (home.smallChildren || home.household === 'family' ? { customDays: 2 } : {}),
  ),
  task(
    'b-toaleta',
    'Czyszczenie toalety',
    'bathroom',
    'custom',
    3,
    10,
    2,
    (home) => hasPlace(home.places, 'bathroom') || hasPlace(home.places, 'toilet'),
    'Kilka razy w tygodniu',
    (home) => ({
      roomId: hasPlace(home.places, 'bathroom') ? 'bathroom' : 'toilet',
      customDays: home.smallChildren || home.household === 'family' ? 2 : 3,
    }),
  ),
  task('b-kabina', 'Mycie kabiny prysznicowej', 'bathroom', 'weekly', null, 20, 8, (home) => hasPlace(home.places, 'bathroom'), 'Raz w tygodniu'),
  task(
    'b-armatura',
    'Odkamienianie armatury',
    'bathroom',
    'custom',
    60,
    15,
    22,
    (home) => hasPlace(home.places, 'bathroom'),
    'Okresowo',
  ),
  task(
    'b-odplywy',
    'Czyszczenie odpływów',
    'bathroom',
    'monthly',
    null,
    15,
    18,
    (home) => hasPlace(home.places, 'bathroom') || hasPlace(home.places, 'toilet'),
    'Raz w miesiącu',
    (home) => ({ roomId: hasPlace(home.places, 'bathroom') ? 'bathroom' : 'toilet' }),
  ),
  task('a-pralka', 'Czyszczenie pralki', 'other', 'custom', 90, 20, 26, (home) => hasAppliance(home, 'washer'), 'Np. co 3 miesiące', (home) => ({
    roomId: serviceRoom(home),
  })),
  task(
    'a-zmywarka',
    'Czyszczenie zmywarki',
    'kitchen',
    'custom',
    60,
    15,
    25,
    (home) => hasAppliance(home, 'dishwasher'),
    'Np. co 1–3 miesiące',
  ),
  task(
    'a-filtr',
    'Czyszczenie filtra zmywarki',
    'kitchen',
    'monthly',
    null,
    5,
    16,
    (home) => hasAppliance(home, 'dishwasher'),
    'Np. raz w miesiącu',
  ),
  task(
    'a-ekspres',
    'Czyszczenie ekspresu',
    'kitchen',
    'custom',
    30,
    15,
    21,
    (home) => hasAppliance(home, 'coffee'),
    'Według instrukcji i komunikatów urządzenia',
  ),
  task(
    'a-odkurzacz',
    'Czyszczenie odkurzacza',
    'other',
    'custom',
    30,
    10,
    19,
    (home) => hasAppliance(home, 'vacuum'),
    'Zależnie od rodzaju i intensywności użytkowania',
    (home) => ({
      roomId: serviceRoom(home),
      customDays: hasPets(home) ? 14 : 30,
    }),
  ),
  task(
    'a-klima',
    'Czyszczenie klimatyzacji',
    'other',
    'quarterly',
    null,
    30,
    35,
    (home) => hasAppliance(home, 'aircon'),
    'Okresowo, według instrukcji urządzenia',
    (home) => ({ roomId: serviceRoom(home) }),
  ),
  task('o-odkurzanie', 'Odkurzanie', 'living', 'custom', 3, 20, 5, livingSpaces, '1–3 razy w tygodniu', (home) => ({
    title: vacuumTitle(home),
    roomId: vacuumRoom(home),
    customDays: hasPets(home) || home.smallChildren || home.household === 'several' || home.household === 'family' ? 2 : 3,
    minutes: home.timeBudget === 'm10' ? 12 : 20,
  })),
  task(
    'o-podlogi',
    'Mycie podłóg',
    'hallway',
    'weekly',
    null,
    25,
    9,
    (home) => livingSpaces(home) || hasPlace(home.places, 'kitchen') || hasPlace(home.places, 'bathroom'),
    'Raz w tygodniu',
    (home) => ({
      roomId: hasPlace(home.places, 'hallway') ? 'hallway' : hasPlace(home.places, 'living') ? 'living' : 'kitchen',
      minutes: home.timeBudget === 'm10' ? 20 : 25,
    }),
  ),
  task('o-kurz', 'Ścieranie kurzu', 'living', 'weekly', null, 15, 7, (home) => livingSpaces(home), 'Raz w tygodniu', (home) => ({
    roomId: vacuumRoom(home),
    minutes: home.timeBudget === 'm10' ? 10 : 15,
  })),
  task(
    'o-okna',
    'Mycie okien',
    'other',
    'quarterly',
    null,
    60,
    40,
    (home) => home.places.length > 0,
    'Sezonowo lub według potrzeb',
  ),
  task(
    'o-zaslony',
    'Pranie zasłon i firan',
    'bedroom',
    'quarterly',
    null,
    30,
    42,
    (home) => hasPlace(home.places, 'bedroom') || hasPlace(home.places, 'living'),
    'Okresowo',
    (home) => ({ roomId: hasPlace(home.places, 'bedroom') ? 'bedroom' : 'living' }),
  ),
  task('o-posciel', 'Zmiana pościeli', 'bedroom', 'weekly', null, 15, 10, (home) => hasPlace(home.places, 'bedroom'), 'Raz w tygodniu'),
  task(
    'o-kids',
    'Porządki w pokoju dziecięcym',
    'kids',
    'weekly',
    null,
    15,
    11,
    (home) => hasPlace(home.places, 'kids'),
    'Raz w tygodniu',
  ),
  task(
    'o-balkon',
    'Zamiatanie balkonu lub tarasu',
    'balcony',
    'weekly',
    null,
    15,
    17,
    (home) => hasPlace(home.places, 'balcony'),
    'Raz w tygodniu',
  ),
  task(
    'o-legowisko',
    'Umyć legowisko zwierzęcia',
    'other',
    'weekly',
    null,
    10,
    6,
    (home) => hasPets(home),
    'Raz w tygodniu',
    (home) => ({
      title: `Umyć legowisko (${home.pets.trim()})`,
      roomId: hasPlace(home.places, 'living') ? 'living' : 'other',
    }),
  ),
];

export function libraryTasksForHome(home: HomeProfile): LibraryTask[] {
  return TASK_LIBRARY.filter((item) => item.include(home)).map((item) => {
    const tuned = item.tune?.(home) ?? {};
    return { ...item, ...tuned };
  });
}
