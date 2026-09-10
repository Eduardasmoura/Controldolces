/**
 * Motor de precificação.
 *
 * Este arquivo é a ÚNICA fonte de verdade dos cálculos financeiros do sistema.
 * Nenhuma tela, action ou relatório deve reimplementar uma fórmula daqui — todas
 * chamam `calculatePricing` ou `simulatePrice`. Ele é puro: não lê banco, não
 * depende de React e não formata nada, o que o torna testável e reutilizável
 * tanto no servidor quanto no simulador em tempo real do navegador.
 *
 * Convenções:
 * - Margem  = lucro ÷ PREÇO DE VENDA  (quanto sobra de cada real vendido)
 * - Markup  = preço ÷ CUSTO          (quantas vezes o custo o preço representa)
 *   Os dois NÃO são sinônimos e o sistema nunca os trata como tal.
 */

import { ceilCurrency, isNonNegativeNumber, isPositiveNumber, sum } from './money';
import type {
  CostBreakdown,
  ExtraCostCategory,
  ExtraCostInput,
  IndirectCostConfig,
  IngredientCostLine,
  IngredientPurchase,
  PriceSimulation,
  PricingInput,
  PricingIssue,
  PricingOutcome,
  RecipeIngredientInput,
} from './types';
import { areCompatible, toBaseQuantity } from './units';

/** Margem máxima aceita. Acima disso o preço dispara para o infinito. */
export const MAX_MARGIN_PERCENT = 95;

/**
 * Custo por unidade-base (grama, mililitro ou unidade) de um ingrediente.
 *
 * Ex.: 1 kg de chocolate por R$ 29,90 -> 1000 g -> R$ 0,0299 por grama.
 */
export function costPerBaseUnit(purchase: IngredientPurchase): number {
  const baseQuantity = toBaseQuantity(purchase.purchaseQuantity, purchase.purchaseUnit);
  if (!isPositiveNumber(baseQuantity)) return 0;
  return purchase.purchasePrice / baseQuantity;
}

/**
 * CMV — Custo da Mercadoria Vendida: ingredientes + embalagem.
 *
 * Fica de fora tudo o que é custo de OPERAR (mão de obra, gás, energia,
 * indiretos). O CMV mede a mercadoria, não a operação. Separar os dois é o que
 * permite comparar produtos entre si sem que o tempo de forno de um bolo
 * distorça a comparação com um brigadeiro.
 */
export function cmvFrom(breakdown: CostBreakdown): number {
  return breakdown.ingredients + breakdown.packaging;
}

/** Custo de uma quantidade usada numa receita. */
export function ingredientLineCost(ingredient: RecipeIngredientInput): number {
  const used = toBaseQuantity(ingredient.quantity, ingredient.unit);
  return costPerBaseUnit(ingredient) * used;
}

function emptyBreakdown(): CostBreakdown {
  return {
    ingredients: 0,
    packaging: 0,
    labor: 0,
    gas: 0,
    energy: 0,
    other: 0,
    indirect: 0,
    total: 0,
  };
}

function divideBreakdown(breakdown: CostBreakdown, divisor: number): CostBreakdown {
  const entries = Object.entries(breakdown) as [keyof CostBreakdown, number][];
  const result = emptyBreakdown();
  for (const [key, value] of entries) result[key] = value / divisor;
  return result;
}

/** Converte a mão de obra num custo de lote: valor/hora × horas trabalhadas. */
export function laborCost(hourlyRate: number, minutes: number): number {
  return hourlyRate * (minutes / 60);
}

/** Rateio dos custos indiretos para o lote inteiro. */
export function indirectCostForBatch(
  config: IndirectCostConfig,
  directBatchCost: number,
  yieldQuantity: number,
  batchHours: number,
): number {
  switch (config.method) {
    case 'none':
      return 0;
    case 'percent':
      return directBatchCost * (config.percent / 100);
    case 'monthly_units': {
      if (!isPositiveNumber(config.monthlyUnits)) return 0;
      return (config.monthlyAmount / config.monthlyUnits) * yieldQuantity;
    }
    case 'monthly_hours': {
      if (!isPositiveNumber(config.monthlyHours)) return 0;
      return (config.monthlyAmount / config.monthlyHours) * batchHours;
    }
    default:
      return 0;
  }
}

/**
 * Preço que entrega exatamente a margem desejada DEPOIS de descontar as taxas
 * que incidem sobre a venda.
 *
 *   preço = custo ÷ (1 − margem − taxas)
 *
 * A dedução: lucro = preço − custo − taxas×preço. Impondo lucro = margem×preço,
 * chega-se à fórmula acima. Usar `custo × (1 + margem)` seria markup disfarçado
 * de margem e entregaria menos lucro do que a usuária pediu.
 */
export function priceForMargin(unitCost: number, marginPercent: number, feesPercent: number): number {
  const denominator = 1 - marginPercent / 100 - feesPercent / 100;
  if (denominator <= 0) return Number.POSITIVE_INFINITY;
  return unitCost / denominator;
}

/** Margem realizada num determinado preço, já descontadas as taxas. */
export function marginAtPrice(unitCost: number, salePrice: number, feesPercent: number): number {
  if (!isPositiveNumber(salePrice)) return 0;
  const fees = salePrice * (feesPercent / 100);
  return ((salePrice - fees - unitCost) / salePrice) * 100;
}

/** Markup: quantas vezes o custo o preço representa. */
export function markupAtPrice(unitCost: number, salePrice: number): number {
  if (!isPositiveNumber(unitCost)) return 0;
  return salePrice / unitCost;
}

/** Retrato completo de um preço de venda — alimenta o simulador em tempo real. */
export function simulatePrice(
  unitCost: number,
  salePrice: number,
  feesPercent: number,
  yieldQuantity = 1,
  /** CMV unitário. Quando omitido, o percentual de CMV volta zero. */
  unitCmv = 0,
): PriceSimulation {
  const feesAmount = salePrice * (feesPercent / 100);
  const profitPerUnit = salePrice - feesAmount - unitCost;
  return {
    salePrice,
    unitCost,
    feesAmount,
    profitPerUnit,
    profitPerBatch: profitPerUnit * yieldQuantity,
    marginPercent: marginAtPrice(unitCost, salePrice, feesPercent),
    markup: markupAtPrice(unitCost, salePrice),
    coversCosts: profitPerUnit >= 0,
    cmvPercent: isPositiveNumber(salePrice) ? (unitCmv / salePrice) * 100 : 0,
  };
}

function validate(input: PricingInput): PricingIssue[] {
  const issues: PricingIssue[] = [];

  if (!isPositiveNumber(input.yieldQuantity)) {
    issues.push({
      field: 'yieldQuantity',
      message: 'Informe quantas unidades a receita rende. O rendimento precisa ser maior que zero.',
    });
  }

  if (input.ingredients.length === 0) {
    issues.push({
      field: 'ingredients',
      message: 'Adicione pelo menos um ingrediente à receita para calcular o custo.',
    });
  }

  for (const ingredient of input.ingredients) {
    const name = ingredient.name || 'Ingrediente';
    if (!isPositiveNumber(ingredient.quantity)) {
      issues.push({
        field: 'ingredients',
        message: `Informe a quantidade de "${name}" usada na receita.`,
      });
    }
    if (!isPositiveNumber(ingredient.purchaseQuantity) || !isPositiveNumber(ingredient.purchasePrice)) {
      issues.push({
        field: 'ingredients',
        message: `"${name}" está sem preço de compra cadastrado. Atualize o ingrediente para continuar.`,
      });
    }
    if (!areCompatible(ingredient.unit, ingredient.purchaseUnit)) {
      issues.push({
        field: 'ingredients',
        message: `A unidade usada em "${name}" não combina com a unidade de compra. Use medidas do mesmo tipo (peso com peso, volume com volume).`,
      });
    }
  }

  if (input.labor) {
    if (!isNonNegativeNumber(input.labor.hourlyRate) || !isNonNegativeNumber(input.labor.minutes)) {
      issues.push({
        field: 'labor',
        message: 'O valor da hora e o tempo de produção não podem ser negativos.',
      });
    }
  }

  for (const extra of input.extras) {
    if (!isNonNegativeNumber(extra.amount)) {
      issues.push({
        field: 'extras',
        message: `O custo "${extra.label || 'sem nome'}" precisa ter um valor igual ou maior que zero.`,
      });
    }
  }

  if (!isNonNegativeNumber(input.desiredMarginPercent) || input.desiredMarginPercent > MAX_MARGIN_PERCENT) {
    issues.push({
      field: 'desiredMarginPercent',
      message: `Escolha uma margem entre 0% e ${MAX_MARGIN_PERCENT}%.`,
    });
  }

  if (!isNonNegativeNumber(input.variableFeesPercent) || input.variableFeesPercent >= 100) {
    issues.push({
      field: 'variableFeesPercent',
      message: 'As taxas sobre a venda precisam ficar entre 0% e 99%.',
    });
  }

  if (!isNonNegativeNumber(input.minimumMarginPercent) || input.minimumMarginPercent > MAX_MARGIN_PERCENT) {
    issues.push({
      field: 'minimumMarginPercent',
      message: `A margem mínima precisa ficar entre 0% e ${MAX_MARGIN_PERCENT}%.`,
    });
  }

  if (issues.length === 0) {
    const total = input.desiredMarginPercent + input.variableFeesPercent;
    if (total >= 100) {
      issues.push({
        field: 'desiredMarginPercent',
        message:
          'A margem desejada somada às taxas passa de 100% do preço. Reduza a margem ou as taxas para o preço fazer sentido.',
      });
    }
  }

  return issues;
}

const CATEGORY_KEYS: Record<ExtraCostCategory, keyof CostBreakdown> = {
  packaging: 'packaging',
  labor: 'labor',
  gas: 'gas',
  energy: 'energy',
  other: 'other',
};

function accumulateExtras(
  breakdown: CostBreakdown,
  extras: ExtraCostInput[],
  yieldQuantity: number,
): void {
  for (const extra of extras) {
    const batchAmount = extra.scope === 'unit' ? extra.amount * yieldQuantity : extra.amount;
    const key = CATEGORY_KEYS[extra.category] ?? 'other';
    breakdown[key] += batchAmount;
  }
}

/**
 * Calcula custos e preços de um produto.
 *
 * Devolve um resultado explícito de sucesso ou de falha com mensagens em português
 * prontas para a tela — nada de exceções técnicas vazando para a usuária.
 */
export function calculatePricing(input: PricingInput): PricingOutcome {
  const issues = validate(input);
  if (issues.length > 0) return { ok: false, issues };

  const { yieldQuantity } = input;

  const totalIngredientsCost = sum(input.ingredients.map(ingredientLineCost));

  const ingredientLines: IngredientCostLine[] = input.ingredients.map((ingredient) => {
    const batchCost = ingredientLineCost(ingredient);
    return {
      ingredientId: ingredient.ingredientId,
      name: ingredient.name,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      costPerBaseUnit: costPerBaseUnit(ingredient),
      batchCost,
      unitCost: batchCost / yieldQuantity,
      sharePercent: totalIngredientsCost > 0 ? (batchCost / totalIngredientsCost) * 100 : 0,
    };
  });

  const batch = emptyBreakdown();
  batch.ingredients = totalIngredientsCost;

  const batchHours = input.labor ? input.labor.minutes / 60 : 0;
  if (input.labor) {
    batch.labor += laborCost(input.labor.hourlyRate, input.labor.minutes);
  }

  accumulateExtras(batch, input.extras, yieldQuantity);

  const directBatchCost =
    batch.ingredients + batch.packaging + batch.labor + batch.gas + batch.energy + batch.other;

  batch.indirect = indirectCostForBatch(input.indirect, directBatchCost, yieldQuantity, batchHours);
  batch.total = directBatchCost + batch.indirect;

  const unit = divideBreakdown(batch, yieldQuantity);

  const minimumPrice = ceilCurrency(
    priceForMargin(unit.total, input.minimumMarginPercent, input.variableFeesPercent),
  );
  const recommendedPrice = ceilCurrency(
    priceForMargin(unit.total, input.desiredMarginPercent, input.variableFeesPercent),
  );

  return {
    ok: true,
    result: {
      yieldQuantity,
      ingredientLines,
      batch,
      unit,
      cmv: { unit: cmvFrom(unit), batch: cmvFrom(batch) },
      minimumPrice,
      recommendedPrice,
      desiredMarginPercent: input.desiredMarginPercent,
      variableFeesPercent: input.variableFeesPercent,
      recommended: simulatePrice(
        unit.total,
        recommendedPrice,
        input.variableFeesPercent,
        yieldQuantity,
        cmvFrom(unit),
      ),
    },
  };
}
