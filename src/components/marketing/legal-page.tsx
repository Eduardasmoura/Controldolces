import type { ReactNode } from 'react';

/** Moldura das páginas de texto corrido: termos, privacidade e suporte. */
export function LegalPage({
  title,
  intro,
  updatedAt,
  children,
}: {
  title: string;
  intro: string;
  updatedAt?: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-5 py-14 sm:px-6 sm:py-20">
      <header>
        <h1 className="font-display text-4xl font-bold leading-tight tracking-display-tight text-content-strong">
          {title}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-content-muted">{intro}</p>
        {updatedAt ? (
          <p className="mt-3 text-sm text-content-subtle">Última atualização: {updatedAt}</p>
        ) : null}
      </header>

      <div className="mt-10 space-y-8 leading-relaxed text-content-muted [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-content-strong [&_li]:leading-relaxed [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
        {children}
      </div>
    </article>
  );
}
