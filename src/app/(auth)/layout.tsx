import Link from 'next/link';

import { Logo } from '@/components/ui/logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-cream">
      <header className="px-4 py-6 sm:px-6">
        <Link href="/" aria-label="ControlDolces, página inicial">
          <Logo />
        </Link>
      </header>

      <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-2 sm:items-center sm:px-6 sm:pb-24">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
