'use client';

import { useActionState } from 'react';

import { SubmitButton } from '@/components/forms/submit-button';
import { OnboardingShell } from '@/components/onboarding/onboarding-shell';
import { OptionCards } from '@/components/onboarding/option-cards';
import { Alert } from '@/components/ui/feedback';
import { IconArrowRight } from '@/components/ui/icons';
import { salvarTipoDeNegocioAction, voltarEtapaAction } from '@/server/actions/onboarding';
import { IDLE } from '@/server/form-state';

const TIPOS = [
  { value: 'Confeitaria', label: 'Confeitaria' },
  { value: 'Bolos', label: 'Bolos' },
  { value: 'Doces', label: 'Doces' },
  { value: 'Brigadeiros', label: 'Brigadeiros' },
  { value: 'Doces para festas', label: 'Doces para festas' },
  { value: 'Outro', label: 'Outro' },
];

export function TipoDeNegocio({ businessType }: { businessType: string }) {
  const [state, action] = useActionState(salvarTipoDeNegocioAction, IDLE);

  return (
    <OnboardingShell
      step={2}
      title="Qual é o seu tipo de negócio?"
      description="Serve para deixar os exemplos mais parecidos com o que você faz. Se nenhuma opção encaixar, pode seguir sem escolher."
      footer={
        <form action={voltarEtapaAction}>
          <input type="hidden" name="etapa" value="1" />
          <button
            type="submit"
            className="w-full rounded-xl px-4 py-2 text-sm text-content-muted hover:text-content-strong"
          >
            Voltar
          </button>
        </form>
      }
    >
      {state.status === 'error' ? (
        <Alert tone="danger" className="mb-5">
          {state.message}
        </Alert>
      ) : null}

      <form action={action} className="space-y-6">
        <OptionCards name="businessType" options={TIPOS} defaultValue={businessType} />

        <SubmitButton size="lg" className="w-full" pendingLabel="Salvando...">
          Continuar
          <IconArrowRight />
        </SubmitButton>
      </form>

      {/* Formulário separado de propósito: dentro do outro, este botão enviaria a
          opção que estivesse marcada — o oposto do que ele promete. */}
      <form action={action} className="mt-2">
        <SubmitButton variant="ghost" className="w-full" pendingLabel="Um instante...">
          Prefiro não dizer
        </SubmitButton>
      </form>
    </OnboardingShell>
  );
}
