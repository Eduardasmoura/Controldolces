import Link from 'next/link';

import { Logo } from '@/components/ui/logo';

export function SiteFooter() {
  return (
    <footer className="border-t border-sand-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-sand-500">
            Precificação honesta para quem faz doce com as próprias mãos. Custo real, preço justo,
            lucro que aparece no fim do mês.
          </p>
        </div>

        <nav aria-label="Produto">
          <h2 className="text-sm font-semibold text-sand-800">Produto</h2>
          <ul className="mt-3 space-y-2 text-sm text-sand-500">
            <li>
              <Link href="/#como-funciona" className="hover:text-sand-800">
                Como funciona
              </Link>
            </li>
            <li>
              <Link href="/#recursos" className="hover:text-sand-800">
                Recursos
              </Link>
            </li>
            <li>
              <Link href="/como-funciona" className="hover:text-sand-800">
                Guia de precificação
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Conta">
          <h2 className="text-sm font-semibold text-sand-800">Conta</h2>
          <ul className="mt-3 space-y-2 text-sm text-sand-500">
            <li>
              <Link href="/criar-conta" className="hover:text-sand-800">
                Criar conta
              </Link>
            </li>
            <li>
              <Link href="/entrar" className="hover:text-sand-800">
                Entrar
              </Link>
            </li>
            <li>
              <Link href="/recuperar-senha" className="hover:text-sand-800">
                Recuperar senha
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-sand-100 px-4 py-5 text-center text-xs text-sand-400 sm:px-6">
        © {new Date().getFullYear()} ControlDolces
      </div>
    </footer>
  );
}
