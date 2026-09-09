import type { Metadata } from 'next';

import { SignUpForm } from './sign-up-form';

export const metadata: Metadata = {
  title: 'Criar conta',
  description:
    'Crie sua conta no ControlDolces e descubra o custo real e o preço certo dos seus doces.',
  alternates: { canonical: '/criar-conta' },
};

export default function SignUpPage() {
  return <SignUpForm />;
}
