import type { CostSettingsRow } from '@/lib/database.types';
import {
  calculatePricing,
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
      return { method: 'percent', percent: settings.indirect_percent };
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
    extras: extras.map((extra) => ({
      id: extra.id,
      label: extra.label,
      category: extra.category,
      amount: extra.amount,
      scope: extra.scope,
    })),
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
