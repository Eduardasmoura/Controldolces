import { cn } from '@/components/ui/cn';

/**
 * Foto do produto.
 *
 * Usa <img> em vez de next/image de propósito: o endereço é colado pela usuária e
 * pode vir de qualquer domínio, o que o otimizador de imagens não aceita sem uma
 * lista de hosts. Quando não há foto, mostra a inicial do produto.
 */
export function ProductPhoto({
  url,
  name,
  className,
}: {
  url: string | null;
  name: string;
  className?: string;
}) {
  const base = cn('shrink-0 overflow-hidden rounded-xl bg-rose-50', className);

  if (!url) {
    return (
      <div
        className={cn(base, 'flex items-center justify-center font-display text-rose-400')}
        aria-hidden="true"
      >
        {name.trim().slice(0, 1).toUpperCase() || '·'}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={`Foto de ${name}`}
      loading="lazy"
      decoding="async"
      className={cn(base, 'object-cover')}
    />
  );
}
