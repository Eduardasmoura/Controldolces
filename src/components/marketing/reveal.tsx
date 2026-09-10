'use client';

import { useEffect, useRef, useState } from 'react';

import { cn } from '@/components/ui/cn';

/**
 * Entrada suave ao rolar a página.
 *
 * Sem biblioteca: um IntersectionObserver e uma transição CSS.
 *
 * O conteúdo é renderizado VISÍVEL no HTML. Só depois de montar, e só para o que
 * está abaixo da dobra, o componente esconde e observa. Assim quem está sem
 * JavaScript enxerga a página inteira, e quem já está vendo o elemento não vê
 * nenhum piscar.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  /** Atraso em milissegundos, para escalonar itens de uma mesma lista. */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const prefereMenosMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefereMenosMovimento) return;

    // Já visível na primeira pintura? Deixa como está.
    if (element.getBoundingClientRect().top < window.innerHeight) return;

    setHidden(true);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setHidden(false);
            observer.disconnect();
          }
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={hidden ? undefined : { transitionDelay: `${delay}ms` }}
      className={cn(
        'transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none',
        hidden ? 'translate-y-3 opacity-0' : 'translate-y-0 opacity-100',
        className,
      )}
    >
      {children}
    </div>
  );
}
