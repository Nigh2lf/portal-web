import type { BuscaFiltros, Objetivo, Ordenacao } from "@/lib/api/types";

export const OBJETIVOS: Array<{ valor: Objetivo; label: string; labelTitulo: string; labelCurto: string }> = [
  { valor: "comprar", label: "Comprar", labelTitulo: "à venda", labelCurto: "Venda" },
  { valor: "alugar", label: "Alugar", labelTitulo: "para alugar", labelCurto: "Aluguel" },
  { valor: "temporada", label: "Temporada", labelTitulo: "para temporada", labelCurto: "Temporada" },
];

export const ORDENACOES: Array<{ valor: Ordenacao; label: string }> = [
  { valor: "recentes", label: "Mais recentes" },
  { valor: "menor_preco", label: "Menor preço" },
  { valor: "maior_preco", label: "Maior preço" },
];

export const POR_PAGINA = 30;

export type SearchParamsLike = Record<string, string | string[] | undefined>;

function um(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

/** `?bairro=a,b` ou `?bairro=a&bairro=b`, sem repetidos. */
function lista(v: string | string[] | undefined) {
  const partes = (Array.isArray(v) ? v : v ? [v] : [])
    .flatMap((x) => x.split(","))
    .map((x) => x.trim())
    .filter(Boolean);
  return [...new Set(partes)].slice(0, 20);
}

function numero(v: string | undefined) {
  if (!v) return undefined;
  const n = Number(v.replace(/\D/g, ""));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/** `?quartos=1,2,6` → [1, 2, 4]: acima de 4 vira "4+" (links antigos com `vagas=6`). */
function contagens(v: string | string[] | undefined) {
  const valores = (Array.isArray(v) ? v : v ? v.split(",") : [])
    .map(Number)
    .filter((n) => Number.isInteger(n) && n >= 1)
    .map((n) => Math.min(n, 4));
  return [...new Set(valores)].sort();
}

/** Converte `searchParams` (e segmentos de rota) nos filtros tipados da busca. */
export function parseFiltros(sp: SearchParamsLike, segmentos: Partial<BuscaFiltros> = {}): BuscaFiltros {
  const objetivo = (um(sp.objetivo) as Objetivo) || segmentos.objetivo || "comprar";
  const quartos = contagens(sp.quartos);
  const vagas = contagens(sp.vagas);
  const condominio = um(sp.condominio);
  const tipos = lista(sp.tipo);
  const bairros = lista(sp.bairro);
  return {
    objetivo: OBJETIVOS.some((o) => o.valor === objetivo) ? objetivo : "comprar",
    tipos: tipos.length ? tipos : segmentos.tipos,
    cidade: um(sp.cidade) || segmentos.cidade,
    bairros: bairros.length ? bairros : segmentos.bairros,
    condominio: condominio === "dentro" || condominio === "fora" ? condominio : undefined,
    quartos: quartos.length ? quartos : undefined,
    vagas: vagas.length ? vagas : undefined,
    valor_min: numero(um(sp.valor_min)),
    valor_max: numero(um(sp.valor_max)),
    area_min: numero(um(sp.area_min)),
    area_max: numero(um(sp.area_max)),
    codigo: um(sp.codigo)?.trim() || undefined,
    anunciante: um(sp.anunciante) || segmentos.anunciante,
    ordenacao: (ORDENACOES.some((o) => o.valor === um(sp.ordenacao))
      ? um(sp.ordenacao)
      : "recentes") as Ordenacao,
    pagina: Math.max(1, numero(um(sp.pagina)) ?? 1),
    por_pagina: POR_PAGINA,
  };
}

/** Gera a query string de uma busca, omitindo valores padrão. */
export function filtrosParaQuery(f: Partial<BuscaFiltros>): string {
  const q = new URLSearchParams();
  if (f.objetivo && f.objetivo !== "comprar") q.set("objetivo", f.objetivo);
  if (f.tipos?.length) q.set("tipo", f.tipos.join(","));
  if (f.cidade) q.set("cidade", f.cidade);
  if (f.bairros?.length) q.set("bairro", f.bairros.join(","));
  if (f.condominio) q.set("condominio", f.condominio);
  if (f.quartos?.length) q.set("quartos", f.quartos.join(","));
  if (f.vagas?.length) q.set("vagas", f.vagas.join(","));
  if (f.valor_min) q.set("valor_min", String(f.valor_min));
  if (f.valor_max) q.set("valor_max", String(f.valor_max));
  if (f.area_min) q.set("area_min", String(f.area_min));
  if (f.area_max) q.set("area_max", String(f.area_max));
  if (f.codigo) q.set("codigo", f.codigo);
  if (f.anunciante) q.set("anunciante", f.anunciante);
  if (f.ordenacao && f.ordenacao !== "recentes") q.set("ordenacao", f.ordenacao);
  if (f.pagina && f.pagina > 1) q.set("pagina", String(f.pagina));
  const s = q.toString();
  return s ? `?${s}` : "";
}

export function linkBusca(f: Partial<BuscaFiltros>, base = "/imoveis") {
  return `${base}${filtrosParaQuery(f)}`;
}

/** Degraus do slider de preço (não linear, como no legado). */
export function degrausPreco(objetivo: Objetivo, maximo: number) {
  if (objetivo === "comprar") {
    const base = [
      0, 100000, 200000, 300000, 400000, 500000, 650000, 800000, 1000000, 1500000, 2000000, 3000000, 5000000,
      10000000,
    ];
    return base.filter((v) => v <= Math.max(maximo, 1000000)).concat(maximo > 10000000 ? [maximo] : []);
  }
  if (objetivo === "alugar")
    return [0, 500, 1000, 1500, 2000, 3000, 4000, 5000, 7500, 10000, 15000, 20000, 30000];
  return [0, 200, 400, 600, 800, 1000, 1500, 2000, 3000, 5000, 10000];
}
