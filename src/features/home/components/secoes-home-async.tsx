import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/skeleton";
import { ListaImoveisSkeleton } from "@/features/imoveis/components/imovel-card-skeleton";
import { getRepository } from "@/lib/api";
import type { Portal } from "@/lib/api/types";
import { SecaoBairros, SecaoDestaques, SecaoMaisProcurados } from "./secoes-home";

/*
 * Seções da home que chegam depois do topo (hero e busca). Cada uma vai dentro de
 * um `Suspense` próprio, então a mais lenta não segura as outras.
 */

export async function DestaquesHome({ portal, favoritos }: { portal: Portal; favoritos: string[] }) {
  const destaques = await (await getRepository()).listDestaques(portal.id);
  return <SecaoDestaques destaques={destaques} portal={portal} favoritos={favoritos} />;
}

export async function MaisProcuradosHome({ portal }: { portal: Portal }) {
  const pesquisas = await (await getRepository()).getPesquisasPopulares(portal.id, 15);
  return <SecaoMaisProcurados pesquisas={pesquisas} />;
}

export async function BairrosHome({ portal }: { portal: Portal }) {
  const bairros = await (await getRepository()).listBairrosMaisAnunciados(portal.id);
  return <SecaoBairros bairros={bairros} />;
}

function TituloSkeleton() {
  return (
    <div className="mb-6 space-y-2">
      <Skeleton className="h-7 w-64" />
      <Skeleton className="h-4 w-80 max-w-full" />
    </div>
  );
}

export function DestaquesHomeSkeleton() {
  return (
    <section className="py-12 sm:py-16" aria-busy="true" aria-label="Carregando imóveis em destaque">
      <Container>
        <TituloSkeleton />
        <ListaImoveisSkeleton quantidade={4} />
      </Container>
    </section>
  );
}

export function MaisProcuradosHomeSkeleton() {
  return (
    <section
      className="bg-brand-soft/50 py-12 sm:py-16"
      aria-busy="true"
      aria-label="Carregando imóveis mais procurados"
    >
      <Container>
        <TituloSkeleton />
        <div className="flex flex-wrap gap-2.5">
          {Array.from({ length: 10 }, (_, i) => (
            <Skeleton key={i} className="h-9 rounded-full" style={{ width: `${140 + ((i * 37) % 120)}px` }} />
          ))}
        </div>
      </Container>
    </section>
  );
}

export function BairrosHomeSkeleton() {
  return (
    <section className="py-12 sm:py-16" aria-busy="true" aria-label="Carregando bairros mais anunciados">
      <Container>
        <TituloSkeleton />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 10 }, (_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </Container>
    </section>
  );
}
