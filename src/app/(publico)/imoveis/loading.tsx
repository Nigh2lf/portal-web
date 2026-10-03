import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/skeleton";
import { ListaImoveisSkeleton } from "@/features/imoveis/components/imovel-card-skeleton";

export default function LoadingBusca() {
  return (
    <>
      <section className="border-b bg-gradient-to-br from-brand-soft/80 via-background to-background">
        <Container className="py-5 sm:py-6">
          <Skeleton className="mb-3 h-4 w-48" />
          <Skeleton className="h-8 w-80 max-w-full" />
          <Skeleton className="mt-3 h-4 w-96 max-w-full" />
        </Container>
      </section>
      <Container className="py-6 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-[288px_minmax(0,1fr)] lg:gap-8">
          <div className="card-elevated hidden h-[560px] p-5 lg:block">
            <Skeleton className="mb-4 h-5 w-32" />
            <div className="space-y-4">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-11 w-full sm:w-80" />
              <Skeleton className="hidden h-9 w-44 sm:block" />
            </div>
            <Skeleton className="h-4 w-56" />
            <ListaImoveisSkeleton quantidade={9} />
          </div>
        </div>
      </Container>
    </>
  );
}
