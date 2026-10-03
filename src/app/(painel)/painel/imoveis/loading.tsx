import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Carregando imóveis">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="card-elevated flex flex-col divide-y">
        {Array.from({ length: 6 }).map((_, k) => (
          <div key={k} className="flex items-center gap-4 p-3">
            <Skeleton className="h-14 w-20 rounded-md" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="hidden h-4 w-24 md:block" />
            <Skeleton className="hidden h-5 w-16 rounded-full md:block" />
            <Skeleton className="size-7 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
