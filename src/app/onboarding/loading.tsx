import { Skeleton } from '@/components/ui/feedback';

/** Carregamento do onboarding. */
export default function OnboardingLoading() {
  return (
    <div
      className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 py-8 sm:px-6 sm:py-12"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Carregando…</span>
      <Skeleton className="h-8 w-40" />
      <Skeleton className="mt-8 h-4 w-56" />
      <Skeleton className="mt-2 h-1.5 w-full rounded-full" />
      <Skeleton className="mt-8 h-10 w-4/5" />
      <Skeleton className="mt-3 h-5 w-full" />
      <div className="mt-8 space-y-2.5">
        <Skeleton className="h-14 rounded-2xl" />
        <Skeleton className="h-14 rounded-2xl" />
        <Skeleton className="h-14 rounded-2xl" />
      </div>
    </div>
  );
}
