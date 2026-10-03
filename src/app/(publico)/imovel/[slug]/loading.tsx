import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingImovel() {
  return (
    <div aria-busy="true" aria-label="Carregando imóvel">
    <Container className="py-5 sm:py-8">
      <Skeleton className="mb-4 h-4 w-72 max-w-full" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10">
        <div className="min-w-0 space-y-8">
          <div className="space-y-2">
            <Skeleton className="aspect-[16/10] w-full rounded-2xl" />
            <div className="hidden grid-cols-5 gap-2 sm:grid">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="aspect-[4/3] rounded-lg" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-9 w-full max-w-xl" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
          <div className="space-y-2">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-4" style={{ width: `${96 - (i % 3) * 12}%` }} />
            ))}
          </div>
        </div>
        <aside className="space-y-4">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </aside>
      </div>
    </Container>
    </div>
  );
}
