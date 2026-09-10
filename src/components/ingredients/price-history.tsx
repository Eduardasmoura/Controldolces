import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { formatCurrency, formatDateTime, formatNumber, formatUnitCost } from '@/lib/format';
import type { IngredientPriceRow } from '@/lib/database.types';
import { unitShort, type Unit } from '@/lib/pricing';

/**
 * Histórico de preços do ingrediente.
 *
 * Cada alteração de compra vira uma linha aqui, com o custo por unidade-base
 * daquele momento. É o que responde "o chocolate subiu quanto desde agosto?" —
 * e o que mantém uma precificação antiga explicável depois de o preço mudar.
 */
export function PriceHistory({ entries }: { entries: IngredientPriceRow[] }) {
  return (
    <Card>
      <CardHeader
        title="Histórico de preços"
        description="Toda vez que você atualiza o preço de compra, o valor anterior fica registrado aqui."
      />

      {entries.length === 0 ? (
        <CardBody>
          <p className="text-sm leading-relaxed text-content-muted">
            Ainda não há alterações registradas. Quando você mudar o preço de compra, a variação
            aparece nesta lista.
          </p>
        </CardBody>
      ) : (
        <ul className="divide-y divide-surface-border">
          {entries.map((entrada, indice) => {
            const anterior = entries[indice + 1];
            const variacao =
              anterior && anterior.unit_cost > 0
                ? ((entrada.unit_cost - anterior.unit_cost) / anterior.unit_cost) * 100
                : null;

            return (
              <li
                key={entrada.id}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-3.5 sm:px-6"
              >
                <div className="min-w-0">
                  <p className="text-sm text-content">
                    {formatNumber(entrada.purchase_quantity)}{' '}
                    {unitShort(entrada.purchase_unit as Unit)} por{' '}
                    <span className="font-medium">{formatCurrency(entrada.purchase_price)}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-content-subtle">
                    {formatDateTime(entrada.recorded_at)}
                    {indice === 0 ? ' · preço atual' : ''}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-medium tabular-nums text-content-strong">
                    {formatUnitCost(entrada.unit_cost)}
                  </p>
                  <p className="text-xs text-content-subtle">
                    por {unitShort(entrada.normalized_unit as Unit)}
                    {variacao != null && Math.abs(variacao) >= 0.05 ? (
                      <span
                        className={
                          variacao > 0 ? ' text-danger-600' : ' text-success-700'
                        }
                      >
                        {' '}
                        {variacao > 0 ? '▲' : '▼'} {Math.abs(variacao).toFixed(1).replace('.', ',')}%
                      </span>
                    ) : null}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
