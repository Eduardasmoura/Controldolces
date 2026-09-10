import type { ReactNode } from 'react';

import { cn } from '@/components/ui/cn';
import { Logo } from '@/components/ui/logo';

const NOMES = ['Boas-vindas', 'Sobre você', 'Seu negócio', 'Seu objetivo'] as const;

/**
 * Moldura do onboarding.
 *
 * Uma pergunta por tela, com o progresso sempre à vista: saber que faltam duas
 * etapas é o que impede a usuária de desistir no meio.
 */
export function OnboardingShell({
  step,
  title,
  description,
  children,
  footer,
}: {
  /** 0 a 4. A etapa 4 é a conclusão e não aparece na barra de progresso. */
  step: number;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const total = NOMES.length;
  const atual = Math.min(step, total - 1);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 py-8 sm:px-6 sm:py-12">
      <Logo />

      {step < total ? (
        <div className="mt-8">
          <p className="text-sm font-medium text-content-subtle">
            Etapa {atual + 1} de {total} · {NOMES[atual]}
          </p>
          <ol className="mt-2 flex gap-1.5" aria-hidden="true">
            {NOMES.map((nome, indice) => (
              <li
                key={nome}
                className={cn(
                  'h-1.5 flex-1 rounded-full transition-colors',
                  indice <= atual ? 'bg-primary' : 'bg-surface-border',
                )}
              />
            ))}
          </ol>
        </div>
      ) : null}

      <div className="mt-8 flex-1">
        <h1 className="text-balance font-display text-3xl font-bold leading-tight tracking-display-tight text-content-strong">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 text-lg leading-relaxed text-content-muted">{description}</p>
        ) : null}

        <div className="mt-8">{children}</div>
      </div>

      {footer ? <div className="mt-8">{footer}</div> : null}
    </div>
  );
}
