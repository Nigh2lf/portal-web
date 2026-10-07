import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/skeleton";
import { BuscaCorpoSkeleton } from "@/features/imoveis/components/busca-skeleton";

export default function LoadingHotsite() {
  return (
    <div aria-busy="true" aria-label="Carregando anunciante">
      <section className="border-b bg-gradient-to-br from-brand-soft/80 via-background to-background">
        <Container className="py-6 sm:py-8">
          <Skeleton className="mb-4 h-4 w-64" />
          <div className="card-elevated flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
            <Skeleton className="size-20 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-7 w-72 max-w-full" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-4 w-40" />
            </div>
            <Skeleton className="h-11 w-full sm:w-48" />
          </div>
        </Container>
      </section>
      <Container className="py-6 sm:py-8">
        <Skeleton className="mb-5 h-8 w-72 max-w-full" />
        <BuscaCorpoSkeleton />
      </Container>
    </div>
  );
}
