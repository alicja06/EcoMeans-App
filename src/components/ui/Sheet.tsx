import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface SheetProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function Sheet({ title, onClose, children, footer }: SheetProps) {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="absolute inset-0 z-50 flex items-end animate-fade-in">
      <button
        type="button"
        aria-label="Zamknij okno"
        onClick={onClose}
        className="absolute inset-0 bg-ink-900/40 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex max-h-[88%] w-full flex-col rounded-t-[32px] bg-canvas shadow-lift animate-sheet-up"
      >
        <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-ink-300" />
        <div className="flex items-center justify-between gap-4 px-6 pb-2 pt-4">
          <h2 className="text-lg font-bold leading-tight text-ink-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zamknij"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-600 transition hover:bg-ink-200"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-6 pb-6 pt-2">{children}</div>
        {footer && <div className="border-t border-ink-200 bg-white px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}
