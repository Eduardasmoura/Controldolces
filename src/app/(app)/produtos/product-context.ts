import type { CostSettingsRow, IngredientRow } from '@/lib/database.types';
import type { Unit } from '@/lib/pricing';
import { indirectConfigFrom } from '@/server/pricing';

import type { CostContext, IngredientOption } from './product-form';

/** Adapta as linhas do banco para o que o formulário de receita precisa. */
export function toIngredientOptions(rows: IngredientRow[]): IngredientOption[] {
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    purchaseUnit: row.purchase_unit as Unit,
    purchaseQuantity: row.purchase_quantity,
    purchasePrice: row.purchase_price,
  }));
}

export function toCostContext(settings: CostSettingsRow): CostContext {
  return {
    laborHourlyRate: settings.labor_hourly_rate,
    defaultMarginPercent: settings.default_margin_percent,
    minimumMarginPercent: settings.minimum_margin_percent,
    variableFeesPercent: settings.variable_fees_percent,
    indirect: indirectConfigFrom(settings),
  };
}
