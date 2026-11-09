import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  actions?: ReactNode;
}

export function ScreenHeader({ title, subtitle, onBack, actions }: ScreenHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 bg-canvas/90 px-5 pb-3 pt-[max(env(safe-area-inset-top),16px)] backdrop-blur-md">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Wróć"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-ink-800 shadow-card transition hover:bg-ink-50 active:scale-95"
        >
          <ArrowLeft size={20} />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xl font-bold leading-tight text-ink-900">{title}</h1>
        {subtitle && <p className="truncate text-sm text-ink-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
