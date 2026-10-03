import { Container } from "@/components/layout/container";
import { CardsSkeleton, PageHeaderSkeleton } from "@/components/layout/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingBlog() {
  return (
    <div aria-busy="true" aria-label="Carregando blog">
      <PageHeaderSkeleton />
      <Container className="py-10 sm:py-14">
        <Skeleton className="mb-10 h-72 rounded-2xl" />
        <CardsSkeleton quantidade={6} altura="h-80" />
      </Container>
    </div>
  );
}
