import { cn } from './cn';

/**
 * Marca do produto: um símbolo geométrico simples que sugere uma forminha de
 * doce vista de cima, sem cair em ilustração genérica.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('h-8 w-8', className)} aria-hidden="true">
      <rect width="32" height="32" rx="9" className="fill-rose-600" />
      <path
        d="M9.5 20.5c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="16" cy="10.5" r="2.2" className="fill-amber-300" />
      <path d="M8 22.5h16" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark className={compact ? 'h-7 w-7' : 'h-8 w-8'} />
      <span className="font-display text-lg font-semibold tracking-tight text-sand-800">
        Control<span className="text-rose-600">Dolces</span>
      </span>
    </span>
  );
}
