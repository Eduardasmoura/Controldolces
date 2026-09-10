import type { ReactNode } from 'react';

import { cn } from '@/components/ui/cn';

/** Faixa de seção: cuida do espaçamento vertical e das margens laterais. */
export function Section({
  id,
  tone = 'default',
  className,
  children,
}: {
  id?: string;
  /** `default` sobre o fundo da página, `surface` em branco, `soft` em rosa claro. */
  tone?: 'default' | 'surface' | 'soft';
  className?: string;
  children: ReactNode;
}) {
  const tones = {
    default: '',
    surface: 'border-y border-surface-border bg-surface',
    soft: 'bg-primary-soft/45',
  } as const;

  return (
    <section id={id} className={cn('scroll-mt-20', tones[tone], className)}>
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20 lg:py-24">{children}</div>
    </section>
  );
}

/**
 * Título de seção.
 *
 * O olho tem uma ordem de leitura: etiqueta curta, título, e só então a
 * explicação. Centralizar é opcional porque texto longo centralizado cansa.
 */
export function SectionTitle({
  eyebrow,
  title,
  description,
  align = 'left',
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: 'left' | 'center';
  className?: string;
}) {
  return (
    <header
      className={cn(
        'max-w-2xl',
        align === 'center' && 'mx-auto text-center',
        className,
      )}
    >
      {eyebrow ? (
        <p className="text-sm font-semibold text-primary">{eyebrow}</p>
      ) : null}
      <h2
        className={cn(
          'text-balance font-display text-3xl font-bold tracking-display-tight text-content-strong sm:text-4xl',
          eyebrow && 'mt-2',
        )}
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-lg leading-relaxed text-content-muted">{description}</p>
      ) : null}
    </header>
  );
}
