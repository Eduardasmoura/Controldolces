'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/components/ui/cn';
import { IconClose } from '@/components/ui/icons';
import { INGREDIENT_CATEGORIES, SEM_CATEGORIA } from '@/lib/ingredient-categories';

/**
 * Busca e filtro da listagem.
 *
 * O estado vive na URL, não em memória: a busca pode ser compartilhada, o botão
 * voltar funciona e recarregar a página não perde o filtro. A digitação espera
 * 300 ms antes de navegar, para não disparar uma consulta por tecla.
 */
export function IngredientFilters({
  search,
  category,
  includeInactive,
  total,
}: {
  search: string;
  category: string;
  includeInactive: boolean;
  total: number;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [termo, setTermo] = useState(search);
  const primeiraRenderizacao = useRef(true);

  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }

    const temporizador = setTimeout(() => {
      const novos = new URLSearchParams(params.toString());
      if (termo.trim()) novos.set('busca', termo.trim());
      else novos.delete('busca');
      novos.delete('pagina');
      router.replace(`/ingredientes?${novos.toString()}`, { scroll: false });
    }, 300);

    return () => clearTimeout(temporizador);
  }, [termo, params, router]);

  function navegar(chave: string, valor: string | null) {
    const novos = new URLSearchParams(params.toString());
    if (valor) novos.set(chave, valor);
    else novos.delete(chave);
    novos.delete('pagina');
    router.replace(`/ingredientes?${novos.toString()}`, { scroll: false });
  }

  const temFiltro = Boolean(search || category || includeInactive);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <label htmlFor="busca-ingrediente" className="sr-only">
            Buscar ingrediente pelo nome
          </label>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-content-subtle"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 4 4" strokeLinecap="round" />
            </svg>
          </span>
          <input
            id="busca-ingrediente"
            type="search"
            value={termo}
            onChange={(evento) => setTermo(evento.target.value)}
            placeholder="Buscar ingrediente..."
            className="h-11 w-full rounded-xl border border-surface-border bg-surface pl-10 pr-3.5 text-[16px] text-content placeholder:text-content-subtle"
          />
        </div>

        <div>
          <label htmlFor="filtro-categoria" className="sr-only">
            Filtrar por categoria
          </label>
          <select
            id="filtro-categoria"
            value={category}
            onChange={(evento) => navegar('categoria', evento.target.value || null)}
            className="h-11 w-full rounded-xl border border-surface-border bg-surface px-3.5 pr-9 text-[16px] text-content sm:w-52"
          >
            <option value="">Todas as categorias</option>
            {INGREDIENT_CATEGORIES.map((categoria) => (
              <option key={categoria} value={categoria}>
                {categoria}
              </option>
            ))}
            <option value={SEM_CATEGORIA}>Sem categoria</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-content-muted">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(evento) => navegar('inativos', evento.target.checked ? '1' : null)}
            className="h-4 w-4 rounded border-surface-border text-primary focus-visible:ring-primary"
          />
          Mostrar desativados
        </label>

        <div className="flex items-center gap-3">
          <p aria-live="polite" className="text-sm text-content-subtle">
            {total === 0
              ? 'Nenhum resultado'
              : `${total} ${total === 1 ? 'ingrediente' : 'ingredientes'}`}
          </p>
          {temFiltro ? (
            <button
              type="button"
              onClick={() => {
                setTermo('');
                router.replace('/ingredientes', { scroll: false });
              }}
              className={cn(
                'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm',
                'text-content-muted hover:bg-surface-muted hover:text-content-strong',
              )}
            >
              <IconClose className="h-3.5 w-3.5" />
              Limpar
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
