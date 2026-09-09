'use client';

import { useActionState } from 'react';

import { SubmitButton } from '@/components/forms/submit-button';
import { Card, CardBody } from '@/components/ui/card';
import { TextField } from '@/components/ui/field';
import { Alert } from '@/components/ui/feedback';
import { resetPasswordAction } from '@/server/actions/auth';
import { IDLE } from '@/server/form-state';

export function ResetPasswordForm() {
  const [state, action] = useActionState(resetPasswordAction, IDLE);

  return (
    <Card>
      <CardBody className="py-7">
        <h1 className="font-display text-2xl font-semibold text-sand-900">Criar nova senha</h1>
        <p className="mt-1.5 text-sm text-sand-500">
          Escolha uma senha nova para voltar a acessar sua conta.
        </p>

        {state.status === 'error' ? (
          <Alert tone="danger" className="mt-5">
            {state.message}
          </Alert>
        ) : null}

        <form action={action} className="mt-6 space-y-4" noValidate>
          <TextField
            label="Nova senha"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            hint="Pelo menos 8 caracteres."
            error={state.fieldErrors?.password}
          />

          <TextField
            label="Repita a nova senha"
            name="passwordConfirmation"
            type="password"
            autoComplete="new-password"
            required
            error={state.fieldErrors?.passwordConfirmation}
          />

          <SubmitButton className="w-full" size="lg" pendingLabel="Salvando...">
            Salvar nova senha
          </SubmitButton>
        </form>
      </CardBody>
    </Card>
  );
}
