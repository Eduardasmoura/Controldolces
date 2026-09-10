export type FaqItem = { question: string; answer: string };

/**
 * Perguntas frequentes com <details>/<summary> nativos: acessível por teclado e
 * por leitor de tela sem uma linha de JavaScript.
 */
export function Faq({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y divide-surface-border border-y border-surface-border">
      {items.map((item) => (
        <details key={item.question} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-medium text-content-strong marker:hidden [&::-webkit-details-marker]:hidden">
            {item.question}
            <span
              aria-hidden="true"
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-surface-border text-content-subtle transition-transform duration-200 group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <p className="pb-5 pr-11 leading-relaxed text-content-muted">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
