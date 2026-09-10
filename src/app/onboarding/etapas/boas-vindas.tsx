import { OnboardingShell } from '@/components/onboarding/onboarding-shell';
import { SubmitButton } from '@/components/forms/submit-button';
import { IconArrowRight, IconCheck } from '@/components/ui/icons';
import { iniciarOnboardingAction } from '@/server/actions/onboarding';

const PROMESSAS = [
  'Descobrir quanto custa cada produto que você faz',
  'Saber qual preço cobre seus custos e qual dá lucro',
  'Guardar suas receitas e preços em um lugar só',
];

export function BoasVindas() {
  return (
    <OnboardingShell
      step={0}
      title="Vamos deixar sua precificação mais simples."
      description="Em poucos passos, vamos configurar sua conta para você começar a descobrir quanto realmente custa cada produto."
    >
      <ul className="space-y-3">
        {PROMESSAS.map((promessa) => (
          <li key={promessa} className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary-soft text-primary"
            >
              <IconCheck className="h-3.5 w-3.5" />
            </span>
            <span className="leading-relaxed text-content-muted">{promessa}</span>
          </li>
        ))}
      </ul>

      <form action={iniciarOnboardingAction} className="mt-8">
        <SubmitButton size="lg" className="w-full" pendingLabel="Um instante...">
          Continuar
          <IconArrowRight />
        </SubmitButton>
      </form>

      <p className="mt-4 text-center text-sm text-content-subtle">
        Leva menos de um minuto.
      </p>
    </OnboardingShell>
  );
}
