import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/skeleton";

/** Cabeçalho de página (breadcrumb, título e subtítulo) enquanto carrega. */
export function PageHeaderSkeleton({ compacto = false }: { compacto?: boolean }) {
  return (
    <section className="from-brand-soft/80 via-background to-background border-b bg-gradient-to-br">
      <Container className={compacto ? "py-5 sm:py-6" : "py-8 sm:py-12"}>
        <Skeleton className="mb-3 h-4 w-40" />
        <Skeleton className="h-8 w-80 max-w-full sm:h-10" />
        <Skeleton className="mt-3 h-4 w-[32rem] max-w-full" />
      </Container>
    </section>
  );
}

/** Grade de cartões genéricos (imobiliárias, posts). */
export function CardsSkeleton({
  quantidade = 6,
  altura = "h-48",
  colunas = "sm:grid-cols-2 lg:grid-cols-3",
}: {
  quantidade?: number;
  altura?: string;
  colunas?: string;
}) {
  return (
    <div className={`grid gap-6 ${colunas}`}>
      {Array.from({ length: quantidade }, (_, i) => (
        <Skeleton key={i} className={`${altura} rounded-xl`} />
      ))}
    </div>
  );
}

/** Página genérica: cabeçalho e blocos de conteúdo. */
export function PaginaSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando página">
      <PageHeaderSkeleton />
      <Container className="space-y-4 py-10 sm:py-14">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-4 w-full" style={{ maxWidth: `${92 - i * 9}%` }} />
        ))}
        <div className="pt-6">
          <CardsSkeleton quantidade={3} />
        </div>
      </Container>
    </div>
  );
}
