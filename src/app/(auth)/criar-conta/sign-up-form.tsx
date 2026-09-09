'use client';

import Link from 'next/link';
import { useActionState } from 'react';

import { SubmitButton } from '@/components/forms/submit-button';
import { Card, CardBody } from '@/components/ui/card';
import { TextField } from '@/components/ui/field';
import { Alert } from '@/components/ui/feedback';
import { signUpAction } from '@/server/actions/auth';
import { IDLE } from '@/server/form-state';

export function SignUpForm() {
  const [state, action] = useActionState(signUpAction, IDLE);

  if (state.status === 'success') {
    return (
      <Card>
        <CardBody className="py-8 text-center">
          <h1 className="font-display text-2xl font-semibold text-sand-900">Quase lá</h1>
          <p className="mt-3 leading-relaxed text-sand-600">{state.message}</p>
          <p className="mt-4 text-sm text-sand-500">
            Não encontrou a mensagem? Verifique a caixa de spam ou promoções.
          </p>
          <p className="mt-6 text-sm">
            <Link href="/entrar" className="font-medium text-rose-700 hover:text-rose-800">
              Voltar para o login
            </Link>
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody className="py-7">
        <h1 className="font-display text-2xl font-semibold text-sand-900">Criar sua conta</h1>
        <p className="mt-1.5 text-sm text-sand-500">
          Leva menos de um minuto. Depois a gente configura sua primeira precificação juntas.
        </p>

        {state.status === 'error' ? (
          <Alert tone="danger" className="mt-5">
            {state.message}
          </Alert>
        ) : null}

        <form action={action} className="mt-6 space-y-4" noValidate>
          <TextField
            label="Seu nome"
            name="fullName"
            autoComplete="name"
            placeholder="Como podemos te chamar?"
            required
            error={state.fieldErrors?.fullName}
          />

          <TextField
            label="E-mail"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="voce@email.com"
            required
            error={state.fieldErrors?.email}
          />

          <TextField
            label="Senha"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            hint="Pelo menos 8 caracteres."
            error={state.fieldErrors?.password}
          />

          <SubmitButton className="w-full" size="lg" pendingLabel="Criando sua conta...">
            Criar conta
          </SubmitButton>
        </form>

        <p className="mt-6 text-center text-sm text-sand-500">
          Já tem conta?{' '}
          <Link href="/entrar" className="font-medium text-rose-700 hover:text-rose-800">
            Entrar
          </Link>
        </p>
      </CardBody>
    </Card>
  );
}
