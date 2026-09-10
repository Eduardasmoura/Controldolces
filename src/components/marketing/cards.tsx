import type { ReactNode } from 'react';

/**
 * Cartões da landing page.
 *
 * Três formatos com papéis distintos, para a página não virar uma parede de
 * caixas iguais: etapa numerada, funcionalidade com ícone e benefício sem ícone.
 */

export function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <li className="relative rounded-2xl border border-surface-border bg-surface p-6">
      <span
        aria-hidden="true"
        className="font-display text-sm font-bold tracking-widest text-primary"
      >
        {number}
      </span>
      <h3 className="mt-2 font-display text-lg font-bold text-content-strong">{title}</h3>
      <p className="mt-2 leading-relaxed text-content-muted">{description}</p>
    </li>
  );
}

export function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <li className="rounded-2xl border border-surface-border bg-surface p-6 transition-colors duration-200 hover:border-primary/30">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
        {icon}
      </span>
      <h3 className="mt-4 font-display text-lg font-bold text-content-strong">{title}</h3>
      <p className="mt-2 leading-relaxed text-content-muted">{description}</p>
    </li>
  );
}

/**
 * Benefício: sem ícone e sem moldura, separado por uma régua fina. O contraste
 * de formato com o cartão de funcionalidade deixa claro que são coisas
 * diferentes — uma é o que o sistema faz, a outra é o que ela ganha com isso.
 */
export function BenefitCard({ title, description }: { title: string; description: string }) {
  return (
    <li className="border-t-2 border-accent/40 pt-5">
      <h3 className="font-display text-lg font-bold text-content-strong">{title}</h3>
      <p className="mt-2 leading-relaxed text-content-muted">{description}</p>
    </li>
  );
}

export function AudienceCard({ title, description }: { title: string; description: string }) {
  return (
    <li className="rounded-2xl bg-surface-muted p-5">
      <h3 className="font-display font-bold text-content-strong">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-content-muted">{description}</p>
    </li>
  );
}
