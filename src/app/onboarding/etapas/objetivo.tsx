'use client';

import { useActionState } from 'react';

import { SubmitButton } from '@/components/forms/submit-button';
import { OnboardingShell } from '@/components/onboarding/onboarding-shell';
import { OptionCards } from '@/components/onboarding/option-cards';
import { Alert } from '@/components/ui/feedback';
import { IconArrowRight } from '@/components/ui/icons';
import { salvarObjetivoAction, voltarEtapaAction } from '@/server/actions/onboarding';
import { IDLE } from '@/server/form-state';

const OBJETIVOS = [
  { value: 'Saber quanto cobrar', label: 'Saber quanto cobrar' },
  { value: 'Descobrir meu lucro', label: 'Descobrir meu lucro' },
  { value: 'Organizar meus custos', label: 'Organizar meus custos' },
  { value: 'Parar de vender no prejuízo', label: 'Parar de vender no prejuízo' },
  { value: 'Organizar minhas receitas', label: 'Organizar minhas receitas' },
  { value: 'Tudo isso', label: 'Tudo isso' },
];

export function Objetivo({ mainGoal }: { mainGoal: string }) {
  const [state, action] = useActionState(salvarObjetivoAction, IDLE);

  return (
    <OnboardingShell
      step={3}
      title="O que você mais quer melhorar hoje?"
      description="Não existe resposta errada — e você pode mudar de ideia depois."
      footer={
        <form action={voltarEtapaAction}>
          <input type="hidden" name="etapa" value="2" />
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
        <OptionCards name="mainGoal" options={OBJETIVOS} defaultValue={mainGoal} columns={1} />

        <SubmitButton size="lg" className="w-full" pendingLabel="Salvando...">
          Continuar
          <IconArrowRight />
        </SubmitButton>
      </form>
    </OnboardingShell>
  );
}
