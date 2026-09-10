'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/components/ui/cn';
import { IconLogout, IconMenu, IconSettings } from '@/components/ui/icons';
import { signOutAction } from '@/server/actions/auth';

import { NAV_ITEMS } from './nav-items';

/** Menu da conta. No celular também dá acesso às seções que não cabem na barra inferior. */
export function AccountMenu({ name, businessName }: { name: string; businessName: string }) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointer(event: MouseEvent) {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const initials = name.trim().slice(0, 1).toUpperCase() || 'C';

  return (
    <div className="relative" ref={container}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-xl border border-sand-200 bg-white px-2 py-1.5 text-sm text-sand-700 hover:border-sand-300"
      >
        <span
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-xs font-semibold text-rose-700"
          aria-hidden="true"
        >
          {initials}
        </span>
        <span className="hidden max-w-[10rem] truncate sm:block">{name}</span>
        <IconMenu className="h-4 w-4 text-sand-400 sm:hidden" />
      </button>

      {open ? (
        <div
          role="menu"
          className={cn(
            'absolute right-0 z-40 mt-2 w-60 overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-lift',
            'animate-fade-in',
          )}
        >
          <div className="border-b border-sand-100 px-4 py-3">
            <p className="truncate text-sm font-medium text-content-strong">{name}</p>
            <p className="truncate text-xs text-content-subtle">{businessName}</p>
          </div>

          <div className="p-1.5 lg:hidden">
            {NAV_ITEMS.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-sand-700 hover:bg-sand-50"
              >
                <Icon className="h-4 w-4 text-sand-400" />
                {label}
              </Link>
            ))}
          </div>

          <div className="hidden p-1.5 lg:block">
            <Link
              href="/configuracoes"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-sand-700 hover:bg-sand-50"
            >
              <IconSettings className="h-4 w-4 text-sand-400" />
              Configurações
            </Link>
          </div>

          <form action={signOutAction} className="border-t border-sand-100 p-1.5">
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-sand-700 hover:bg-sand-50"
            >
              <IconLogout className="h-4 w-4 text-sand-400" />
              Sair da conta
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
