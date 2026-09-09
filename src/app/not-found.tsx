import Link from 'next/link';

import { Logo } from '@/components/ui/logo';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <Link href="/" aria-label="ControlDolces, página inicial">
        <Logo />
      </Link>
      <div>
        <h1 className="font-display text-3xl font-semibold text-sand-900">Página não encontrada</h1>
        <p className="mx-auto mt-3 max-w-md leading-relaxed text-sand-600">
          O endereço que você abriu não existe. Talvez o link esteja incompleto.
        </p>
      </div>
      <Link
        href="/"
        className="inline-flex h-11 items-center rounded-xl bg-rose-600 px-5 text-white hover:bg-rose-700"
      >
        Ir para a página inicial
      </Link>
    </div>
  );
}
