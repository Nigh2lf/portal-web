/**
 * Converte o contrato da API Django (inglês) para os tipos do front
 * (`types.ts`, em português). Mantém as páginas iguais entre mock e API.
 */

import { OBJETIVOS, linkBusca } from "@/lib/busca/filtros";
import type { Bairro, Cidade, ImovelResumo, ImovelTipo, Infraestrutura, Objetivo, PesquisaPopular, Portal, Publicidade } from "./types";

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
