import type { ImovelDetalhe, PortalRepository } from "./repository";
import type { Bairro, BuscaFiltros, BuscaResultado, Dica, HomeDados, Paginado, Plano, Portal, Post, Publicidade, ResultadoAcao, SessaoUsuario, TabelaPublicidade } from "./types";
import { descricaoBusca, tituloBusca } from "@/lib/busca/titulo";
import { getAccessToken, hashSenha } from "@/lib/auth/session";
import {
  CAMPOS_CONTATO,
  CAMPOS_ENCOMENDA,
  CAMPOS_LEAD_SITE,
  contatoParaApi,
  encomendaParaApi,
  filtrosParaApi,
  leadSiteParaApi,
  mapAnuncianteResumo,
  mapBairro,
  mapBairroMaisAnunciado,
  mapCidade,
  mapDica,
  mapImovel,
  mapImovelResumo,
  mapInfra,
  mapLinkRelacionado,
  mapPaginado,
  mapPesquisaPopular,
  mapPlano,
  mapPortal,
  mapPost,
  mapPublicidade,
  mapTabelaPublicidade,
  mapTipo,
  traduzirErros,
  type ApiAd,
  type ApiAdPlacement,
  type ApiAdvertiser,
  type ApiBanner,
  type ApiCity,
  type ApiFeature,
  type ApiNeighborhood,
  type ApiPaginado,
  type ApiPlan,
  type ApiPortal,
  type ApiPostCard,
  type ApiPostDetail,
  type ApiPropertyCard,
  type ApiPropertyDetail,
  type ApiPropertyType,
  type ApiRelatedLink,
  type ApiSearchResult,
  type ApiTip,
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

  // -------------------------------------------------- busca, detalhe, favoritos
  async buscarImoveis(portalId: string, f: BuscaFiltros): Promise<BuscaResultado> {
    const slug = await this.slugDoPortal(portalId);
    const portal = this.portaisPorId.get(portalId) ?? (await this.getPortalBySlug(slug));
    const r = await this.request<ApiSearchResult>(`/public/portals/${slug}/properties/?${filtrosParaApi(f)}`);
    const titulo = tituloBusca(f, {
      tipo: r.applied.property_type?.name,
      cidade: r.applied.city?.name,
      bairro: r.applied.neighborhood?.name,
      cidadePadrao: portal?.cidade_principal_nome ?? "",
    });
    return {
      resultados: r.results.map(mapImovelResumo),
      total: r.count,
      pagina: r.page,
      por_pagina: r.page_size,
      total_paginas: r.total_pages,
      contadores: { comprar: r.counters.sale, alugar: r.counters.rent, temporada: r.counters.seasonal },
      valor_maximo: Number(r.max_price) || 0,
      titulo,
      descricao_seo: descricaoBusca(titulo, r.count, portal?.nome ?? ""),
    };
  }

  async getImovel(portalId: string, slugOuId: string): Promise<ImovelDetalhe | null> {
    const slug = await this.slugDoPortal(portalId);
    try {
      const r = await this.request<{ property: ApiPropertyDetail; related: ApiPropertyCard[]; related_links: ApiRelatedLink[] }>(
        `/public/portals/${slug}/properties/${encodeURIComponent(slugOuId)}/`,
      );
      return {
        imovel: mapImovel(r.property, portalId),
        anunciante: mapAnuncianteResumo(r.property.advertiser),
        relacionados: r.related.map(mapImovelResumo),
        links_relacionados: r.related_links.map(mapLinkRelacionado),
      };
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  }

  async listImoveisPorIds(portalId: string, ids: string[]) {
    if (!ids.length) return [];
    const slug = await this.slugDoPortal(portalId);
    const r = await this.request<ApiPropertyCard[]>(`/public/portals/${slug}/properties/by-ids/?ids=${encodeURIComponent(ids.join(","))}`);
    return r.map(mapImovelResumo);
  }

  async listAnunciantes(portalId: string) {
    const slug = await this.slugDoPortal(portalId);
    const r = await this.request<{ agencies: ApiAdvertiser[]; brokers: ApiAdvertiser[] }>(`/public/portals/${slug}/advertisers/`);
    return { imobiliarias: r.agencies.map(mapAnuncianteResumo), corretores: r.brokers.map(mapAnuncianteResumo) };
  }

  async getAnunciantePublico(portalId: string, anuncianteSlug: string) {
    const slug = await this.slugDoPortal(portalId);
    try {
      const r = await this.request<ApiAdvertiser>(`/public/portals/${slug}/advertisers/${anuncianteSlug}/`);
      return mapAnuncianteResumo(r);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  }

  async registrarClique(input: { imovelId?: string; anuncianteId: string; tipo: "telefone" | "whatsapp" }) {
    const slug = this.portaisPorSlug.keys().next().value ?? (await this.listPortais())[0]?.slug;
    if (!slug) return;
    await this.request(`/public/portals/${slug}/properties/contact-clicks/`, {
      method: "POST",
      body: JSON.stringify({ property: input.imovelId ?? null, advertiser: input.anuncianteId || null, channel: input.tipo === "whatsapp" ? "WHATSAPP" : "PHONE" }),
    }).catch(() => undefined);
  }

  contatarAnunciante: PortalRepository["contatarAnunciante"] = async (portalId, p) => {
    const slug = await this.slugDoPortal(portalId);
    const pref = p.preferencias.map((x) => (x === "whatsapp" ? "WHATSAPP" : x === "telefone" ? "PHONE" : "EMAIL"));
    try {
      await this.request(`/public/portals/${slug}/properties/inquiries/`, {
        method: "POST",
        body: JSON.stringify({ property: p.imovel_id, name: p.nome, email: p.email, phone: p.telefone, message: p.mensagem, contact_preferences: pref, recaptcha_token: p.recaptcha_token }),
      });
      return { ok: true, mensagem: "Sua mensagem foi enviada ao anunciante." };
    } catch (e) {
      if (e instanceof ApiError) return { ok: false, mensagem: e.status === 403 ? "Não foi possível enviar sua mensagem." : e.message, erros: e.erros ?? undefined };
      throw e;
    }
  };

  // ---------------------------------------------------------------- sessão
  /** Chamada autenticada da área do anunciante com o access token dos cookies. */
  protected async requestAuth<T>(path: string, init: RequestInit & { revalidate?: number } = {}): Promise<T> {
    const token = await getAccessToken();
    if (!token) throw new ApiError(401, "Sessão expirada.");
    return this.request<T>(path, { ...init, token });
  }

  private sessaoDe(me: ApiMe, tokens?: { access: string; refresh: string }): SessaoUsuario {
    return {
      anunciante_id: me.advertiser_id,
      nome: me.name,
      email: me.email,
      tipo: me.type === "OWNER" ? "proprietario" : me.type === "BROKER" ? "corretor" : "imobiliaria",
      plano_id: me.plan?.id ?? "",
      carga_automatica: Boolean(me.has_automatic_import),
      tokens,
    };
  }

  async login(email: string, senha: string): Promise<ResultadoAcao<SessaoUsuario>> {
    try {
      const tokens = await this.request<{ access: string; refresh: string }>("/auth/login/", {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase(), password: hashSenha(senha) }),
      });
      const me = await this.request<ApiMe>("/advertiser/me/", { token: tokens.access });
      return { ok: true, dados: this.sessaoDe(me, tokens) };
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 401) return { ok: false, mensagem: "E-mail ou senha inválidos." };
        if (e.status === 403 || e.status === 404) return { ok: false, mensagem: "Esta conta não é de anunciante." };
        return { ok: false, mensagem: e.message };
      }
      throw e;
    }
  }

  async getSessaoAtual(accessToken: string | null): Promise<SessaoUsuario | null> {
    if (!accessToken) return null;
    try {
      const me = await this.request<ApiMe>("/advertiser/me/", { token: accessToken });
      return this.sessaoDe(me);
    } catch {
      return null;
    }
  }

  async encerrarSessao(refreshToken: string | null) {
    if (!refreshToken) return;
    await this.request("/auth/logout/", { method: "POST", body: JSON.stringify({ refresh: refreshToken }) }).catch(() => undefined);
  }

  async getSessaoPorAnunciante(): Promise<SessaoUsuario | null> {
    return this.getSessaoAtual(await getAccessToken());
  }

  async recuperarSenha(email: string): Promise<ResultadoAcao> {
    await this.request("/users/forgot-password/", { method: "POST", body: JSON.stringify({ email: email.trim().toLowerCase() }) }).catch(() => undefined);
    return { ok: true, mensagem: `Se ${email} estiver cadastrado, enviamos um link para redefinir a senha. O link vale por 1 hora.` };
  }

  async redefinirSenha(email: string, hash: string, novaSenha: string): Promise<ResultadoAcao> {
    try {
      await this.request("/users/change-password-forgot-password/", {
        method: "POST",
        body: JSON.stringify({ email, forgot_password_hash: hash, new_password: hashSenha(novaSenha) }),
      });
      return { ok: true, mensagem: "Senha redefinida. Faça login com a nova senha." };
    } catch (e) {
      if (e instanceof ApiError) return { ok: false, mensagem: e.erros?.detail?.join(" ") ?? e.message, erros: e.erros ?? undefined };
      throw e;
    }
  }

  async cadastrar(portalId: string, p: Parameters<PortalRepository["cadastrar"]>[1]): Promise<ResultadoAcao<SessaoUsuario>> {
    const slug = await this.slugDoPortal(portalId);
    const tipo = p.tipo === "proprietario" ? "OWNER" : p.tipo === "corretor" ? "BROKER" : "AGENCY";
    try {
      const r = await this.request<{ advertiser_id: string; user_id: string; is_published: boolean; access: string; refresh: string }>(`/public/portals/${slug}/register/`, {
        method: "POST",
        body: JSON.stringify({
          type: tipo,
          plan: p.plano_id,
          name: p.nome,
          document: p.documento,
          email: p.email,
          password: hashSenha(p.senha),
          phone: p.telefone,
          phone_secondary: p.telefone2 ?? "",
          contact_name: p.contato ?? "",
          website: p.site ?? "",
          address: p.endereco ?? "",
          creci: p.creci ?? "",
          coupon: p.cupom ?? "",
          accepted_terms: p.aceite_termos,
        }),
      });
      const me = await this.request<ApiMe>("/advertiser/me/", { token: r.access });
      return {
        ok: true,
        dados: this.sessaoDe(me, { access: r.access, refresh: r.refresh }),
        mensagem: r.is_published ? "Cadastro realizado com sucesso." : "Cadastro recebido. Seu plano será ativado após confirmação.",
      };
    } catch (e) {
      if (e instanceof ApiError) return { ok: false, mensagem: e.message, erros: traduzirErrosCadastro(e.erros) };
      throw e;
    }
  }

  // ------------------------------------------- planos e tabela de publicidade
  async listPlanos(): Promise<Plano[]> {
    const lista = await this.request<ApiPlan[]>("/public/plans/", { revalidate: REVALIDATE_HOME });
    return lista.map(mapPlano);
  }

  async getTabelaPublicidade(): Promise<TabelaPublicidade[]> {
    const lista = await this.request<ApiAdPlacement[]>("/public/ad-placements/", { revalidate: REVALIDATE_HOME });
    return lista.map(mapTabelaPublicidade);
  }

  // --------------------------------------------------------- blog e dicas
  /** Slug do primeiro portal conhecido (conteúdo é global ou do portal; não há portalId no contrato). */
  private async slugPadrao() {
    return this.portaisPorSlug.keys().next().value ?? (await this.listPortais())[0]?.slug;
  }

  async listPosts(pagina: number, porPagina = 9): Promise<Paginado<Post>> {
    const vazio: Paginado<Post> = { resultados: [], total: 0, pagina, por_pagina: porPagina, total_paginas: 0 };
    const slug = await this.slugPadrao();
    if (!slug) return vazio;
    try {
      const r = await this.request<ApiPaginado<ApiPostCard>>(`/public/portals/${slug}/posts/?page=${pagina}&page_size=${porPagina}`, { revalidate: REVALIDATE_HOME });
      return mapPaginado(r, mapPost);
    } catch (e) {
      // A paginação da API responde 404 para página fora do intervalo.
      if (e instanceof ApiError && e.status === 404) return vazio;
      throw e;
    }
  }

  async getPost(slug: string): Promise<Post | null> {
    const portal = await this.slugPadrao();
    if (!portal) return null;
    try {
      const r = await this.request<ApiPostDetail>(`/public/portals/${portal}/posts/${encodeURIComponent(slug)}/`, { revalidate: REVALIDATE_HOME });
      return mapPost(r);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  }

  async listDicas(): Promise<Dica[]> {
    const slug = await this.slugPadrao();
    if (!slug) return [];
    const lista = await this.request<ApiTip[]>(`/public/portals/${slug}/tips/`, { revalidate: REVALIDATE_HOME });
    return lista.map(mapDica);
  }

  // ------------------------------------------------------ formulários públicos
  /** POST de formulário público: 403 (remetente bloqueado) vira mensagem genérica; 400 traduz os campos. */
  private async postarFormulario(path: string, body: unknown, ok: string, bloqueado: string, campos: Record<string, string>): Promise<ResultadoAcao> {
    try {
      await this.request(path, { method: "POST", body: JSON.stringify(body) });
      return { ok: true, mensagem: ok };
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 403) return { ok: false, mensagem: bloqueado };
        return { ok: false, mensagem: e.message, erros: traduzirErros(e.erros, campos) };
      }
      throw e;
    }
  }

  enviarContato: PortalRepository["enviarContato"] = async (portalId, p) => {
    const slug = await this.slugDoPortal(portalId);
    return this.postarFormulario(`/public/portals/${slug}/contact-messages/`, contatoParaApi(p), "Mensagem enviada. Responderemos em breve.", "Não foi possível enviar sua mensagem.", CAMPOS_CONTATO);
  };

  enviarEncomenda: PortalRepository["enviarEncomenda"] = async (portalId, p) => {
    const slug = await this.slugDoPortal(portalId);
    return this.postarFormulario(
      `/public/portals/${slug}/property-requests/`,
      encomendaParaApi(p),
      p.parceiro ? "Encomenda enviada às imobiliárias parceiras." : "Encomenda registrada. Entraremos em contato.",
      "Não foi possível enviar sua encomenda.",
      CAMPOS_ENCOMENDA,
    );
  };

  enviarLeadSite: PortalRepository["enviarLeadSite"] = async (portalId, p) => {
    const slug = await this.slugDoPortal(portalId);
    return this.postarFormulario(`/public/portals/${slug}/advertiser-leads/`, leadSiteParaApi(p), "Recebemos seu interesse. Nossa equipe vai entrar em contato.", "Não foi possível enviar seu contato.", CAMPOS_LEAD_SITE);
  };

  // ---------------------------------------------- ainda no mock (fase 3)
  alterarSenha: PortalRepository["alterarSenha"] = (a, b, c) => this.fallback.alterarSenha(a, b, c);
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

/** Contrato de `GET /advertiser/me/` (área do anunciante). */
export interface ApiMe {
  advertiser_id: string;
  user_id: string;
  name: string;
  email: string;
  type: "OWNER" | "BROKER" | "AGENCY";
  portal_slug: string;
  plan: {
    id: string;
    slug: string;
    name: string;
    property_limit: number;
    photo_limit: number;
    featured_limit: number;
    has_hotsite: boolean;
    has_realtor_page: boolean;
    receives_property_requests: boolean;
    monthly_price: string | number | null;
  } | null;
  has_automatic_import: boolean;
  has_hotsite: boolean;
  is_published: boolean;
  document: string;
  phone: string;
  phone_secondary: string;
  whatsapp: string;
  contact_name: string;
  website: string;
  address: string;
  creci: string;
  created_at: string;
}

const CAMPOS_CADASTRO: Record<string, string> = {
  type: "tipo",
  plan: "plano_id",
  name: "nome",
  document: "documento",
  email: "email",
  password: "senha",
  phone: "telefone",
  phone_secondary: "telefone2",
  contact_name: "contato",
  website: "site",
  address: "endereco",
  creci: "creci",
  coupon: "cupom",
  accepted_terms: "aceite_termos",
};

function traduzirErrosCadastro(erros: Record<string, string[]> | null) {
  if (!erros) return undefined;
  const out: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(erros)) out[CAMPOS_CADASTRO[k] ?? k] = v;
  return out;
}
