import "server-only";

import { cache } from "react";
import { getRepository } from "@/lib/api";
import type { Bairro, BuscaFiltros, BuscaResultado, Cidade, ImovelTipo, Portal } from "@/lib/api/types";
import { type SearchParamsLike, linkBusca } from "@/lib/busca/filtros";

/**
 * Busca memoizada por request: `generateMetadata` e a página pedem o mesmo
 * resultado e o repositório é chamado uma única vez.
 */
const buscarMemo = cache(async (portalId: string, filtrosJson: string): Promise<BuscaResultado> => {
  const repo = await getRepository();
  return repo.buscarImoveis(portalId, JSON.parse(filtrosJson) as BuscaFiltros);
});

export function buscarImoveis(portalId: string, filtros: BuscaFiltros) {
  return buscarMemo(portalId, JSON.stringify(filtros));
}

export interface DadosBusca {
  resultado: BuscaResultado;
  tipos: ImovelTipo[];
  cidades: Cidade[];
  bairros: Bairro[];
  cidadePadraoSlug: string;
}

/** Resultado + catálogos necessários para a UI de filtros. */
export async function carregarBusca(
  portal: Portal,
  filtros: BuscaFiltros,
  opts: { anuncianteId?: string } = {},
): Promise<DadosBusca> {
  const repo = await getRepository();
  const [resultado, tipos, cidades] = await Promise.all([
    buscarImoveis(portal.id, filtros),
    repo.listTipos(),
    repo.listCidades(portal.id),
  ]);
  const cidadePadraoSlug =
    cidades.find((c) => c.id === portal.cidade_principal_id)?.slug ?? cidades[0]?.slug ?? "";
  // Bairros sem cidade (links antigos) usam a cidade principal, como a API faz na busca.
  const cidadeSlug =
    filtros.cidade ?? (portal.exibir_cidade && !filtros.bairros?.length ? undefined : cidadePadraoSlug);
  const bairros = cidadeSlug
    ? await repo.listBairros({
        cidadeSlug,
        portalId: portal.id,
        anuncianteId: opts.anuncianteId,
        comImoveis: true,
      })
    : [];
  return { resultado, tipos, cidades, bairros, cidadePadraoSlug };
}

function um(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

/**
 * URLs do legado chegam com ids numéricos (`tipo_id`, `cidade_id`, `bairro_id`)
 * via redirect 301. Converte para slugs e devolve a URL limpa, ou null se não
 * há nada a converter.
 */
export async function resolverIdsLegado(
  sp: SearchParamsLike,
  portalId: string,
  filtros: BuscaFiltros,
): Promise<string | null> {
  const tipoId = um(sp.tipo_id);
  const cidadeId = um(sp.cidade_id);
  const bairroId = um(sp.bairro_id);
  if (!tipoId && !cidadeId && !bairroId) return null;

  const repo = await getRepository();
  const [tipos, cidades] = await Promise.all([repo.listTipos(), repo.listCidades(portalId)]);
  const novos: Partial<BuscaFiltros> = { ...filtros, pagina: 1 };

  if (tipoId) novos.tipo = tipos.find((t) => t.id === tipoId)?.slug ?? filtros.tipo;
  if (cidadeId) novos.cidade = cidades.find((c) => c.id === cidadeId)?.slug ?? filtros.cidade;
  if (bairroId) {
    const bairros = await repo.listBairros({ portalId });
    const bairro = bairros.find((b) => b.id === bairroId);
    if (bairro) {
      novos.bairros = [bairro.slug];
      novos.cidade = cidades.find((c) => c.id === bairro.cidade_id)?.slug ?? novos.cidade;
    }
  }
  return linkBusca(novos);
}
