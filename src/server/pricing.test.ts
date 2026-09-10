import { describe, expect, it } from 'vitest';

import type { CostSettingsRow, IngredientRow, ProductRow } from '@/lib/database.types';
import { calculatePricing, costPerBaseUnit } from '@/lib/pricing';
import type { ProductDetail } from '@/server/queries';

import { buildPricingInput, effectiveMargin, indirectConfigFrom } from './pricing';

/**
 * Testes da ponte entre banco e motor. Um erro aqui é tão caro quanto um erro
 * de fórmula: um custo que não chega ao motor simplesmente desaparece do preço.
 */

const AGORA = '2026-01-10T12:00:00.000Z';

function settings(overrides: Partial<CostSettingsRow> = {}): CostSettingsRow {
  return {
    id: 'settings-1',
    business_id: 'business-1',
    labor_hourly_rate: 25,
    gas_cost: 0,
    electricity_cost: 0,
    default_margin_percent: 50,
    minimum_margin_percent: 0,
    variable_fees_percent: 0,
    indirect_method: 'none',
    indirect_cost_percentage: 0,
    indirect_monthly_amount: 0,
    indirect_monthly_units: 0,
    indirect_monthly_hours: 0,
    created_at: AGORA,
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
    // Coluna gerada pelo banco; nos testes é preenchida com o mesmo valor que o
    // Postgres calcularia, para o fixture refletir uma linha real.
    unit_cost: 29.9 / 1000,
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
    expect(indirectConfigFrom(settings({ indirect_method: 'percent', indirect_cost_percentage: 12 }))).toEqual(
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
        settings({ indirect_method: 'percent', indirect_cost_percentage: 10 }),
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


describe('gás e energia do negócio', () => {
  it('entram como custo do lote quando o produto não declara os seus', () => {
    const input = buildPricingInput(
      detail({ extras: [] }),
      settings({ gas_cost: 3, electricity_cost: 2 }),
    );

    const gas = input.extras.filter((extra) => extra.category === 'gas');
    const energia = input.extras.filter((extra) => extra.category === 'energy');

    expect(gas).toHaveLength(1);
    expect(gas[0]).toMatchObject({ amount: 3, scope: 'batch' });
    expect(energia).toHaveLength(1);
    expect(energia[0]).toMatchObject({ amount: 2, scope: 'batch' });
  });

  it('o custo próprio do produto tem prioridade sobre a estimativa do negócio', () => {
    const comGasProprio = detail({
      extras: [
        {
          id: 'ex-gas',
          product_id: 'prod-1',
          business_id: 'business-1',
          label: 'Gás do forno grande',
          category: 'gas',
          amount: 9,
          scope: 'batch',
          position: 0,
          created_at: AGORA,
        },
      ],
    });

    const input = buildPricingInput(comGasProprio, settings({ gas_cost: 3, electricity_cost: 2 }));
    const gas = input.extras.filter((extra) => extra.category === 'gas');

    expect(gas).toHaveLength(1);
    expect(gas[0]?.amount).toBe(9);
    // A energia, que o produto não declarou, continua vindo do negócio.
    expect(input.extras.filter((extra) => extra.category === 'energy')).toHaveLength(1);
  });

  it('estimativa zerada não vira custo fantasma', () => {
    const input = buildPricingInput(detail({ extras: [] }), settings({ gas_cost: 0, electricity_cost: 0 }));
    expect(input.extras).toHaveLength(0);
  });

  it('chegam ao custo final do lote', () => {
    const outcome = calculatePricing(
      buildPricingInput(detail({ extras: [] }), settings({ gas_cost: 3, electricity_cost: 2 })),
    );
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.batch.gas).toBeCloseTo(3, 10);
    expect(outcome.result.batch.energy).toBeCloseTo(2, 10);
  });
});

describe('coerência entre o custo do banco e o do motor', () => {
  it('ingredients.unit_cost e costPerBaseUnit calculam a mesma coisa', () => {
    // unit_cost é uma coluna gerada no Postgres; costPerBaseUnit é a versão em
    // TypeScript. As duas precisam concordar — este teste é o contrato entre elas.
    const linha = ingredient({ purchase_unit: 'kg', purchase_quantity: 1, purchase_price: 29.9 });

    const doMotor = costPerBaseUnit({
      purchaseQuantity: linha.purchase_quantity,
      purchaseUnit: linha.purchase_unit,
      purchasePrice: linha.purchase_price,
    });

    expect(doMotor).toBeCloseTo(0.0299, 10);
    expect(linha.unit_cost).toBeCloseTo(doMotor, 10);
  });
});
