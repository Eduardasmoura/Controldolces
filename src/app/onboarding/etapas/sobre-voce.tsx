'use client';

import { useActionState } from 'react';

import { SubmitButton } from '@/components/forms/submit-button';
import { OnboardingShell } from '@/components/onboarding/onboarding-shell';
import { TextField } from '@/components/ui/field';
import { Alert } from '@/components/ui/feedback';
import { IconArrowRight } from '@/components/ui/icons';
import { salvarSobreVoceAction } from '@/server/actions/onboarding';
import { IDLE } from '@/server/form-state';

export function SobreVoce({
  fullName,
  businessName,
}: {
  fullName: string;
  businessName: string;
}) {
  const [state, action] = useActionState(salvarSobreVoceAction, IDLE);

  return (
    <OnboardingShell
      step={1}
      title="Sobre você"
      description="Só o essencial para o sistema falar a sua língua."
    >
      {state.status === 'error' ? (
        <Alert tone="danger" className="mb-5">
          {state.message}
        </Alert>
      ) : null}

      <form action={action} className="space-y-5" noValidate>
        <TextField
          label="Como podemos chamar você?"
          name="fullName"
          defaultValue={fullName}
          autoComplete="name"
          placeholder="Ana"
          required
          autoFocus
          error={state.fieldErrors?.fullName}
        />

        <TextField
          label="Nome da sua confeitaria"
          name="businessName"
          defaultValue={businessName}
          placeholder="Doces da Ana"
          required
          hint="Pode ser o nome que você usa nas redes sociais."
          error={state.fieldErrors?.businessName}
        />

        <SubmitButton size="lg" className="w-full" pendingLabel="Salvando...">
          Continuar
          <IconArrowRight />
        </SubmitButton>
      </form>
    </OnboardingShell>
  );
}
