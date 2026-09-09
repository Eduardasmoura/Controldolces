'use client';

import Link from 'next/link';
import { useState } from 'react';

import { ButtonLink } from '@/components/ui/button';
import { IconClose, IconMenu } from '@/components/ui/icons';
import { Logo } from '@/components/ui/logo';

const LINKS = [
  { href: '/#problema', label: 'Por que precificar' },
  { href: '/#como-funciona', label: 'Como funciona' },
  { href: '/#recursos', label: 'Recursos' },
  { href: '/#perguntas', label: 'Dúvidas' },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-sand-200/70 bg-cream/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="ControlDolces, página inicial">
          <Logo />
        </Link>

        <nav aria-label="Navegação principal" className="hidden items-center gap-7 lg:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-sand-600 transition-colors hover:text-sand-900"
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

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="menu-mobile"
          className="-mr-2 rounded-lg p-2 text-sand-600 sm:hidden"
        >
          <span className="sr-only">{open ? 'Fechar menu' : 'Abrir menu'}</span>
          {open ? <IconClose /> : <IconMenu />}
        </button>
      </div>

      {open ? (
        <div id="menu-mobile" className="border-t border-sand-200 bg-cream px-4 py-4 sm:hidden">
          <nav aria-label="Navegação principal" className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-2.5 text-sand-700 hover:bg-sand-100"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 grid gap-2">
            <ButtonLink href="/criar-conta">Começar agora</ButtonLink>
            <ButtonLink href="/entrar" variant="secondary">
              Já tenho conta
            </ButtonLink>
          </div>
        </div>
      ) : null}
    </header>
  );
}
