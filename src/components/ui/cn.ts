/** Junta classes ignorando valores falsos. Substitui `clsx` sem custo de dependência. */
export function cn(...classes: unknown[]): string {
  return classes.filter((value): value is string => typeof value === 'string' && value.length > 0).join(' ');
}
