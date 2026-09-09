import { formatCurrency, formatMarkup, formatPercent } from '@/lib/format';
import { calculatePricing, type PricingInput } from '@/lib/pricing';

/**
 * Demonstração do precificador na página inicial.
 *
 * Os números NÃO são inventados: passam pelo mesmo motor de cálculo do produto,
 * a partir de uma receita de exemplo declarada abaixo. Se a fórmula mudar, a
 * vitrine muda junto.
 */
const EXAMPLE: PricingInput = {
  yieldQuantity: 20,
  ingredients: [
    {
      ingredientId: 'chocolate',
      name: 'Chocolate meio amargo',
      quantity: 200,
      unit: 'g',
      purchaseQuantity: 1,
      purchaseUnit: 'kg',
      purchasePrice: 29.9,
    },
    {
      ingredientId: 'leite-condensado',
      name: 'Leite condensado',
      quantity: 395,
      unit: 'g',
      purchaseQuantity: 395,
      purchaseUnit: 'g',
      purchasePrice: 6.99,
    },
    {
      ingredientId: 'creme-de-leite',
      name: 'Creme de leite',
      quantity: 100,
      unit: 'g',
      purchaseQuantity: 200,
      purchaseUnit: 'g',
      purchasePrice: 4.2,
    },
  ],
  labor: { hourlyRate: 25, minutes: 48 },
  extras: [
    { label: 'Forminha e caixa', category: 'packaging', amount: 0.6, scope: 'unit' },
    { label: 'Gás', category: 'gas', amount: 2, scope: 'batch' },
  ],
  indirect: { method: 'none' },
  desiredMarginPercent: 60,
  variableFeesPercent: 0,
  minimumMarginPercent: 0,
};

const ROWS: { key: 'ingredients' | 'packaging' | 'labor' | 'gas'; label: string; color: string }[] = [
  { key: 'ingredients', label: 'Ingredientes', color: 'bg-rose-500' },
  { key: 'packaging', label: 'Embalagem', color: 'bg-amber-400' },
  { key: 'labor', label: 'Mão de obra', color: 'bg-rose-300' },
  { key: 'gas', label: 'Gás', color: 'bg-amber-300' },
];

export function HeroPreview() {
  const outcome = calculatePricing(EXAMPLE);
  if (!outcome.ok) return null;
  const result = outcome.result;

  return (
    <figure className="m-0">
      <div className="overflow-hidden rounded-3xl border border-sand-200 bg-white shadow-lift">
        <div className="flex items-center gap-2 border-b border-sand-100 bg-sand-50 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-sand-300" aria-hidden="true" />
          <span className="h-2.5 w-2.5 rounded-full bg-sand-300" aria-hidden="true" />
          <span className="h-2.5 w-2.5 rounded-full bg-sand-300" aria-hidden="true" />
          <p className="ml-2 truncate text-xs font-medium text-sand-500">
            Precificação · Brigadeiro gourmet
          </p>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-sand-200 px-4 py-3">
              <p className="text-[0.7rem] font-medium text-sand-500">Custo por unidade</p>
              <p className="mt-0.5 font-display text-xl font-semibold tabular-nums text-sand-900">
                {formatCurrency(result.unit.total)}
              </p>
            </div>
            <div className="rounded-2xl bg-rose-600 px-4 py-3 text-white">
              <p className="text-[0.7rem] font-medium text-rose-100">Preço recomendado</p>
              <p className="mt-0.5 font-display text-xl font-semibold tabular-nums">
                {formatCurrency(result.recommendedPrice)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 rounded-2xl bg-sand-50 px-4 py-3">
            <div>
              <p className="text-[0.7rem] text-sand-500">Lucro/un.</p>
              <p className="text-sm font-semibold tabular-nums text-sand-800">
                {formatCurrency(result.recommended.profitPerUnit)}
              </p>
            </div>
            <div>
              <p className="text-[0.7rem] text-sand-500">Margem</p>
              <p className="text-sm font-semibold tabular-nums text-sand-800">
                {formatPercent(result.recommended.marginPercent, 0)}
              </p>
            </div>
            <div>
              <p className="text-[0.7rem] text-sand-500">Markup</p>
              <p className="text-sm font-semibold tabular-nums text-sand-800">
                {formatMarkup(result.recommended.markup)}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-sand-500">Composição do custo</p>
            <div
              className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-sand-100"
              aria-hidden="true"
            >
              {ROWS.map((row) => (
                <div
                  key={row.key}
                  className={row.color}
                  style={{ width: `${(result.unit[row.key] / result.unit.total) * 100}%` }}
                />
              ))}
            </div>
            <ul className="mt-3 space-y-1.5">
              {ROWS.map((row) => (
                <li key={row.key} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-sand-600">
                    <span className={`h-2 w-2 rounded-full ${row.color}`} aria-hidden="true" />
                    {row.label}
                  </span>
                  <span className="tabular-nums text-sand-700">
                    {formatCurrency(result.unit[row.key])}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <figcaption className="mt-3 text-center text-xs text-sand-400">
        Exemplo real calculado pelo motor do ControlDolces: 20 brigadeiros, 60% de margem.
      </figcaption>
    </figure>
  );
}
