import { Badge } from '@/components/ui/feedback';
import { formatCurrency, formatMarkup, formatPercent } from '@/lib/format';
import type { PricingResult } from '@/lib/pricing';

import { CostComposition } from './cost-composition';

function Metric({
  label,
  value,
  hint,
  emphasis = false,
}: {
  label: string;
  value: string;
  hint?: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={
        emphasis
          ? 'rounded-2xl bg-rose-600 px-4 py-4 text-white'
          : 'rounded-2xl border border-sand-200 bg-white px-4 py-4'
      }
    >
      <p className={emphasis ? 'text-xs font-medium text-rose-100' : 'text-xs font-medium text-sand-500'}>
        {label}
      </p>
      <p
        className={
          emphasis
            ? 'mt-1 font-display text-2xl font-semibold tabular-nums'
            : 'mt-1 font-display text-2xl font-semibold tabular-nums text-sand-900'
        }
      >
        {value}
      </p>
      {hint ? (
        <p className={emphasis ? 'mt-1 text-xs text-rose-100/90' : 'mt-1 text-xs text-sand-400'}>{hint}</p>
      ) : null}
    </div>
  );
}

/**
 * Resultado da precificação. Mesmo componente usado na tela de precificação e na
 * demonstração da página inicial — a vitrine mostra o produto de verdade.
 */
export function PricingResultView({
  productName,
  yieldLabel,
  result,
  salePrice,
}: {
  productName: string;
  yieldLabel?: string;
  result: PricingResult;
  /** Preço realmente praticado. Quando ausente, usa o preço recomendado. */
  salePrice?: number;
}) {
  const price = salePrice ?? result.recommendedPrice;
  const fees = price * (result.variableFeesPercent / 100);
  const profit = price - fees - result.unit.total;
  const margin = price > 0 ? (profit / price) * 100 : 0;
  const markup = result.unit.total > 0 ? price / result.unit.total : 0;
  const belowMinimum = price < result.minimumPrice;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-xl font-semibold text-sand-900">{productName}</h2>
          <p className="text-sm text-sand-500">
            Rende {result.yieldQuantity} {yieldLabel ?? 'unidades'}
          </p>
        </div>
        {belowMinimum ? (
          <Badge tone="danger">Abaixo do preço mínimo</Badge>
        ) : (
          <Badge tone="success">Preço saudável</Badge>
        )}
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Custo por unidade" value={formatCurrency(result.unit.total)} />
        <Metric
          label="Preço mínimo"
          value={formatCurrency(result.minimumPrice)}
          hint="Cobre os custos"
        />
        <Metric
          label="Preço recomendado"
          value={formatCurrency(result.recommendedPrice)}
          hint={`Margem de ${formatPercent(result.desiredMarginPercent, 0)}`}
          emphasis
        />
        <Metric
          label="Lucro por unidade"
          value={formatCurrency(profit)}
          hint={`${formatCurrency(profit * result.yieldQuantity)} no lote`}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-sand-200 bg-white px-4 py-3.5">
          <p className="text-xs font-medium text-sand-500">Margem de lucro</p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums text-sand-900">
            {formatPercent(margin)}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-sand-400">
            Quanto sobra de cada real vendido.
          </p>
        </div>
        <div className="rounded-2xl border border-sand-200 bg-white px-4 py-3.5">
          <p className="text-xs font-medium text-sand-500">Markup</p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums text-sand-900">
            {formatMarkup(markup)}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-sand-400">
            Quantas vezes o custo o preço representa. Não é a mesma coisa que a margem.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-sand-200 bg-white px-5 py-5">
        <h3 className="text-sm font-semibold text-sand-800">Composição do custo por unidade</h3>
        <div className="mt-4">
          <CostComposition unit={result.unit} />
        </div>
      </div>
    </div>
  );
}
