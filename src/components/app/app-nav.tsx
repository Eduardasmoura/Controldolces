'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/components/ui/cn';

import { MOBILE_NAV_ITEMS, NAV_ITEMS } from './nav-items';

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegação do sistema" className="space-y-0.5">
      {NAV_ITEMS.map(({ href, label, Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
              active
                ? 'bg-rose-50 font-medium text-rose-800'
                : 'text-sand-600 hover:bg-sand-100 hover:text-sand-900',
            )}
          >
            <Icon className={cn('h-5 w-5', active ? 'text-rose-600' : 'text-sand-400')} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Barra inferior fixa: o padrão de navegação mais confortável no celular. */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação do sistema"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-sand-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="grid grid-cols-4">
        {MOBILE_NAV_ITEMS.map(({ href, short, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center gap-1 py-2.5 text-[0.7rem] font-medium transition-colors',
                  active ? 'text-rose-700' : 'text-sand-500',
                )}
              >
                <Icon className={cn('h-5 w-5', active ? 'text-rose-600' : 'text-sand-400')} />
                {short}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
