'use client';

import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';

export default function OnboardingError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error('[controldolces] erro no onboarding', error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-5 text-center sm:px-6">
      <div className="flex justify-center">
        <Logo />
      </div>
      <h1 className="mt-8 font-display text-2xl font-bold text-content-strong">
        Não conseguimos continuar agora
      </h1>
      <p className="mt-3 leading-relaxed text-content-muted">
        Nada do que você respondeu se perdeu. Tente novamente em alguns instantes.
      </p>
      <div className="mt-6 flex justify-center">
        <Button type="button" onClick={reset}>
          Tentar novamente
        </Button>
      </div>
    </div>
  );
}
