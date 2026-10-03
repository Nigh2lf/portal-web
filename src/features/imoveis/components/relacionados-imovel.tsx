import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getRepository } from "@/lib/api";
import type { Objetivo, Portal } from "@/lib/api/types";
import { ListaImoveisSkeleton } from "./imovel-card-skeleton";
import { ListaImoveis } from "./lista-imoveis";

interface Props {
  portal: Portal;
  imovelSlug: string;
  objetivo?: Objetivo;
  verMaisHref: string;
  favoritos: string[];
}

/** Imóveis relacionados, carregados depois do detalhe (vai dentro de um `Suspense`). */
export async function RelacionadosImovel({ portal, imovelSlug, objetivo, verMaisHref, favoritos }: Props) {
  const repo = await getRepository();
  const relacionados = await repo.listRelacionados(portal.id, imovelSlug);
  if (!relacionados.length) return null;
  return (
    <section className="mt-14" aria-labelledby="relacionados">
      <div className="mb-5 flex items-end justify-between gap-3">
        <h2 id="relacionados" className="text-brand text-2xl font-bold">
          Imóveis relacionados
        </h2>
        <Button asChild variant="ghost" className="text-brand">
          <Link href={verMaisHref}>Ver mais</Link>
        </Button>
      </div>
      <ListaImoveis
        imoveis={relacionados}
        objetivo={objetivo}
        favoritos={favoritos}
        portalNome={portal.nome}
        colunas={3}
      />
    </section>
  );
}

export function RelacionadosImovelSkeleton() {
  return (
    <section className="mt-14" aria-busy="true" aria-label="Carregando imóveis relacionados">
      <Skeleton className="mb-5 h-8 w-64" />
      <ListaImoveisSkeleton quantidade={3} />
    </section>
  );
}
