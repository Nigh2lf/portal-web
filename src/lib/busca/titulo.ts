import type { BuscaFiltros } from "@/lib/api/types";
import { OBJETIVOS } from "./filtros";

interface Nomes {
  tipo?: string | null;
  cidade?: string | null;
  bairro?: string | null;
  cidadePadrao: string;
}

/** Título da página de busca, no padrão do legado: "Comprar Casa em Itaipava em Petrópolis". */
export function tituloBusca(f: Pick<BuscaFiltros, "objetivo">, n: Nomes) {
  const obj = OBJETIVOS.find((o) => o.valor === f.objetivo)!;
  const partes = [obj.label, n.tipo ?? "Imóveis"];
  if (n.bairro) partes.push(`em ${n.bairro}`);
  partes.push(`em ${n.cidade ?? n.cidadePadrao}`);
  return partes.join(" ");
}

export function descricaoBusca(titulo: string, total: number, portalNome: string) {
  return `${titulo}. ${total} imóveis encontrados no ${portalNome}. Casas, apartamentos, terrenos e sítios com fotos, preços e contato direto com o anunciante.`;
}
