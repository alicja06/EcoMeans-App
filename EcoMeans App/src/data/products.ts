import type { Product, ProductCategory } from '@/types';

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  { id: 'kitchen', name: 'Kuchnia' },
  { id: 'bathroom', name: 'Łazienka' },
  { id: 'floors', name: 'Podłogi' },
  { id: 'dishes', name: 'Naczynia' },
];

const DEMO_COMPOSITION =
  'Dane demonstracyjne. Skład i oznaczenia zostaną uzupełnione na podstawie zatwierdzonej karty produktu.';

const DEMO_DOSAGE =
  'Dane demonstracyjne. Dokładne dawkowanie zostanie podane na podstawie zatwierdzonej karty produktu.';

export const PRODUCTS: Product[] = [
  {
    id: 'kitchen-foam',
    name: 'EcoMeans Kuchnia',
    categoryId: 'kitchen',
    shortUse: 'Pianka do czyszczenia blatów i powierzchni w kuchni.',
    description:
      'Pianka do codziennego czyszczenia kuchennych powierzchni, takich jak blaty czy zlew.',
    purpose: 'Czyszczenie blatów, zlewu i innych powierzchni roboczych w kuchni.',
    usageSteps: [
      'Spryskaj zabrudzoną powierzchnię pianką.',
      'Odczekaj chwilę, aż preparat zadziała.',
      'Przetrzyj czystą ściereczką i w razie potrzeby przemyj wodą.',
    ],
    dosage: DEMO_DOSAGE,
    composition: DEMO_COMPOSITION,
    tips: [
      'Przed pierwszym użyciem sprawdź preparat na małym, mało widocznym fragmencie.',
      'Nie mieszaj go z innymi środkami czystości.',
    ],
  },
  {
    id: 'bathroom-foam',
    name: 'EcoMeans Łazienka',
    categoryId: 'bathroom',
    shortUse: 'Pianka do czyszczenia łazienkowych powierzchni.',
    description:
      'Pianka przeznaczona do regularnego czyszczenia umywalki, wanny i innych powierzchni w łazience.',
    purpose: 'Czyszczenie umywalki, kabiny prysznicowej i innych powierzchni w łazience.',
    usageSteps: [
      'Spryskaj powierzchnię, zaczynając od góry.',
      'Odczekaj chwilę, aby pianka mogła działać.',
      'Zetrzyj zabrudzenia i dokładnie wypłucz powierzchnię.',
    ],
    dosage: DEMO_DOSAGE,
    composition: DEMO_COMPOSITION,
    tips: [
      'Wietrz pomieszczenie podczas sprzątania.',
      'Używaj osobnej ściereczki do umywalki i do toalety.',
    ],
  },
  {
    id: 'floor-concentrate',
    name: 'EcoMeans Podłoga',
    categoryId: 'floors',
    shortUse: 'Koncentrat do mycia podłóg, dozowany w mililitrach na wodę.',
    description:
      'Koncentrat do mycia podłóg. Wymaga rozcieńczenia w wodzie zgodnie z dawkowaniem.',
    purpose: 'Mycie podłóg w domu, w zależności od stopnia zabrudzenia.',
    usageSteps: [
      'Odkurz lub zamiataj podłogę przed myciem.',
      'Odmierz koncentrat zgodnie z wybranym sposobem mycia.',
      'Dodaj go do wody, wymieszaj i umyj podłogę.',
      'Pozostaw podłogę do wyschnięcia.',
    ],
    dosage:
      'Standardowe mycie: 25–50 ml na 5 litrów wody. Silniejsze zabrudzenia: 100 ml na 5 litrów wody. Skorzystaj z kalkulatora, aby obliczyć ilość dla swojej wody.',
    composition: DEMO_COMPOSITION,
    tips: [
      'Zacznij od mniejszej dawki i zwiększ ją tylko przy mocniejszych zabrudzeniach.',
      'Nie dodawaj większej ilości niż zalecana, bo może to zostawiać smugi.',
    ],
  },
  {
    id: 'floor-shine',
    name: 'EcoMeans Efekt Połysku',
    categoryId: 'floors',
    shortUse: 'Preparat do pielęgnacji podłóg nadający połysk.',
    description: 'Preparat do pielęgnacji podłóg, który ma nadawać powierzchni estetyczny wygląd.',
    purpose: 'Pielęgnacja i nadanie połysku podłogom.',
    usageSteps: [
      'Upewnij się, że podłoga jest czysta i sucha.',
      'Nanieś cienką, równomierną warstwę preparatu.',
      'Pozostaw do wyschnięcia zgodnie z zaleceniami.',
    ],
    dosage: DEMO_DOSAGE,
    composition: DEMO_COMPOSITION,
    tips: [
      'Nanoś cienką warstwę, zamiast dużej ilości preparatu.',
      'Nie stosuj go na podłogach, do których nie jest przeznaczony.',
    ],
  },
  {
    id: 'dish-soap',
    name: 'EcoMeans Płyn do naczyń',
    categoryId: 'dishes',
    shortUse: 'Płyn do mycia naczyń ręcznie.',
    description: 'Płyn do ręcznego mycia naczyń, przeznaczony do codziennego użytku w kuchni.',
    purpose: 'Mycie naczyń, sztućców i garnków.',
    usageSteps: [
      'Dodaj niewielką ilość płynu do gąbki lub do wody.',
      'Umyj naczynia i zabrudzone fragmenty.',
      'Dokładnie wypłucz naczynia wodą.',
    ],
    dosage: DEMO_DOSAGE,
    composition: DEMO_COMPOSITION,
    tips: [
      'Dozuj płyn oszczędnie, a w razie potrzeby dodaj więcej.',
      'Skorzystaj z kalkulatora naczyń, aby lepiej dobrać dawkę do zabrudzenia i wody.',
    ],
  },
];

export function findProduct(productId: string): Product | undefined {
  return PRODUCTS.find((product) => product.id === productId);
}

export function findProductCategory(categoryId: Product['categoryId']): ProductCategory | undefined {
  return PRODUCT_CATEGORIES.find((category) => category.id === categoryId);
}
