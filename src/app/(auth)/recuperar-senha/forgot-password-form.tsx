'use client';

import Link from 'next/link';
import { useActionState } from 'react';

import { SubmitButton } from '@/components/forms/submit-button';
import { Card, CardBody } from '@/components/ui/card';
import { TextField } from '@/components/ui/field';
import { Alert } from '@/components/ui/feedback';
import { forgotPasswordAction } from '@/server/actions/auth';
import { IDLE } from '@/server/form-state';

export function ForgotPasswordForm() {
  const [state, action] = useActionState(forgotPasswordAction, IDLE);

  return (
    <Card>
      <CardBody className="py-7">
        <h1 className="font-display text-2xl font-semibold text-sand-900">Recuperar senha</h1>
        <p className="mt-1.5 text-sm text-sand-500">
          Informe o e-mail da sua conta e enviamos um link para você criar uma nova senha.
        </p>

        {state.status === 'success' ? (
          <Alert tone="success" className="mt-5">
            {state.message}
          </Alert>
        ) : null}

        {state.status === 'error' ? (
          <Alert tone="danger" className="mt-5">
            {state.message}
          </Alert>
        ) : null}

        <form action={action} className="mt-6 space-y-4" noValidate>
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

          <SubmitButton className="w-full" size="lg" pendingLabel="Enviando...">
            Enviar link de recuperação
          </SubmitButton>
        </form>

        <p className="mt-6 text-center text-sm text-sand-500">
          Lembrou a senha?{' '}
          <Link href="/entrar" className="font-medium text-rose-700 hover:text-rose-800">
            Entrar
          </Link>
        </p>
      </CardBody>
    </Card>
  );
}
