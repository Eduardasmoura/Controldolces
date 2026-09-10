import Link from 'next/link';

import { cn } from '@/components/ui/cn';

/** Paginação simples: só aparece quando existe mais de uma página. */
export function Pagination({
  page,
  pageCount,
  buildHref,
}: {
  page: number;
  pageCount: number;
  buildHref: (page: number) => string;
}) {
  if (pageCount <= 1) return null;

  const estilo =
    'inline-flex h-10 items-center rounded-xl border border-surface-border bg-surface px-4 text-sm text-content hover:border-content-subtle/40';

  return (
    <nav
      aria-label="Paginação dos ingredientes"
      className="flex items-center justify-between gap-3 px-5 py-4 sm:px-6"
    >
      {page > 1 ? (
        <Link href={buildHref(page - 1)} className={estilo} rel="prev">
          Anterior
        </Link>
      ) : (
        <span className={cn(estilo, 'cursor-not-allowed opacity-50')} aria-disabled="true">
          Anterior
        </span>
      )}

      <p className="text-sm text-content-subtle">
        Página {page} de {pageCount}
      </p>

      {page < pageCount ? (
        <Link href={buildHref(page + 1)} className={estilo} rel="next">
          Próxima
        </Link>
      ) : (
        <span className={cn(estilo, 'cursor-not-allowed opacity-50')} aria-disabled="true">
          Próxima
        </span>
      )}
    </nav>
  );
}
