/**
 * Categorias de ingrediente.
 *
 * Lista fechada para a busca por categoria funcionar de verdade: campo livre
 * viraria "Chocolate", "chocolates" e "Chocolate " como três categorias
 * distintas. "Outros" cobre o que não encaixa, e ficar sem categoria é válido.
 */
export const INGREDIENT_CATEGORIES = [
  'Chocolates',
  'Laticínios',
  'Frutas',
  'Farinhas',
  'Açúcares',
  'Recheios',
  'Coberturas',
  'Confeitos',
  'Bebidas',
  'Outros',
] as const;

export type IngredientCategory = (typeof INGREDIENT_CATEGORIES)[number];

/** Valor usado na URL para filtrar quem está sem categoria. */
export const SEM_CATEGORIA = 'sem-categoria';
