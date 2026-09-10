import { cache } from 'react';
import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

import type { BusinessRow, CostSettingsRow, ProfileRow } from '@/lib/database.types';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Contexto da requisição: usuária autenticada, perfil, negócio e configurações
 * de custo. Memoizado por requisição (`cache`) para que várias partes da página
 * possam pedir o contexto sem repetir as mesmas consultas.
 */

export type AppContext = {
  user: User;
  profile: ProfileRow | null;
  business: BusinessRow;
  settings: CostSettingsRow;
};

export const getUser = cache(async (): Promise<User | null> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) redirect('/entrar');
  return user;
}

export const getProfile = cache(async (): Promise<ProfileRow | null> => {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  return data ?? null;
});

/** O negócio da usuária. Cada conta tem um; o RLS garante que seja só o dela. */
export const getBusiness = cache(async (): Promise<BusinessRow | null> => {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  return data ?? null;
});

const DEFAULT_SETTINGS: Omit<CostSettingsRow, 'id' | 'business_id' | 'created_at' | 'updated_at'> = {
  labor_hourly_rate: 0,
  gas_cost: 0,
  electricity_cost: 0,
  default_margin_percent: 50,
  minimum_margin_percent: 0,
  variable_fees_percent: 0,
  indirect_method: 'none',
  indirect_cost_percentage: 0,
  indirect_monthly_amount: 0,
  indirect_monthly_units: 0,
  indirect_monthly_hours: 0,
};

export const getCostSettings = cache(async (businessId: string): Promise<CostSettingsRow> => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('cost_settings')
    .select('*')
    .eq('business_id', businessId)
    .maybeSingle();

  if (data) return data;

  // Negócio sem configurações gravadas ainda: valores neutros, nunca undefined
  // chegando ao motor de cálculo.
  const agora = new Date().toISOString();
  return {
    ...DEFAULT_SETTINGS,
    id: '',
    business_id: businessId,
    created_at: agora,
    updated_at: agora,
  };
});

/**
 * Exige usuária logada COM negócio configurado. Quem ainda não terminou o
 * onboarding é levado para lá — é o que garante que nenhuma tela do app
 * apareça sem os dados mínimos.
 */
export async function requireContext(): Promise<AppContext> {
  const user = await requireUser();
  const business = await getBusiness();
  if (!business) redirect('/onboarding');

  const [profile, settings] = await Promise.all([getProfile(), getCostSettings(business.id)]);

  return { user, profile, business, settings };
}

/** Versão para Server Actions: erro em vez de redirecionamento. */
export async function requireBusinessId(): Promise<string> {
  const user = await getUser();
  if (!user) throw new Error('NAO_AUTENTICADO');

  const business = await getBusiness();
  if (!business) throw new Error('SEM_NEGOCIO');

  return business.id;
}
