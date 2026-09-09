/**
 * Conversão de unidades de medida.
 *
 * Cada unidade pertence a uma dimensão (massa, volume ou contagem) e possui um
 * fator de conversão para a unidade-base daquela dimensão. Todo custo interno do
 * sistema é armazenado por unidade-base (grama, mililitro ou unidade), de modo que
 * um ingrediente comprado em quilos possa ser usado em gramas sem conversão manual.
 */

export type Dimension = 'mass' | 'volume' | 'count';

export type Unit = 'kg' | 'g' | 'mg' | 'l' | 'ml' | 'un' | 'dz';

type UnitDefinition = {
  dimension: Dimension;
  /** Quantos unidades-base equivalem a 1 desta unidade. */
  factor: number;
  label: string;
  /** Rótulo curto usado em tabelas e resultados. */
  short: string;
};

const UNITS: Record<Unit, UnitDefinition> = {
  kg: { dimension: 'mass', factor: 1000, label: 'Quilograma (kg)', short: 'kg' },
  g: { dimension: 'mass', factor: 1, label: 'Grama (g)', short: 'g' },
  mg: { dimension: 'mass', factor: 0.001, label: 'Miligrama (mg)', short: 'mg' },
  l: { dimension: 'volume', factor: 1000, label: 'Litro (L)', short: 'L' },
  ml: { dimension: 'volume', factor: 1, label: 'Mililitro (ml)', short: 'ml' },
  un: { dimension: 'count', factor: 1, label: 'Unidade (un)', short: 'un' },
  dz: { dimension: 'count', factor: 12, label: 'Dúzia (dz)', short: 'dz' },
};

export const ALL_UNITS = Object.keys(UNITS) as Unit[];

export const BASE_UNIT_OF: Record<Dimension, Unit> = {
  mass: 'g',
  volume: 'ml',
  count: 'un',
};

export function isUnit(value: string): value is Unit {
  return Object.prototype.hasOwnProperty.call(UNITS, value);
}

export function unitDefinition(unit: Unit): UnitDefinition {
  return UNITS[unit];
}

export function unitLabel(unit: Unit): string {
  return UNITS[unit].label;
}

export function unitShort(unit: Unit): string {
  return UNITS[unit].short;
}

export function dimensionOf(unit: Unit): Dimension {
  return UNITS[unit].dimension;
}

export function baseUnitOf(unit: Unit): Unit {
  return BASE_UNIT_OF[UNITS[unit].dimension];
}

/** Converte uma quantidade para a unidade-base da sua dimensão. */
export function toBaseQuantity(quantity: number, unit: Unit): number {
  return quantity * UNITS[unit].factor;
}

/** Unidades que a usuária pode escolher ao lançar uma quantidade de um ingrediente. */
export function compatibleUnits(unit: Unit): Unit[] {
  const dimension = UNITS[unit].dimension;
  return ALL_UNITS.filter((candidate) => UNITS[candidate].dimension === dimension);
}

export function areCompatible(a: Unit, b: Unit): boolean {
  return UNITS[a].dimension === UNITS[b].dimension;
}
