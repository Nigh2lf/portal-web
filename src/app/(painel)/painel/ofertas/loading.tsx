import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Carregando ofertas">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <Skeleton className="h-28 w-full rounded-xl" />
      <div className="card-elevated flex flex-col divide-y">
        {Array.from({ length: 6 }).map((_, k) => (
          <div key={k} className="grid grid-cols-[1fr_2fr_2fr_3fr] items-center gap-4 p-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
