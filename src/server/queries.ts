import { cache } from 'react';

import type {
  IngredientPriceRow,
  IngredientRow,
  PricingCalculationRow,
  PricingHistoryRow,
  ProductExtraCostRow,
  ProductRow,
  RecipeIngredientRow,
  RecipeRow,
  SubscriptionRow,
} from '@/lib/database.types';
import { SEM_CATEGORIA } from '@/lib/ingredient-categories';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Camada de leitura.
 *
 * Todas as consultas passam por aqui para que nenhuma tela monte SQL por conta
 * própria. O filtro por business_id é explícito mesmo com RLS ativo: defesa em
 * profundidade, e evita consultas acidentalmente amplas.
 *
 * Colunas `numeric` do Postgres chegam como número, mas são normalizadas com
 * `num()` — um valor financeiro nunca deve virar string por acidente.
 */

function num(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Campos financeiros de uma precificação, sempre como número.
 * Compartilhado pelas duas tabelas de precificação, que têm as mesmas colunas.
 */
function normalizePricingNumbers<T extends Record<string, unknown>>(row: T) {
  const campos = [
    'sale_price',
    'unit_cost',
    'ingredient_cost',
    'packaging_cost',
    'labor_cost',
    'gas_cost',
    'electricity_cost',
    'other_cost',
    'indirect_cost',
    'total_cost',
    'minimum_price',
    'suggested_price',
    'desired_margin',
    'margin_percentage',
    'markup',
    'profit_per_unit',
    'profit_total',
    'yield_quantity',
  ] as const;

  const saida: Record<string, number> = {};
  for (const campo of campos) {
    if (campo in row) saida[campo] = num(row[campo]);
  }
  return saida;
}

export function normalizeIngredient(row: IngredientRow): IngredientRow {
  return {
    ...row,
    purchase_quantity: num(row.purchase_quantity),
    purchase_price: num(row.purchase_price),
    unit_cost: num(row.unit_cost),
  };
}

export function normalizeProduct(row: ProductRow): ProductRow {
  return {
    ...row,
    yield_quantity: num(row.yield_quantity),
    labor_minutes: Math.round(num(row.labor_minutes)),
    margin_percent: row.margin_percent == null ? null : num(row.margin_percent),
  };
}

export const listIngredients = cache(async (businessId: string): Promise<IngredientRow[]> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .eq('business_id', businessId)
    .is('archived_at', null)
    .order('name', { ascending: true });

  if (error) {
    console.error('[controldolces] listIngredients', error);
    throw new Error('FALHA_LEITURA_INGREDIENTES');
  }

  return (data ?? []).map(normalizeIngredient);
});

export type IngredientFilters = {
  /** Termo digitado na busca. Casa com qualquer parte do nome. */
  search?: string;
  /** Categoria exata, ou SEM_CATEGORIA para os que não têm nenhuma. */
  category?: string;
  /** Inclui os desativados na listagem. */
  includeInactive?: boolean;
  page?: number;
  pageSize?: number;
};

export type IngredientPage = {
  rows: IngredientRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export const INGREDIENTS_PAGE_SIZE = 20;

/**
 * Listagem paginada, com busca e filtro feitos no banco.
 *
 * Filtrar em JavaScript exigiria trazer a lista inteira — o que funciona com 20
 * insumos e vira um problema com 800. O Postgres devolve só a página pedida e a
 * contagem total, numa consulta só.
 */
export const listIngredientsPage = cache(
  async (businessId: string, filters: IngredientFilters = {}): Promise<IngredientPage> => {
    const pageSize = filters.pageSize ?? INGREDIENTS_PAGE_SIZE;
    const page = Math.max(1, filters.page ?? 1);
    const from = (page - 1) * pageSize;

    const supabase = await createSupabaseServerClient();
    let query = supabase
      .from('ingredients')
      .select('*', { count: 'exact' })
      .eq('business_id', businessId);

    if (!filters.includeInactive) query = query.is('archived_at', null);

    const termo = filters.search?.trim();
    if (termo) {
      // Escapa os curingas do LIKE para que "100%" seja buscado como texto.
      const seguro = termo.replace(/[%_\\]/g, (caractere) => `\\${caractere}`);
      query = query.ilike('name', `%${seguro}%`);
    }

    if (filters.category === SEM_CATEGORIA) {
      query = query.is('category', null);
    } else if (filters.category) {
      query = query.eq('category', filters.category);
    }

    const { data, count, error } = await query
      .order('name', { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('[controldolces] listIngredientsPage', error);
      throw new Error('FALHA_LEITURA_INGREDIENTES');
    }

    const total = count ?? 0;

    return {
      rows: (data ?? []).map(normalizeIngredient),
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
    };
  },
);

/** Histórico de preços de um ingrediente, do mais recente para o mais antigo. */
export const listIngredientPriceHistory = cache(
  async (businessId: string, ingredientId: string): Promise<IngredientPriceRow[]> => {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from('ingredient_prices')
      .select('*')
      .eq('business_id', businessId)
      .eq('ingredient_id', ingredientId)
      .order('recorded_at', { ascending: false })
      .limit(50);

    return (data ?? []).map((row) => ({
      ...row,
      purchase_quantity: num(row.purchase_quantity),
      purchase_price: num(row.purchase_price),
      normalized_quantity: num(row.normalized_quantity),
      unit_cost: num(row.unit_cost),
    }));
  },
);

/** Em quantas receitas cada ingrediente aparece. Uma consulta para a lista toda. */
export const getIngredient = cache(
  async (businessId: string, id: string): Promise<IngredientRow | null> => {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from('ingredients')
      .select('*')
      .eq('business_id', businessId)
      .eq('id', id)
      .maybeSingle();

    return data ? normalizeIngredient(data) : null;
  },
);

/** Quantas receitas usam cada ingrediente — impede exclusões que quebrariam fichas. */
export const countIngredientUsage = cache(
  async (businessId: string): Promise<Record<string, number>> => {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from('recipe_ingredients')
      .select('ingredient_id')
      .eq('business_id', businessId);

    const usage: Record<string, number> = {};
    for (const row of data ?? []) {
      usage[row.ingredient_id] = (usage[row.ingredient_id] ?? 0) + 1;
    }
    return usage;
  },
);

export type ProductDetail = {
  product: ProductRow;
  recipe: RecipeRow | null;
  items: (RecipeIngredientRow & { ingredient: IngredientRow })[];
  extras: ProductExtraCostRow[];
};

export const listProducts = cache(async (businessId: string): Promise<ProductRow[]> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('business_id', businessId)
    .is('archived_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[controldolces] listProducts', error);
    throw new Error('FALHA_LEITURA_PRODUTOS');
  }

  return (data ?? []).map(normalizeProduct);
});

export const getProductDetail = cache(
  async (businessId: string, productId: string): Promise<ProductDetail | null> => {
    const supabase = await createSupabaseServerClient();

    const { data: product } = await supabase
      .from('products')
      .select('*')
      .eq('business_id', businessId)
      .eq('id', productId)
      .maybeSingle();

    if (!product) return null;

    const { data: recipe } = await supabase
      .from('recipes')
      .select('*')
      .eq('business_id', businessId)
      .eq('product_id', productId)
      .eq('is_active', true)
      .maybeSingle();

    // Duas consultas em vez de um join aninhado: o mapeamento fica explícito e
    // independente dos metadados de relacionamento do PostgREST.
    const [itemsResult, extrasResult, ingredientsList] = await Promise.all([
      recipe
        ? supabase
            .from('recipe_ingredients')
            .select('*')
            .eq('business_id', businessId)
            .eq('recipe_id', recipe.id)
            .order('position', { ascending: true })
        : Promise.resolve({ data: [] as RecipeIngredientRow[] }),
      supabase
        .from('product_extra_costs')
        .select('*')
        .eq('business_id', businessId)
        .eq('product_id', productId)
        .order('position', { ascending: true }),
      listIngredients(businessId),
    ]);

    const byId = new Map(ingredientsList.map((row) => [row.id, row]));

    const items = (itemsResult.data ?? []).flatMap((row) => {
      const ingredient = byId.get(row.ingredient_id);
      if (!ingredient) return [];
      return [{ ...row, quantity: num(row.quantity), ingredient }];
    });

    const extras = (extrasResult.data ?? []).map((row) => ({ ...row, amount: num(row.amount) }));

    return { product: normalizeProduct(product), recipe: recipe ?? null, items, extras };
  },
);

export type SavedPricing = PricingCalculationRow & { product: ProductRow | null };

export const listSavedPricings = cache(async (businessId: string): Promise<SavedPricing[]> => {
  const supabase = await createSupabaseServerClient();
  const [{ data }, products] = await Promise.all([
    supabase
      .from('pricing_calculations')
      .select('*')
      .eq('business_id', businessId)
      .order('updated_at', { ascending: false }),
    listProducts(businessId),
  ]);

  const byId = new Map(products.map((product) => [product.id, product]));

  return (data ?? []).map((row) => ({
    ...row,
    ...normalizePricingNumbers(row),
    product: byId.get(row.product_id) ?? null,
  }));
});

export const listPricingHistory = cache(
  async (businessId: string, limit = 100): Promise<PricingHistoryRow[]> => {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from('pricing_history')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return (data ?? []).map((row) => ({ ...row, ...normalizePricingNumbers(row) }));
  },
);

export const getSubscription = cache(async (businessId: string): Promise<SubscriptionRow | null> => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('business_id', businessId)
    .maybeSingle();

  return data ?? null;
});

export type DashboardSummary = {
  ingredientsCount: number;
  productsCount: number;
  pricingsCount: number;
  /** Nulos quando ainda não há precificação salva — a tela mostra "—", nunca zero inventado. */
  averageMargin: number | null;
  averageUnitCost: number | null;
  potentialProfit: number | null;
  lowMarginCount: number;
  belowMinimumCount: number;
};

/**
 * Resumo do painel numa única ida ao banco.
 *
 * Conta no Postgres em vez de trazer as linhas para contar em JavaScript.
 * Devolve `null` — e não zero — nas médias quando não há precificação: a
 * diferença entre "não há dados" e "a média é zero" importa na tela.
 */
export const getDashboardSummary = cache(async (): Promise<DashboardSummary> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc('dashboard_summary');

  if (error) {
    console.error('[controldolces] dashboard_summary', error);
    throw new Error('FALHA_RESUMO_PAINEL');
  }

  const linha = Array.isArray(data) ? data[0] : undefined;

  return {
    ingredientsCount: num(linha?.ingredients_count),
    productsCount: num(linha?.products_count),
    pricingsCount: num(linha?.pricings_count),
    averageMargin: linha?.average_margin == null ? null : num(linha.average_margin),
    averageUnitCost: linha?.average_unit_cost == null ? null : num(linha.average_unit_cost),
    potentialProfit: linha?.potential_profit == null ? null : num(linha.potential_profit),
    lowMarginCount: num(linha?.low_margin_count),
    belowMinimumCount: num(linha?.below_minimum_count),
  };
});

/** As precificações mais recentes, com o nome do produto. Só o que o painel exibe. */
export const listRecentPricings = cache(
  async (businessId: string, limit = 5): Promise<SavedPricing[]> => {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('pricing_calculations')
      .select('*')
      .eq('business_id', businessId)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[controldolces] listRecentPricings', error);
      throw new Error('FALHA_PRECIFICACOES_RECENTES');
    }

    const linhas = data ?? [];
    if (linhas.length === 0) return [];

    // Busca só os produtos que aparecem na lista, não o catálogo inteiro.
    const { data: produtos } = await supabase
      .from('products')
      .select('*')
      .eq('business_id', businessId)
      .in('id', linhas.map((linha) => linha.product_id));

    const porId = new Map((produtos ?? []).map((produto) => [produto.id, normalizeProduct(produto)]));

    return linhas.map((linha) => ({
      ...linha,
      ...normalizePricingNumbers(linha),
      product: porId.get(linha.product_id) ?? null,
    }));
  },
);
