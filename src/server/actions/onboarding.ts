'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  onboardingObjetivoSchema,
  onboardingSobreVoceSchema,
  onboardingTipoSchema,
} from '@/lib/validation/schemas';
import { getBusiness, getUser } from '@/server/context';
import { ETAPAS } from '@/server/onboarding-steps';
import { databaseError, failure, invalid, type FormState } from '@/server/form-state';

/**
 * Onboarding em etapas.
 *
 * Cada etapa grava o que coletou e avança `profiles.onboarding_step`. O estado
 * mora no banco — fechar o navegador, trocar de celular ou voltar amanhã leva a
 * usuária de volta ao ponto exato onde parou.
 *
 * As respostas vão direto para as tabelas de destino (`profiles` e
 * `businesses`), sem rascunho paralelo. Quem abandonar no meio deixa um negócio
 * com dados parciais, e é justamente por isso que as telas do app exigem
 * `onboarding_completed_at` preenchido para liberar o acesso.
 */

const SESSAO_EXPIRADA = 'Sua sessão expirou. Entre novamente para continuar.';

/** Move o marcador de etapa apenas para a frente, para o botão "voltar" não regredir o progresso. */
async function avancarPara(userId: string, etapa: number) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('profiles')
    .select('onboarding_step')
    .eq('id', userId)
    .maybeSingle();

  if ((data?.onboarding_step ?? 0) >= etapa) return null;

  const { error } = await supabase
    .from('profiles')
    .update({ onboarding_step: etapa })
    .eq('id', userId);

  return error;
}

/** Etapa 1: apenas registra que a usuária leu as boas-vindas. */
export async function iniciarOnboardingAction(): Promise<void> {
  const user = await getUser();
  if (!user) redirect('/entrar');

  await avancarPara(user.id, ETAPAS.SOBRE_VOCE);
  revalidatePath('/onboarding');
  redirect('/onboarding');
}

/**
 * Etapa 2: nome da usuária e da confeitaria.
 * É aqui que o negócio nasce, junto com as configurações de custo e o registro
 * de plano — sem eles as próximas telas não teriam valores padrão.
 */
export async function salvarSobreVoceAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = onboardingSobreVoceSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return invalid(parsed.error);

  const user = await getUser();
  if (!user) return failure(SESSAO_EXPIRADA);

  const supabase = await createSupabaseServerClient();
  const { fullName, businessName } = parsed.data;

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ id: user.id, full_name: fullName }, { onConflict: 'id' });

  if (profileError) return databaseError('onboarding: perfil', profileError);

  const existente = await getBusiness();

  if (existente) {
    const { error } = await supabase
      .from('businesses')
      .update({ name: businessName })
      .eq('id', existente.id);

    if (error) return databaseError('onboarding: atualizar negócio', error);
  } else {
    const { data: business, error } = await supabase
      .from('businesses')
      .insert({ owner_id: user.id, name: businessName })
      .select('id')
      .single();

    if (error || !business) return databaseError('onboarding: criar negócio', error);

    const [{ error: settingsError }, { error: subscriptionError }] = await Promise.all([
      supabase.from('cost_settings').insert({ business_id: business.id }),
      supabase
        .from('subscriptions')
        .insert({ business_id: business.id, plan: 'free', status: 'active' }),
    ]);

    if (settingsError) return databaseError('onboarding: configurações', settingsError);
    // O plano é acessório: sem ele o sistema funciona, então não vale barrar a usuária.
    if (subscriptionError) console.error('[controldolces] onboarding: assinatura', subscriptionError);
  }

  const erro = await avancarPara(user.id, ETAPAS.TIPO_DE_NEGOCIO);
  if (erro) return databaseError('onboarding: avançar etapa', erro);

  revalidatePath('/onboarding');
  redirect('/onboarding');
}

/** Etapa 3: tipo de negócio. Pode ficar em branco. */
export async function salvarTipoDeNegocioAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = onboardingTipoSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return invalid(parsed.error);

  const user = await getUser();
  if (!user) return failure(SESSAO_EXPIRADA);

  const business = await getBusiness();
  if (!business) return failure('Precisamos do nome da sua confeitaria antes de continuar.');

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('businesses')
    .update({ business_type: parsed.data.businessType || null })
    .eq('id', business.id);

  if (error) return databaseError('onboarding: tipo de negócio', error);

  const erro = await avancarPara(user.id, ETAPAS.OBJETIVO);
  if (erro) return databaseError('onboarding: avançar etapa', erro);

  revalidatePath('/onboarding');
  redirect('/onboarding');
}

/** Etapa 4: objetivo principal, e o onboarding se dá por concluído. */
export async function salvarObjetivoAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = onboardingObjetivoSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return invalid(parsed.error);

  const user = await getUser();
  if (!user) return failure(SESSAO_EXPIRADA);

  const business = await getBusiness();
  if (!business) return failure('Precisamos do nome da sua confeitaria antes de continuar.');

  const supabase = await createSupabaseServerClient();

  const [{ error: businessError }, { error: profileError }] = await Promise.all([
    supabase
      .from('businesses')
      .update({ main_goal: parsed.data.mainGoal || null })
      .eq('id', business.id),
    supabase
      .from('profiles')
      .update({ onboarding_step: ETAPAS.TUDO_PRONTO })
      .eq('id', user.id),
  ]);

  if (businessError) return databaseError('onboarding: objetivo', businessError);
  if (profileError) return databaseError('onboarding: avançar etapa', profileError);

  revalidatePath('/onboarding');
  redirect('/onboarding');
}

/**
 * Conclusão: marca o onboarding como concluído e libera o app.
 * A partir daqui `requireContext()` deixa de devolver a usuária para cá.
 */
export async function concluirOnboardingAction(): Promise<void> {
  const user = await getUser();
  if (!user) redirect('/entrar');

  const supabase = await createSupabaseServerClient();
  await supabase
    .from('profiles')
    .update({
      onboarding_step: ETAPAS.TUDO_PRONTO,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  revalidatePath('/painel');
  redirect('/painel?bemvinda=1');
}

/** Permite voltar uma etapa para corrigir o que já foi respondido. */
export async function voltarEtapaAction(formData: FormData): Promise<void> {
  const destino = Number(formData.get('etapa'));
  const user = await getUser();
  if (!user) redirect('/entrar');

  if (Number.isInteger(destino) && destino >= 0 && destino <= ETAPAS.TUDO_PRONTO) {
    const supabase = await createSupabaseServerClient();
    await supabase.from('profiles').update({ onboarding_step: destino }).eq('id', user.id);
  }

  revalidatePath('/onboarding');
  redirect('/onboarding');
}
