import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingPost() {
  return (
    <div aria-busy="true" aria-label="Carregando publicação">
      <section className="border-b bg-gradient-to-br from-brand-soft/80 via-background to-background">
        <Container className="max-w-4xl py-8 sm:py-12">
          <Skeleton className="mb-4 h-4 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="mt-2 h-10 w-2/3" />
          <Skeleton className="mt-4 h-5 w-full max-w-2xl" />
        </Container>
      </section>
      <Container className="max-w-4xl py-8 sm:py-10">
        <Skeleton className="aspect-[1200/630] w-full rounded-2xl" />
        <div className="mx-auto mt-10 max-w-3xl space-y-3">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-4" style={{ width: `${98 - (i % 4) * 8}%` }} />
          ))}
        </div>
      </Container>
    </div>
  );
}
