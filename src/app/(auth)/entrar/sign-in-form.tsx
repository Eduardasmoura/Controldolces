'use client';

import Link from 'next/link';
import { useActionState } from 'react';

import { SubmitButton } from '@/components/forms/submit-button';
import { Card, CardBody } from '@/components/ui/card';
import { TextField } from '@/components/ui/field';
import { Alert } from '@/components/ui/feedback';
import { signInAction } from '@/server/actions/auth';
import { IDLE } from '@/server/form-state';

export function SignInForm({ next, linkError }: { next?: string; linkError?: boolean }) {
  const [state, action] = useActionState(signInAction, IDLE);

  return (
    <Card>
      <CardBody className="py-7">
        <h1 className="font-display text-2xl font-semibold text-sand-900">Entrar na sua conta</h1>
        <p className="mt-1.5 text-sm text-sand-500">
          Suas receitas e precificações estão esperando por você.
        </p>

        {linkError ? (
          <Alert tone="warning" className="mt-5">
            Esse link não é mais válido. Faça login normalmente ou peça um novo link de recuperação.
          </Alert>
        ) : null}

        {state.status === 'error' ? (
          <Alert tone="danger" className="mt-5">
            {state.message}
          </Alert>
        ) : null}

        <form action={action} className="mt-6 space-y-4" noValidate>
          {next ? <input type="hidden" name="next" value={next} /> : null}

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
            autoComplete="current-password"
            required
            error={state.fieldErrors?.password}
          />

          <div className="flex justify-end">
            <Link href="/recuperar-senha" className="text-sm text-rose-700 hover:text-rose-800">
              Esqueci minha senha
            </Link>
          </div>

          <SubmitButton className="w-full" size="lg" pendingLabel="Entrando...">
            Entrar
          </SubmitButton>
        </form>

        <p className="mt-6 text-center text-sm text-sand-500">
          Ainda não tem conta?{' '}
          <Link href="/criar-conta" className="font-medium text-rose-700 hover:text-rose-800">
            Criar conta
          </Link>
        </p>
      </CardBody>
    </Card>
  );
}
