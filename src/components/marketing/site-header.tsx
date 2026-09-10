'use client';

import Link from 'next/link';
import { useState } from 'react';

import { ButtonLink } from '@/components/ui/button';
import { IconClose, IconMenu } from '@/components/ui/icons';
import { Logo } from '@/components/ui/logo';

const LINKS = [
  { href: '/#como-funciona', label: 'Como funciona' },
  { href: '/#funcionalidades', label: 'Funcionalidades' },
  { href: '/#beneficios', label: 'Benefícios' },
  { href: '/#faq', label: 'FAQ' },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-surface-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-6">
        <Link href="/" aria-label="ControlDolces, página inicial">
          <Logo />
        </Link>

        <nav aria-label="Navegação principal" className="hidden items-center gap-7 lg:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-content-muted transition-colors hover:text-content-strong"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          <ButtonLink href="/entrar" variant="ghost" size="sm">
            Entrar
          </ButtonLink>
          <ButtonLink href="/criar-conta" size="sm">
            Começar agora
          </ButtonLink>
        </div>

        {/* No celular o CTA fica sempre à vista; o menu guarda só a navegação. */}
        <div className="flex items-center gap-1 sm:hidden">
          <ButtonLink href="/criar-conta" size="sm">
            Começar
          </ButtonLink>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="menu-mobile"
            className="-mr-2 rounded-lg p-2 text-content-muted"
          >
            <span className="sr-only">{open ? 'Fechar menu' : 'Abrir menu'}</span>
            {open ? <IconClose /> : <IconMenu />}
          </button>
        </div>
      </div>

      {open ? (
        <div id="menu-mobile" className="border-t border-surface-border bg-background px-5 py-4 sm:hidden">
          <nav aria-label="Navegação principal" className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-2.5 text-content hover:bg-surface-muted"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3">
            <ButtonLink href="/entrar" variant="secondary" className="w-full">
              Já tenho conta
            </ButtonLink>
          </div>
        </div>
      ) : null}
    </header>
  );
}
