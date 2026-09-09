'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ingredientSchema } from '@/lib/validation/schemas';
import { requireBusinessId } from '@/server/context';
import { databaseError, failure, invalid, success, type FormState } from '@/server/form-state';

const CAMINHOS = ['/ingredientes', '/painel', '/precificar', '/relatorios'];

function revalidarTudo() {
  for (const caminho of CAMINHOS) revalidatePath(caminho);
}

function erroDeContexto(error: unknown): FormState | null {
  if (error instanceof Error && error.message === 'NAO_AUTENTICADO') {
    return failure('Sua sessão expirou. Entre novamente para continuar.');
  }
  if (error instanceof Error && error.message === 'SEM_NEGOCIO') {
    return failure('Finalize a configuração da sua conta para continuar.');
  }
  return null;
}

/** 23505 = unique_violation: o índice único por nome dentro do negócio. */
function isDuplicateName(error: { code?: string; message?: string }): boolean {
  return error.code === '23505' || Boolean(error.message?.includes('duplicate key'));
}

function nomeDuplicado(): FormState {
  return failure('Você já tem um ingrediente com esse nome.', {
    name: 'Escolha outro nome para não confundir na hora de montar a receita.',
  });
}

/**
 * Cria ou atualiza um ingrediente.
 *
 * Quando o preço de compra muda, a alteração também é registrada em
 * `ingredient_prices` — assim a usuária consegue ver o histórico de custo do
 * insumo, e uma precificação antiga continua explicável.
 */
export async function saveIngredientAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = ingredientSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return invalid(parsed.error);

  let businessId: string;
  try {
    businessId = await requireBusinessId();
  } catch (error) {
    return erroDeContexto(error) ?? databaseError('ingrediente: contexto', error);
  }

  const supabase = await createSupabaseServerClient();
  const { id, name, category, supplier, purchaseUnit, purchaseQuantity, purchasePrice } = parsed.data;

  const payload = {
    business_id: businessId,
    name,
    category: category || null,
    supplier: supplier || null,
    purchase_unit: purchaseUnit as never,
    purchase_quantity: purchaseQuantity,
    purchase_price: purchasePrice,
  };

  let ingredientId = id;
  let precoMudou = true;

  if (id) {
    const { data: anterior } = await supabase
      .from('ingredients')
      .select('purchase_price, purchase_quantity, purchase_unit')
      .eq('business_id', businessId)
      .eq('id', id)
      .maybeSingle();

    if (!anterior) return failure('Não encontramos esse ingrediente. Ele pode ter sido excluído.');

    precoMudou =
      Number(anterior.purchase_price) !== purchasePrice ||
      Number(anterior.purchase_quantity) !== purchaseQuantity ||
      anterior.purchase_unit !== purchaseUnit;

    const { error } = await supabase
      .from('ingredients')
      .update(payload)
      .eq('business_id', businessId)
      .eq('id', id);

    if (error) {
      if (isDuplicateName(error)) return nomeDuplicado();
      return databaseError('ingrediente: atualizar', error);
    }
  } else {
    const { data, error } = await supabase.from('ingredients').insert(payload).select('id').single();

    if (error) {
      if (isDuplicateName(error)) return nomeDuplicado();
      return databaseError('ingrediente: criar', error);
    }

    ingredientId = data.id;
  }

  if (ingredientId && precoMudou) {
    const { error } = await supabase.from('ingredient_prices').insert({
      ingredient_id: ingredientId,
      business_id: businessId,
      purchase_unit: purchaseUnit as never,
      purchase_quantity: purchaseQuantity,
      purchase_price: purchasePrice,
    });
    // O histórico é um extra: se falhar, o ingrediente já foi salvo e o fluxo segue.
    if (error) console.error('[controldolces] ingrediente: histórico de preço', error);
  }

  revalidarTudo();
  redirect('/ingredientes?salvo=1');
}

/** Arquiva o ingrediente. Não apagamos de vez: fichas antigas continuariam órfãs. */
export async function deleteIngredientAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = formData.get('id');
  if (typeof id !== 'string' || id.length === 0) {
    return failure('Não conseguimos identificar o ingrediente.');
  }

  let businessId: string;
  try {
    businessId = await requireBusinessId();
  } catch (error) {
    return erroDeContexto(error) ?? databaseError('ingrediente: contexto', error);
  }

  const supabase = await createSupabaseServerClient();

  const { count } = await supabase
    .from('recipe_ingredients')
    .select('id', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .eq('ingredient_id', id);

  if ((count ?? 0) > 0) {
    return failure(
      'Esse ingrediente está sendo usado em uma receita. Remova-o da ficha técnica antes de excluir.',
    );
  }

  const { error } = await supabase
    .from('ingredients')
    .update({ archived_at: new Date().toISOString() })
    .eq('business_id', businessId)
    .eq('id', id);

  if (error) return databaseError('ingrediente: excluir', error);

  revalidarTudo();
  return success('Ingrediente excluído.');
}
