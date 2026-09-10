import type { CostSettingsRow } from '@/lib/database.types';
import {
  calculatePricing,
  type ExtraCostCategory,
  type ExtraCostInput,
  type IndirectCostConfig,
  type PricingInput,
  type PricingOutcome,
  type Unit,
} from '@/lib/pricing';

import type { ProductDetail } from './queries';

/**
 * Ponte entre o banco e o motor de precificação.
 *
 * É o único lugar que traduz linhas do Postgres para a entrada do motor. Assim
 * a tela de precificação, o simulador, o painel e os relatórios enxergam
 * exatamente os mesmos números — não existe uma segunda interpretação dos dados.
 */

export function indirectConfigFrom(settings: CostSettingsRow): IndirectCostConfig {
  switch (settings.indirect_method) {
    case 'percent':
      return { method: 'percent', percent: settings.indirect_cost_percentage };
    case 'monthly_units':
      return {
        method: 'monthly_units',
        monthlyAmount: settings.indirect_monthly_amount,
        monthlyUnits: settings.indirect_monthly_units,
      };
    case 'monthly_hours':
      return {
        method: 'monthly_hours',
        monthlyAmount: settings.indirect_monthly_amount,
        monthlyHours: settings.indirect_monthly_hours,
      };
    default:
      return { method: 'none' };
  }
}

/** Margem que vale para o produto: a dele, se definida, senão a padrão do negócio. */
export function effectiveMargin(
  detail: ProductDetail,
  settings: CostSettingsRow,
  override?: number | null,
): number {
  if (override != null && Number.isFinite(override)) return override;
  if (detail.product.margin_percent != null) return detail.product.margin_percent;
  return settings.default_margin_percent;
}

/**
 * Gás e energia têm uma estimativa por produção no nível do negócio
 * (`cost_settings`). Ela entra no cálculo apenas quando o produto NÃO declara um
 * custo próprio daquela categoria — receita que assa duas horas merece um valor
 * seu, e o padrão do negócio não deve competir com ele.
 */
function extrasComPadroesDoNegocio(
  extras: ExtraCostInput[],
  settings: CostSettingsRow,
): ExtraCostInput[] {
  const resultado = [...extras];
  const temCategoria = (categoria: ExtraCostCategory) =>
    extras.some((extra) => extra.category === categoria);

  if (settings.gas_cost > 0 && !temCategoria('gas')) {
    resultado.push({
      label: 'Gás (estimativa do negócio)',
      category: 'gas',
      amount: settings.gas_cost,
      scope: 'batch',
    });
  }

  if (settings.electricity_cost > 0 && !temCategoria('energy')) {
    resultado.push({
      label: 'Energia (estimativa do negócio)',
      category: 'energy',
      amount: settings.electricity_cost,
      scope: 'batch',
    });
  }

  return resultado;
}

export function buildPricingInput(
  detail: ProductDetail,
  settings: CostSettingsRow,
  marginOverride?: number | null,
): PricingInput {
  const { product, items, extras } = detail;

  return {
    yieldQuantity: product.yield_quantity,
    ingredients: items.map((item) => ({
      ingredientId: item.ingredient_id,
      name: item.ingredient.name,
      quantity: item.quantity,
      unit: item.unit as Unit,
      purchaseQuantity: item.ingredient.purchase_quantity,
      purchaseUnit: item.ingredient.purchase_unit as Unit,
      purchasePrice: item.ingredient.purchase_price,
    })),
    labor:
      product.labor_minutes > 0
        ? { hourlyRate: settings.labor_hourly_rate, minutes: product.labor_minutes }
        : undefined,
    extras: extrasComPadroesDoNegocio(
      extras.map((extra) => ({
        id: extra.id,
        label: extra.label,
        category: extra.category,
        amount: extra.amount,
        scope: extra.scope,
      })),
      settings,
    ),
    indirect: indirectConfigFrom(settings),
    desiredMarginPercent: effectiveMargin(detail, settings, marginOverride),
    variableFeesPercent: settings.variable_fees_percent,
    minimumMarginPercent: settings.minimum_margin_percent,
  };
}

export function computeProductPricing(
  detail: ProductDetail,
  settings: CostSettingsRow,
  marginOverride?: number | null,
): PricingOutcome {
  return calculatePricing(buildPricingInput(detail, settings, marginOverride));
}
