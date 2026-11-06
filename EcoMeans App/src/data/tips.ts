import type { Tip, TipCategory } from '@/types';

export const TIP_CATEGORIES: TipCategory[] = [
  { id: 'kitchen', name: 'Kuchnia', description: 'Blaty, zlew i kuchenne sprzęty' },
  { id: 'bathroom', name: 'Łazienka', description: 'Umywalka, wanna i prysznic' },
  { id: 'floors', name: 'Podłogi', description: 'Częstotliwość i sposób mycia' },
  { id: 'whole-home', name: 'Cały dom', description: 'Plan i regularność sprzątania' },
  { id: 'eco', name: 'Ekologicznie', description: 'Mniej środków, mniej wody' },
  { id: 'products', name: 'Środki czystości', description: 'Bezpieczne stosowanie' },
];

export const TIPS: Tip[] = [
  {
    id: 'plan-whole-home',
    categoryId: 'whole-home',
    title: 'Jak zaplanować sprzątanie całego domu?',
    summary: 'Podziel obowiązki na pomieszczenia i częstotliwości, zamiast sprzątać wszystko naraz.',
    readMinutes: 4,
    intro:
      'Największą różnicę robi regularność. Zamiast jednego dużego sprzątania w weekend, rozłóż zadania na cały tydzień.',
    points: [
      'Zacznij od listy pomieszczeń i tego, co w każdym z nich brudzi się najczęściej.',
      'Codzienne drobiazgi, takie jak blaty czy zlew, zostaw na krótkie czynności.',
      'Cięższe prace, na przykład mycie kabiny prysznicowej, zaplanuj co kilka tygodni.',
      'Odhaczaj zadania w aplikacji po wykonaniu, aby widzieć postęp.',
    ],
  },
  {
    id: 'how-often-floors',
    categoryId: 'floors',
    title: 'Jak często należy myć podłogi?',
    summary: 'Częstotliwość zależy od ruchu w domu, zwierząt i tego, czy chodzi się w butach.',
    readMinutes: 3,
    intro:
      'Nie ma jednej właściwej odpowiedzi. Najlepiej obserwować, jak szybko podłoga się brudzi w Twoim domu.',
    points: [
      'W przedpokoju i kuchni z dużym ruchem myj podłogę raz w tygodniu lub częściej.',
      'W sypialni i salonie zwykle wystarczy mycie co dwa tygodnie.',
      'Odkurzaj lub zamiataj przed myciem, aby nie rozsmarowywać kurzu.',
      'Jeśli w domu są zwierzęta, częstsze odkurzanie pomaga utrzymać porządek.',
    ],
  },
  {
    id: 'dosage-how-much',
    categoryId: 'products',
    title: 'Ile środka czystości dodać do wody?',
    summary: 'Więcej nie znaczy lepiej. Sprawdź dawkowanie i skorzystaj z kalkulatora.',
    readMinutes: 4,
    intro:
      'Zbyt duża dawka rzadko czyści lepiej, za to może zostawiać smugi i film na powierzchni.',
    points: [
      'Sprawdź dawkowanie w karcie konkretnego produktu.',
      'Przy lekkim zabrudzeniu zacznij od mniejszej dawki i zwiększaj ją tylko w razie potrzeby.',
      'Kalkulator w aplikacji przelicza ilość koncentratu na litry wody.',
    ],
  },
  {
    id: 'avoid-streaks',
    categoryId: 'whole-home',
    title: 'Jak uniknąć smug na powierzchniach?',
    summary: 'Cienka warstwa preparatu, czysta ściereczka i wytarcie do sucha.',
    readMinutes: 3,
    intro: 'Smugi najczęściej pojawiają się przez zbyt dużo środka lub brudną ściereczkę.',
    points: [
      'Używaj czystej, suchej ściereczki z mikrofibry.',
      'Nie spryskuj nadmiernie. Cienka warstwa zwykle wystarcza.',
      'Przecieraj powierzchnię jednym, spokojnym ruchem, bez wracania po tym samym miejscu.',
      'Na koniec wytrzyj powierzchnię do sucha.',
    ],
  },
  {
    id: 'bathroom-properly',
    categoryId: 'bathroom',
    title: 'Jak prawidłowo czyścić łazienkę?',
    summary: 'Kolejność od góry do dołu i osobne ściereczki do różnych miejsc.',
    readMinutes: 5,
    intro:
      'Dobra kolejność oszczędza czas, bo brud, który spadnie z góry, nie zostanie na świeżo umytej podłodze.',
    points: [
      'Zacznij od luster i półek, potem umywalka i wanna lub kabina, na końcu podłoga.',
      'Umywalkę i toaletę czyść osobnymi ściereczkami.',
      'Wentyluj pomieszczenie podczas sprzątania i po nim.',
      'Regularnie wycieraj wilgoć, aby ograniczyć osad.',
    ],
  },
  {
    id: 'do-not-mix',
    categoryId: 'products',
    title: 'Dlaczego nie należy mieszać różnych środków czystości?',
    summary: 'Niektóre połączenia mogą wydzielać szkodliwe gazy. Bezpieczeństwo jest najważniejsze.',
    readMinutes: 3,
    intro:
      'Każdy preparat ma inny skład. Łączenie ich w ciemno może prowadzić do reakcji chemicznych, których nie chcesz wdychać.',
    points: [
      'Nigdy nie mieszaj preparatów z wybielaczem (chlorem) z kwasami, na przykład octem lub środkami do usuwania kamienia.',
      'Nie przelewaj różnych środków do jednego pojemnika.',
      'Po jednym środku dokładnie spłucz powierzchnię, zanim sięgniesz po kolejny.',
      'Zapewnij wentylację podczas sprzątania.',
    ],
  },
  {
    id: 'eco-cleaning',
    categoryId: 'eco',
    title: 'Jak ograniczyć zużycie środków czystości?',
    summary: 'Kilka prostych nawyków pozwala zużyć mniej preparatu i wody.',
    readMinutes: 3,
    intro:
      'Ekologiczne sprzątanie nie musi oznaczać więcej pracy. Często wystarczy zmienić kilka drobnych nawyków.',
    points: [
      'Dawkuj zgodnie z zaleceniami zamiast dolewać środek na oko.',
      'W lekkich zabrudzeniach zacznij od wody i ściereczki z mikrofibry.',
      'Sprzątaj regularnie, aby nie potrzebować mocniejszych środków.',
      'Dokładnie zakręcaj opakowania, aby preparat nie wysychał.',
    ],
  },
];

export function findTip(tipId: string): Tip | undefined {
  return TIPS.find((tip) => tip.id === tipId);
}

export function findTipCategory(categoryId: Tip['categoryId']): TipCategory | undefined {
  return TIP_CATEGORIES.find((category) => category.id === categoryId);
}
