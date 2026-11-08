import type { BuscaFiltros } from "@/lib/api/types";
import { OBJETIVOS } from "./filtros";

interface Nomes {
  tipos?: string[];
  cidade?: string | null;
  bairros?: string[];
  cidadePadrao: string;
}

/** "Centro", "Centro e Bingen", "Centro, Bingen e Itaipava". */
function juntarNomes(nomes: string[]) {
  if (nomes.length <= 1) return nomes[0] ?? "";
  return `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`;
}

/** Até 3 bairros por nome; acima disso, "5 bairros". */
export function nomesBairros(nomes: string[]) {
  if (nomes.length > 3) return `${nomes.length} bairros`;
  return juntarNomes(nomes);
}

/** "Casa", "Casa e Apartamento", "Casa, Apartamento e Terreno"; nenhum ou mais de 3, "Imóveis". */
export function nomesTipos(nomes: string[]) {
  if (!nomes.length || nomes.length > 3) return "Imóveis";
  return juntarNomes(nomes);
}

/** Título da página de busca, no padrão do legado: "Comprar Casa em Itaipava em Petrópolis". */
export function tituloBusca(f: Pick<BuscaFiltros, "objetivo">, n: Nomes) {
  const obj = OBJETIVOS.find((o) => o.valor === f.objetivo)!;
  const partes = [obj.label, nomesTipos(n.tipos ?? [])];
  if (n.bairros?.length) partes.push(`em ${nomesBairros(n.bairros)}`);
  partes.push(`em ${n.cidade ?? n.cidadePadrao}`);
  return partes.join(" ");
}

export function descricaoBusca(titulo: string, total: number, portalNome: string) {
  return `${titulo}. ${total} imóveis encontrados no ${portalNome}. Casas, apartamentos, terrenos e sítios com fotos, preços e contato direto com o anunciante.`;
}
