import { SubmitButton } from '@/components/forms/submit-button';
import { OnboardingShell } from '@/components/onboarding/onboarding-shell';
import { IconArrowRight, IconCheck } from '@/components/ui/icons';
import { concluirOnboardingAction } from '@/server/actions/onboarding';

export function TudoPronto({ firstName }: { firstName: string }) {
  return (
    <OnboardingShell
      step={4}
      title={firstName ? `Tudo pronto, ${firstName}!` : 'Tudo pronto!'}
      description="Agora vamos criar sua primeira precificação."
    >
      <div className="flex justify-center py-4">
        <span
          aria-hidden="true"
          className="grid h-16 w-16 place-items-center rounded-full bg-primary-soft text-primary"
        >
          <IconCheck className="h-8 w-8" />
        </span>
      </div>

      <p className="text-center leading-relaxed text-content-muted">
        Sua conta está configurada. O próximo passo é escolher um produto que você já vende e
        descobrir quanto ele realmente custa.
      </p>

      <form action={concluirOnboardingAction} className="mt-8">
        <SubmitButton size="lg" className="w-full" pendingLabel="Abrindo seu painel...">
          Começar
          <IconArrowRight />
        </SubmitButton>
      </form>
    </OnboardingShell>
  );
}
