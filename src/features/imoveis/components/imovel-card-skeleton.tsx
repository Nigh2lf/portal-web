import { Skeleton } from "@/components/ui/skeleton";

export function ImovelCardSkeleton() {
  return (
    <div className="card-elevated flex flex-col overflow-hidden" aria-hidden>
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
        <div className="flex gap-3">
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-14" />
        </div>
        <div className="mt-auto flex items-center justify-between border-t pt-3">
          <div className="flex items-center gap-2">
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </div>
  );
}

export function ListaImoveisSkeleton({ quantidade = 9 }: { quantidade?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: quantidade }, (_, i) => (
        <ImovelCardSkeleton key={i} />
      ))}
    </div>
  );
}
