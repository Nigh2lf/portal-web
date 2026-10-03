import type { FiltrosMeusImoveis, ImovelDetalhe, PortalRepository } from "./repository";
import { REVALIDATE_PADRAO, TAGS_HOSTS, tagsCache } from "./cache-tags";
import type {
  Anunciante,
  Bairro,
  BuscaFiltros,
  BuscaResultado,
  Dica,
  Encomenda,
  EstatisticaMensal,
  EstatisticaPeriodo,
  HomeDados,
  HomeTopo,
  Imovel,
  ImovelPayload,
  Mensagem,
  Paginado,
  PerfilPayload,
  Plano,
  Portal,
  Post,
  Publicidade,
  RelatorioImportacao,
  ResultadoAcao,
  SessaoUsuario,
  TabelaPublicidade,
  UsoPlano,
} from "./types";
import { descricaoBusca, tituloBusca } from "@/lib/busca/titulo";
import { getAccessToken, hashSenha } from "@/lib/auth/session";
import {
  CAMPOS_CONTATO,
  CAMPOS_ENCOMENDA,
  CAMPOS_IMOVEL,
  CAMPOS_LEAD_SITE,
  CAMPOS_PERFIL,
  arquivoDeDataUrl,
  contatoParaApi,
  encomendaParaApi,
  filtrosMeusImoveisParaApi,
  filtrosParaApi,
  imovelParaApi,
  leadSiteParaApi,
  mapAnunciante,
  mapAnuncianteResumo,
  mapBairro,
  mapBairroMaisAnunciado,
  mapCidade,
  mapDica,
  mapEncomenda,
  mapEstatisticaMensal,
  mapEstatisticaPeriodo,
  mapImovel,
  mapImovelPainel,
  mapImovelResumo,
  mapInfra,
  mapLinkRelacionado,
  mapMensagem,
  mapPaginado,
  mapPesquisaPopular,
  mapPlano,
  mapPortal,
  mapPost,
  mapPublicidade,
  mapRelatorioImportacao,
  mapTabelaPublicidade,
  mapTipo,
  mapUsoPlano,
  perfilParaApi,
  traduzirErros,
  type ApiAd,
  type ApiAdPlacement,
  type ApiAdvertiser,
  type ApiBanner,
  type ApiCity,
  type ApiFeature,
  type ApiImportReport,
  type ApiInquiry,
  type ApiMe,
  type ApiMonthlyStat,
  type ApiNeighborhood,
  type ApiPaginado,
  type ApiPeriodStat,
  type ApiPlan,
  type ApiPlanUsage,
  type ApiPortal,
  type ApiPostCard,
  type ApiPostDetail,
  type ApiPropertyCard,
  type ApiPropertyDetail,
  type ApiPropertyPainel,
  type ApiPropertyRequest,
  type ApiPropertyType,
  type ApiRelatedLink,
  type ApiSearchResult,
  type ApiTip,
  type ApiTopNeighborhood,
  type ApiTopSearch,
} from "./mappers";

export type { ApiMe } from "./mappers";

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


/**
 * Repositório HTTP contra a API Django: site público (`/public/...`), sessão
 * (`/auth/...`) e área do anunciante (`/advertiser/...`, com o JWT dos cookies).
 */
export class HttpRepository implements PortalRepository {
  private portaisPorId = new Map<string, Portal>();
  private portaisPorSlug = new Map<string, Portal>();
  private catalogoPorSlug = new Map<string, Promise<Catalogo>>();

  constructor(
    private baseUrl: string,
    fallback?: PortalRepository,
  ) {
    // Mantido na assinatura por compatibilidade com `getRepository()`; tudo já vem da API.
    void fallback;
  }

  // ------------------------------------------------------------- transporte
  /**
   * `tags`: leitura pública guardada no cache do Next e invalidada pela API por tag.
   * Sem `tags`, a chamada nunca é cacheada (sessão, painel, busca e detalhe com contagem).
   */
  protected async request<T>(path: string, init: RequestInit & { token?: string; tags?: string[]; revalidate?: number } = {}): Promise<T> {
    const { token, tags, revalidate, ...rest } = init;
    const headers = new Headers(rest.headers);
    headers.set("Accept", "application/json");
    if (rest.body && !(rest.body instanceof FormData)) headers.set("Content-Type", "application/json");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...rest,
      headers,
      next: tags ? { tags, revalidate: revalidate ?? REVALIDATE_PADRAO } : undefined,
      cache: tags ? undefined : "no-store",
    });
    // DELETE responde 204 sem corpo.
    if (res.status === 204) return undefined as T;
    const json = (await res.json().catch(() => null)) as Envelope<T> | Record<string, unknown> | null;
    const comEnvelope = Boolean(json && typeof json === "object" && "success" in json);
    if (comEnvelope) {
      const env = json as Envelope<T>;
      if (!res.ok || !env.success) {
        const erros = env.error && !("detail" in env.error) ? (env.error as Record<string, string[]>) : null;
        throw new ApiError(res.status, env.message || res.statusText, erros);
      }
      return env.data;
    }
    // Fora do envelope (ex.: `auth/login`, `auth/refresh` do SimpleJWT): corpo cru.
    if (!res.ok) {
      const detail = (json as { detail?: string } | null)?.detail;
      const erros = json && typeof json === "object" && !detail ? (json as Record<string, string[]>) : null;
      throw new ApiError(res.status, detail || res.statusText, erros);
    }
    return json as T;
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

  /**
   * Catálogo sem portal informado (painel): o do primeiro portal conhecido; se
   * uma cidade foi pedida e não está nele, procura nos demais portais.
   */
  private async catalogoPadrao(cidade?: { id?: string; slug?: string }): Promise<Catalogo | null> {
    const slugs = Array.from(this.portaisPorSlug.keys());
    if (!slugs.length) slugs.push(...(await this.listPortais()).map((p) => p.slug));
    if (!slugs.length) return null;
    const temCidade = (cat: Catalogo) => cat.cities.some((c) => (cidade?.id && c.id === cidade.id) || (cidade?.slug && c.slug === cidade.slug));
    const primeiro = await this.catalogo(slugs[0]!);
    if (!cidade?.id && !cidade?.slug) return primeiro;
    if (temCidade(primeiro)) return primeiro;
    const todos = Array.from(new Set([...slugs.slice(1), ...(await this.listPortais()).map((p) => p.slug)]));
    for (const slug of todos) {
      const cat = await this.catalogo(slug);
      if (temCidade(cat)) return cat;
    }
    return primeiro;
  }

  private catalogo(slug: string) {
    let p = this.catalogoPorSlug.get(slug);
    if (!p) {
      p = this.request<Catalogo>(`/public/portals/${slug}/catalog/`, { tags: tagsCache("catalog", slug) });
      this.catalogoPorSlug.set(slug, p);
      p.catch(() => this.catalogoPorSlug.delete(slug));
    }
    return p;
  }

  // ----------------------------------------------------------------- portal
  async getPortalByHost(host: string) {
    try {
      const p = await this.request<ApiPortal>(`/public/portals/by-host/?host=${encodeURIComponent(host)}`, { tags: TAGS_HOSTS });
      return this.lembrar(mapPortal(p));
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  }

  async getPortalBySlug(slug: string) {
    try {
      const p = await this.request<ApiPortal>(`/public/portals/${slug}/`, { tags: tagsCache("portal", slug) });
      return this.lembrar(mapPortal(p));
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  }

  async listPortais() {
    const lista = await this.request<Array<{ id: string; slug: string; name: string; domain: string }>>("/public/portals/", { tags: TAGS_HOSTS });
    const completos = await Promise.all(lista.map((p) => this.portaisPorSlug.get(p.slug) ?? this.getPortalBySlug(p.slug)));
    return completos.filter((p): p is Portal => Boolean(p));
  }

  // -------------------------------------------------------------- catálogos
  async listCidades(portalId: string) {
    const slug = await this.slugDoPortal(portalId);
    return (await this.catalogo(slug)).cities.map(mapCidade);
  }

  async listBairros(opts: { cidadeId?: string; cidadeSlug?: string; portalId?: string; anuncianteId?: string; comImoveis?: boolean }): Promise<Bairro[]> {
    const cat = opts.portalId ? await this.catalogo(await this.slugDoPortal(opts.portalId)) : await this.catalogoPadrao({ id: opts.cidadeId, slug: opts.cidadeSlug });
    if (!cat) return [];
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
    const [topo, destaques, mais_procurados, bairros_mais_anunciados] = await Promise.all([
      this.getHomeTopo(portalId),
      this.listDestaques(portalId),
      this.getPesquisasPopulares(portalId, 15),
      this.listBairrosMaisAnunciados(portalId),
    ]);
    return { ...topo, destaques, mais_procurados, bairros_mais_anunciados };
  }

  async getHomeTopo(portalId: string): Promise<HomeTopo> {
    const slug = await this.slugDoPortal(portalId);
    const base = `/public/portals/${slug}`;
    const [portal, banners, anuncios] = await Promise.all([
      this.portaisPorId.get(portalId) ?? this.getPortalBySlug(slug),
      this.request<ApiBanner[]>(`${base}/banners/`, { tags: tagsCache("content", slug) }),
      this.request<ApiAd[]>(`${base}/ads/?page=HOME`, { tags: tagsCache("content", slug) }),
    ]);
    const comImagem = banners.filter((b) => b.home_image_url);
    const banner = comImagem.length ? comImagem[Math.floor(Math.random() * comImagem.length)] : null;
    const pubs = anuncios.map((a) => mapPublicidade(a, portalId));
    return {
      total_imoveis: portal?.total_imoveis ?? 0,
      hero_imagem_url: banner?.home_image_url ?? "/portais/hero-padrao.jpg",
      banner_home: pubs.find((p) => p.categoria === "banner_home") ?? null,
      popup_home: pubs.find((p) => p.categoria === "popup_home") ?? null,
    };
  }

  async listDestaques(portalId: string) {
    const slug = await this.slugDoPortal(portalId);
    const lista = await this.request<ApiPropertyCard[]>(`/public/portals/${slug}/featured-properties/?limit=12`, { tags: tagsCache("home", slug) });
    return lista.map(mapImovelResumo);
  }

  async listBairrosMaisAnunciados(portalId: string) {
    const slug = await this.slugDoPortal(portalId);
    const [portal, lista] = await Promise.all([
      this.portaisPorId.get(portalId) ?? this.getPortalBySlug(slug),
      this.request<ApiTopNeighborhood[]>(`/public/portals/${slug}/top-neighborhoods/?limit=15`, { tags: tagsCache("home", slug) }),
    ]);
    return lista.map((b) => mapBairroMaisAnunciado(b, portal?.cidade_principal_id ?? ""));
  }

  async getPublicidade(portalId: string, categoria: Publicidade["categoria"]) {
    const slug = await this.slugDoPortal(portalId);
    const page = categoria === "banner_lista" ? "SEARCH" : categoria === "banner_detalhe" ? "PROPERTY" : "HOME";
    const kind = categoria === "popup_home" ? "POPUP" : "HORIZONTAL";
    const lista = await this.request<ApiAd[]>(`/public/portals/${slug}/ads/?page=${page}&kind=${kind}`, { tags: tagsCache("content", slug) });
    return lista.length ? mapPublicidade(lista[0]!, portalId) : null;
  }

  async getPesquisasPopulares(portalId: string, limite = 15) {
    const slug = await this.slugDoPortal(portalId);
    const lista = await this.request<ApiTopSearch[]>(`/public/portals/${slug}/top-searches/?limit=${limite}`, { tags: tagsCache("home", slug), revalidate: 900 });
    return lista.map(mapPesquisaPopular);
  }

  async registrarCliquePublicidade(publicidadeId: string) {
    const slug = this.portaisPorSlug.keys().next().value ?? (await this.listPortais())[0]?.slug;
    if (!slug) return null;
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
      bairros: (r.applied.neighborhoods ?? (r.applied.neighborhood ? [r.applied.neighborhood] : [])).map((n) => n.name),
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
      // Relacionados vêm à parte (`listRelacionados`), para a página aparecer antes.
      const r = await this.request<{ property: ApiPropertyDetail; related_links: ApiRelatedLink[] }>(
        `/public/portals/${slug}/properties/${encodeURIComponent(slugOuId)}/?related=0`,
      );
      return {
        imovel: mapImovel(r.property, portalId),
        anunciante: mapAnuncianteResumo(r.property.advertiser),
        links_relacionados: r.related_links.map(mapLinkRelacionado),
      };
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  }

  async listRelacionados(portalId: string, slugOuId: string) {
    const slug = await this.slugDoPortal(portalId);
    try {
      const lista = await this.request<ApiPropertyCard[]>(`/public/portals/${slug}/properties/${encodeURIComponent(slugOuId)}/related/`, {
        tags: tagsCache("listing", slug),
        revalidate: 900,
      });
      return lista.map(mapImovelResumo);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return [];
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
      const r = await this.request<ApiAdvertiser>(`/public/portals/${slug}/advertisers/${anuncianteSlug}/`, { tags: tagsCache("advertiser", slug) });
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
    const lista = await this.request<ApiPlan[]>("/public/plans/", { tags: tagsCache("plans") });
    return lista.map(mapPlano);
  }

  async getTabelaPublicidade(): Promise<TabelaPublicidade[]> {
    const lista = await this.request<ApiAdPlacement[]>("/public/ad-placements/", { tags: tagsCache("plans") });
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
      const r = await this.request<ApiPaginado<ApiPostCard>>(`/public/portals/${slug}/posts/?page=${pagina}&page_size=${porPagina}`, { tags: tagsCache("content", slug) });
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
      const r = await this.request<ApiPostDetail>(`/public/portals/${portal}/posts/${encodeURIComponent(slug)}/`, { tags: tagsCache("content", portal) });
      return mapPost(r);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  }

  async listDicas(): Promise<Dica[]> {
    const slug = await this.slugPadrao();
    if (!slug) return [];
    const lista = await this.request<ApiTip[]>(`/public/portals/${slug}/tips/`, { tags: tagsCache("content", slug) });
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

  // ------------------------------------------------------ painel: anunciante
  // O anunciante é sempre o da sessão (token); o `anuncianteId` do contrato só
  // preenche os campos de referência dos objetos devolvidos.
  private static readonly PAINEL = "/advertiser";

  /** Erro 400 da API → `ResultadoAcao` com os campos traduzidos; demais erros propagam. */
  private falha(e: unknown, campos: Record<string, string> = {}): ResultadoAcao<never> {
    if (!(e instanceof ApiError)) throw e;
    const erros = traduzirErros(e.erros, campos);
    const detalhe = erros ? Object.values(erros).flat().join(" ") : "";
    return { ok: false, mensagem: e.status === 404 ? "Imóvel não encontrado." : detalhe || e.message, erros };
  }

  async getAnunciante(): Promise<Anunciante | null> {
    try {
      return mapAnunciante(await this.requestAuth<ApiMe>(`${HttpRepository.PAINEL}/me/`));
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 404)) return null;
      throw e;
    }
  }

  async atualizarPerfil(_anuncianteId: string, payload: PerfilPayload): Promise<ResultadoAcao<Anunciante>> {
    try {
      const me = await this.requestAuth<ApiMe>(`${HttpRepository.PAINEL}/me/`, { method: "PATCH", body: JSON.stringify(perfilParaApi(payload)) });
      return { ok: true, dados: mapAnunciante(me), mensagem: "Cadastro atualizado." };
    } catch (e) {
      return this.falha(e, CAMPOS_PERFIL);
    }
  }

  async alterarSenha(_anuncianteId: string, atual: string, nova: string): Promise<ResultadoAcao> {
    try {
      await this.requestAuth(`${HttpRepository.PAINEL}/me/change-password/`, {
        method: "POST",
        body: JSON.stringify({ old_password: hashSenha(atual), new_password: hashSenha(nova) }),
      });
      return { ok: true, mensagem: "Senha alterada com sucesso." };
    } catch (e) {
      return this.falha(e, { old_password: "senha_atual", new_password: "senha_nova" });
    }
  }

  async getUsoPlano(): Promise<UsoPlano> {
    return mapUsoPlano(await this.requestAuth<ApiPlanUsage>(`${HttpRepository.PAINEL}/me/plan-usage/`));
  }

  // -------------------------------------------------------- painel: imóveis
  private imovelUrl(imovelId: string, sufixo = "") {
    return `${HttpRepository.PAINEL}/properties/${encodeURIComponent(imovelId)}/${sufixo}`;
  }

  async listMeusImoveis(anuncianteId: string, filtros: FiltrosMeusImoveis): Promise<Paginado<Imovel>> {
    const vazio: Paginado<Imovel> = { resultados: [], total: 0, pagina: filtros.pagina, por_pagina: filtros.por_pagina, total_paginas: 0 };
    try {
      const r = await this.requestAuth<ApiPaginado<ApiPropertyPainel>>(`${HttpRepository.PAINEL}/properties/?${filtrosMeusImoveisParaApi(filtros)}`);
      return mapPaginado(r, (p) => mapImovelPainel(p, anuncianteId));
    } catch (e) {
      // Página fora do intervalo responde 404.
      if (e instanceof ApiError && e.status === 404) return vazio;
      throw e;
    }
  }

  async getMeuImovel(anuncianteId: string, imovelId: string): Promise<Imovel | null> {
    try {
      return mapImovelPainel(await this.requestAuth<ApiPropertyPainel>(this.imovelUrl(imovelId)), anuncianteId);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  }

  private async salvarImovel(anuncianteId: string, imovelId: string | null, payload: ImovelPayload): Promise<ResultadoAcao<Imovel>> {
    const catalogo = await this.listInfraestruturas();
    const body = JSON.stringify(imovelParaApi(payload, catalogo));
    try {
      const r = imovelId
        ? await this.requestAuth<ApiPropertyPainel>(this.imovelUrl(imovelId), { method: "PATCH", body })
        : await this.requestAuth<ApiPropertyPainel>(`${HttpRepository.PAINEL}/properties/`, { method: "POST", body });
      return { ok: true, dados: mapImovelPainel(r, anuncianteId), mensagem: imovelId ? "Imóvel atualizado." : "Imóvel cadastrado." };
    } catch (e) {
      const r = this.falha(e, CAMPOS_IMOVEL);
      return r.erros ? { ...r, mensagem: "Verifique os campos destacados." } : r;
    }
  }

  criarImovel(anuncianteId: string, payload: ImovelPayload) {
    return this.salvarImovel(anuncianteId, null, payload);
  }

  atualizarImovel(anuncianteId: string, imovelId: string, payload: ImovelPayload) {
    return this.salvarImovel(anuncianteId, imovelId, payload);
  }

  async excluirImovel(_anuncianteId: string, imovelId: string): Promise<ResultadoAcao> {
    try {
      await this.requestAuth(this.imovelUrl(imovelId), { method: "DELETE" });
      return { ok: true, mensagem: "Imóvel excluído." };
    } catch (e) {
      return this.falha(e);
    }
  }

  // ---------------------------------------------------------- painel: fotos
  /** Executa a ação nas fotos e devolve o imóvel atualizado (os endpoints só retornam a lista de fotos). */
  private async acaoFotos(anuncianteId: string, imovelId: string, sufixo: string, init: RequestInit): Promise<ResultadoAcao<Imovel>> {
    try {
      await this.requestAuth(this.imovelUrl(imovelId, sufixo), init);
    } catch (e) {
      return this.falha(e);
    }
    const imovel = await this.getMeuImovel(anuncianteId, imovelId);
    return imovel ? { ok: true, dados: imovel } : { ok: false, mensagem: "Imóvel não encontrado." };
  }

  adicionarFotos(anuncianteId: string, imovelId: string, urls: string[]) {
    const form = new FormData();
    urls.forEach((u, k) => form.append("images", arquivoDeDataUrl(u, `foto-${k + 1}`)));
    return this.acaoFotos(anuncianteId, imovelId, "photos/", { method: "POST", body: form });
  }

  removerFoto(anuncianteId: string, imovelId: string, fotoId: string) {
    return this.acaoFotos(anuncianteId, imovelId, `photos/${encodeURIComponent(fotoId)}/`, { method: "DELETE" });
  }

  removerTodasFotos(anuncianteId: string, imovelId: string) {
    return this.acaoFotos(anuncianteId, imovelId, "photos/", { method: "DELETE" });
  }

  definirFotoPrincipal(anuncianteId: string, imovelId: string, fotoId: string) {
    return this.acaoFotos(anuncianteId, imovelId, `photos/${encodeURIComponent(fotoId)}/cover/`, { method: "POST" });
  }

  reordenarFotos(anuncianteId: string, imovelId: string, fotoIds: string[]) {
    return this.acaoFotos(anuncianteId, imovelId, "photos/reorder/", { method: "POST", body: JSON.stringify({ ids: fotoIds }) });
  }

  // ------------------------------------- painel: ofertas, encomendas, relatórios
  async listMensagens(_anuncianteId: string, opts: { inicio?: string; fim?: string; pagina: number; por_pagina: number }): Promise<Paginado<Mensagem>> {
    const q = new URLSearchParams();
    if (opts.inicio) q.set("created_at__gte", opts.inicio);
    // Data pura no `__lte` é interpretada como 00:00: inclui o dia final inteiro.
    if (opts.fim) q.set("created_at__lte", /^\d{4}-\d{2}-\d{2}$/.test(opts.fim) ? `${opts.fim}T23:59:59` : opts.fim);
    q.set("page", String(opts.pagina));
    q.set("page_size", String(opts.por_pagina));
    try {
      return mapPaginado(await this.requestAuth<ApiPaginado<ApiInquiry>>(`${HttpRepository.PAINEL}/inquiries/?${q}`), mapMensagem);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return { resultados: [], total: 0, pagina: opts.pagina, por_pagina: opts.por_pagina, total_paginas: 0 };
      throw e;
    }
  }

  async listEncomendasRecebidas(): Promise<Encomenda[]> {
    const r = await this.requestAuth<ApiPaginado<ApiPropertyRequest>>(`${HttpRepository.PAINEL}/property-requests/?page_size=100`);
    return r.results.map(mapEncomenda);
  }

  async getEstatisticasMensais(_anuncianteId: string, meses = 3): Promise<EstatisticaMensal[]> {
    const lista = await this.requestAuth<ApiMonthlyStat[]>(`${HttpRepository.PAINEL}/stats/monthly/?months=${Math.min(24, Math.max(1, meses))}`);
    return lista.map(mapEstatisticaMensal);
  }

  async getEstatisticasPeriodo(anuncianteId: string, inicio: string, fim: string): Promise<EstatisticaPeriodo> {
    const q = new URLSearchParams({ start: inicio, end: fim });
    return mapEstatisticaPeriodo(await this.requestAuth<ApiPeriodStat>(`${HttpRepository.PAINEL}/stats/period/?${q}`), anuncianteId);
  }

  async getRelatorioImportacao(anuncianteId: string): Promise<RelatorioImportacao | null> {
    try {
      return mapRelatorioImportacao(await this.requestAuth<ApiImportReport>(`${HttpRepository.PAINEL}/import-report/`), anuncianteId);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  }
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
