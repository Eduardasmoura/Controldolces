'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/feedback';
import { formatCurrency, formatMarkup, formatPercent, parseNumberInput } from '@/lib/format';
import { simulatePrice, type PriceSimulation } from '@/lib/pricing';

/**
 * Simulador de preço.
 *
 * A usuária mexe no preço e vê lucro, margem e markup mudarem na hora. Os
 * números saem de `simulatePrice`, a mesma função usada no servidor — o
 * simulador não tem uma matemática própria.
 */
export function PriceSimulator({
  unitCost,
  yieldQuantity,
  variableFeesPercent,
  minimumPrice,
  recommendedPrice,
  onChange,
}: {
  unitCost: number;
  yieldQuantity: number;
  variableFeesPercent: number;
  minimumPrice: number;
  recommendedPrice: number;
  onChange?: (price: number) => void;
}) {
  const [text, setText] = useState(recommendedPrice.toFixed(2).replace('.', ','));

  const parsed = parseNumberInput(text);
  const price = parsed != null && parsed >= 0 ? parsed : 0;
  const simulation: PriceSimulation = simulatePrice(
    unitCost,
    price,
    variableFeesPercent,
    yieldQuantity,
  );

  useEffect(() => {
    onChange?.(price);
  }, [price, onChange]);

  function ajustar(delta: number) {
    const novo = Math.max(0, Math.round((price + delta) * 100) / 100);
    setText(novo.toFixed(2).replace('.', ','));
  }

  const abaixoDoMinimo = price > 0 && price < minimumPrice;

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="simulador-preco" className="block text-sm font-medium text-sand-700">
          Preço de venda
        </label>
        <div className="mt-1.5 flex items-stretch gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => ajustar(-0.5)}
            aria-label="Diminuir cinquenta centavos"
            className="w-12 shrink-0 text-lg"
          >
            −
          </Button>

          <div className="relative flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sand-500">
              R$
            </span>
            <input
              id="simulador-preco"
              inputMode="decimal"
              value={text}
              onChange={(event) => setText(event.target.value)}
              aria-describedby="simulador-ajuda"
              className="h-12 w-full rounded-xl border border-sand-200 bg-white pl-11 pr-3 text-center text-xl font-semibold tabular-nums text-sand-900"
            />
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={() => ajustar(0.5)}
            aria-label="Aumentar cinquenta centavos"
            className="w-12 shrink-0 text-lg"
          >
            +
          </Button>
        </div>

        <p id="simulador-ajuda" className="mt-2 text-xs text-sand-500">
          Custo por unidade: {formatCurrency(unitCost)} · Mínimo: {formatCurrency(minimumPrice)}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setText(minimumPrice.toFixed(2).replace('.', ','))}
            className="rounded-full border border-sand-200 bg-white px-3 py-1.5 text-xs text-sand-600 hover:border-rose-200 hover:text-rose-700"
          >
            Usar o mínimo
          </button>
          <button
            type="button"
            onClick={() => setText(recommendedPrice.toFixed(2).replace('.', ','))}
            className="rounded-full border border-sand-200 bg-white px-3 py-1.5 text-xs text-sand-600 hover:border-rose-200 hover:text-rose-700"
          >
            Usar o recomendado
          </button>
          <button
            type="button"
            onClick={() => setText(Math.ceil(recommendedPrice).toFixed(2).replace('.', ','))}
            className="rounded-full border border-sand-200 bg-white px-3 py-1.5 text-xs text-sand-600 hover:border-rose-200 hover:text-rose-700"
          >
            Arredondar para cima
          </button>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-sand-200 bg-white px-3.5 py-3">
          <dt className="text-xs text-sand-500">Custo</dt>
          <dd className="mt-0.5 text-base font-semibold tabular-nums text-sand-900">
            {formatCurrency(unitCost)}
          </dd>
        </div>
        <div className="rounded-xl border border-sand-200 bg-white px-3.5 py-3">
          <dt className="text-xs text-sand-500">Lucro</dt>
          <dd
            className={`mt-0.5 text-base font-semibold tabular-nums ${
              simulation.profitPerUnit < 0 ? 'text-danger-600' : 'text-success-700'
            }`}
          >
            {formatCurrency(simulation.profitPerUnit)}
          </dd>
        </div>
        <div className="rounded-xl border border-sand-200 bg-white px-3.5 py-3">
          <dt className="text-xs text-sand-500">Margem</dt>
          <dd className="mt-0.5 text-base font-semibold tabular-nums text-sand-900">
            {price > 0 ? formatPercent(simulation.marginPercent) : '—'}
          </dd>
        </div>
        <div className="rounded-xl border border-sand-200 bg-white px-3.5 py-3">
          <dt className="text-xs text-sand-500">Markup</dt>
          <dd className="mt-0.5 text-base font-semibold tabular-nums text-sand-900">
            {price > 0 ? formatMarkup(simulation.markup) : '—'}
          </dd>
        </div>
      </dl>

      {variableFeesPercent > 0 && price > 0 ? (
        <p className="text-xs leading-relaxed text-sand-500">
          Nesse preço, {formatPercent(variableFeesPercent)} vão para taxas —{' '}
          {formatCurrency(simulation.feesAmount)} por unidade. O lucro acima já desconta isso.
        </p>
      ) : null}

      {yieldQuantity > 1 && price > 0 ? (
        <p className="text-xs leading-relaxed text-sand-500">
          Vendendo a receita inteira ({yieldQuantity} unidades) nesse preço, o lucro é de{' '}
          <strong className="font-semibold text-sand-700">
            {formatCurrency(simulation.profitPerBatch)}
          </strong>
          .
        </p>
      ) : null}

      {abaixoDoMinimo ? (
        <Alert tone="danger">
          Esse preço está abaixo do mínimo de {formatCurrency(minimumPrice)}. Nele, cada venda tira
          dinheiro do seu bolso em vez de colocar.
        </Alert>
      ) : null}

      {price === 0 ? (
        <Alert tone="warning">Informe um preço de venda para ver o resultado.</Alert>
      ) : null}

      <input type="hidden" name="salePrice" value={price.toFixed(2)} />
    </div>
  );
}
