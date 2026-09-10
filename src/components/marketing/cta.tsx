import { ButtonLink } from '@/components/ui/button';
import { IconArrowRight } from '@/components/ui/icons';

/**
 * Chamada final. O botão principal leva ao cadastro de verdade — não existe
 * formulário de mentira nesta página.
 */
export function CallToAction({
  title,
  description,
  note,
}: {
  title: string;
  description: string;
  note?: string;
}) {
  return (
    <div className="rounded-3xl bg-primary px-6 py-12 text-center sm:px-12 sm:py-16">
      <h2 className="text-balance font-display text-3xl font-bold tracking-display-tight text-primary-contrast sm:text-4xl">
        {title}
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-primary-soft">
        {description}
      </p>
      <div className="mt-8 flex justify-center">
        <ButtonLink
          href="/criar-conta"
          size="lg"
          className="bg-surface text-primary-hover hover:bg-primary-soft active:bg-primary-soft"
        >
          Começar agora
          <IconArrowRight />
        </ButtonLink>
      </div>
      {note ? <p className="mt-4 text-sm text-primary-soft/90">{note}</p> : null}
    </div>
  );
}
