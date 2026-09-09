'use client';

import { useActionState } from 'react';

import { SubmitButton } from '@/components/forms/submit-button';
import { Card, CardBody } from '@/components/ui/card';
import { SelectField, TextField } from '@/components/ui/field';
import { Alert } from '@/components/ui/feedback';
import { Logo } from '@/components/ui/logo';
import { completeOnboardingAction } from '@/server/actions/onboarding';
import { IDLE } from '@/server/form-state';

const TIPOS = [
  'Confeitaria artesanal',
  'Doces para festas',
  'Bolos e tortas',
  'Brownies e cookies',
  'Salgados e doces',
  'Outro',
];

const VOLUMES = ['Até 5 produtos', 'De 6 a 15 produtos', 'De 16 a 40 produtos', 'Mais de 40 produtos'];

const OBJETIVOS = [
  'Descobrir se estou tendo lucro',
  'Organizar meus custos',
  'Montar minha tabela de preços',
  'Aumentar minha margem',
];

export function OnboardingForm({
  defaultFullName,
  defaultBusinessName,
  defaultBusinessType,
  defaultProductVolume,
  defaultMainGoal,
}: {
  defaultFullName: string;
  defaultBusinessName: string;
  defaultBusinessType: string;
  defaultProductVolume: string;
  defaultMainGoal: string;
}) {
  const [state, action] = useActionState(completeOnboardingAction, IDLE);

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 py-8 sm:px-6 sm:py-12">
      <Logo />

      <div className="mt-8">
        <h1 className="font-display text-3xl font-semibold leading-tight text-sand-900">
          Vamos configurar sua primeira precificação
        </h1>
        <p className="mt-3 leading-relaxed text-sand-600">
          Cinco respostas rápidas para o sistema falar a sua língua. Você pode mudar tudo depois nas
          configurações.
        </p>
      </div>

      {state.status === 'error' ? (
        <Alert tone="danger" className="mt-6">
          {state.message}
        </Alert>
      ) : null}

      <Card className="mt-6">
        <CardBody>
          <form action={action} className="space-y-4" noValidate>
            <TextField
              label="Seu nome"
              name="fullName"
              defaultValue={defaultFullName}
              autoComplete="name"
              required
              error={state.fieldErrors?.fullName}
            />

            <TextField
              label="Nome da sua confeitaria"
              name="businessName"
              defaultValue={defaultBusinessName}
              placeholder="Ex.: Doces da Duda"
              required
              hint="Pode ser o nome que você usa nas redes sociais."
              error={state.fieldErrors?.businessName}
            />

            <SelectField
              label="Tipo de negócio"
              name="businessType"
              defaultValue={defaultBusinessType}
              error={state.fieldErrors?.businessType}
            >
              <option value="">Prefiro não dizer</option>
              {TIPOS.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </SelectField>

            <SelectField
              label="Quantos produtos você vende hoje"
              name="productVolume"
              defaultValue={defaultProductVolume}
              error={state.fieldErrors?.productVolume}
            >
              <option value="">Ainda não sei</option>
              {VOLUMES.map((volume) => (
                <option key={volume} value={volume}>
                  {volume}
                </option>
              ))}
            </SelectField>

            <SelectField
              label="Seu objetivo principal"
              name="mainGoal"
              defaultValue={defaultMainGoal}
              error={state.fieldErrors?.mainGoal}
            >
              <option value="">Ainda não sei</option>
              {OBJETIVOS.map((objetivo) => (
                <option key={objetivo} value={objetivo}>
                  {objetivo}
                </option>
              ))}
            </SelectField>

            <SubmitButton className="w-full" size="lg" pendingLabel="Preparando tudo...">
              Começar minha primeira precificação
            </SubmitButton>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
