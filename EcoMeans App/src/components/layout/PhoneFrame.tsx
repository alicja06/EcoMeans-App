import type { ReactNode } from 'react';

export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[radial-gradient(circle_at_top,_#E6EDE3,_#EDEBE3_60%)] md:p-6">
      <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-canvas md:h-[844px] md:max-h-[calc(100dvh-48px)] md:w-[390px] md:rounded-[44px] md:border-[10px] md:border-ink-900 md:shadow-phone">
        {children}
      </div>
    </div>
  );
}
