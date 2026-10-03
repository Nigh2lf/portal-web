import { PageHeaderSkeleton } from "@/components/layout/skeletons";
import { BuscaCorpoSkeleton } from "@/features/imoveis/components/busca-skeleton";

export default function LoadingBusca() {
  return (
    <div aria-busy="true" aria-label="Carregando imóveis">
      <PageHeaderSkeleton compacto />
      <BuscaCorpoSkeleton />
    </div>
  );
}
