
interface WelcomeScreenProps {
  onStart: () => void;
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <main className="relative flex min-h-dvh w-full flex-col items-center justify-between overflow-hidden bg-[#f5e6ce] px-7 py-12 text-center">
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#73a62d]/10" />
      <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-[#3b742f]/10" />

      <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center">
        <img
          src="/logo-ecomeans-zielone.png"
          alt="EcoMeans"
          className="mb-12 w-56 max-w-[75%] object-contain"
        />

        <div className="mb-8 flex h-64 w-full max-w-sm items-center justify-center rounded-[2.5rem] bg-white/40">
          <span className="text-8xl" role="img" aria-label="Dom i rośliny">
            🏡🌿
          </span>
        </div>

        <h1 className="mb-5 text-5xl leading-tight text-[#3b742f]">
          Czysty dom.
          <br />
          Spokojna głowa.
        </h1>

        <p className="max-w-sm text-base leading-relaxed text-[#4e4d4d]">
          Zadbaj o dom w swoim rytmie. Zaplanuj porządki, podziel obowiązki
          i miej wszystko pod kontrolą.
        </p>
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <button
          type="button"
          onClick={onStart}
          className="w-full rounded-2xl bg-[#3b742f] px-6 py-4 text-lg font-bold text-white shadow-md transition hover:bg-[#315f27] active:scale-[0.98]"
        >
          Zaczynamy!
        </button>

        <p className="mt-5 text-sm text-[#4e4d4d]/70">
          Twój dom, Twoje tempo, Twój porządek.
        </p>
      </div>
    </main>
  );
}
