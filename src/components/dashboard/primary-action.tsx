import { ButtonLink } from '@/components/ui/button';
import { IconArrowRight } from '@/components/ui/icons';

/**
 * Cartão de ação principal do painel.
 *
 * É o elemento que responde "e agora?". Fica no topo, sozinho, e não divide
 * atenção com outros botões da mesma força.
 */
export function PrimaryAction({
  title,
  description,
  cta,
  href,
}: {
  title: string;
  description: string;
  cta: string;
  href: string;
}) {
  return (
    <section className="overflow-hidden rounded-2xl bg-primary px-5 py-6 sm:px-7 sm:py-7">
      <h2 className="text-balance font-display text-xl font-bold text-primary-contrast sm:text-2xl">
        {title}
      </h2>
      <p className="mt-2 max-w-lg leading-relaxed text-primary-soft">{description}</p>
      <div className="mt-5">
        <ButtonLink
          href={href}
          size="lg"
          className="bg-surface text-primary-hover hover:bg-primary-soft active:bg-primary-soft"
        >
          {cta}
          <IconArrowRight />
        </ButtonLink>
      </div>
    </section>
  );
}
