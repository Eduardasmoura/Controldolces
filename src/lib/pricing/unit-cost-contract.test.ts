import { describe, expect, it } from 'vitest';

import casos from '../../../supabase/tests/unit-cost-cases.json';
import { costPerBaseUnit } from './engine';
import type { Unit } from './units';

/**
 * Contrato entre as duas implementações da conversão de unidades.
 *
 * O custo por unidade-base é calculado em dois lugares: na coluna gerada
 * `ingredients.unit_cost` (Postgres) e em `costPerBaseUnit` (TypeScript). Ambas
 * leem os mesmos casos deste arquivo JSON — este teste cobre o lado TypeScript e
 * `supabase/tests/run.sh` cobre o lado do banco. Se alguém mexer só em um, o
 * outro acusa.
 */
describe('contrato do custo por unidade-base', () => {
  for (const caso of casos.casos) {
    it(`${caso.nome}: ${caso.quantidade} ${caso.unidade} por R$ ${caso.preco}`, () => {
      const calculado = costPerBaseUnit({
        purchaseQuantity: caso.quantidade,
        purchaseUnit: caso.unidade as Unit,
        purchasePrice: caso.preco,
      });
      expect(calculado).toBeCloseTo(caso.esperado, 9);
    });
  }

  it('cobre todas as unidades que o sistema aceita', () => {
    const cobertas = new Set(casos.casos.map((caso) => caso.unidade));
    for (const unidade of ['kg', 'g', 'mg', 'l', 'ml', 'un', 'dz']) {
      expect(cobertas.has(unidade)).toBe(true);
    }
  });
});
