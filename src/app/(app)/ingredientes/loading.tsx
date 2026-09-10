import { Card } from '@/components/ui/card';
import { ListSkeleton, Skeleton } from '@/components/ui/feedback';

export default function IngredientesLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Carregando ingredientes…</span>
      <div className="mb-6 space-y-2">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <Skeleton className="h-11 flex-1 rounded-xl" />
        <Skeleton className="h-11 rounded-xl sm:w-52" />
      </div>
      <Card>
        <ListSkeleton rows={6} />
      </Card>
    </div>
  );
}
