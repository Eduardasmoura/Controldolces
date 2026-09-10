import Link from 'next/link';

import { Logo } from '@/components/ui/logo';

const PRODUTO = [
  { href: '/#como-funciona', label: 'Como funciona' },
  { href: '/#funcionalidades', label: 'Funcionalidades' },
  { href: '/#beneficios', label: 'Benefícios' },
  { href: '/como-funciona', label: 'Guia de precificação' },
];

const CONTA = [
  { href: '/criar-conta', label: 'Criar conta' },
  { href: '/entrar', label: 'Entrar' },
  { href: '/recuperar-senha', label: 'Recuperar senha' },
];

const AJUDA = [
  { href: '/suporte', label: 'Suporte' },
  { href: '/#faq', label: 'Perguntas frequentes' },
  { href: '/termos', label: 'Termos de uso' },
  { href: '/privacidade', label: 'Privacidade' },
];

function Coluna({
  titulo,
  links,
}: {
  titulo: string;
  links: { href: string; label: string }[];
}) {
  return (
    <nav aria-label={titulo}>
      <h2 className="text-sm font-bold text-content-strong">{titulo}</h2>
      <ul className="mt-3 space-y-2 text-sm text-content-muted">
        {links.map((link) => (
          <li key={link.href + link.label}>
            <Link href={link.href} className="transition-colors hover:text-content-strong">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Rodapé. Todos os links apontam para páginas que existem neste projeto. */
export function SiteFooter() {
  return (
    <footer className="border-t border-surface-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-6 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-content-muted">
            Precificação honesta para quem faz doce com as próprias mãos. Custo real, preço justo,
            lucro que aparece no fim do mês.
          </p>
        </div>

        <Coluna titulo="Produto" links={PRODUTO} />
        <Coluna titulo="Conta" links={CONTA} />
        <Coluna titulo="Ajuda" links={AJUDA} />
      </div>

      <div className="border-t border-surface-border px-5 py-5 text-center text-xs text-content-subtle sm:px-6">
        © {new Date().getFullYear()} ControlDolces
      </div>
    </footer>
  );
}
