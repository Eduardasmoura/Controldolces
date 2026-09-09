import { describe, expect, it } from 'vitest';

import {
  MAX_MARGIN_PERCENT,
  calculatePricing,
  costPerBaseUnit,
  ingredientLineCost,
  laborCost,
  marginAtPrice,
  markupAtPrice,
  priceForMargin,
  simulatePrice,
} from './engine';
import { ceilCurrency, roundCurrency } from './money';
import type { PricingInput, RecipeIngredientInput } from './types';
import { toBaseQuantity } from './units';

function ingredient(overrides: Partial<RecipeIngredientInput> = {}): RecipeIngredientInput {
  return {
    ingredientId: 'ing-1',
    name: 'Ingrediente',
    quantity: 100,
    unit: 'g',
    purchaseQuantity: 1,
    purchaseUnit: 'kg',
    purchasePrice: 10,
    ...overrides,
  };
}

function baseInput(overrides: Partial<PricingInput> = {}): PricingInput {
  return {
    yieldQuantity: 10,
    ingredients: [ingredient()],
    extras: [],
    indirect: { method: 'none' },
    desiredMarginPercent: 50,
    variableFeesPercent: 0,
    minimumMarginPercent: 0,
    ...overrides,
  };
}

function expectOk(input: PricingInput) {
  const outcome = calculatePricing(input);
  if (!outcome.ok) {
    throw new Error(`Esperava sucesso, recebi: ${outcome.issues.map((i) => i.message).join(' | ')}`);
  }
  return outcome.result;
}

describe('conversão de unidades', () => {
  it('converte para a unidade-base de cada dimensão', () => {
    expect(toBaseQuantity(1, 'kg')).toBe(1000);
    expect(toBaseQuantity(395, 'g')).toBe(395);
    expect(toBaseQuantity(1.5, 'l')).toBe(1500);
    expect(toBaseQuantity(2, 'dz')).toBe(24);
    expect(toBaseQuantity(500, 'mg')).toBe(0.5);
  });
});

describe('custo do ingrediente', () => {
  it('calcula o custo por grama de uma compra em quilos', () => {
    const custoPorGrama = costPerBaseUnit({
      purchaseQuantity: 1,
      purchaseUnit: 'kg',
      purchasePrice: 29.9,
    });
    expect(custoPorGrama).toBeCloseTo(0.0299, 10);
  });

  it('aplica o custo por grama à quantidade usada na receita', () => {
    const custo = ingredientLineCost(
      ingredient({ quantity: 150, unit: 'g', purchaseQuantity: 1, purchaseUnit: 'kg', purchasePrice: 29.9 }),
    );
    expect(custo).toBeCloseTo(4.485, 10);
    expect(roundCurrency(custo)).toBe(4.49);
  });

  it('lida com embalagens de tamanho irregular (leite condensado 395 g)', () => {
    const custo = ingredientLineCost(
      ingredient({ quantity: 395, unit: 'g', purchaseQuantity: 395, purchaseUnit: 'g', purchasePrice: 6.99 }),
    );
    expect(custo).toBeCloseTo(6.99, 10);
  });

  it('converte entre unidades da mesma dimensão', () => {
    const custo = ingredientLineCost(
      ingredient({ quantity: 0.25, unit: 'kg', purchaseQuantity: 500, purchaseUnit: 'g', purchasePrice: 8 }),
    );
    expect(custo).toBeCloseTo(4, 10);
  });
});

describe('exemplo canônico do briefing', () => {
  it('100 g por R$ 10,00, usando 50 g, rendimento 10 -> R$ 0,50 por unidade', () => {
    const resultado = expectOk(
      baseInput({
        yieldQuantity: 10,
        ingredients: [
          ingredient({ quantity: 50, unit: 'g', purchaseQuantity: 100, purchaseUnit: 'g', purchasePrice: 10 }),
        ],
        desiredMarginPercent: 0,
      }),
    );
    expect(resultado.batch.ingredients).toBeCloseTo(5, 10);
    expect(resultado.batch.total).toBeCloseTo(5, 10);
    expect(resultado.unit.total).toBeCloseTo(0.5, 10);
  });
});

describe('receita com vários ingredientes', () => {
  it('soma os ingredientes e divide pelo rendimento', () => {
    const resultado = expectOk(
      baseInput({
        yieldQuantity: 20,
        ingredients: [
          ingredient({
            ingredientId: 'choc',
            name: 'Chocolate',
            quantity: 200,
            unit: 'g',
            purchaseQuantity: 1,
            purchaseUnit: 'kg',
            purchasePrice: 29.9,
          }),
          ingredient({
            ingredientId: 'lc',
            name: 'Leite condensado',
            quantity: 395,
            unit: 'g',
            purchaseQuantity: 395,
            purchaseUnit: 'g',
            purchasePrice: 6.99,
          }),
          ingredient({
            ingredientId: 'cl',
            name: 'Creme de leite',
            quantity: 100,
            unit: 'g',
            purchaseQuantity: 200,
            purchaseUnit: 'g',
            purchasePrice: 4,
          }),
        ],
      }),
    );

    // 5,98 + 6,99 + 2,00
    expect(resultado.batch.ingredients).toBeCloseTo(14.97, 10);
    expect(resultado.unit.ingredients).toBeCloseTo(0.7485, 10);
    expect(resultado.ingredientLines).toHaveLength(3);
    const somaDasParticipacoes = resultado.ingredientLines.reduce((t, l) => t + l.sharePercent, 0);
    expect(somaDasParticipacoes).toBeCloseTo(100, 8);
  });
});

describe('mão de obra', () => {
  it('multiplica valor da hora pelas horas trabalhadas', () => {
    expect(laborCost(20, 90)).toBeCloseTo(30, 10);
    expect(laborCost(25, 30)).toBeCloseTo(12.5, 10);
  });

  it('entra no custo do lote e é rateada pelo rendimento', () => {
    const resultado = expectOk(
      baseInput({ yieldQuantity: 20, labor: { hourlyRate: 20, minutes: 60 } }),
    );
    expect(resultado.batch.labor).toBeCloseTo(20, 10);
    expect(resultado.unit.labor).toBeCloseTo(1, 10);
  });
});

describe('custos adicionais', () => {
  it('trata custo por unidade e custo por lote de formas diferentes', () => {
    const resultado = expectOk(
      baseInput({
        yieldQuantity: 10,
        extras: [
          { label: 'Caixa', category: 'packaging', amount: 2, scope: 'unit' },
          { label: 'Gás', category: 'gas', amount: 5, scope: 'batch' },
          { label: 'Energia', category: 'energy', amount: 3, scope: 'batch' },
          { label: 'Etiquetas', category: 'other', amount: 0.5, scope: 'unit' },
        ],
      }),
    );

    expect(resultado.batch.packaging).toBeCloseTo(20, 10);
    expect(resultado.unit.packaging).toBeCloseTo(2, 10);
    expect(resultado.batch.gas).toBeCloseTo(5, 10);
    expect(resultado.unit.gas).toBeCloseTo(0.5, 10);
    expect(resultado.batch.other).toBeCloseTo(5, 10);
    // ingredientes 1,00 + embalagem 20 + gás 5 + energia 3 + outros 5
    expect(resultado.batch.total).toBeCloseTo(34, 10);
    expect(resultado.unit.total).toBeCloseTo(3.4, 10);
  });
});

describe('custos indiretos', () => {
  it('não altera nada quando desligado', () => {
    const resultado = expectOk(baseInput({ indirect: { method: 'none' } }));
    expect(resultado.batch.indirect).toBe(0);
  });

  it('aplica percentual sobre o custo direto', () => {
    const resultado = expectOk(
      baseInput({ yieldQuantity: 10, indirect: { method: 'percent', percent: 10 } }),
    );
    expect(resultado.batch.ingredients).toBeCloseTo(1, 10);
    expect(resultado.batch.indirect).toBeCloseTo(0.1, 10);
    expect(resultado.batch.total).toBeCloseTo(1.1, 10);
  });

  it('rateia por volume mensal de unidades', () => {
    const resultado = expectOk(
      baseInput({
        yieldQuantity: 20,
        indirect: { method: 'monthly_units', monthlyAmount: 800, monthlyUnits: 400 },
      }),
    );
    expect(resultado.unit.indirect).toBeCloseTo(2, 10);
    expect(resultado.batch.indirect).toBeCloseTo(40, 10);
  });

  it('rateia por horas de produção do mês', () => {
    const resultado = expectOk(
      baseInput({
        yieldQuantity: 10,
        labor: { hourlyRate: 20, minutes: 120 },
        indirect: { method: 'monthly_hours', monthlyAmount: 900, monthlyHours: 90 },
      }),
    );
    // R$ 10 por hora de estrutura x 2 horas
    expect(resultado.batch.indirect).toBeCloseTo(20, 10);
  });

  it('não divide por zero quando o rateio está mal configurado', () => {
    const resultado = expectOk(
      baseInput({ indirect: { method: 'monthly_units', monthlyAmount: 800, monthlyUnits: 0 } }),
    );
    expect(resultado.batch.indirect).toBe(0);
  });
});

describe('margem e markup', () => {
  it('margem é lucro sobre o preço; markup é preço sobre o custo', () => {
    expect(marginAtPrice(5, 10, 0)).toBeCloseTo(50, 10);
    expect(markupAtPrice(5, 10)).toBeCloseTo(2, 10);
    // 50% de margem NÃO é o mesmo que 1,5x de markup
    expect(markupAtPrice(5, priceForMargin(5, 50, 0))).toBeCloseTo(2, 10);
  });

  it('o preço recomendado devolve exatamente a margem pedida', () => {
    for (const margem of [30, 40, 50, 60, 70]) {
      const preco = priceForMargin(8, margem, 0);
      expect(marginAtPrice(8, preco, 0)).toBeCloseTo(margem, 8);
    }
  });

  it('mantém a margem pedida mesmo com taxas sobre a venda', () => {
    const preco = priceForMargin(10, 50, 6);
    expect(preco).toBeCloseTo(22.7272727, 5);
    expect(marginAtPrice(10, preco, 6)).toBeCloseTo(50, 8);
  });

  it('trata margem impossível sem quebrar', () => {
    expect(priceForMargin(10, 100, 0)).toBe(Number.POSITIVE_INFINITY);
  });
});

describe('simulador', () => {
  it('reproduz o exemplo do briefing: custo 7,50 e preço 15,00', () => {
    const simulacao = simulatePrice(7.5, 15, 0, 1);
    expect(simulacao.profitPerUnit).toBeCloseTo(7.5, 10);
    expect(simulacao.marginPercent).toBeCloseTo(50, 10);
    expect(simulacao.markup).toBeCloseTo(2, 10);
    expect(simulacao.coversCosts).toBe(true);
  });

  it('desconta as taxas do lucro', () => {
    const simulacao = simulatePrice(10, 20, 5, 1);
    expect(simulacao.feesAmount).toBeCloseTo(1, 10);
    expect(simulacao.profitPerUnit).toBeCloseTo(9, 10);
    expect(simulacao.marginPercent).toBeCloseTo(45, 10);
  });

  it('avisa quando o preço não cobre os custos', () => {
    const simulacao = simulatePrice(10, 8, 0, 1);
    expect(simulacao.coversCosts).toBe(false);
    expect(simulacao.profitPerUnit).toBeCloseTo(-2, 10);
    expect(simulacao.marginPercent).toBeLessThan(0);
  });

  it('projeta o lucro do lote inteiro', () => {
    const simulacao = simulatePrice(4.8, 12, 0, 20);
    expect(simulacao.profitPerBatch).toBeCloseTo(144, 10);
  });
});

describe('preço mínimo', () => {
  it('por padrão é o ponto de equilíbrio: cobre o custo e não deixa lucro', () => {
    const resultado = expectOk(baseInput({ yieldQuantity: 10, minimumMarginPercent: 0 }));
    expect(resultado.unit.total).toBeCloseTo(0.1, 10);
    expect(resultado.minimumPrice).toBe(0.1);
    const simulacao = simulatePrice(resultado.unit.total, resultado.minimumPrice, 0);
    expect(simulacao.profitPerUnit).toBeCloseTo(0, 10);
  });

  it('cobre também as taxas sobre a venda', () => {
    const resultado = expectOk(
      baseInput({ yieldQuantity: 1, variableFeesPercent: 10, minimumMarginPercent: 0 }),
    );
    // custo 1,00 -> 1 / 0,9 = 1,1111 -> arredonda para cima
    expect(resultado.minimumPrice).toBe(1.12);
    expect(simulatePrice(1, resultado.minimumPrice, 10).profitPerUnit).toBeGreaterThanOrEqual(0);
  });

  it('respeita a margem mínima de segurança configurada', () => {
    const resultado = expectOk(
      baseInput({ yieldQuantity: 1, minimumMarginPercent: 20, desiredMarginPercent: 60 }),
    );
    expect(resultado.minimumPrice).toBeCloseTo(1.25, 10);
    expect(resultado.minimumPrice).toBeLessThan(resultado.recommendedPrice);
  });

  it('nunca fica abaixo do custo por causa de arredondamento', () => {
    const resultado = expectOk(
      baseInput({
        yieldQuantity: 3,
        ingredients: [
          ingredient({ quantity: 100, unit: 'g', purchaseQuantity: 1, purchaseUnit: 'kg', purchasePrice: 29.9 }),
        ],
      }),
    );
    expect(resultado.minimumPrice).toBeGreaterThanOrEqual(resultado.unit.total);
  });
});

describe('arredondamento', () => {
  it('arredonda meia-unidade para cima apesar do ponto flutuante', () => {
    expect(roundCurrency(1.005)).toBe(1.01);
    expect(roundCurrency(2.675)).toBe(2.68);
    expect(roundCurrency(4.485)).toBe(4.49);
    expect(ceilCurrency(1.111)).toBe(1.12);
    expect(ceilCurrency(1.1)).toBe(1.1);
  });

  it('não arredonda os valores intermediários do lote', () => {
    const resultado = expectOk(
      baseInput({
        yieldQuantity: 3,
        ingredients: [
          ingredient({ quantity: 1, unit: 'g', purchaseQuantity: 3, purchaseUnit: 'g', purchasePrice: 1 }),
        ],
      }),
    );
    expect(resultado.batch.ingredients).toBeCloseTo(1 / 3, 12);
  });
});

describe('cenário completo — Brigadeiro Gourmet', () => {
  const input = baseInput({
    yieldQuantity: 20,
    ingredients: [
      ingredient({
        ingredientId: 'choc',
        name: 'Chocolate',
        quantity: 200,
        unit: 'g',
        purchaseQuantity: 1,
        purchaseUnit: 'kg',
        purchasePrice: 29.9,
      }),
      ingredient({
        ingredientId: 'lc',
        name: 'Leite condensado',
        quantity: 395,
        unit: 'g',
        purchaseQuantity: 395,
        purchaseUnit: 'g',
        purchasePrice: 6.99,
      }),
    ],
    labor: { hourlyRate: 25, minutes: 48 },
    extras: [
      { label: 'Forminha e caixa', category: 'packaging', amount: 0.6, scope: 'unit' },
      { label: 'Gás', category: 'gas', amount: 2, scope: 'batch' },
    ],
    desiredMarginPercent: 60,
    variableFeesPercent: 0,
  });

  it('compõe o custo unitário somando todas as partes', () => {
    const r = expectOk(input);
    expect(r.batch.ingredients).toBeCloseTo(12.97, 10);
    expect(r.batch.labor).toBeCloseTo(20, 10);
    expect(r.batch.packaging).toBeCloseTo(12, 10);
    expect(r.batch.gas).toBeCloseTo(2, 10);
    expect(r.batch.total).toBeCloseTo(46.97, 10);
    expect(r.unit.total).toBeCloseTo(2.3485, 10);

    const somaDasPartes =
      r.unit.ingredients + r.unit.packaging + r.unit.labor + r.unit.gas + r.unit.energy + r.unit.other + r.unit.indirect;
    expect(somaDasPartes).toBeCloseTo(r.unit.total, 10);
  });

  it('entrega o preço recomendado com a margem pedida', () => {
    const r = expectOk(input);
    expect(r.recommendedPrice).toBeCloseTo(5.88, 2);
    expect(r.recommended.marginPercent).toBeGreaterThanOrEqual(60);
    expect(r.recommended.markup).toBeCloseTo(r.recommendedPrice / r.unit.total, 8);
  });
});

describe('validações', () => {
  it('recusa rendimento zero com mensagem em português', () => {
    const outcome = calculatePricing(baseInput({ yieldQuantity: 0 }));
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.issues[0]?.field).toBe('yieldQuantity');
    expect(outcome.issues[0]?.message).toMatch(/rendimento/i);
  });

  it('recusa receita sem ingredientes', () => {
    const outcome = calculatePricing(baseInput({ ingredients: [] }));
    expect(outcome.ok).toBe(false);
  });

  it('recusa ingrediente sem preço cadastrado', () => {
    const outcome = calculatePricing(
      baseInput({ ingredients: [ingredient({ name: 'Morango', purchasePrice: 0 })] }),
    );
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.issues.some((i) => i.message.includes('Morango'))).toBe(true);
  });

  it('recusa quantidade negativa ou zero', () => {
    expect(calculatePricing(baseInput({ ingredients: [ingredient({ quantity: 0 })] })).ok).toBe(false);
    expect(calculatePricing(baseInput({ ingredients: [ingredient({ quantity: -5 })] })).ok).toBe(false);
  });

  it('recusa misturar peso com volume', () => {
    const outcome = calculatePricing(
      baseInput({ ingredients: [ingredient({ unit: 'ml', purchaseUnit: 'kg' })] }),
    );
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.issues[0]?.message).toMatch(/mesmo tipo/i);
  });

  it('recusa custo adicional negativo', () => {
    const outcome = calculatePricing(
      baseInput({ extras: [{ label: 'Frete', category: 'other', amount: -1, scope: 'batch' }] }),
    );
    expect(outcome.ok).toBe(false);
  });

  it('recusa margem acima do limite', () => {
    expect(calculatePricing(baseInput({ desiredMarginPercent: MAX_MARGIN_PERCENT + 1 })).ok).toBe(false);
  });

  it('recusa margem somada às taxas acima de 100%', () => {
    const outcome = calculatePricing(
      baseInput({ desiredMarginPercent: 90, variableFeesPercent: 15 }),
    );
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.issues[0]?.message).toMatch(/100%/);
  });
});
