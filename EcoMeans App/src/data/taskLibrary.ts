import type { Frequency, RoomId } from '@/types';

export interface LibraryTask {
  id: string;
  title: string;
  roomId: RoomId;
  frequency: Frequency;
  customDays: number | null;
  minutes: number;
}

export interface LibraryGroup {
  id: string;
  name: string;
  tasks: LibraryTask[];
}

function task(
  id: string,
  title: string,
  roomId: RoomId,
  frequency: Frequency,
  customDays: number | null,
  minutes: number,
): LibraryTask {
  return { id, title, roomId, frequency, customDays, minutes };
}

// Częstotliwości są przykładowymi wartościami startowymi, a nie uniwersalnymi zaleceniami.
export const TASK_LIBRARY: LibraryGroup[] = [
  {
    id: 'kitchen',
    name: 'Kuchnia',
    tasks: [
      task('k-blaty', 'Mycie blatów', 'kitchen', 'daily', null, 5),
      task('k-zlew', 'Czyszczenie zlewu', 'kitchen', 'custom', 2, 5),
      task('k-piekarnik', 'Czyszczenie piekarnika', 'kitchen', 'quarterly', null, 45),
      task('k-lodowka', 'Czyszczenie lodówki', 'kitchen', 'monthly', null, 30),
      task('k-okap', 'Czyszczenie okapu', 'kitchen', 'custom', 60, 20),
    ],
  },
  {
    id: 'bathroom',
    name: 'Łazienka',
    tasks: [
      task('b-umywalka', 'Mycie umywalki', 'bathroom', 'custom', 3, 5),
      task('b-toaleta', 'Czyszczenie toalety', 'bathroom', 'custom', 3, 10),
      task('b-kabina', 'Mycie kabiny prysznicowej', 'bathroom', 'weekly', null, 20),
      task('b-armatura', 'Odkamienianie armatury', 'bathroom', 'custom', 60, 15),
      task('b-odplywy', 'Czyszczenie odpływów', 'bathroom', 'monthly', null, 15),
    ],
  },
  {
    id: 'appliances',
    name: 'Sprzęty AGD',
    tasks: [
      task('a-pralka', 'Czyszczenie pralki', 'other', 'custom', 90, 20),
      task('a-zmywarka', 'Czyszczenie zmywarki', 'kitchen', 'custom', 60, 15),
      task('a-filtr', 'Czyszczenie filtra zmywarki', 'kitchen', 'monthly', null, 5),
      task('a-ekspres', 'Czyszczenie ekspresu', 'kitchen', 'custom', 30, 15),
      task('a-odkurzacz', 'Czyszczenie odkurzacza', 'other', 'custom', 30, 10),
    ],
  },
  {
    id: 'other',
    name: 'Pozostałe pomieszczenia',
    tasks: [
      task('o-odkurzanie', 'Odkurzanie', 'living', 'custom', 3, 20),
      task('o-podlogi', 'Mycie podłóg', 'hallway', 'weekly', null, 25),
      task('o-kurz', 'Ścieranie kurzu', 'living', 'weekly', null, 15),
      task('o-okna', 'Mycie okien', 'other', 'quarterly', null, 60),
      task('o-zaslony', 'Pranie zasłon i firan', 'other', 'quarterly', null, 30),
    ],
  },
];
