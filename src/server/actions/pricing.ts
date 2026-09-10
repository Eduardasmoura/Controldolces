'use server';

import { revalidatePath } from 'next/cache';

import { roundCurrency, roundTo, simulatePrice } from '@/lib/pricing';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { savePricingSchema } from '@/lib/validation/schemas';
import { getCostSettings, requireBusinessId } from '@/server/context';
import { databaseError, failure, invalid, success, type FormState } from '@/server/form-state';
import { buildPricingInput, computeProductPricing } from '@/server/pricing';
import { getProductDetail } from '@/server/queries';

const CAMINHOS = ['/precificar', '/painel', '/produtos', '/historico', '/relatorios'];

function revalidarTudo() {
  for (const caminho of CAMINHOS) revalidatePath(caminho);
}

/**
 * Salva a precificação de um produto.
 *
 * O preço vem da tela, mas TODOS os custos são recalculados aqui a partir do
 * banco. Nada de número financeiro enviado pelo navegador é aceito como verdade
 * — a tela pode estar desatualizada, ou a requisição forjada.
 */
export async function savePricingAction(_state: FormState, formData: FormData): Promise<FormState> {
  const parsed = savePricingSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return invalid(parsed.error);

  let businessId: string;
  try {
    businessId = await requireBusinessId();
  } catch {
    return failure('Sua sessão expirou. Entre novamente para continuar.');
  }

  const detail = await getProductDetail(businessId, parsed.data.productId);
  if (!detail) return failure('Não encontramos esse produto. Ele pode ter sido excluído.');

  const settings = await getCostSettings(businessId);
  const outcome = computeProductPricing(detail, settings, parsed.data.marginPercent);

  if (!outcome.ok) {
    return failure(
      outcome.issues[0]?.message ??
        'Não conseguimos calcular este produto. Verifique se todos os ingredientes possuem preço cadastrado.',
    );
  }

  const result = outcome.result;
  const salePrice = roundCurrency(parsed.data.salePrice);
  const simulation = simulatePrice(
    result.unit.total,
    salePrice,
    settings.variable_fees_percent,
    result.yieldQuantity,
  );

  const snapshot = {
    // Retrato do que entrou na conta, para o histórico continuar explicável
    // mesmo depois de a receita ou os preços de compra mudarem.
    input: buildPricingInput(detail, settings, parsed.data.marginPercent),
    settings: {
      laborHourlyRate: settings.labor_hourly_rate,
      variableFeesPercent: settings.variable_fees_percent,
      minimumMarginPercent: settings.minimum_margin_percent,
      indirectMethod: settings.indirect_method,
    },
    ingredientLines: result.ingredientLines.map((line) => ({
      name: line.name,
      quantity: line.quantity,
      unit: line.unit,
      batchCost: roundTo(line.batchCost, 4),
    })),
  };

  const breakdown = {
    batch: result.batch,
    unit: result.unit,
  };

  // Os custos são gravados abertos por categoria, sempre referentes ao LOTE.
  // Ficar só no JSONB obrigaria a abrir o JSON para qualquer relatório.
  const registro = {
    business_id: businessId,
    product_id: detail.product.id,
    sale_price: salePrice,
    unit_cost: roundTo(result.unit.total, 4),
    ingredient_cost: roundTo(result.batch.ingredients, 4),
    packaging_cost: roundTo(result.batch.packaging, 4),
    labor_cost: roundTo(result.batch.labor, 4),
    gas_cost: roundTo(result.batch.gas, 4),
    electricity_cost: roundTo(result.batch.energy, 4),
    other_cost: roundTo(result.batch.other, 4),
    indirect_cost: roundTo(result.batch.indirect, 4),
    total_cost: roundTo(result.batch.total, 4),
    minimum_price: result.minimumPrice,
    suggested_price: result.recommendedPrice,
    /** O que a usuária pediu... */
    desired_margin: roundTo(parsed.data.marginPercent, 3),
    /** ...e o que o preço praticado de fato entrega. */
    margin_percentage: roundTo(simulation.marginPercent, 3),
    markup: roundTo(simulation.markup, 4),
    profit_per_unit: roundTo(simulation.profitPerUnit, 4),
    profit_total: roundTo(simulation.profitPerBatch, 4),
    yield_quantity: result.yieldQuantity,
    input_snapshot: snapshot as never,
    breakdown: breakdown as never,
  };

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from('pricing_calculations')
    .upsert(registro, { onConflict: 'product_id' });

  if (error) return databaseError('precificação: salvar', error);

  // O histórico recebe as mesmas colunas, mais o nome do produto: se o produto
  // for excluído depois, o registro continua legível.
  const { error: historyError } = await supabase.from('pricing_history').insert({
    ...registro,
    product_name: detail.product.name,
  });

  if (historyError) console.error('[controldolces] precificação: histórico', historyError);

  // A margem escolhida passa a ser a do produto, para reabrir a tela do mesmo jeito.
  const { error: marginError } = await supabase
    .from('products')
    .update({ margin_percent: parsed.data.marginPercent })
    .eq('business_id', businessId)
    .eq('id', detail.product.id);

  if (marginError) console.error('[controldolces] precificação: margem do produto', marginError);

  revalidarTudo();
  return success('Precificação salva.');
}

/** Remove a precificação vigente de um produto. O histórico permanece. */
export async function deletePricingAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const productId = formData.get('id');
  if (typeof productId !== 'string' || productId.length === 0) {
    return failure('Não conseguimos identificar a precificação.');
  }

  let businessId: string;
  try {
    businessId = await requireBusinessId();
  } catch {
    return failure('Sua sessão expirou. Entre novamente para continuar.');
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('pricing_calculations')
    .delete()
    .eq('business_id', businessId)
    .eq('product_id', productId);

  if (error) return databaseError('precificação: excluir', error);

  revalidarTudo();
  return success('Precificação removida.');
}

/** Apaga um registro do histórico. */
export async function deleteHistoryEntryAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = formData.get('id');
  if (typeof id !== 'string' || id.length === 0) {
    return failure('Não conseguimos identificar esse registro.');
  }

  let businessId: string;
  try {
    businessId = await requireBusinessId();
  } catch {
    return failure('Sua sessão expirou. Entre novamente para continuar.');
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('pricing_history')
    .delete()
    .eq('business_id', businessId)
    .eq('id', id);

  if (error) return databaseError('histórico: excluir', error);

  revalidatePath('/historico');
  return success('Registro removido do histórico.');
}
