'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { areCompatible, type Unit } from '@/lib/pricing';
import { productSchema } from '@/lib/validation/schemas';
import { requireBusinessId } from '@/server/context';
import { databaseError, failure, invalid, success, type FormState } from '@/server/form-state';
import { listIngredients } from '@/server/queries';

const CAMINHOS = ['/produtos', '/painel', '/precificar', '/historico', '/relatorios'];

function revalidarTudo() {
  for (const caminho of CAMINHOS) revalidatePath(caminho);
}

/**
 * Os arrays da ficha técnica chegam do formulário como JSON num campo oculto.
 * É a forma mais simples de enviar uma lista de tamanho variável por FormData
 * sem inventar convenções de nome de campo.
 */
function parseJsonField(formData: FormData, field: string): unknown {
  const raw = formData.get(field);
  if (typeof raw !== 'string' || raw.trim() === '') return [];
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function saveProductAction(_state: FormState, formData: FormData): Promise<FormState> {
  const ingredients = parseJsonField(formData, 'ingredients');
  const extraCosts = parseJsonField(formData, 'extraCosts');

  if (ingredients === null || extraCosts === null) {
    return failure('Não conseguimos ler os itens da receita. Recarregue a página e tente de novo.');
  }

  const parsed = productSchema.safeParse({
    ...Object.fromEntries(formData.entries()),
    ingredients,
    extraCosts,
    marginPercent: formData.get('marginPercent') || null,
  });

  if (!parsed.success) return invalid(parsed.error);

  let businessId: string;
  try {
    businessId = await requireBusinessId();
  } catch {
    return failure('Sua sessão expirou. Entre novamente para continuar.');
  }

  // As unidades da receita precisam ser do mesmo tipo da unidade de compra.
  // Validado no servidor, com os dados reais do banco — não confiamos na tela.
  const disponiveis = await listIngredients(businessId);
  const porId = new Map(disponiveis.map((row) => [row.id, row]));

  for (const item of parsed.data.ingredients) {
    const ingrediente = porId.get(item.ingredientId);
    if (!ingrediente) {
      return failure('Um dos ingredientes da receita não existe mais. Revise a ficha técnica.');
    }
    if (!areCompatible(item.unit as Unit, ingrediente.purchase_unit as Unit)) {
      return failure(
        `A unidade usada em "${ingrediente.name}" não combina com a unidade de compra. Use medidas do mesmo tipo (peso com peso, volume com volume).`,
      );
    }
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc('save_product', {
    p_product: {
      id: parsed.data.id ?? null,
      name: parsed.data.name,
      category: parsed.data.category ?? '',
      description: parsed.data.description ?? '',
      photo_url: parsed.data.photoUrl ?? '',
      yield_quantity: parsed.data.yieldQuantity,
      yield_label: parsed.data.yieldLabel,
      labor_minutes: Math.round(parsed.data.laborMinutes),
      margin_percent: parsed.data.marginPercent ?? '',
      notes: parsed.data.notes ?? '',
    },
    p_ingredients: parsed.data.ingredients.map((item) => ({
      ingredient_id: item.ingredientId,
      quantity: item.quantity,
      unit: item.unit,
    })),
    p_extras: parsed.data.extraCosts.map((item) => ({
      label: item.label,
      category: item.category,
      amount: item.amount,
      scope: item.scope,
    })),
  });

  if (error) {
    if (error.message.includes('RECEITA_SEM_INGREDIENTES')) {
      return failure('Adicione pelo menos um ingrediente à receita.');
    }
    if (error.message.includes('PRODUTO_NAO_ENCONTRADO')) {
      return failure('Não encontramos esse produto. Ele pode ter sido excluído.');
    }
    return databaseError('produto: salvar', error);
  }

  revalidarTudo();
  redirect(`/precificar/${data}?salvo=1`);
}

/** Arquiva o produto e a precificação vigente. O histórico é preservado. */
export async function deleteProductAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = formData.get('id');
  if (typeof id !== 'string' || id.length === 0) {
    return failure('Não conseguimos identificar o produto.');
  }

  let businessId: string;
  try {
    businessId = await requireBusinessId();
  } catch {
    return failure('Sua sessão expirou. Entre novamente para continuar.');
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('products')
    .update({ archived_at: new Date().toISOString() })
    .eq('business_id', businessId)
    .eq('id', id);

  if (error) return databaseError('produto: excluir', error);

  await supabase
    .from('pricing_calculations')
    .delete()
    .eq('business_id', businessId)
    .eq('product_id', id);

  revalidarTudo();
  return success('Produto excluído. O histórico de precificações continua guardado.');
}

/** Duplica uma receita para criar uma variação sem começar do zero. */
export async function duplicateProductAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = formData.get('id');
  if (typeof id !== 'string' || id.length === 0) {
    return failure('Não conseguimos identificar o produto.');
  }

  let businessId: string;
  try {
    businessId = await requireBusinessId();
  } catch {
    return failure('Sua sessão expirou. Entre novamente para continuar.');
  }

  const { getProductDetail } = await import('@/server/queries');
  const detail = await getProductDetail(businessId, id);
  if (!detail) return failure('Não encontramos esse produto.');

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc('save_product', {
    p_product: {
      id: null,
      name: `${detail.product.name} (cópia)`,
      category: detail.product.category ?? '',
      description: detail.product.description ?? '',
      photo_url: detail.product.photo_url ?? '',
      yield_quantity: detail.product.yield_quantity,
      yield_label: detail.product.yield_label,
      labor_minutes: detail.product.labor_minutes,
      margin_percent: detail.product.margin_percent ?? '',
      notes: detail.product.notes ?? '',
    },
    p_ingredients: detail.items.map((item) => ({
      ingredient_id: item.ingredient_id,
      quantity: item.quantity,
      unit: item.unit,
    })),
    p_extras: detail.extras.map((extra) => ({
      label: extra.label,
      category: extra.category,
      amount: extra.amount,
      scope: extra.scope,
    })),
  });

  if (error) return databaseError('produto: duplicar', error);

  revalidarTudo();
  redirect(`/produtos/${data}?duplicado=1`);
}
