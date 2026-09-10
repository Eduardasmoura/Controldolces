import { calculatePricing, type PricingInput, type PricingResult } from '@/lib/pricing';

/**
 * Receita de demonstração da página inicial.
 *
 * Os números que aparecem na vitrine NÃO são escritos à mão: esta entrada passa
 * pelo mesmo motor que precifica os produtos das usuárias. Se uma fórmula mudar,
 * a vitrine muda junto — nunca vai mostrar um resultado que o produto não produz.
 *
 * A receita foi montada para custar exatamente R$ 4,80 por unidade, com os
 * ingredientes e custos que uma brownie de verdade tem:
 *
 *   ingredientes  R$ 28,80  →  R$ 1,80/un
 *   embalagem     R$ 19,20  →  R$ 1,20/un
 *   mão de obra   R$ 20,00  →  R$ 1,25/un   (48 min a R$ 25/h)
 *   gás           R$  3,20  →  R$ 0,20/un
 *   energia       R$  5,60  →  R$ 0,35/un
 *   ────────────────────────────────────────
 *   total         R$ 76,80  →  R$ 4,80/un   (rende 16)
 */
export const BROWNIE_DEMO: PricingInput = {
  yieldQuantity: 16,
  ingredients: [
    {
      ingredientId: 'chocolate',
      name: 'Chocolate meio amargo',
      quantity: 400,
      unit: 'g',
      purchaseQuantity: 1,
      purchaseUnit: 'kg',
      purchasePrice: 29.9,
    },
    {
      ingredientId: 'manteiga',
      name: 'Manteiga sem sal',
      quantity: 200,
      unit: 'g',
      purchaseQuantity: 500,
      purchaseUnit: 'g',
      purchasePrice: 25,
    },
    {
      ingredientId: 'ovos',
      name: 'Ovos',
      quantity: 3,
      unit: 'un',
      purchaseQuantity: 1,
      purchaseUnit: 'dz',
      purchasePrice: 12,
    },
    {
      ingredientId: 'acucar',
      name: 'Açúcar',
      quantity: 300,
      unit: 'g',
      purchaseQuantity: 1,
      purchaseUnit: 'kg',
      purchasePrice: 5,
    },
    {
      ingredientId: 'farinha',
      name: 'Farinha de trigo',
      quantity: 180,
      unit: 'g',
      purchaseQuantity: 1,
      purchaseUnit: 'kg',
      purchasePrice: 6,
    },
    {
      ingredientId: 'cacau',
      name: 'Cacau em pó',
      quantity: 40,
      unit: 'g',
      purchaseQuantity: 1,
      purchaseUnit: 'kg',
      purchasePrice: 31.5,
    },
  ],
  labor: { hourlyRate: 25, minutes: 48 },
  extras: [
    { label: 'Caixa e fita', category: 'packaging', amount: 1.2, scope: 'unit' },
    { label: 'Gás', category: 'gas', amount: 3.2, scope: 'batch' },
    { label: 'Energia do forno', category: 'energy', amount: 5.6, scope: 'batch' },
  ],
  indirect: { method: 'none' },
  desiredMarginPercent: 60,
  variableFeesPercent: 0,
  // Margem mínima de segurança: é ela que coloca o preço mínimo em R$ 8,00 em vez
  // do ponto de equilíbrio puro. A página explica isso ao lado do número.
  minimumMarginPercent: 40,
};

export const BROWNIE_NOME = 'Brownie';
export const BROWNIE_RENDIMENTO = 'unidades';

/**
 * Resultado da receita de demonstração.
 *
 * Roda em tempo de build. Se a receita deixar de ser calculável, o build QUEBRA
 * em vez de publicar uma vitrine com números errados — é de propósito.
 */
export function brownieResult(): PricingResult {
  const outcome = calculatePricing(BROWNIE_DEMO);
  if (!outcome.ok) {
    throw new Error(
      `Receita de demonstração inválida: ${outcome.issues.map((issue) => issue.message).join(' | ')}`,
    );
  }
  return outcome.result;
}
