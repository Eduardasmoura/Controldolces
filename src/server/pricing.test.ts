import { describe, expect, it } from 'vitest';

import type { CostSettingsRow, IngredientRow, ProductRow } from '@/lib/database.types';
import { calculatePricing } from '@/lib/pricing';
import type { ProductDetail } from '@/server/queries';

import { buildPricingInput, effectiveMargin, indirectConfigFrom } from './pricing';

/**
 * Testes da ponte entre banco e motor. Um erro aqui é tão caro quanto um erro
 * de fórmula: um custo que não chega ao motor simplesmente desaparece do preço.
 */

const AGORA = '2026-01-10T12:00:00.000Z';

function settings(overrides: Partial<CostSettingsRow> = {}): CostSettingsRow {
  return {
    business_id: 'business-1',
    labor_hourly_rate: 25,
    default_margin_percent: 50,
    minimum_margin_percent: 0,
    variable_fees_percent: 0,
    indirect_method: 'none',
    indirect_percent: 0,
    indirect_monthly_amount: 0,
    indirect_monthly_units: 0,
    indirect_monthly_hours: 0,
    updated_at: AGORA,
    ...overrides,
  };
}

function ingredient(overrides: Partial<IngredientRow> = {}): IngredientRow {
  return {
    id: 'ing-1',
    business_id: 'business-1',
    name: 'Chocolate',
    category: null,
    supplier: null,
    purchase_unit: 'kg',
    purchase_quantity: 1,
    purchase_price: 29.9,
    archived_at: null,
    created_at: AGORA,
    updated_at: AGORA,
    ...overrides,
  };
}

function product(overrides: Partial<ProductRow> = {}): ProductRow {
  return {
    id: 'prod-1',
    business_id: 'business-1',
    name: 'Brigadeiro gourmet',
    category: null,
    description: null,
    photo_url: null,
    yield_quantity: 20,
    yield_label: 'unidades',
    notes: null,
    labor_minutes: 48,
    margin_percent: null,
    archived_at: null,
    created_at: AGORA,
    updated_at: AGORA,
    ...overrides,
  };
}

function detail(overrides: Partial<ProductDetail> = {}): ProductDetail {
  const base = ingredient();
  return {
    product: product(),
    recipe: null,
    items: [
      {
        id: 'ri-1',
        recipe_id: 'rec-1',
        business_id: 'business-1',
        ingredient_id: base.id,
        quantity: 200,
        unit: 'g',
        position: 0,
        created_at: AGORA,
        ingredient: base,
      },
    ],
    extras: [
      {
        id: 'ex-1',
        product_id: 'prod-1',
        business_id: 'business-1',
        label: 'Forminha e caixa',
        category: 'packaging',
        amount: 0.6,
        scope: 'unit',
        position: 0,
        created_at: AGORA,
      },
    ],
    ...overrides,
  };
}

describe('rateio de custos indiretos a partir das configurações', () => {
  it('desligado por padrão', () => {
    expect(indirectConfigFrom(settings())).toEqual({ method: 'none' });
  });

  it('lê cada método com os campos que lhe pertencem', () => {
    expect(indirectConfigFrom(settings({ indirect_method: 'percent', indirect_percent: 12 }))).toEqual(
      { method: 'percent', percent: 12 },
    );

    expect(
      indirectConfigFrom(
        settings({
          indirect_method: 'monthly_units',
          indirect_monthly_amount: 800,
          indirect_monthly_units: 400,
        }),
      ),
    ).toEqual({ method: 'monthly_units', monthlyAmount: 800, monthlyUnits: 400 });

    expect(
      indirectConfigFrom(
        settings({
          indirect_method: 'monthly_hours',
          indirect_monthly_amount: 900,
          indirect_monthly_hours: 90,
        }),
      ),
    ).toEqual({ method: 'monthly_hours', monthlyAmount: 900, monthlyHours: 90 });
  });
});

describe('margem efetiva', () => {
  it('usa a margem padrão do negócio quando o produto não tem uma', () => {
    expect(effectiveMargin(detail(), settings({ default_margin_percent: 55 }))).toBe(55);
  });

  it('a margem do produto tem prioridade sobre a do negócio', () => {
    const d = detail({ product: product({ margin_percent: 70 }) });
    expect(effectiveMargin(d, settings({ default_margin_percent: 50 }))).toBe(70);
  });

  it('a margem escolhida na tela tem prioridade sobre as duas', () => {
    const d = detail({ product: product({ margin_percent: 70 }) });
    expect(effectiveMargin(d, settings(), 35)).toBe(35);
  });
});

describe('montagem da entrada de cálculo', () => {
  it('traz ingredientes, mão de obra, custos extras e configurações', () => {
    const input = buildPricingInput(detail(), settings({ variable_fees_percent: 6 }));

    expect(input.yieldQuantity).toBe(20);
    expect(input.ingredients).toHaveLength(1);
    expect(input.ingredients[0]).toMatchObject({
      name: 'Chocolate',
      quantity: 200,
      unit: 'g',
      purchaseQuantity: 1,
      purchaseUnit: 'kg',
      purchasePrice: 29.9,
    });
    expect(input.labor).toEqual({ hourlyRate: 25, minutes: 48 });
    expect(input.extras).toHaveLength(1);
    expect(input.extras[0]).toMatchObject({ category: 'packaging', amount: 0.6, scope: 'unit' });
    expect(input.variableFeesPercent).toBe(6);
  });

  it('não cria mão de obra quando o tempo de produção é zero', () => {
    const input = buildPricingInput(detail({ product: product({ labor_minutes: 0 }) }), settings());
    expect(input.labor).toBeUndefined();
  });

  it('produz um cálculo válido de ponta a ponta', () => {
    const outcome = calculatePricing(buildPricingInput(detail(), settings()));
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;

    // ingredientes 5,98 + mão de obra 20,00 + embalagem 12,00
    expect(outcome.result.batch.ingredients).toBeCloseTo(5.98, 10);
    expect(outcome.result.batch.labor).toBeCloseTo(20, 10);
    expect(outcome.result.batch.packaging).toBeCloseTo(12, 10);
    expect(outcome.result.unit.total).toBeCloseTo(1.899, 10);
    expect(outcome.result.recommendedPrice).toBeGreaterThan(outcome.result.minimumPrice);
  });

  it('o rateio de custos indiretos chega ao resultado', () => {
    const semRateio = calculatePricing(buildPricingInput(detail(), settings()));
    const comRateio = calculatePricing(
      buildPricingInput(
        detail(),
        settings({ indirect_method: 'percent', indirect_percent: 10 }),
      ),
    );

    expect(semRateio.ok && comRateio.ok).toBe(true);
    if (!semRateio.ok || !comRateio.ok) return;

    expect(comRateio.result.unit.indirect).toBeGreaterThan(0);
    expect(comRateio.result.unit.total).toBeCloseTo(semRateio.result.unit.total * 1.1, 8);
  });

  it('receita sem ingredientes não é calculável e explica o motivo', () => {
    const outcome = calculatePricing(buildPricingInput(detail({ items: [] }), settings()));
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.issues.some((issue) => issue.field === 'ingredients')).toBe(true);
  });
});
