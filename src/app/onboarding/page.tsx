import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getBusiness, getProfile, requireUser } from '@/server/context';
import { ETAPAS } from '@/server/onboarding-steps';

import { BoasVindas } from './etapas/boas-vindas';
import { Objetivo } from './etapas/objetivo';
import { SobreVoce } from './etapas/sobre-voce';
import { TipoDeNegocio } from './etapas/tipo-de-negocio';
import { TudoPronto } from './etapas/tudo-pronto';

export const metadata: Metadata = {
  title: 'Vamos configurar sua conta',
  robots: { index: false, follow: false },
};

/**
 * Onboarding.
 *
 * A etapa exibida vem do banco (`profiles.onboarding_step`), não da URL nem do
 * navegador: quem fecha no meio e volta depois — de qualquer aparelho — cai
 * exatamente onde parou. Quem já concluiu nunca mais vê esta tela.
 */
export default async function OnboardingPage() {
  const user = await requireUser();
  const [profile, business] = await Promise.all([getProfile(), getBusiness()]);

  if (profile?.onboarding_completed_at) redirect('/painel');

  const nomeSugerido =
    profile?.full_name || (user.user_metadata?.full_name as string | undefined) || '';

  // Sem negócio criado, a etapa 1 é a única que faz sentido, mesmo que o
  // marcador diga o contrário: as etapas seguintes escrevem no negócio.
  const etapa = !business
    ? Math.min(profile?.onboarding_step ?? 0, ETAPAS.SOBRE_VOCE)
    : (profile?.onboarding_step ?? 0);

  switch (etapa) {
    case ETAPAS.SOBRE_VOCE:
      return <SobreVoce fullName={nomeSugerido} businessName={business?.name ?? ''} />;
    case ETAPAS.TIPO_DE_NEGOCIO:
      return <TipoDeNegocio businessType={business?.business_type ?? ''} />;
    case ETAPAS.OBJETIVO:
      return <Objetivo mainGoal={business?.main_goal ?? ''} />;
    case ETAPAS.TUDO_PRONTO:
      return <TudoPronto firstName={nomeSugerido.trim().split(' ')[0] ?? ''} />;
    default:
      return <BoasVindas />;
  }
}
