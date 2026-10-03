import { Container } from "@/components/layout/container";
import { CardsSkeleton, PageHeaderSkeleton } from "@/components/layout/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingImobiliarias() {
  return (
    <div aria-busy="true" aria-label="Carregando imobiliárias">
      <PageHeaderSkeleton />
      <Container className="space-y-16 py-10 sm:py-14">
        {Array.from({ length: 2 }, (_, i) => (
          <section key={i} className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-80 max-w-full" />
            </div>
            <CardsSkeleton quantidade={6} altura="h-44" />
          </section>
        ))}
      </Container>
    </div>
  );
}
