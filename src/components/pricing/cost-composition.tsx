import type { CostBreakdown } from '@/lib/pricing';
import { formatCurrency, formatPercent } from '@/lib/format';

const LABELS: { key: keyof CostBreakdown; label: string; color: string }[] = [
  { key: 'ingredients', label: 'Ingredientes', color: 'bg-rose-500' },
  { key: 'packaging', label: 'Embalagem', color: 'bg-amber-400' },
  { key: 'labor', label: 'Mão de obra', color: 'bg-rose-300' },
  { key: 'gas', label: 'Gás', color: 'bg-amber-300' },
  { key: 'energy', label: 'Energia', color: 'bg-sand-400' },
  { key: 'other', label: 'Outros custos', color: 'bg-sand-300' },
  { key: 'indirect', label: 'Custos indiretos', color: 'bg-sand-500' },
];

/**
 * Composição do custo unitário. Mostra de onde vem cada centavo — é o que
 * transforma um número solto em entendimento ("a embalagem é 25% do custo?").
 */
export function CostComposition({ unit }: { unit: CostBreakdown }) {
  const rows = LABELS.map((item) => ({
    ...item,
    value: unit[item.key],
    share: unit.total > 0 ? (unit[item.key] / unit.total) * 100 : 0,
  })).filter((row) => row.value > 0);

  if (rows.length === 0) {
    return <p className="text-sm text-sand-500">Nenhum custo lançado ainda.</p>;
  }

  return (
    <div>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-sand-100" aria-hidden="true">
        {rows.map((row) => (
          <div key={row.key} className={row.color} style={{ width: `${row.share}%` }} />
        ))}
      </div>

      <dl className="mt-4 divide-y divide-sand-100">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-3 py-2.5">
            <dt className="flex min-w-0 items-center gap-2.5 text-sm text-sand-600">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${row.color}`} aria-hidden="true" />
              <span className="truncate">{row.label}</span>
            </dt>
            <dd className="flex shrink-0 items-baseline gap-2">
              <span className="text-xs tabular-nums text-sand-400">{formatPercent(row.share, 0)}</span>
              <span className="text-sm font-medium tabular-nums text-sand-800">
                {formatCurrency(row.value)}
              </span>
            </dd>
          </div>
        ))}
        <div className="flex items-center justify-between gap-3 border-t border-sand-200 py-3">
          <dt className="text-sm font-semibold text-sand-800">Custo total por unidade</dt>
          <dd className="text-sm font-semibold tabular-nums text-sand-900">
            {formatCurrency(unit.total)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
