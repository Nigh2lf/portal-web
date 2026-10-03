import type { PortalRepository } from "./repository";
import type { Bairro, HomeDados, Portal, Publicidade } from "./types";
import {
  mapBairro,
  mapBairroMaisAnunciado,
  mapCidade,
  mapImovelResumo,
  mapInfra,
  mapPesquisaPopular,
  mapPortal,
  mapPublicidade,
  mapTipo,
  type ApiAd,
  type ApiBanner,
  type ApiCity,
  type ApiFeature,
  type ApiNeighborhood,
  type ApiPortal,
  type ApiPropertyCard,
  type ApiPropertyType,
  type ApiTopNeighborhood,
  type ApiTopSearch,
} from "./mappers";

/** Envelope padrão da API Django: `{success, status, message, data, error}`. */
export interface Envelope<T> {
  success: boolean;
  status: number;
  message: string;
  data: T;
  error: Record<string, string[]> | { detail?: string } | null;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public erros: Record<string, string[]> | null = null,
  ) {
    super(message);
  }
}

interface Catalogo {
  property_types: ApiPropertyType[];
  cities: ApiCity[];
  neighborhoods: ApiNeighborhood[];
  features: ApiFeature[];
}

const REVALIDATE_PORTAL = 300;
const REVALIDATE_HOME = 120;

/**
 * Repositório HTTP contra a API Django. Os métodos já migrados consultam a
 * API; os demais delegam ao `fallback` (mock) até os endpoints existirem,
 * traduzindo o id do portal da API para o id do mock pelo slug.
 */
export class HttpRepository implements PortalRepository {
  private portaisPorId = new Map<string, Portal>();
  private portaisPorSlug = new Map<string, Portal>();
  private catalogoPorSlug = new Map<string, Promise<Catalogo>>();

  constructor(
    private baseUrl: string,
    private fallback: PortalRepository,
  ) {}

  // ------------------------------------------------------------- transporte
  protected async request<T>(path: string, init: RequestInit & { token?: string; revalidate?: number } = {}): Promise<T> {
    const { token, revalidate, ...rest } = init;
    const headers = new Headers(rest.headers);
    headers.set("Accept", "application/json");
    if (rest.body && !(rest.body instanceof FormData)) headers.set("Content-Type", "application/json");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...rest,
      headers,
      next: revalidate !== undefined ? { revalidate } : undefined,
      cache: revalidate === undefined ? "no-store" : undefined,
    });
    const json = (await res.json().catch(() => null)) as Envelope<T> | null;
    if (!res.ok || !json?.success) {
      const erros = json?.error && !("detail" in json.error) ? (json.error as Record<string, string[]>) : null;
      throw new ApiError(res.status, json?.message ?? res.statusText, erros);
    }
    return json.data;
  }

  private lembrar(portal: Portal) {
    this.portaisPorId.set(portal.id, portal);
    this.portaisPorSlug.set(portal.slug, portal);
    return portal;
  }

  private async slugDoPortal(portalId: string) {
    const conhecido = this.portaisPorId.get(portalId);
    if (conhecido) return conhecido.slug;
    const todos = await this.listPortais();
    const achado = todos.find((p) => p.id === portalId);
    if (!achado) throw new ApiError(404, "Portal não encontrado.");
    return achado.slug;
  }

  /** Id equivalente no mock (mesmo slug), para os métodos ainda não migrados. */
  private async idNoFallback(portalId: string) {
    const slug = await this.slugDoPortal(portalId);
    const mock = await this.fallback.getPortalBySlug(slug);
    return mock?.id ?? portalId;
  }

  private catalogo(slug: string) {
    let p = this.catalogoPorSlug.get(slug);
    if (!p) {
      p = this.request<Catalogo>(`/public/portals/${slug}/catalog/`, { revalidate: REVALIDATE_HOME });
      this.catalogoPorSlug.set(slug, p);
      p.catch(() => this.catalogoPorSlug.delete(slug));
    }
    return p;
  }

  // ----------------------------------------------------------------- portal
  async getPortalByHost(host: string) {
    try {
      const p = await this.request<ApiPortal>(`/public/portals/by-host/?host=${encodeURIComponent(host)}`, { revalidate: REVALIDATE_PORTAL });
      return this.lembrar(mapPortal(p));
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  }

  async getPortalBySlug(slug: string) {
    try {
      const p = await this.request<ApiPortal>(`/public/portals/${slug}/`, { revalidate: REVALIDATE_PORTAL });
      return this.lembrar(mapPortal(p));
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  }

  async listPortais() {
    const lista = await this.request<Array<{ id: string; slug: string; name: string; domain: string }>>("/public/portals/", { revalidate: REVALIDATE_PORTAL });
    const completos = await Promise.all(lista.map((p) => this.portaisPorSlug.get(p.slug) ?? this.getPortalBySlug(p.slug)));
    return completos.filter((p): p is Portal => Boolean(p));
  }

  // -------------------------------------------------------------- catálogos
  async listCidades(portalId: string) {
    const slug = await this.slugDoPortal(portalId);
    return (await this.catalogo(slug)).cities.map(mapCidade);
  }

  async listBairros(opts: { cidadeId?: string; cidadeSlug?: string; portalId?: string; anuncianteId?: string; comImoveis?: boolean }): Promise<Bairro[]> {
    if (!opts.portalId) return this.fallback.listBairros(opts);
    const slug = await this.slugDoPortal(opts.portalId);
    const cat = await this.catalogo(slug);
    const cidade = opts.cidadeId ? cat.cities.find((c) => c.id === opts.cidadeId) : opts.cidadeSlug ? cat.cities.find((c) => c.slug === opts.cidadeSlug) : undefined;
    return cat.neighborhoods
      .filter((b) => !cidade || b.city === cidade.id)
      .filter((b) => !opts.comImoveis || (b.total ?? 0) > 0)
      .map(mapBairro);
  }

  async listTipos() {
    const slug = this.portaisPorSlug.keys().next().value ?? (await this.listPortais())[0]?.slug;
    if (!slug) return [];
    return (await this.catalogo(slug)).property_types.map(mapTipo);
  }

  async listInfraestruturas() {
    const slug = this.portaisPorSlug.keys().next().value ?? (await this.listPortais())[0]?.slug;
    if (!slug) return [];
    return (await this.catalogo(slug)).features.map(mapInfra);
  }

  // ------------------------------------------------------------------- home
  async getHome(portalId: string): Promise<HomeDados> {
    const slug = await this.slugDoPortal(portalId);
    const portal = this.portaisPorId.get(portalId) ?? (await this.getPortalBySlug(slug));
    const base = `/public/portals/${slug}`;
    const [destaques, buscas, bairros, banners, anuncios] = await Promise.all([
      this.request<ApiPropertyCard[]>(`${base}/featured-properties/?limit=12`, { revalidate: REVALIDATE_HOME }),
      this.request<ApiTopSearch[]>(`${base}/top-searches/?limit=15`, { revalidate: REVALIDATE_HOME }),
      this.request<ApiTopNeighborhood[]>(`${base}/top-neighborhoods/?limit=15`, { revalidate: REVALIDATE_HOME }),
      this.request<ApiBanner[]>(`${base}/banners/`, { revalidate: REVALIDATE_HOME }),
      this.request<ApiAd[]>(`${base}/ads/?page=HOME`, { revalidate: REVALIDATE_HOME }),
    ]);
    const cidadeId = portal?.cidade_principal_id ?? "";
    const comImagem = banners.filter((b) => b.home_image_url);
    const banner = comImagem.length ? comImagem[Math.floor(Math.random() * comImagem.length)] : null;
    const pubs = anuncios.map((a) => mapPublicidade(a, portalId));
    return {
      destaques: destaques.map(mapImovelResumo),
      mais_procurados: buscas.map(mapPesquisaPopular),
      bairros_mais_anunciados: bairros.map((b) => mapBairroMaisAnunciado(b, cidadeId)),
      total_imoveis: portal?.total_imoveis ?? 0,
      hero_imagem_url: banner?.home_image_url ?? "/portais/hero-padrao.jpg",
      banner_home: pubs.find((p) => p.categoria === "banner_home") ?? null,
      popup_home: pubs.find((p) => p.categoria === "popup_home") ?? null,
    };
  }

  async getPublicidade(portalId: string, categoria: Publicidade["categoria"]) {
    const slug = await this.slugDoPortal(portalId);
    const page = categoria === "banner_lista" ? "SEARCH" : categoria === "banner_detalhe" ? "PROPERTY" : "HOME";
    const kind = categoria === "popup_home" ? "POPUP" : "HORIZONTAL";
    const lista = await this.request<ApiAd[]>(`/public/portals/${slug}/ads/?page=${page}&kind=${kind}`, { revalidate: REVALIDATE_HOME });
    return lista.length ? mapPublicidade(lista[0]!, portalId) : null;
  }

  async getPesquisasPopulares(portalId: string, limite = 15) {
    const slug = await this.slugDoPortal(portalId);
    const lista = await this.request<ApiTopSearch[]>(`/public/portals/${slug}/top-searches/?limit=${limite}`, { revalidate: REVALIDATE_HOME });
    return lista.map(mapPesquisaPopular);
  }

  async registrarCliquePublicidade(publicidadeId: string) {
    const slug = this.portaisPorSlug.keys().next().value;
    if (!slug) return this.fallback.registrarCliquePublicidade(publicidadeId);
    try {
      const r = await this.request<{ link_url: string }>(`/public/portals/${slug}/ads/${publicidadeId}/click/`);
      return r.link_url || null;
    } catch {
      return null;
    }
  }

  // ---------------------------------------------- ainda no mock (fase 3)
  listPlanos = () => this.fallback.listPlanos();
  getTabelaPublicidade = () => this.fallback.getTabelaPublicidade();
  buscarImoveis: PortalRepository["buscarImoveis"] = async (portalId, f) => this.fallback.buscarImoveis(await this.idNoFallback(portalId), f);
  getImovel: PortalRepository["getImovel"] = async (portalId, s, o) => this.fallback.getImovel(await this.idNoFallback(portalId), s, o);
  listImoveisPorIds: PortalRepository["listImoveisPorIds"] = async (portalId, ids) => this.fallback.listImoveisPorIds(await this.idNoFallback(portalId), ids);
  listAnunciantes: PortalRepository["listAnunciantes"] = async (portalId) => this.fallback.listAnunciantes(await this.idNoFallback(portalId));
  getAnunciantePublico: PortalRepository["getAnunciantePublico"] = async (portalId, s) => this.fallback.getAnunciantePublico(await this.idNoFallback(portalId), s);
  listPosts = (p: number, pp?: number) => this.fallback.listPosts(p, pp);
  getPost = (s: string) => this.fallback.getPost(s);
  listDicas = () => this.fallback.listDicas();
  registrarClique: PortalRepository["registrarClique"] = (i) => this.fallback.registrarClique(i);
  enviarContato: PortalRepository["enviarContato"] = async (portalId, p) => this.fallback.enviarContato(await this.idNoFallback(portalId), p);
  contatarAnunciante: PortalRepository["contatarAnunciante"] = async (portalId, p) => this.fallback.contatarAnunciante(await this.idNoFallback(portalId), p);
  enviarEncomenda: PortalRepository["enviarEncomenda"] = async (portalId, p) => this.fallback.enviarEncomenda(await this.idNoFallback(portalId), p);
  enviarLeadSite: PortalRepository["enviarLeadSite"] = async (portalId, p) => this.fallback.enviarLeadSite(await this.idNoFallback(portalId), p);
  login: PortalRepository["login"] = (e, s) => this.fallback.login(e, s);
  cadastrar: PortalRepository["cadastrar"] = async (portalId, p) => this.fallback.cadastrar(await this.idNoFallback(portalId), p);
  recuperarSenha: PortalRepository["recuperarSenha"] = (e) => this.fallback.recuperarSenha(e);
  alterarSenha: PortalRepository["alterarSenha"] = (a, b, c) => this.fallback.alterarSenha(a, b, c);
  getSessaoPorAnunciante: PortalRepository["getSessaoPorAnunciante"] = (a) => this.fallback.getSessaoPorAnunciante(a);
  getAnunciante: PortalRepository["getAnunciante"] = (a) => this.fallback.getAnunciante(a);
  atualizarPerfil: PortalRepository["atualizarPerfil"] = (a, p) => this.fallback.atualizarPerfil(a, p);
  getUsoPlano: PortalRepository["getUsoPlano"] = (a) => this.fallback.getUsoPlano(a);
  listMeusImoveis: PortalRepository["listMeusImoveis"] = (a, f) => this.fallback.listMeusImoveis(a, f);
  getMeuImovel: PortalRepository["getMeuImovel"] = (a, i) => this.fallback.getMeuImovel(a, i);
  criarImovel: PortalRepository["criarImovel"] = (a, p) => this.fallback.criarImovel(a, p);
  atualizarImovel: PortalRepository["atualizarImovel"] = (a, i, p) => this.fallback.atualizarImovel(a, i, p);
  excluirImovel: PortalRepository["excluirImovel"] = (a, i) => this.fallback.excluirImovel(a, i);
  adicionarFotos: PortalRepository["adicionarFotos"] = (a, i, u) => this.fallback.adicionarFotos(a, i, u);
  removerFoto: PortalRepository["removerFoto"] = (a, i, f) => this.fallback.removerFoto(a, i, f);
  removerTodasFotos: PortalRepository["removerTodasFotos"] = (a, i) => this.fallback.removerTodasFotos(a, i);
  definirFotoPrincipal: PortalRepository["definirFotoPrincipal"] = (a, i, f) => this.fallback.definirFotoPrincipal(a, i, f);
  reordenarFotos: PortalRepository["reordenarFotos"] = (a, i, f) => this.fallback.reordenarFotos(a, i, f);
  listMensagens: PortalRepository["listMensagens"] = (a, o) => this.fallback.listMensagens(a, o);
  listEncomendasRecebidas: PortalRepository["listEncomendasRecebidas"] = (a) => this.fallback.listEncomendasRecebidas(a);
  getEstatisticasMensais: PortalRepository["getEstatisticasMensais"] = (a, m) => this.fallback.getEstatisticasMensais(a, m);
  getEstatisticasPeriodo: PortalRepository["getEstatisticasPeriodo"] = (a, i, f) => this.fallback.getEstatisticasPeriodo(a, i, f);
  getRelatorioImportacao: PortalRepository["getRelatorioImportacao"] = (a) => this.fallback.getRelatorioImportacao(a);
}
