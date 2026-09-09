import type { Metadata } from 'next';

import { getBusiness, getProfile, requireUser } from '@/server/context';

import { OnboardingForm } from './onboarding-form';

export const metadata: Metadata = {
  title: 'Vamos configurar sua conta',
  robots: { index: false, follow: false },
};

export default async function OnboardingPage() {
  const user = await requireUser();
  const [profile, business] = await Promise.all([getProfile(), getBusiness()]);

  const suggestedName =
    profile?.full_name || (user.user_metadata?.full_name as string | undefined) || '';

  return (
    <OnboardingForm
      defaultFullName={suggestedName}
      defaultBusinessName={business?.name ?? ''}
      defaultBusinessType={business?.business_type ?? ''}
      defaultProductVolume={business?.product_volume ?? ''}
      defaultMainGoal={business?.main_goal ?? ''}
    />
  );
}
