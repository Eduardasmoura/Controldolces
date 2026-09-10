import Link from 'next/link';

import { cn } from '@/components/ui/cn';
import { IconArrowRight, IconCheck } from '@/components/ui/icons';

export type ChecklistItem = {
  label: string;
  done: boolean;
  href?: string;
};

/**
 * "Comece por aqui".
 *
 * Cada item reflete um fato do banco — conta criada, negócio configurado,
 * ingrediente cadastrado, receita criada, precificação salva. Nada é marcado
 * por suposição, e o primeiro item pendente ganha o link, para haver sempre um
 * próximo passo óbvio.
 */
export function Checklist({ items }: { items: ChecklistItem[] }) {
  const concluidos = items.filter((item) => item.done).length;
  const proximoPendente = items.findIndex((item) => !item.done);

  if (proximoPendente === -1) return null;

  return (
    <section
      aria-labelledby="checklist-titulo"
      className="rounded-2xl border border-surface-border bg-surface p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="checklist-titulo" className="font-display text-lg font-bold text-content-strong">
          Comece por aqui
        </h2>
        <p className="text-sm text-content-subtle">
          {concluidos} de {items.length} concluídos
        </p>
      </div>

      <div
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-muted"
        role="progressbar"
        aria-valuenow={concluidos}
        aria-valuemin={0}
        aria-valuemax={items.length}
        aria-label="Progresso da configuração inicial"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500"
          style={{ width: `${(concluidos / items.length) * 100}%` }}
        />
      </div>

      <ol className="mt-5 space-y-1">
        {items.map((item, indice) => {
          const eOProximo = indice === proximoPendente;
          const conteudo = (
            <>
              <span
                aria-hidden="true"
                className={cn(
                  'grid h-6 w-6 shrink-0 place-items-center rounded-full border transition-colors',
                  item.done
                    ? 'border-success-500 bg-success-500 text-white'
                    : eOProximo
                      ? 'border-primary text-primary'
                      : 'border-surface-border text-content-subtle',
                )}
              >
                {item.done ? <IconCheck className="h-3.5 w-3.5" /> : null}
              </span>

              <span
                className={cn(
                  'flex-1',
                  item.done
                    ? 'text-content-subtle line-through decoration-content-subtle/40'
                    : eOProximo
                      ? 'font-medium text-content-strong'
                      : 'text-content-muted',
                )}
              >
                {item.label}
              </span>

              {eOProximo && item.href ? (
                <IconArrowRight className="h-4 w-4 shrink-0 text-primary" />
              ) : null}
            </>
          );

          return (
            <li key={item.label}>
              {eOProximo && item.href ? (
                <Link
                  href={item.href}
                  className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-primary-soft/40"
                >
                  {conteudo}
                  <span className="sr-only">— próximo passo</span>
                </Link>
              ) : (
                <div className="flex items-center gap-3 px-2 py-2.5">{conteudo}</div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
