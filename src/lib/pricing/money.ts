/**
 * Utilidades numéricas para valores financeiros.
 *
 * Regra do sistema: os cálculos correm com a precisão total do ponto flutuante e o
 * arredondamento acontece somente na apresentação (ou ao gravar o resultado final).
 * Arredondar a cada etapa intermediária acumularia erro — em receitas com dezenas de
 * ingredientes isso vira centavos visíveis no preço final.
 */

/** Arredonda meia-unidade para cima, corrigindo a representação binária (ex.: 1.005 -> 1.01). */
export function roundTo(value: number, decimals: number): number {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** decimals;
  const scaled = value * factor;
  // Correção do erro de representação: 1.005 * 100 = 100.49999999999999 em IEEE-754.
  const corrected = Math.round(Number(scaled.toPrecision(12)));
  return corrected / factor;
}

/** Arredonda para centavos — usado na exibição e na gravação de resultados. */
export function roundCurrency(value: number): number {
  return roundTo(value, 2);
}

/** Arredonda centavos para cima — usado em preços mínimos, que nunca podem ficar abaixo do custo. */
export function ceilCurrency(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.ceil(Number((value * 100).toPrecision(12))) / 100;
}

/** Arredonda percentuais para uma casa decimal. */
export function roundPercent(value: number): number {
  return roundTo(value, 1);
}

/** Soma uma lista sem arredondamento intermediário. */
export function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

export function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

export function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}
