import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { DemoNotice } from '@/components/ui/controls';
import { useNavigation } from '@/store/NavigationContext';

export function PrivacyScreen() {
  const { goBack } = useNavigation();
  return (
    <>
      <ScreenHeader title="Polityka prywatności" onBack={goBack} />
      <div className="flex flex-col gap-4 px-5 pt-2 text-sm leading-relaxed text-ink-600">
        <DemoNotice text="Poniższy tekst jest szkicem. Ostateczna polityka prywatności zostanie przygotowana przed publikacją." />
        <p>Dane prototypu, takie jak zadania, lista zakupów i ustawienia, są zapisywane wyłącznie w pamięci tej przeglądarki.</p>
        <p>Aplikacja nie zakłada kont użytkowników i nie wysyła danych do zewnętrznych usług na tym etapie.</p>
        <p>Możesz w każdej chwili zresetować dane prototypu w sekcji Profil.</p>
      </div>
    </>
  );
}
