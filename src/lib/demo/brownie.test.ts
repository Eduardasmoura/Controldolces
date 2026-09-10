import { describe, expect, it } from 'vitest';

import { calculatePricing } from '@/lib/pricing';

import { BROWNIE_DEMO } from './brownie';

/**
 * A vitrine mostra números; este teste garante que eles são os números que o
 * produto realmente calcula. Se alguém mexer na receita de demonstração ou numa
 * fórmula do motor sem querer, a página inicial passa a mentir — e é isso que
 * este arquivo impede.
 */
describe('receita de demonstração da página inicial', () => {
  const outcome = calculatePricing(BROWNIE_DEMO);

  it('é calculável', () => {
    expect(outcome.ok).toBe(true);
  });

  it('compõe o custo do lote como a página descreve', () => {
    if (!outcome.ok) return;
    const { batch } = outcome.result;

    expect(batch.ingredients).toBeCloseTo(28.8, 10);
    expect(batch.packaging).toBeCloseTo(19.2, 10);
    expect(batch.labor).toBeCloseTo(20, 10);
    expect(batch.gas).toBeCloseTo(3.2, 10);
    expect(batch.energy).toBeCloseTo(5.6, 10);
    expect(batch.total).toBeCloseTo(76.8, 10);
  });

  it('entrega exatamente os números anunciados na landing page', () => {
    if (!outcome.ok) return;
    const { result } = outcome;

    expect(result.unit.total).toBeCloseTo(4.8, 10);
    expect(result.minimumPrice).toBe(8);
    expect(result.recommendedPrice).toBe(12);
    expect(result.recommended.profitPerUnit).toBeCloseTo(7.2, 10);
    expect(result.recommended.marginPercent).toBeCloseTo(60, 10);
    expect(result.recommended.markup).toBeCloseTo(2.5, 10);
  });

  it('as partes do custo unitário somam o total', () => {
    if (!outcome.ok) return;
    const { unit } = outcome.result;
    const soma =
      unit.ingredients + unit.packaging + unit.labor + unit.gas + unit.energy + unit.other + unit.indirect;
    expect(soma).toBeCloseTo(unit.total, 10);
  });
});
