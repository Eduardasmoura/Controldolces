import type { Metadata } from 'next';

import { SignInForm } from './sign-in-form';

export const metadata: Metadata = {
  title: 'Entrar',
  description: 'Acesse a sua conta do ControlDolces.',
  robots: { index: false, follow: false },
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ proximo?: string; erro?: string }>;
}) {
  const params = await searchParams;
  return <SignInForm next={params.proximo} linkError={params.erro === 'link-invalido'} />;
}
