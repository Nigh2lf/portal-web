import type { Imovel, Objetivo, PreferenciaContato } from "@/lib/api/types";
import type { FiltrosMeusImoveis } from "@/lib/api/repository";

export type SearchParamsLike = Record<string, string | string[] | undefined>;

export function um(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  return s ? s : undefined;
}

export function paginaDe(sp: SearchParamsLike) {
  const n = Number(um(sp.pagina));
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

// ---------------------------------------------------------------- datas
const TZ = "America/Sao_Paulo";

/** Data "YYYY-MM-DD" no fuso do portal. */
export function dataISO(d: Date = new Date()) {
  const partes = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(d);
  const pega = (t: string) => partes.find((p) => p.type === t)?.value ?? "";
  return `${pega("year")}-${pega("month")}-${pega("day")}`;
}

export function hojeISO() {
  return dataISO();
}

export function diasAtrasISO(dias: number) {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return dataISO(d);
}

export function inicioDoMesISO(deslocMeses = 0) {
  const [ano, mes] = hojeISO().split("-").map(Number) as [number, number, number];
  const d = new Date(Date.UTC(ano, mes - 1 + deslocMeses, 1));
  return d.toISOString().slice(0, 10);
}

export function fimDoMesISO(deslocMeses = 0) {
  const [ano, mes] = hojeISO().split("-").map(Number) as [number, number, number];
  const d = new Date(Date.UTC(ano, mes + deslocMeses, 0));
  return d.toISOString().slice(0, 10);
}

const RE_DATA = /^\d{4}-\d{2}-\d{2}$/;
export function dataValida(v: string | undefined): string | undefined {
  if (!v || !RE_DATA.test(v)) return undefined;
  const d = new Date(`${v}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? undefined : v;
}

/** Período (inicio, fim) lido da URL com padrão; garante inicio <= fim. */
export function periodoDe(sp: SearchParamsLike, padrao: { inicio: string; fim: string }) {
  let inicio = dataValida(um(sp.inicio)) ?? padrao.inicio;
  let fim = dataValida(um(sp.fim)) ?? padrao.fim;
  if (inicio > fim) [inicio, fim] = [fim, inicio];
  return { inicio, fim };
}

export function formatarDataCurta(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: TZ }).format(new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso));
}

export function formatarDataHora(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: TZ }).format(new Date(iso));
}

export function formatarMesCurto(anoMes: string) {
  const [ano, mes] = anoMes.split("-").map(Number) as [number, number];
  return new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit", timeZone: "UTC" }).format(new Date(Date.UTC(ano, mes - 1, 1))).replace(".", "");
}

// ---------------------------------------------------------------- imóveis
export const POR_PAGINA_PAINEL = 12;

export const STATUS_IMOVEL = ["ativo", "inativo", "rascunho"] as const;
export type StatusImovel = (typeof STATUS_IMOVEL)[number];

export function filtrosMeusImoveisDe(sp: SearchParamsLike): FiltrosMeusImoveis {
  const objetivo = um(sp.objetivo);
  const status = um(sp.status);
  return {
    busca: um(sp.busca)?.slice(0, 80),
    objetivo: objetivo && ["comprar", "alugar", "temporada"].includes(objetivo) ? (objetivo as Objetivo) : undefined,
    status: status && (STATUS_IMOVEL as readonly string[]).includes(status) ? (status as StatusImovel) : undefined,
    tipo: um(sp.tipo),
    cidade: um(sp.cidade),
    pagina: paginaDe(sp),
    por_pagina: POR_PAGINA_PAINEL,
  };
}

export function queryDe(params: Record<string, string | number | undefined | null>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

export function statusDoImovel(i: Pick<Imovel, "ativo" | "status">): StatusImovel {
  if (i.status === "rascunho") return "rascunho";
  return i.ativo ? "ativo" : "inativo";
}

export function linkPreview(i: Pick<Imovel, "slug">) {
  return `/imovel/${i.slug}?preview=1`;
}

/** Ids `legado-123` vêm dos redirects do site antigo e não existem na API nova. */
export function ehIdLegado(id: string) {
  return /^legado-\d+$/i.test(id);
}

export const PREFERENCIAS_LABEL: Record<PreferenciaContato, string> = {
  whatsapp: "WhatsApp",
  telefone: "Telefone",
  email: "E-mail",
};

export const OBJETIVO_LABEL: Record<Objetivo, string> = {
  comprar: "Comprar",
  alugar: "Alugar",
  temporada: "Temporada",
};

export const RECURSO_LABEL = {
  financiamento: "Financiamento",
  a_vista: "À vista",
  fgts: "FGTS",
  permuta: "Permuta",
} as const;

export function porcentagem(parte: number, total: number) {
  if (!total) return 0;
  return Math.min(100, Math.round((parte / total) * 100));
}
