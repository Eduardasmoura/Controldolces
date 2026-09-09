import Link from 'next/link';

import { AccountMenu } from '@/components/app/app-menu';
import { BottomNav, SidebarNav } from '@/components/app/app-nav';
import { Logo } from '@/components/ui/logo';
import { requireContext } from '@/server/context';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, business } = await requireContext();
  const name = profile?.full_name?.trim() || business.name;

  return (
    <div className="min-h-dvh bg-cream">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-rose-600 focus:px-4 focus:py-2 focus:text-white"
      >
        Pular para o conteúdo
      </a>

      {/* Coluna lateral fixa a partir do desktop. */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-sand-200 bg-white px-4 py-5 lg:block">
        <Link href="/painel" aria-label="ControlDolces, ir para o painel">
          <Logo compact />
        </Link>
        <div className="mt-7">
          <SidebarNav />
        </div>
        <p className="absolute bottom-5 left-4 right-4 truncate text-xs text-sand-400">
          {business.name}
        </p>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 border-b border-sand-200 bg-cream/90 backdrop-blur">
          <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
            <Link href="/painel" className="lg:hidden" aria-label="ControlDolces, ir para o painel">
              <Logo compact />
            </Link>
            <p className="hidden truncate text-sm text-sand-500 lg:block">{business.name}</p>
            <AccountMenu name={name} email={user.email ?? ''} />
          </div>
        </header>

        <main id="conteudo" className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-6 sm:pb-12">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
