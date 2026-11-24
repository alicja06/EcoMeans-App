interface WelcomeScreenProps {
  onStart: () => void;
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <main className="relative flex min-h-dvh w-full flex-col items-center justify-between overflow-hidden bg-[#f5e6ce] px-7 py-12 text-center">
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <style>{`
    @keyframes leaf-fall-a {
      0% { transform: translateY(-110vh) rotate(-35deg); opacity: 0; }
      15% { opacity: .9; }
      100% { transform: translateY(0) rotate(35deg); opacity: .9; }
    }

    @keyframes leaf-fall-b {
      0% { transform: translateY(-110vh) rotate(40deg); opacity: 0; }
      15% { opacity: .9; }
      100% { transform: translateY(0) rotate(-25deg); opacity: .9; }
    }

    @keyframes leaf-fall-c {
      0% { transform: translateY(-110vh) rotate(-20deg); opacity: 0; }
      15% { opacity: .9; }
      100% { transform: translateY(0) rotate(55deg); opacity: .9; }
    }

    @keyframes leaf-fall-d {
      0% { transform: translateY(-110vh) rotate(30deg); opacity: 0; }
      15% { opacity: .9; }
      100% { transform: translateY(0) rotate(-45deg); opacity: .9; }
    }

    .welcome-leaf {
      position: absolute;
      height: auto;
      animation-duration: 6s;
      animation-timing-function: cubic-bezier(.35,.05,.65,1);
      animation-fill-mode: both;
      animation-iteration-count: 1;
    }

    @media (prefers-reduced-motion: reduce) {
      .welcome-leaf {
        animation-duration: 0.01ms;
      }
    }
  `}</style>

        {[
          {
            viewBox: "82 0 24 9",
            left: "1%",
            top: "5%",
            width: 46,
            animation: "leaf-fall-a",
            delay: "0s",
          },
          {
            viewBox: "28 26 32 17",
            left: "10%",
            top: "18%",
            width: 38,
            animation: "leaf-fall-b",
            delay: ".3s",
          },
          {
            viewBox: "64 11 17 22",
            left: "2%",
            top: "32%",
            width: 55,
            animation: "leaf-fall-c",
            delay: ".6s",
          },
          {
            viewBox: "0 9 35 15",
            left: "11%",
            top: "46%",
            width: 40,
            animation: "leaf-fall-d",
            delay: ".9s",
          },
          {
            viewBox: "82 0 24 9",
            left: "4%",
            top: "62%",
            width: 48,
            animation: "leaf-fall-b",
            delay: "1.2s",
          },
          {
            viewBox: "64 11 17 22",
            left: "12%",
            top: "78%",
            width: 36,
            animation: "leaf-fall-a",
            delay: "1.5s",
          },

          {
            viewBox: "28 26 32 17",
            right: "2%",
            top: "8%",
            width: 40,
            animation: "leaf-fall-d",
            delay: ".2s",
          },
          {
            viewBox: "0 9 35 15",
            right: "10%",
            top: "22%",
            width: 54,
            animation: "leaf-fall-c",
            delay: ".5s",
          },
          {
            viewBox: "82 0 24 9",
            right: "3%",
            top: "37%",
            width: 36,
            animation: "leaf-fall-a",
            delay: ".8s",
          },
          {
            viewBox: "64 11 17 22",
            right: "12%",
            top: "53%",
            width: 48,
            animation: "leaf-fall-b",
            delay: "1.1s",
          },
          {
            viewBox: "28 26 32 17",
            right: "1%",
            top: "68%",
            width: 42,
            animation: "leaf-fall-c",
            delay: "1.4s",
          },
          {
            viewBox: "0 9 35 15",
            right: "10%",
            top: "83%",
            width: 56,
            animation: "leaf-fall-d",
            delay: "1.7s",
          },
        ].map((leaf, index) => (
          <svg
            key={index}
            viewBox={leaf.viewBox}
            className="welcome-leaf"
            style={{
              left: leaf.left,
              right: leaf.right,
              top: leaf.top,
              width: `${leaf.width}px`,
              animationName: leaf.animation,
              animationDelay: leaf.delay,
            }}
          >
            <image
              href="/latajace-zielone-liscie-ilustracja.svg"
              x="0"
              y="0"
              width="105.1"
              height="44"
            />
          </svg>
        ))}
      </div>

      <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center">
        <img
          src="/logo-ecomeans-zielone.png"
          alt="EcoMeans"
          className="mb-12 w-56 max-w-[75%] object-contain"
        />

        <h1 className="mb-5 text-5xl leading-tight text-[#3b742f]">
          Czysty dom.
          <br />
          Spokojna głowa.
        </h1>

        <p className="max-w-sm text-base leading-relaxed text-[#4e4d4d]">
          Zadbaj o dom w swoim rytmie. Zaplanuj porządki, podziel obowiązki i
          miej wszystko pod kontrolą.
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
