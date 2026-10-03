import { Container } from "@/components/layout/container";
import { PageHeaderSkeleton } from "@/components/layout/skeletons";
import { ListaImoveisSkeleton } from "@/features/imoveis/components/imovel-card-skeleton";

export default function LoadingFavoritos() {
  return (
    <div aria-busy="true" aria-label="Carregando favoritos">
      <PageHeaderSkeleton compacto />
      <Container className="py-8">
        <ListaImoveisSkeleton quantidade={6} />
      </Container>
    </div>
  );
}
