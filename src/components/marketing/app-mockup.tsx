import type { ReactNode } from 'react';

import { cn } from '@/components/ui/cn';
import { formatCurrency, formatMarkup, formatNumber, formatPercent, formatUnitCost } from '@/lib/format';
import { BROWNIE_DEMO, brownieResult } from '@/lib/demo/brownie';
import { costPerBaseUnit, baseUnitOf, unitShort } from '@/lib/pricing';

/**
 * Telas do produto usadas na página inicial.
 *
 * Não são imagens nem ilustrações: são o mesmo HTML e as mesmas cores das telas
 * reais, com os números vindos do motor de cálculo. Quando a tela de verdade
 * mudar, trocar isto por um print é substituir um componente — a página não
 * depende de nenhum arquivo binário.
 *
 * Como é texto de verdade, o leitor de tela lê os valores; não há imagem sem alt.
 */

const resultado = brownieResult();

export function MockWindow({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-surface-border bg-surface shadow-lift',
        className,
      )}
    >
      <div className="flex items-center gap-1.5 border-b border-surface-border bg-surface-muted px-4 py-2.5">
        <span className="h-2 w-2 rounded-full bg-sand-300" aria-hidden="true" />
        <span className="h-2 w-2 rounded-full bg-sand-300" aria-hidden="true" />
        <span className="h-2 w-2 rounded-full bg-sand-300" aria-hidden="true" />
        <p className="ml-2 truncate text-xs font-medium text-content-subtle">{label}</p>
      </div>
      {children}
    </div>
  );
}

/** Tela de resultado — a prova visual do Hero. */
export function PricingScreen({ compact = false }: { compact?: boolean }) {
  const barras = [
    { chave: 'ingredients' as const, rotulo: 'Ingredientes', cor: 'bg-primary' },
    { chave: 'packaging' as const, rotulo: 'Embalagem', cor: 'bg-accent' },
    { chave: 'labor' as const, rotulo: 'Mão de obra', cor: 'bg-rose-300' },
    { chave: 'gas' as const, rotulo: 'Gás', cor: 'bg-amber-300' },
    { chave: 'energy' as const, rotulo: 'Energia', cor: 'bg-sand-400' },
  ];

  return (
    <MockWindow label="Precificação · Brownie">
      <div className="space-y-4 p-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-surface-border px-4 py-3">
            <p className="text-[0.7rem] font-medium text-content-subtle">Custo por unidade</p>
            <p className="mt-0.5 font-display text-xl font-bold tabular-nums text-content-strong">
              {formatCurrency(resultado.unit.total)}
            </p>
          </div>
          <div className="rounded-xl bg-primary px-4 py-3">
            <p className="text-[0.7rem] font-medium text-primary-soft">Preço sugerido</p>
            <p className="mt-0.5 font-display text-xl font-bold tabular-nums text-primary-contrast">
              {formatCurrency(resultado.recommendedPrice)}
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-3 gap-3 rounded-xl bg-surface-muted px-4 py-3">
          <div>
            <dt className="text-[0.7rem] text-content-subtle">Lucro/un.</dt>
            <dd className="text-sm font-bold tabular-nums text-content">
              {formatCurrency(resultado.recommended.profitPerUnit)}
            </dd>
          </div>
          <div>
            <dt className="text-[0.7rem] text-content-subtle">Margem</dt>
            <dd className="text-sm font-bold tabular-nums text-content">
              {formatPercent(resultado.recommended.marginPercent, 0)}
            </dd>
          </div>
          <div>
            <dt className="text-[0.7rem] text-content-subtle">Preço mínimo</dt>
            <dd className="text-sm font-bold tabular-nums text-content">
              {formatCurrency(resultado.minimumPrice)}
            </dd>
          </div>
        </dl>

        {compact ? (
          // Fecha a história da demonstração: o preço vira dinheiro no fim do lote.
          <p className="rounded-xl border border-dashed border-surface-border px-4 py-2.5 text-xs text-content-muted">
            Vendendo as {resultado.yieldQuantity} unidades por{' '}
            {formatCurrency(resultado.recommendedPrice)}, sobram{' '}
            <strong className="font-semibold text-content-strong">
              {formatCurrency(resultado.recommended.profitPerBatch)}
            </strong>{' '}
            de lucro · markup {formatMarkup(resultado.recommended.markup)}
          </p>
        ) : (
          <div>
            <p className="text-xs font-medium text-content-subtle">Composição do custo</p>
            <div
              className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-surface-muted"
              aria-hidden="true"
            >
              {barras.map((barra) => (
                <div
                  key={barra.chave}
                  className={barra.cor}
                  style={{ width: `${(resultado.unit[barra.chave] / resultado.unit.total) * 100}%` }}
                />
              ))}
            </div>
            <ul className="mt-3 space-y-1.5">
              {barras.map((barra) => (
                <li key={barra.chave} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-content-muted">
                    <span className={cn('h-2 w-2 rounded-full', barra.cor)} aria-hidden="true" />
                    {barra.rotulo}
                  </span>
                  <span className="tabular-nums text-content-muted">
                    {formatCurrency(resultado.unit[barra.chave])}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </MockWindow>
  );
}

/** Tela 1 da demonstração: ingredientes com o custo por medida. */
export function IngredientsScreen() {
  const linhas = BROWNIE_DEMO.ingredients.slice(0, 4);

  return (
    <MockWindow label="Ingredientes">
      <ul className="divide-y divide-surface-border">
        {linhas.map((ingrediente) => {
          const porMedida = costPerBaseUnit(ingrediente);
          return (
            <li key={ingrediente.ingredientId} className="flex items-center gap-3 px-4 py-2.5">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium text-content">
                  {ingrediente.name}
                </span>
                <span className="block text-[0.7rem] text-content-subtle">
                  {formatNumber(ingrediente.purchaseQuantity)} {unitShort(ingrediente.purchaseUnit)} ·{' '}
                  {formatCurrency(ingrediente.purchasePrice)}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-xs font-semibold tabular-nums text-content">
                  {formatUnitCost(porMedida)}
                </span>
                <span className="block text-[0.7rem] text-content-subtle">
                  por {unitShort(baseUnitOf(ingrediente.purchaseUnit))}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </MockWindow>
  );
}

/** Tela 2 da demonstração: a ficha técnica. */
export function RecipeScreen() {
  return (
    <MockWindow label="Ficha técnica · Brownie">
      <div className="p-4">
        <p className="text-[0.7rem] text-content-subtle">
          Rende {resultado.yieldQuantity} unidades
        </p>
        <ul className="mt-2.5 space-y-1.5">
          {resultado.ingredientLines.slice(0, 4).map((linha) => (
            <li key={linha.ingredientId} className="flex items-center justify-between gap-3 text-xs">
              <span className="min-w-0 truncate text-content-muted">{linha.name}</span>
              <span className="shrink-0 tabular-nums text-content-subtle">
                {formatNumber(linha.quantity)} {unitShort(linha.unit)}
              </span>
              <span className="w-16 shrink-0 text-right font-medium tabular-nums text-content">
                {formatCurrency(linha.batchCost)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center justify-between border-t border-surface-border pt-2.5 text-xs">
          <span className="font-semibold text-content-strong">Custo dos ingredientes</span>
          <span className="font-semibold tabular-nums text-content-strong">
            {formatCurrency(resultado.batch.ingredients)}
          </span>
        </div>
      </div>
    </MockWindow>
  );
}

/** Tela 3 da demonstração: os custos que não são ingrediente. */
export function CostsScreen() {
  const itens = [
    { rotulo: 'Embalagem', valor: resultado.batch.packaging, detalhe: 'por unidade' },
    { rotulo: 'Mão de obra', valor: resultado.batch.labor, detalhe: '48 min a R$ 25/h' },
    { rotulo: 'Gás', valor: resultado.batch.gas, detalhe: 'por fornada' },
    { rotulo: 'Energia', valor: resultado.batch.energy, detalhe: 'por fornada' },
  ];

  return (
    <MockWindow label="Custos · Brownie">
      <ul className="divide-y divide-surface-border">
        {itens.map((item) => (
          <li key={item.rotulo} className="flex items-center justify-between gap-3 px-4 py-2.5">
            <span className="min-w-0">
              <span className="block text-xs font-medium text-content">{item.rotulo}</span>
              <span className="block text-[0.7rem] text-content-subtle">{item.detalhe}</span>
            </span>
            <span className="shrink-0 text-xs font-semibold tabular-nums text-content">
              {formatCurrency(item.valor)}
            </span>
          </li>
        ))}
        <li className="flex items-center justify-between gap-3 bg-surface-muted px-4 py-2.5">
          <span className="text-xs font-semibold text-content-strong">Custo total da receita</span>
          <span className="text-xs font-bold tabular-nums text-content-strong">
            {formatCurrency(resultado.batch.total)}
          </span>
        </li>
      </ul>
    </MockWindow>
  );
}

export { resultado as brownieDemoResult };
