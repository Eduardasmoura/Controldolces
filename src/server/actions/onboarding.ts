'use server';

import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { onboardingSchema } from '@/lib/validation/schemas';
import { getBusiness, getUser } from '@/server/context';
import { databaseError, failure, invalid, type FormState } from '@/server/form-state';

/**
 * Conclui o onboarding: grava o nome da usuária, cria o negócio (o "tenant" de
 * todos os dados) com as configurações de custo iniciais e o registro de plano.
 */
export async function completeOnboardingAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = onboardingSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return invalid(parsed.error);

  const user = await getUser();
  if (!user) return failure('Sua sessão expirou. Entre novamente para continuar.');

  const supabase = await createSupabaseServerClient();
  const { fullName, businessName, businessType, productVolume, mainGoal } = parsed.data;

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert(
      { id: user.id, full_name: fullName, onboarding_completed_at: new Date().toISOString() },
      { onConflict: 'id' },
    );

  if (profileError) return databaseError('onboarding: perfil', profileError);

  const existing = await getBusiness();

  if (existing) {
    const { error } = await supabase
      .from('businesses')
      .update({
        name: businessName,
        business_type: businessType || null,
        product_volume: productVolume || null,
        main_goal: mainGoal || null,
      })
      .eq('id', existing.id);

    if (error) return databaseError('onboarding: atualizar negócio', error);
    redirect('/painel');
  }

  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .insert({
      owner_id: user.id,
      name: businessName,
      business_type: businessType || null,
      product_volume: productVolume || null,
      main_goal: mainGoal || null,
    })
    .select('id')
    .single();

  if (businessError || !business) return databaseError('onboarding: criar negócio', businessError);

  // Configurações iniciais e plano gratuito. Sem esses registros o app funciona,
  // mas a usuária começaria sem valores padrão de margem.
  const [{ error: settingsError }, { error: subscriptionError }] = await Promise.all([
    supabase.from('cost_settings').insert({ business_id: business.id }),
    supabase.from('subscriptions').insert({ business_id: business.id, plan: 'free', status: 'active' }),
  ]);

  if (settingsError) return databaseError('onboarding: configurações', settingsError);
  if (subscriptionError) console.error('[controldolces] onboarding: assinatura', subscriptionError);

  redirect('/painel');
}
