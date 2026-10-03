/**
 * Converte o contrato da API Django (inglês) para os tipos do front
 * (`types.ts`, em português). Mantém as páginas iguais entre mock e API.
 */

import { OBJETIVOS, linkBusca } from "@/lib/busca/filtros";
import type {
  AnuncianteResumo,
  Bairro,
  BuscaFiltros,
  Cidade,
  ContatoPayload,
  Dica,
  EncomendaPayload,
  Imovel,
  ImovelResumo,
  ImovelTipo,
  Infraestrutura,
  LeadSitePayload,
  Objetivo,
  Paginado,
  PesquisaPopular,
  Plano,
  Portal,
  Post,
  Publicidade,
  TabelaPublicidade,
  TipoAnunciante,
} from "./types";

export interface ApiCity {
  id: string;
  name: string;
  slug: string;
  state_code: string;
}
export interface ApiNeighborhood {
  id: string;
  name: string;
  slug: string;
  city: string;
  city_slug: string;
  total?: number;
}
export interface ApiPropertyType {
  id: string;
  name: string;
  slug: string;
  is_residential: boolean;
}
export interface ApiFeature {
  id: string;
  name: string;
  slug: string;
  scope: "PROPERTY" | "CONDOMINIUM";
}
export interface ApiPortal {
  id: string;
  slug: string;
  name: string;
  domain: string;
  extra_domains: string[];
  main_city: ApiCity;
  cities: ApiCity[];
  combined_portals: string[];
  show_city_filter: boolean;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  about_text: string;
  facebook_url: string;
  instagram_url: string;
  ga4_measurement_id: string;
  recaptcha_site_key: string;
  logo_url: string | null;
  logo_mobile_url: string | null;
  og_image_url: string | null;
  primary_color: string;
  secondary_color: string;
  realtors_page_slug: string;
  results_per_page: number;
  menu_items: Array<{ label: string; path: string; sort_order: number }>;
  total_properties: number;
}
export interface ApiPropertyCard {
  id: string;
  reference_code: string;
  slug: string;
  title: string;
  is_featured: boolean;
  property_type_name: string;
  property_type_slug: string;
  city_name: string;
  city_slug: string;
  state_code: string;
  neighborhood_name: string | null;
  neighborhood_slug: string | null;
  bedrooms: number;
  suites: number;
  bathrooms: number;
  parking_spaces: number;
  built_area: string | number | null;
  total_area: string | number | null;
  sale_price: string | number | null;
  rent_price: string | number | null;
  seasonal_rent_price: string | number | null;
  cover_photo_url: string | null;
  photos_count: number;
  features: string[];
  description_excerpt: string;
  advertiser_name: string;
  advertiser_slug: string | null;
  advertiser_logo_url: string | null;
  updated_at: string;
}
export interface ApiTopSearch {
  purpose: "SALE" | "RENT" | "SEASONAL";
  property_type: { name: string; slug: string };
  city: { name: string; slug: string; state_code: string };
  neighborhood: { name: string; slug: string };
  total: number;
}
export interface ApiTopNeighborhood {
  neighborhood: { id: string; name: string; slug: string };
  city: { name: string; slug: string; state_code: string };
  total: number;
}
export interface ApiBanner {
  id: string;
  home_image_url: string | null;
  inner_image_url: string | null;
}
export interface ApiAd {
  id: string;
  name: string;
  image_url: string | null;
  link_url: string;
  open_in_new_tab: boolean;
  placement_code: string;
  placement_page: "HOME" | "SEARCH" | "PROPERTY";
  placement_kind: "POPUP" | "HORIZONTAL" | "SIDEBAR";
  starts_at: string;
  ends_at: string;
}

const PURPOSE_TO_OBJETIVO: Record<ApiTopSearch["purpose"], Objetivo> = { SALE: "comprar", RENT: "alugar", SEASONAL: "temporada" };

function numero(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

const LOGO_PLACEHOLDER = "/portais/placeholder-logo.svg";

export function mapCidade(c: ApiCity): Cidade {
  return { id: c.id, nome: c.name, uf: c.state_code, slug: c.slug };
}

export function mapBairro(b: ApiNeighborhood): Bairro {
  return { id: b.id, cidade_id: b.city, nome: b.name, slug: b.slug, total_imoveis: b.total ?? 0 };
}

export function mapTipo(t: ApiPropertyType): ImovelTipo {
  return { id: t.id, nome: t.name, slug: t.slug };
}

export function mapInfra(f: ApiFeature): Infraestrutura {
  return { id: f.id, nome: f.name, escopo: f.scope === "PROPERTY" ? "imovel" : "condominio" };
}

export function mapPortal(p: ApiPortal): Portal {
  const menu = [...p.menu_items].sort((a, b) => a.sort_order - b.sort_order).map((m) => ({ label: m.label, href: m.path }));
  return {
    id: p.id,
    slug: p.slug,
    nome: p.name,
    dominio: p.domain,
    dominios: [p.domain, ...(p.extra_domains ?? [])],
    cidade_principal_id: p.main_city.id,
    cidade_principal_nome: p.main_city.name,
    cidade_principal_uf: p.main_city.state_code,
    cidades_ids: p.cities.map((c) => c.id),
    portais_combinados_ids: p.combined_portals,
    exibir_cidade: p.show_city_filter,
    telefone: p.phone,
    whatsapp: p.whatsapp,
    endereco: p.address,
    email: p.email,
    titulo_padrao: p.seo_title || p.name,
    descricao_padrao: p.seo_description || p.name,
    keywords_padrao: p.seo_keywords,
    o_que_somos: p.about_text,
    facebook: p.facebook_url || null,
    instagram: p.instagram_url || null,
    ga4_id: p.ga4_measurement_id || null,
    recaptcha_site_key: p.recaptcha_site_key || null,
    logo_url: p.logo_url ?? LOGO_PLACEHOLDER,
    logo_largura: 503,
    logo_altura: 132,
    og_image_url: p.og_image_url ?? p.logo_url ?? LOGO_PLACEHOLDER,
    icones: null,
    slug_imobiliarias: p.realtors_page_slug,
    menu: menu.length ? menu : [{ label: "Início", href: "/" }, { label: "Imóveis", href: "/imoveis" }],
    cor_primaria: p.primary_color || "#204860",
    cor_secundaria: p.secondary_color || "#0078a8",
    total_imoveis: p.total_properties,
  };
}

export function mapImovelResumo(c: ApiPropertyCard): ImovelResumo {
  return {
    id: c.id,
    codigo: c.reference_code,
    slug: c.slug,
    titulo: c.title,
    anunciante_id: "",
    destaque: c.is_featured,
    tipo_nome: c.property_type_name,
    cidade_nome: c.city_name,
    bairro_nome: c.neighborhood_name ?? "",
    uf: c.state_code,
    quartos: c.bedrooms,
    suites: c.suites,
    banheiros: c.bathrooms,
    vagas: c.parking_spaces,
    area_construida: numero(c.built_area),
    area_total: numero(c.total_area),
    preco_venda: numero(c.sale_price),
    preco_locacao: numero(c.rent_price),
    preco_temporada: numero(c.seasonal_rent_price),
    foto_principal_url: c.cover_photo_url,
    infraestrutura: c.features ?? [],
    atualizado_em: c.updated_at,
    descricao_resumo: c.description_excerpt,
    anunciante_nome: c.advertiser_name,
    anunciante_logo_url: c.advertiser_logo_url,
    anunciante_slug: c.advertiser_slug,
    total_fotos: c.photos_count,
  };
}

export function mapPesquisaPopular(t: ApiTopSearch): PesquisaPopular {
  const objetivo = PURPOSE_TO_OBJETIVO[t.purpose] ?? "comprar";
  const obj = OBJETIVOS.find((o) => o.valor === objetivo)!;
  return {
    label: `${t.property_type.name} ${obj.labelTitulo} em ${t.neighborhood.name}, ${t.city.name} - ${t.city.state_code}`,
    href: linkBusca({ objetivo, tipo: t.property_type.slug, cidade: t.city.slug, bairro: t.neighborhood.slug }),
    total: t.total,
  };
}

export function mapBairroMaisAnunciado(t: ApiTopNeighborhood, cidadeId: string): { bairro: Bairro; cidade: Cidade; href: string } {
  return {
    bairro: { id: t.neighborhood.id, cidade_id: cidadeId, nome: t.neighborhood.name, slug: t.neighborhood.slug, total_imoveis: t.total },
    cidade: { id: cidadeId, nome: t.city.name, uf: t.city.state_code, slug: t.city.slug },
    href: linkBusca({ cidade: t.city.slug, bairro: t.neighborhood.slug }),
  };
}

export function mapPublicidade(a: ApiAd, portalId: string): Publicidade {
  const categoria: Publicidade["categoria"] =
    a.placement_kind === "POPUP" ? "popup_home" : a.placement_page === "SEARCH" ? "banner_lista" : a.placement_page === "PROPERTY" ? "banner_detalhe" : "banner_home";
  return {
    id: a.id,
    portal_id: portalId,
    nome: a.name,
    imagem_url: a.image_url ?? "",
    link: a.link_url,
    nova_aba: a.open_in_new_tab,
    categoria,
    inicio: a.starts_at,
    fim: a.ends_at,
    ativo: true,
  };
}

// ---------------------------------------------------------------------------
// Busca, detalhe, anunciantes
// ---------------------------------------------------------------------------

export interface ApiRef {
  name: string;
  slug: string;
  state_code?: string;
  id?: string;
}
export interface ApiSearchResult {
  results: ApiPropertyCard[];
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  counters: { sale: number; rent: number; seasonal: number };
  max_price: string | number;
  applied: { property_type: ApiRef | null; city: ApiRef | null; neighborhood: ApiRef | null };
}
export interface ApiAdvertiser {
  id: string;
  slug: string;
  type: "OWNER" | "BROKER" | "AGENCY";
  name: string;
  creci: string;
  logo_url: string | null;
  phone: string;
  phone_secondary: string;
  whatsapp: string;
  email: string;
  website: string;
  address: string;
  has_hotsite: boolean;
  hotsite_slug: string | null;
  total_properties: number;
  total_sale: number;
  total_rent: number;
  total_seasonal: number;
}
export interface ApiPropertyDetail {
  id: string;
  reference_code: string;
  slug: string;
  title: string;
  is_featured: boolean;
  property_type: { id: string; name: string; slug: string };
  city: { id: string; name: string; slug: string; state_code: string };
  neighborhood: { id: string; name: string; slug: string } | null;
  neighborhood_name: string | null;
  state_code: string;
  is_in_condominium: boolean;
  bedrooms: number;
  suites: number;
  bathrooms: number;
  parking_spaces: number;
  built_area: string | number | null;
  total_area: string | number | null;
  description: string;
  features: string[];
  condominium_features: string[];
  fees: Array<{ description: string; amount: string | number; period: string; notes: string }>;
  sale_price: string | number | null;
  rent_price: string | number | null;
  seasonal_rent_price: string | number | null;
  photos: Array<{ id: string; url: string | null; thumbnail_url: string | null; sort_order: number; is_cover: boolean }>;
  advertiser: ApiAdvertiser;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}
export interface ApiRelatedLink {
  purpose: "SALE" | "RENT" | "SEASONAL";
  property_type: ApiRef;
  city: ApiRef;
  neighborhood: ApiRef | null;
}

const TYPE_TO_TIPO: Record<ApiAdvertiser["type"], TipoAnunciante> = { OWNER: "proprietario", BROKER: "corretor", AGENCY: "imobiliaria" };
const PERIOD_LABEL: Record<string, string> = { MONTHLY: "mensal", YEARLY: "anual", ONE_TIME: "única" };

export function mapAnuncianteResumo(a: ApiAdvertiser): AnuncianteResumo {
  return {
    id: a.id,
    slug: a.slug,
    tipo: TYPE_TO_TIPO[a.type] ?? "imobiliaria",
    nome: a.name,
    logo_url: a.logo_url,
    creci: a.creci || null,
    telefone: a.phone,
    telefone2: a.phone_secondary || null,
    whatsapp: a.whatsapp || null,
    endereco: a.address || null,
    email: a.email,
    site: a.website || null,
    hotsite: a.has_hotsite,
    total_imoveis: a.total_properties,
    totais_por_objetivo: { comprar: a.total_sale, alugar: a.total_rent, temporada: a.total_seasonal },
  };
}

export function mapImovel(p: ApiPropertyDetail, portalId: string): Imovel {
  const fotos = [...p.photos]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((f) => ({ id: f.id, url: f.url ?? f.thumbnail_url ?? "", mini_url: f.thumbnail_url ?? f.url ?? "", ordem: f.sort_order, principal: f.is_cover }));
  const capa = fotos.find((f) => f.principal) ?? fotos[0];
  return {
    id: p.id,
    codigo: p.reference_code,
    slug: p.slug,
    titulo: p.title,
    anunciante_id: p.advertiser.id,
    portal_id: portalId,
    ativo: true,
    destaque: p.is_featured,
    status: "publicado",
    tipo_id: p.property_type.id,
    tipo_nome: p.property_type.name,
    cidade_id: p.city.id,
    cidade_nome: p.city.name,
    bairro_id: p.neighborhood?.id ?? "",
    bairro_nome: p.neighborhood?.name ?? p.neighborhood_name ?? "",
    uf: p.state_code,
    quartos: p.bedrooms,
    suites: p.suites,
    banheiros: p.bathrooms,
    vagas: p.parking_spaces,
    area_construida: numero(p.built_area),
    area_total: numero(p.total_area),
    descricao: p.description,
    infraestrutura: p.features,
    infra_condominio: p.condominium_features,
    dentro_condominio: p.is_in_condominium,
    taxas: p.fees.map((f) => ({ descricao: f.description, valor: numero(f.amount) ?? 0, observacao: [PERIOD_LABEL[f.period], f.notes].filter(Boolean).join(" · ") || null })),
    preco_venda: numero(p.sale_price),
    preco_locacao: numero(p.rent_price),
    preco_temporada: numero(p.seasonal_rent_price),
    fotos,
    foto_principal_url: capa?.mini_url ?? null,
    visualizacoes: 0,
    criado_em: p.created_at,
    atualizado_em: p.updated_at,
  };
}

export function mapLinkRelacionado(l: ApiRelatedLink): PesquisaPopular {
  const objetivo = PURPOSE_TO_OBJETIVO[l.purpose] ?? "comprar";
  const obj = OBJETIVOS.find((o) => o.valor === objetivo)!;
  const local = l.neighborhood ? l.neighborhood.name : l.city.name;
  return {
    label: `${obj.label} ${l.property_type.name} em ${local}`,
    href: linkBusca({ objetivo, tipo: l.property_type.slug, cidade: l.city.slug, bairro: l.neighborhood?.slug }),
    total: 0,
  };
}

const OBJETIVO_TO_PURPOSE: Record<Objetivo, "SALE" | "RENT" | "SEASONAL"> = { comprar: "SALE", alugar: "RENT", temporada: "SEASONAL" };
const ORDENACAO_TO_ORDERING: Record<string, string> = { recentes: "recent", menor_preco: "price_asc", maior_preco: "price_desc" };

export function filtrosParaApi(f: BuscaFiltros, anuncianteSlug?: string) {
  const q = new URLSearchParams();
  q.set("purpose", OBJETIVO_TO_PURPOSE[f.objetivo]);
  if (f.tipo) q.set("property_type", f.tipo);
  if (f.cidade) q.set("city", f.cidade);
  if (f.bairro) q.set("neighborhood", f.bairro);
  if (f.condominio) q.set("condominium", f.condominio === "dentro" ? "inside" : "outside");
  if (f.quartos?.length) q.set("bedrooms", f.quartos.join(","));
  if (f.vagas) q.set("parking", String(f.vagas));
  if (f.valor_min) q.set("price_min", String(f.valor_min));
  if (f.valor_max) q.set("price_max", String(f.valor_max));
  if (f.codigo) q.set("code", f.codigo);
  const anunciante = anuncianteSlug ?? f.anunciante;
  if (anunciante) q.set("advertiser", anunciante);
  q.set("ordering", ORDENACAO_TO_ORDERING[f.ordenacao] ?? "recent");
  q.set("page", String(f.pagina));
  q.set("page_size", String(f.por_pagina));
  return q.toString();
}

// ---------------------------------------------------------------------------
// Conteúdo (blog, dicas), planos, tabela de publicidade e formulários públicos
// ---------------------------------------------------------------------------

export interface ApiPaginado<T> {
  count: number;
  total_pages: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
export interface ApiPostCard {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  author_name: string;
  cover_image_url: string | null;
  published_at: string | null;
}
export interface ApiPostDetail extends ApiPostCard {
  body: string;
  portal: string | null;
}
export interface ApiTip {
  id: string;
  title: string;
  body: string;
  sort_order: number;
}
export interface ApiPlan {
  id: string;
  slug: string;
  name: string;
  monthly_price: string | number | null;
  property_limit: number;
  photo_limit: number;
  featured_limit: number;
  has_realtor_page: boolean;
  receives_property_requests: boolean;
  has_hotsite: boolean;
  is_recommended: boolean;
  is_owner_only: boolean;
  sort_order: number;
}
export interface ApiAdPlacement {
  code: string;
  name: string;
  page: "HOME" | "SEARCH" | "PROPERTY";
  kind: "POPUP" | "HORIZONTAL" | "SIDEBAR";
  width: number;
  height: number;
  monthly_price: string | number | null;
  notes: string;
}

const HERO_PADRAO = "/portais/hero-padrao.jpg";
const PLACEMENT_PAGE_LABEL: Record<ApiAdPlacement["page"], string> = { HOME: "Home", SEARCH: "Lista de imóveis", PROPERTY: "Detalhe do imóvel" };
const PLACEMENT_KIND_LABEL: Record<ApiAdPlacement["kind"], string> = { POPUP: "Pop-up", HORIZONTAL: "Banner horizontal", SIDEBAR: "Banner lateral" };
const RECURSO_TO_FUNDING: Record<NonNullable<EncomendaPayload["recurso"]>, string> = { financiamento: "FINANCING", a_vista: "CASH", fgts: "FGTS", permuta: "EXCHANGE" };

export function mapPaginado<T, U>(r: ApiPaginado<T>, map: (item: T) => U): Paginado<U> {
  return { resultados: r.results.map(map), total: r.count, pagina: r.page, por_pagina: r.page_size, total_paginas: r.total_pages };
}

export function mapPost(p: ApiPostCard | ApiPostDetail): Post {
  return {
    id: p.id,
    slug: p.slug,
    titulo: p.title,
    resumo: p.excerpt,
    conteudo_html: "body" in p ? p.body : "",
    autor: p.author_name,
    imagem_url: p.cover_image_url ?? HERO_PADRAO,
    publicado_em: p.published_at ?? "",
  };
}

export function mapDica(t: ApiTip): Dica {
  return { id: t.id, titulo: t.title, descricao_html: t.body, ativo: true };
}

export function mapPlano(p: ApiPlan): Plano {
  return {
    id: p.id,
    slug: p.slug,
    nome: p.name,
    preco_mensal: numero(p.monthly_price),
    imoveis: p.property_limit,
    fotos: p.photo_limit,
    destaques: p.featured_limit,
    pagina_imobiliaria: p.has_realtor_page,
    encomenda: p.receives_property_requests,
    hotsite: p.has_hotsite,
    recomendado: p.is_recommended,
    exclusivo_proprietario: p.is_owner_only,
  };
}

export function mapTabelaPublicidade(a: ApiAdPlacement): TabelaPublicidade {
  return {
    codigo: a.code,
    pagina: PLACEMENT_PAGE_LABEL[a.page] ?? a.page,
    tipo: PLACEMENT_KIND_LABEL[a.kind] ?? a.kind,
    tamanho: `${a.width}x${a.height}`,
    observacao: a.notes ?? "",
    preco_mensal: Number(a.monthly_price) || 0,
  };
}

/** Corpo de `POST .../contact-messages/`. */
export function contatoParaApi(p: ContatoPayload) {
  return { name: p.nome, email: p.email, phone: p.telefone, subject: p.assunto, message: p.mensagem, recaptcha_token: p.recaptcha_token };
}

/** Corpo de `POST .../property-requests/`. */
export function encomendaParaApi(p: EncomendaPayload) {
  return {
    name: p.nome,
    email: p.email,
    phone: p.telefone,
    purpose: OBJETIVO_TO_PURPOSE[p.objetivo],
    property_type: p.tipo_id || null,
    city: p.cidade_id || null,
    neighborhood: p.bairro_id || null,
    min_price: p.valor_min,
    max_price: p.valor_max,
    is_in_condominium: p.dentro_condominio,
    funding: p.recurso ? RECURSO_TO_FUNDING[p.recurso] : "",
    message: p.mensagem,
    is_partner_broadcast: p.parceiro,
  };
}

/** Corpo de `POST .../advertiser-leads/`. */
export function leadSiteParaApi(p: LeadSitePayload) {
  return { name: p.nome, email: p.email, phone: p.telefone, company: p.imobiliaria, message: p.mensagem ?? "" };
}

/** Nomes de campo da API → nomes dos formulários (pt-BR), para exibir erros 400 no campo certo. */
export const CAMPOS_CONTATO: Record<string, string> = { name: "nome", email: "email", phone: "telefone", subject: "assunto", message: "mensagem" };
export const CAMPOS_ENCOMENDA: Record<string, string> = {
  name: "nome",
  email: "email",
  phone: "telefone",
  purpose: "objetivo",
  property_type: "tipo_id",
  city: "cidade_id",
  neighborhood: "bairro_id",
  min_price: "valor_min",
  max_price: "valor_max",
  is_in_condominium: "condominio",
  funding: "recurso",
  message: "mensagem",
  is_partner_broadcast: "parceiro",
};
export const CAMPOS_LEAD_SITE: Record<string, string> = { name: "nome", email: "email", phone: "telefone", company: "imobiliaria", message: "mensagem" };

export function traduzirErros(erros: Record<string, string[]> | null | undefined, campos: Record<string, string>) {
  if (!erros) return undefined;
  const out: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(erros)) out[campos[k] ?? k] = v;
  return out;
}
