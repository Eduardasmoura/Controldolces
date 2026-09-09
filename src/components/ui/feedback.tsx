import type { ReactNode } from 'react';

import { cn } from './cn';

type Tone = 'info' | 'success' | 'warning' | 'danger';

const TONES: Record<Tone, string> = {
  info: 'border-sand-200 bg-sand-50 text-sand-700',
  success: 'border-success-100 bg-success-50 text-success-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-danger-100 bg-danger-50 text-danger-700',
};

export function Alert({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: Tone;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('rounded-xl border px-4 py-3 text-sm leading-relaxed', TONES[tone], className)}
    >
      {title ? <p className="font-semibold">{title}</p> : null}
      {children ? <div className={cn(title && 'mt-1')}>{children}</div> : null}
    </div>
  );
}

const BADGE_TONES: Record<Tone, string> = {
  info: 'bg-sand-100 text-sand-600',
  success: 'bg-success-50 text-success-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-danger-50 text-danger-600',
};

export function Badge({ tone = 'info', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        BADGE_TONES[tone],
      )}
    >
      {children}
    </span>
  );
}

/**
 * Estado vazio: nunca uma tela em branco. Sempre explica o que falta e oferece
 * a próxima ação concreta.
 */
export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {icon ? (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
          {icon}
        </div>
      ) : null}
      <h3 className="font-display text-lg text-sand-800">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-sand-500">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton h-4 w-full', className)} aria-hidden="true" />;
}

/** Bloco de carregamento genérico das listas. */
export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-5" aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-1/5" />
          </div>
          <Skeleton className="h-3.5 w-16" />
        </div>
      ))}
    </div>
  );
}
