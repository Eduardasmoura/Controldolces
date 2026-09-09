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

  const registro = {
    business_id: businessId,
    product_id: detail.product.id,
    sale_price: salePrice,
    unit_cost: roundTo(result.unit.total, 4),
    batch_cost: roundTo(result.batch.total, 4),
    minimum_price: result.minimumPrice,
    recommended_price: result.recommendedPrice,
    margin_percent: roundTo(simulation.marginPercent, 3),
    markup: roundTo(simulation.markup, 4),
    profit_per_unit: roundTo(simulation.profitPerUnit, 4),
    yield_quantity: result.yieldQuantity,
    input_snapshot: snapshot as never,
    breakdown: breakdown as never,
  };

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from('pricing_calculations')
    .upsert(registro, { onConflict: 'product_id' });

  if (error) return databaseError('precificação: salvar', error);

  const { error: historyError } = await supabase.from('pricing_history').insert({
    business_id: businessId,
    product_id: detail.product.id,
    product_name: detail.product.name,
    sale_price: registro.sale_price,
    unit_cost: registro.unit_cost,
    minimum_price: registro.minimum_price,
    recommended_price: registro.recommended_price,
    margin_percent: registro.margin_percent,
    markup: registro.markup,
    profit_per_unit: registro.profit_per_unit,
    yield_quantity: registro.yield_quantity,
    input_snapshot: snapshot as never,
    breakdown: breakdown as never,
  });

  if (historyError) console.error('[controldolces] precificação: histórico', historyError);

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
