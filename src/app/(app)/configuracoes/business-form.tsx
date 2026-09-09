'use client';

import { useActionState } from 'react';

import { SubmitButton } from '@/components/forms/submit-button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { TextField } from '@/components/ui/field';
import { Alert } from '@/components/ui/feedback';
import { saveBusinessAction } from '@/server/actions/settings';
import { IDLE } from '@/server/form-state';

export function BusinessForm({
  initial,
  email,
}: {
  initial: { fullName: string; businessName: string };
  email: string;
}) {
  const [state, action] = useActionState(saveBusinessAction, IDLE);

  return (
    <Card>
      <CardHeader title="Seus dados" description="Como o sistema te chama." />
      <CardBody>
        {state.status === 'success' ? (
          <Alert tone="success" className="mb-4">
            {state.message}
          </Alert>
        ) : null}
        {state.status === 'error' ? (
          <Alert tone="danger" className="mb-4">
            {state.message}
          </Alert>
        ) : null}

        <form action={action} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Seu nome"
              name="fullName"
              defaultValue={initial.fullName}
              required
              error={state.fieldErrors?.fullName}
            />
            <TextField
              label="Nome da confeitaria"
              name="businessName"
              defaultValue={initial.businessName}
              required
              error={state.fieldErrors?.businessName}
            />
          </div>

          <TextField
            label="E-mail de acesso"
            value={email}
            readOnly
            disabled
            hint="Para trocar o e-mail, fale com o suporte."
          />

          <div className="flex sm:justify-end">
            <SubmitButton className="w-full sm:w-auto" pendingLabel="Salvando...">
              Salvar dados
            </SubmitButton>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
