'use server';

import { revalidatePath } from 'next/cache';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { costSettingsSchema } from '@/lib/validation/schemas';
import { requireBusinessId } from '@/server/context';
import { databaseError, failure, invalid, success, type FormState } from '@/server/form-state';

/** Salva as configurações de custo do negócio. */
export async function saveCostSettingsAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = costSettingsSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return invalid(parsed.error);

  let businessId: string;
  try {
    businessId = await requireBusinessId();
  } catch {
    return failure('Sua sessão expirou. Entre novamente para continuar.');
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('cost_settings').upsert(
    {
      business_id: businessId,
      labor_hourly_rate: parsed.data.laborHourlyRate,
      default_margin_percent: parsed.data.defaultMarginPercent,
      minimum_margin_percent: parsed.data.minimumMarginPercent,
      variable_fees_percent: parsed.data.variableFeesPercent,
      indirect_method: parsed.data.indirectMethod,
      indirect_percent: parsed.data.indirectPercent,
      indirect_monthly_amount: parsed.data.indirectMonthlyAmount,
      indirect_monthly_units: parsed.data.indirectMonthlyUnits,
      indirect_monthly_hours: parsed.data.indirectMonthlyHours,
    },
    { onConflict: 'business_id' },
  );

  if (error) return databaseError('configurações: salvar', error);

  // Os custos afetam todos os cálculos: revalida as telas que exibem valores.
  for (const caminho of ['/configuracoes', '/painel', '/precificar', '/relatorios', '/produtos']) {
    revalidatePath(caminho);
  }

  return success('Configurações salvas. Os próximos cálculos já usam esses valores.');
}

/** Atualiza o nome da usuária e da confeitaria. */
export async function saveBusinessAction(_state: FormState, formData: FormData): Promise<FormState> {
  const fullName = String(formData.get('fullName') ?? '').trim();
  const businessName = String(formData.get('businessName') ?? '').trim();

  const fieldErrors: Record<string, string> = {};
  if (fullName.length < 2) fieldErrors.fullName = 'Informe o seu nome.';
  if (businessName.length < 2) fieldErrors.businessName = 'Informe o nome da sua confeitaria.';
  if (Object.keys(fieldErrors).length > 0) {
    return failure('Confira os campos destacados.', fieldErrors);
  }

  let businessId: string;
  try {
    businessId = await requireBusinessId();
  } catch {
    return failure('Sua sessão expirou. Entre novamente para continuar.');
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return failure('Sua sessão expirou. Entre novamente para continuar.');

  const [{ error: profileError }, { error: businessError }] = await Promise.all([
    supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id),
    supabase.from('businesses').update({ name: businessName }).eq('id', businessId),
  ]);

  if (profileError) return databaseError('configurações: perfil', profileError);
  if (businessError) return databaseError('configurações: negócio', businessError);

  revalidatePath('/configuracoes');
  revalidatePath('/painel');
  return success('Dados atualizados.');
}
