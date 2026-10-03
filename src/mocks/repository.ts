import type { FiltrosMeusImoveis, ImovelDetalhe, PortalRepository } from "@/lib/api/repository";
import { nomesBairros } from "@/lib/busca/titulo";
import { RANK_TIPO_ANUNCIO } from "@/lib/tipo-anuncio";
import type {
  Anunciante,
  AnuncianteResumo,
  Bairro,
  BuscaFiltros,
  BuscaResultado,
  CadastroPayload,
  ContatarAnunciantePayload,
  ContatoPayload,
  Encomenda,
  EncomendaPayload,
  EstatisticaMensal,
  EstatisticaPeriodo,
  BairroMaisAnunciado,
  HomeDados,
  HomeTopo,
  Imovel,
  ImovelPayload,
  ImovelResumo,
  LeadSitePayload,
  Mensagem,
  Objetivo,
  Paginado,
  PerfilPayload,
  PesquisaPopular,
  Portal,
  Publicidade,
  RelatorioImportacao,
  ResultadoAcao,
  SessaoUsuario,
  UsoPlano,
} from "@/lib/api/types";
import { OBJETIVOS, linkBusca } from "@/lib/busca/filtros";
import { slugify, truncar } from "@/lib/utils/format";
import { ANUNCIANTES } from "./data/anunciantes";
import { DICAS, POSTS, PUBLICIDADES } from "./data/conteudo";
import { BAIRROS, CIDADES } from "./data/localidades";
import { PLANOS, TABELA_PUBLICIDADE } from "./data/planos";
import { PORTAIS } from "./data/portais";
import { INFRAESTRUTURAS, TIPOS } from "./data/tipos";
import { criarRandom, dataAtras, fotoUrl } from "./random";
import { getStore, proximoId } from "./store";

const delay = (ms = 0) => (ms ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve());

function precoPorObjetivo(i: Imovel, objetivo: Objetivo) {
  return objetivo === "comprar" ? i.preco_venda : objetivo === "alugar" ? i.preco_locacao : i.preco_temporada;
}

function paginar<T>(lista: T[], pagina: number, porPagina: number): Paginado<T> {
  const total = lista.length;
  const total_paginas = Math.max(1, Math.ceil(total / porPagina));
  const p = Math.min(Math.max(1, pagina), total_paginas);
  return { resultados: lista.slice((p - 1) * porPagina, p * porPagina), total, pagina: p, por_pagina: porPagina, total_paginas };
}

function portaisVisiveis(portal: Portal) {
  return new Set([portal.id, ...portal.portais_combinados_ids]);
}

export class MockRepository implements PortalRepository {
  // ------------------------------------------------------------------ helpers
  private portal(id: string) {
    const p = PORTAIS.find((x) => x.id === id);
    if (!p) throw new Error(`Portal ${id} não encontrado`);
    return p;
  }

  private anunciante(id: string) {
    return getStore().anunciantes.find((a) => a.id === id) ?? null;
  }

  private publicadosDoPortal(portal: Portal) {
    const visiveis = portaisVisiveis(portal);
    const cidades = new Set(portal.cidades_ids);
    const anunciantesAtivos = new Set(getStore().anunciantes.filter((a) => a.ativo && visiveis.has(a.portal_id)).map((a) => a.id));
    return getStore().imoveis.filter(
      (i) => i.ativo && i.status === "publicado" && anunciantesAtivos.has(i.anunciante_id) && cidades.has(i.cidade_id),
    );
  }

  private resumo(i: Imovel): ImovelResumo {
    const a = this.anunciante(i.anunciante_id);
    return {
      id: i.id,
      codigo: i.codigo,
      slug: i.slug,
      titulo: i.titulo,
      anunciante_id: i.anunciante_id,
      tipo_anuncio: i.tipo_anuncio,
      tipo_nome: i.tipo_nome,
      cidade_nome: i.cidade_nome,
      bairro_nome: i.bairro_nome,
      uf: i.uf,
      quartos: i.quartos,
      suites: i.suites,
      banheiros: i.banheiros,
      vagas: i.vagas,
      area_construida: i.area_construida,
      area_total: i.area_total,
      preco_venda: i.preco_venda,
      preco_locacao: i.preco_locacao,
      preco_temporada: i.preco_temporada,
      foto_principal_url: i.fotos.find((f) => f.principal)?.mini_url ?? i.fotos[0]?.mini_url ?? null,
      infraestrutura: i.infraestrutura,
      atualizado_em: i.atualizado_em,
      descricao_resumo: truncar(i.descricao, 220),
      anunciante_nome: a?.nome ?? "Anunciante",
      anunciante_logo_url: a?.logo_url ?? null,
      anunciante_slug: a?.hotsite ? a.slug : null,
      total_fotos: i.fotos.length,
    };
  }

  private resumoAnunciante(a: Anunciante, portal: Portal): AnuncianteResumo {
    const imoveis = this.publicadosDoPortal(portal).filter((i) => i.anunciante_id === a.id);
    return {
      id: a.id,
      slug: a.slug,
      tipo: a.tipo,
      nome: a.nome,
      logo_url: a.logo_url,
      creci: a.creci,
      telefone: a.telefone,
      telefone2: a.telefone2,
      whatsapp: a.whatsapp,
      endereco: a.endereco,
      email: a.email,
      site: a.site,
      hotsite: a.hotsite,
      total_imoveis: imoveis.length,
      totais_por_objetivo: {
        comprar: imoveis.filter((i) => i.preco_venda).length,
        alugar: imoveis.filter((i) => i.preco_locacao).length,
        temporada: imoveis.filter((i) => i.preco_temporada).length,
      },
    };
  }

  private aplicarFiltros(lista: Imovel[], f: BuscaFiltros, ignorarObjetivo = false) {
    const tipo = f.tipo ? TIPOS.find((t) => t.slug === f.tipo) : undefined;
    const cidade = f.cidade ? CIDADES.find((c) => c.slug === f.cidade) : undefined;
    const bairroIds = f.bairros?.length ? new Set(BAIRROS.filter((b) => f.bairros!.includes(b.slug) && (!cidade || b.cidade_id === cidade.id)).map((b) => b.id)) : undefined;
    const anunciante = f.anunciante ? ANUNCIANTES.find((a) => a.slug === f.anunciante) : undefined;
    return lista.filter((i) => {
      if (!ignorarObjetivo && !precoPorObjetivo(i, f.objetivo)) return false;
      if (tipo && i.tipo_id !== tipo.id) return false;
      if (cidade && i.cidade_id !== cidade.id) return false;
      if (bairroIds && !bairroIds.has(i.bairro_id)) return false;
      if (anunciante && i.anunciante_id !== anunciante.id) return false;
      if (f.condominio === "dentro" && !i.dentro_condominio) return false;
      if (f.condominio === "fora" && i.dentro_condominio) return false;
      if (f.quartos?.length && !f.quartos.some((q) => (q >= 4 ? i.quartos >= 4 : i.quartos === q))) return false;
      if (f.vagas && (f.vagas >= 6 ? i.vagas < 6 : i.vagas !== f.vagas)) return false;
      if (f.codigo && !i.codigo.toLowerCase().includes(f.codigo.toLowerCase())) return false;
      if (!ignorarObjetivo) {
        const preco = precoPorObjetivo(i, f.objetivo) ?? 0;
        if (f.valor_min && preco < f.valor_min) return false;
        if (f.valor_max && preco > f.valor_max) return false;
      }
      return true;
    });
  }

  private tituloBusca(f: BuscaFiltros, portal: Portal) {
    const obj = OBJETIVOS.find((o) => o.valor === f.objetivo)!;
    const tipo = f.tipo ? TIPOS.find((t) => t.slug === f.tipo)?.nome : undefined;
    const cidade = f.cidade ? CIDADES.find((c) => c.slug === f.cidade) : undefined;
    const bairros = BAIRROS.filter((b) => f.bairros?.includes(b.slug)).map((b) => b.nome);
    const partes = [obj.label, tipo ?? "Imóveis"];
    if (bairros.length) partes.push(`em ${nomesBairros(bairros)}`);
    partes.push(`em ${cidade?.nome ?? portal.cidade_principal_nome}`);
    return partes.join(" ");
  }

  // ------------------------------------------------------------------- portal
  async getPortalByHost(host: string) {
    const h = host.toLowerCase().split(":")[0]!;
    return PORTAIS.find((p) => p.dominios.includes(h)) ?? null;
  }
  async getPortalBySlug(slug: string) {
    return PORTAIS.find((p) => p.slug === slug) ?? null;
  }
  async listPortais() {
    return PORTAIS;
  }

  // ---------------------------------------------------------------- catálogos
  async listCidades(portalId: string) {
    const portal = this.portal(portalId);
    return CIDADES.filter((c) => portal.cidades_ids.includes(c.id));
  }

  async listBairros(opts: { cidadeId?: string; cidadeSlug?: string; portalId?: string; anuncianteId?: string; comImoveis?: boolean }): Promise<Bairro[]> {
    const cidade = opts.cidadeId ? CIDADES.find((c) => c.id === opts.cidadeId) : opts.cidadeSlug ? CIDADES.find((c) => c.slug === opts.cidadeSlug) : undefined;
    let base = cidade ? BAIRROS.filter((b) => b.cidade_id === cidade.id) : BAIRROS;
    const portal = opts.portalId ? this.portal(opts.portalId) : undefined;
    if (portal && !cidade) base = base.filter((b) => portal.cidades_ids.includes(b.cidade_id));
    const imoveis = portal ? this.publicadosDoPortal(portal) : getStore().imoveis.filter((i) => i.status === "publicado" && i.ativo);
    const contagem = new Map<string, number>();
    for (const i of imoveis) {
      if (opts.anuncianteId && i.anunciante_id !== opts.anuncianteId) continue;
      contagem.set(i.bairro_id, (contagem.get(i.bairro_id) ?? 0) + 1);
    }
    return base
      .map((b) => ({ ...b, total_imoveis: contagem.get(b.id) ?? 0 }))
      .filter((b) => !opts.comImoveis || b.total_imoveis > 0)
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }

  async listTipos() {
    return TIPOS;
  }
  async listInfraestruturas() {
    return INFRAESTRUTURAS;
  }
  async listPlanos() {
    return PLANOS;
  }
  async getTabelaPublicidade() {
    return TABELA_PUBLICIDADE;
  }

  // ------------------------------------------------------------------ público
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
    const portal = this.portal(portalId);
    return {
      total_imoveis: Math.max(this.publicadosDoPortal(portal).length, portal.total_imoveis),
      hero_imagem_url: fotoUrl(`hero-${portal.slug}`, 1920, 900),
      banner_home: await this.getPublicidade(portalId, "banner_home"),
      popup_home: await this.getPublicidade(portalId, "popup_home"),
    };
  }

  async listDestaques(portalId: string) {
    const portal = this.portal(portalId);
    const rnd = criarRandom(Number(portal.id.slice(-4)) || 1);
    return rnd
      .shuffle(this.publicadosDoPortal(portal).filter((i) => i.tipo_anuncio !== "normal" && i.fotos.length))
      .slice(0, 12)
      .map((i) => this.resumo(i));
  }

  async listBairrosMaisAnunciados(portalId: string): Promise<BairroMaisAnunciado[]> {
    const porBairro = new Map<string, number>();
    for (const i of this.publicadosDoPortal(this.portal(portalId))) porBairro.set(i.bairro_id, (porBairro.get(i.bairro_id) ?? 0) + 1);
    return [...porBairro.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([id]) => {
        const bairro = BAIRROS.find((b) => b.id === id)!;
        const cidade = CIDADES.find((c) => c.id === bairro.cidade_id)!;
        return { bairro: { ...bairro, total_imoveis: porBairro.get(id)! }, cidade, href: linkBusca({ cidade: cidade.slug, bairros: [bairro.slug] }) };
      });
  }

  async listRelacionados(portalId: string, slugOuId: string) {
    const portal = this.portal(portalId);
    const imovel = getStore().imoveis.find((i) => i.slug === slugOuId || i.id === slugOuId || i.codigo.toLowerCase() === slugOuId.toLowerCase());
    if (!imovel) return [];
    const objetivo: Objetivo = imovel.preco_venda ? "comprar" : imovel.preco_locacao ? "alugar" : "temporada";
    const preco = precoPorObjetivo(imovel, objetivo) ?? 0;
    return this.publicadosDoPortal(portal)
      .filter((i) => i.id !== imovel.id && i.tipo_id === imovel.tipo_id && i.cidade_id === imovel.cidade_id && precoPorObjetivo(i, objetivo))
      .map((i) => ({ i, dist: Math.abs((precoPorObjetivo(i, objetivo) ?? 0) - preco) }))
      .sort((x, y) => x.dist - y.dist)
      .slice(0, 6)
      .map(({ i }) => this.resumo(i));
  }

  async buscarImoveis(portalId: string, f: BuscaFiltros): Promise<BuscaResultado> {
    await delay();
    const portal = this.portal(portalId);
    const base = this.aplicarFiltros(this.publicadosDoPortal(portal), f, true);
    const contadores: Record<Objetivo, number> = {
      comprar: base.filter((i) => i.preco_venda).length,
      alugar: base.filter((i) => i.preco_locacao).length,
      temporada: base.filter((i) => i.preco_temporada).length,
    };
    const filtrados = this.aplicarFiltros(base, f);
    const valorMaximo = Math.max(0, ...base.map((i) => precoPorObjetivo(i, f.objetivo) ?? 0));
    const ordenados = [...filtrados].sort((a, b) => {
      if (RANK_TIPO_ANUNCIO[a.tipo_anuncio] !== RANK_TIPO_ANUNCIO[b.tipo_anuncio]) return RANK_TIPO_ANUNCIO[b.tipo_anuncio] - RANK_TIPO_ANUNCIO[a.tipo_anuncio];
      const fa = a.fotos.length > 0 ? 1 : 0;
      const fb = b.fotos.length > 0 ? 1 : 0;
      if (fa !== fb) return fb - fa;
      if (f.ordenacao === "menor_preco") return (precoPorObjetivo(a, f.objetivo) ?? 0) - (precoPorObjetivo(b, f.objetivo) ?? 0);
      if (f.ordenacao === "maior_preco") return (precoPorObjetivo(b, f.objetivo) ?? 0) - (precoPorObjetivo(a, f.objetivo) ?? 0);
      return b.atualizado_em.localeCompare(a.atualizado_em);
    });
    getStore().pesquisas.push({ portal_id: portalId, objetivo: f.objetivo, tipo: f.tipo, cidade: f.cidade, bairro: f.bairros?.[0], data: new Date().toISOString() });
    const pag = paginar(ordenados, f.pagina, f.por_pagina);
    const titulo = this.tituloBusca(f, portal);
    return {
      ...pag,
      resultados: pag.resultados.map((i) => this.resumo(i)),
      contadores,
      valor_maximo: valorMaximo,
      titulo,
      descricao_seo: `${titulo}. ${pag.total} imóveis encontrados no ${portal.nome}. Casas, apartamentos, terrenos e sítios com fotos, preços e contato direto com o anunciante.`,
    };
  }

  async getImovel(portalId: string, slugOuId: string, opts: { preview?: boolean; anuncianteId?: string } = {}): Promise<ImovelDetalhe | null> {
    const portal = this.portal(portalId);
    const todos = getStore().imoveis;
    const imovel = todos.find((i) => i.slug === slugOuId || i.id === slugOuId || i.codigo.toLowerCase() === slugOuId.toLowerCase());
    if (!imovel) return null;
    const publicado = this.publicadosDoPortal(portal).some((i) => i.id === imovel.id);
    const podePreview = opts.preview && opts.anuncianteId === imovel.anunciante_id;
    if (!publicado && !podePreview) return null;
    const a = this.anunciante(imovel.anunciante_id);
    if (!a) return null;
    if (!opts.preview) imovel.visualizacoes += 1;

    const cidade = CIDADES.find((c) => c.id === imovel.cidade_id)!;
    const bairro = BAIRROS.find((b) => b.id === imovel.bairro_id)!;
    const tipo = TIPOS.find((t) => t.id === imovel.tipo_id)!;
    const links: PesquisaPopular[] = OBJETIVOS.flatMap((o) => [
      { label: `${o.label} ${tipo.nome} em ${bairro.nome}`, href: linkBusca({ objetivo: o.valor, tipo: tipo.slug, cidade: cidade.slug, bairros: [bairro.slug] }), total: 0 },
      { label: `${o.label} ${tipo.nome} em ${cidade.nome}`, href: linkBusca({ objetivo: o.valor, tipo: tipo.slug, cidade: cidade.slug }), total: 0 },
    ]).concat([{ label: `Todos os imóveis em ${bairro.nome}`, href: linkBusca({ cidade: cidade.slug, bairros: [bairro.slug] }), total: 0 }]);

    return { imovel, anunciante: this.resumoAnunciante(a, portal), links_relacionados: links };
  }

  async listImoveisPorIds(portalId: string, ids: string[]) {
    const portal = this.portal(portalId);
    const set = new Set(ids);
    return this.publicadosDoPortal(portal).filter((i) => set.has(i.id)).map((i) => this.resumo(i));
  }

  async listAnunciantes(portalId: string) {
    const portal = this.portal(portalId);
    const visiveis = portaisVisiveis(portal);
    const rnd = criarRandom(Date.now() % 100000);
    const lista = rnd.shuffle(getStore().anunciantes.filter((a) => a.ativo && a.pagina_imobiliaria && visiveis.has(a.portal_id)));
    return {
      imobiliarias: lista.filter((a) => a.tipo === "imobiliaria").map((a) => this.resumoAnunciante(a, portal)),
      corretores: lista.filter((a) => a.tipo === "corretor").map((a) => this.resumoAnunciante(a, portal)),
    };
  }

  async getAnunciantePublico(portalId: string, slug: string) {
    const portal = this.portal(portalId);
    const a = getStore().anunciantes.find((x) => x.slug === slug && x.ativo);
    if (!a || !a.hotsite) return null;
    return this.resumoAnunciante(a, portal);
  }

  async listPosts(pagina: number, porPagina = 9) {
    return paginar([...POSTS].sort((a, b) => b.publicado_em.localeCompare(a.publicado_em)), pagina, porPagina);
  }
  async getPost(slug: string) {
    return POSTS.find((p) => p.slug === slug) ?? null;
  }
  async listDicas() {
    return DICAS.filter((d) => d.ativo);
  }

  async getPublicidade(portalId: string, categoria: Publicidade["categoria"]) {
    const agora = new Date().toISOString();
    return PUBLICIDADES.find((p) => p.portal_id === portalId && p.categoria === categoria && p.ativo && p.inicio <= agora && p.fim >= agora) ?? null;
  }

  async getPesquisasPopulares(portalId: string, limite = 15): Promise<PesquisaPopular[]> {
    const portal = this.portal(portalId);
    const publicados = this.publicadosDoPortal(portal);
    const grupos = new Map<string, { label: string; href: string; total: number }>();
    for (const i of publicados) {
      const objetivo: Objetivo = i.preco_venda ? "comprar" : i.preco_locacao ? "alugar" : "temporada";
      const obj = OBJETIVOS.find((o) => o.valor === objetivo)!;
      const tipo = TIPOS.find((t) => t.id === i.tipo_id)!;
      const cidade = CIDADES.find((c) => c.id === i.cidade_id)!;
      const bairro = BAIRROS.find((b) => b.id === i.bairro_id)!;
      const chave = `${objetivo}|${tipo.id}|${bairro.id}`;
      const atual = grupos.get(chave) ?? {
        label: `${tipo.nome} ${obj.labelTitulo} em ${bairro.nome}, ${cidade.nome} - ${cidade.uf}`,
        href: linkBusca({ objetivo, tipo: tipo.slug, cidade: cidade.slug, bairros: [bairro.slug] }),
        total: 0,
      };
      atual.total += 1;
      grupos.set(chave, atual);
    }
    return [...grupos.values()].sort((a, b) => b.total - a.total).slice(0, limite);
  }

  async registrarClique(input: { imovelId?: string; anuncianteId: string; tipo: "telefone" | "whatsapp" }) {
    getStore().cliques.push({ imovel_id: input.imovelId ?? null, anunciante_id: input.anuncianteId, tipo: input.tipo, data: new Date().toISOString() });
  }

  async registrarCliquePublicidade(publicidadeId: string) {
    return PUBLICIDADES.find((p) => p.id === publicidadeId)?.link ?? null;
  }

  // -------------------------------------------------------- formulários públicos
  async enviarContato(portalId: string, payload: ContatoPayload): Promise<ResultadoAcao> {
    await delay(300);
    getStore().contatos.push({ id: proximoId("ctt"), portal_id: portalId, ...payload, criado_em: new Date().toISOString() });
    return { ok: true, mensagem: "Mensagem enviada. Responderemos em breve." };
  }

  async contatarAnunciante(portalId: string, payload: ContatarAnunciantePayload): Promise<ResultadoAcao> {
    await delay(300);
    const imovel = getStore().imoveis.find((i) => i.id === payload.imovel_id);
    if (!imovel) return { ok: false, mensagem: "Imóvel não encontrado." };
    const msg: Mensagem = {
      id: proximoId("msg"),
      anunciante_id: imovel.anunciante_id,
      imovel_id: imovel.id,
      imovel_codigo: imovel.codigo,
      imovel_titulo: imovel.titulo,
      portal_id: portalId,
      nome: payload.nome,
      email: payload.email,
      telefone: payload.telefone,
      mensagem: payload.mensagem,
      preferencias: payload.preferencias,
      origem: "imovel",
      criado_em: new Date().toISOString(),
    };
    getStore().mensagens.unshift(msg);
    return { ok: true, mensagem: "Sua mensagem foi enviada ao anunciante." };
  }

  async enviarEncomenda(portalId: string, payload: EncomendaPayload): Promise<ResultadoAcao> {
    await delay(300);
    const enc: Encomenda = { id: proximoId("enc"), portal_id: portalId, criado_em: new Date().toISOString(), ...payload };
    getStore().encomendas.unshift(enc);
    return { ok: true, mensagem: payload.parceiro ? "Encomenda enviada às imobiliárias parceiras." : "Encomenda registrada. Entraremos em contato." };
  }

  async enviarLeadSite(portalId: string, payload: LeadSitePayload): Promise<ResultadoAcao> {
    await delay(300);
    getStore().leads.push({ id: proximoId("lead"), portal_id: portalId, ...payload, criado_em: new Date().toISOString() });
    return { ok: true, mensagem: "Recebemos seu interesse. Nossa equipe vai entrar em contato." };
  }

  // -------------------------------------------------------------------- conta
  private sessao(a: Anunciante): SessaoUsuario {
    return { anunciante_id: a.id, nome: a.nome, email: a.email, tipo: a.tipo, plano_id: a.plano_id, carga_automatica: Boolean(a.url_xml) };
  }

  async login(email: string, senha: string): Promise<ResultadoAcao<SessaoUsuario>> {
    await delay(300);
    const u = getStore().usuarios.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
    if (!u || u.senha !== senha) return { ok: false, mensagem: "E-mail ou senha inválidos." };
    const a = this.anunciante(u.anunciante_id);
    if (!a || !a.ativo) return { ok: false, mensagem: "Cadastro inativo. Entre em contato com o portal." };
    return { ok: true, dados: this.sessao(a) };
  }

  async cadastrar(portalId: string, payload: CadastroPayload): Promise<ResultadoAcao<SessaoUsuario>> {
    await delay(400);
    const s = getStore();
    if (s.usuarios.some((u) => u.email.toLowerCase() === payload.email.toLowerCase())) {
      return { ok: false, erros: { email: ["Já existe um cadastro com este e-mail."] } };
    }
    const plano = PLANOS.find((p) => p.id === payload.plano_id);
    if (!plano) return { ok: false, erros: { plano_id: ["Plano inválido."] } };
    const id = proximoId("anunc");
    const a: Anunciante = {
      id,
      slug: `${slugify(payload.nome)}-${id.slice(-4)}`,
      tipo: payload.tipo,
      nome: payload.nome,
      documento: payload.documento,
      email: payload.email,
      telefone: payload.telefone,
      telefone2: payload.telefone2 ?? null,
      whatsapp: payload.telefone2 ?? payload.telefone,
      logo_url: null,
      creci: payload.creci ?? null,
      contato: payload.contato ?? null,
      site: payload.site ?? null,
      endereco: payload.endereco ?? null,
      plano_id: plano.id,
      portal_id: portalId,
      ativo: true,
      hotsite: plano.hotsite,
      pagina_imobiliaria: plano.pagina_imobiliaria && payload.tipo !== "proprietario",
      recebe_encomenda: plano.encomenda,
      url_xml: null,
      cadastrado_em: new Date().toISOString(),
    };
    s.anunciantes.push(a);
    s.usuarios.push({ anunciante_id: id, email: payload.email, senha: payload.senha });
    return { ok: true, dados: this.sessao(a), mensagem: plano.preco_mensal ? "Cadastro recebido. Seu plano será ativado após confirmação." : "Cadastro realizado com sucesso." };
  }

  async recuperarSenha(email: string): Promise<ResultadoAcao> {
    await delay(300);
    return { ok: true, mensagem: `Se ${email} estiver cadastrado, enviamos um link para redefinir a senha.` };
  }

  async redefinirSenha(email: string, _hash: string, novaSenha: string): Promise<ResultadoAcao> {
    const u = getStore().usuarios.find((x) => x.email.toLowerCase() === email.toLowerCase());
    if (!u) return { ok: false, mensagem: "Link inválido ou expirado." };
    u.senha = novaSenha;
    return { ok: true, mensagem: "Senha redefinida. Faça login com a nova senha." };
  }

  async getSessaoAtual(_accessToken: string | null, anuncianteId: string | null) {
    return anuncianteId ? this.getSessaoPorAnunciante(anuncianteId) : null;
  }

  async encerrarSessao() {}

  async alterarSenha(anuncianteId: string, atual: string, nova: string): Promise<ResultadoAcao> {
    const u = getStore().usuarios.find((x) => x.anunciante_id === anuncianteId);
    if (!u) return { ok: false, mensagem: "Usuário não encontrado." };
    if (u.senha !== atual) return { ok: false, erros: { senha_atual: ["Senha atual incorreta."] } };
    u.senha = nova;
    return { ok: true, mensagem: "Senha alterada com sucesso." };
  }

  async getSessaoPorAnunciante(anuncianteId: string) {
    const a = this.anunciante(anuncianteId);
    return a && a.ativo ? this.sessao(a) : null;
  }

  // ------------------------------------------------------------------- painel
  async getAnunciante(anuncianteId: string) {
    return this.anunciante(anuncianteId);
  }

  async atualizarPerfil(anuncianteId: string, payload: PerfilPayload): Promise<ResultadoAcao<Anunciante>> {
    const s = getStore();
    const a = this.anunciante(anuncianteId);
    if (!a) return { ok: false, mensagem: "Anunciante não encontrado." };
    if (s.usuarios.some((u) => u.anunciante_id !== anuncianteId && u.email.toLowerCase() === payload.email.toLowerCase())) {
      return { ok: false, erros: { email: ["Este e-mail já está em uso."] } };
    }
    Object.assign(a, payload);
    const u = s.usuarios.find((x) => x.anunciante_id === anuncianteId);
    if (u) u.email = payload.email;
    return { ok: true, dados: a, mensagem: "Cadastro atualizado." };
  }

  async getUsoPlano(anuncianteId: string): Promise<UsoPlano> {
    const a = this.anunciante(anuncianteId);
    const plano = PLANOS.find((p) => p.id === a?.plano_id) ?? PLANOS[0]!;
    const meus = getStore().imoveis.filter((i) => i.anunciante_id === anuncianteId);
    return { plano, imoveis_usados: meus.filter((i) => i.ativo).length, destaques_usados: meus.filter((i) => i.ativo && i.tipo_anuncio !== "normal").length };
  }

  async listMeusImoveis(anuncianteId: string, f: FiltrosMeusImoveis): Promise<Paginado<Imovel>> {
    const tipo = f.tipo ? TIPOS.find((t) => t.slug === f.tipo) : undefined;
    const cidade = f.cidade ? CIDADES.find((c) => c.slug === f.cidade) : undefined;
    const bairro = f.bairro ? BAIRROS.find((b) => b.slug === f.bairro) : undefined;
    const lista = getStore()
      .imoveis.filter((i) => i.anunciante_id === anuncianteId)
      .filter((i) => {
        if (f.busca && !`${i.codigo} ${i.titulo}`.toLowerCase().includes(f.busca.toLowerCase())) return false;
        if (f.objetivo && !precoPorObjetivo(i, f.objetivo)) return false;
        if (tipo && i.tipo_id !== tipo.id) return false;
        if (cidade && i.cidade_id !== cidade.id) return false;
        if (bairro && i.bairro_id !== bairro.id) return false;
        if (f.status === "ativo" && !(i.ativo && i.status === "publicado")) return false;
        if (f.status === "inativo" && i.ativo) return false;
        if (f.status === "rascunho" && i.status !== "rascunho") return false;
        return true;
      })
      .sort((a, b) => b.atualizado_em.localeCompare(a.atualizado_em));
    return paginar(lista, f.pagina, f.por_pagina);
  }

  async getMeuImovel(anuncianteId: string, imovelId: string) {
    return getStore().imoveis.find((i) => i.id === imovelId && i.anunciante_id === anuncianteId) ?? null;
  }

  private montarImovel(anunciante: Anunciante, payload: ImovelPayload, base?: Imovel): ResultadoAcao<Imovel> {
    const tipo = TIPOS.find((t) => t.id === payload.tipo_id);
    const cidade = CIDADES.find((c) => c.id === payload.cidade_id);
    const bairro = BAIRROS.find((b) => b.id === payload.bairro_id);
    const erros: Record<string, string[]> = {};
    if (!tipo) erros.tipo_id = ["Tipo inválido."];
    if (!cidade) erros.cidade_id = ["Cidade inválida."];
    if (!bairro) erros.bairro_id = ["Bairro inválido."];
    if (!payload.preco_venda && !payload.preco_locacao && !payload.preco_temporada) erros.preco_venda = ["Informe ao menos um preço (venda, locação ou temporada)."];
    const s = getStore();
    const codigoEmUso = s.imoveis.some((i) => i.anunciante_id === anunciante.id && i.codigo.toLowerCase() === payload.codigo.toLowerCase() && i.id !== base?.id);
    if (codigoEmUso) erros.codigo = ["Você já tem um imóvel com este código."];
    const plano = PLANOS.find((p) => p.id === anunciante.plano_id)!;
    const meus = s.imoveis.filter((i) => i.anunciante_id === anunciante.id && i.id !== base?.id);
    if (payload.ativo && meus.filter((i) => i.ativo).length >= plano.imoveis) erros.ativo = [`Seu plano permite ${plano.imoveis} imóveis ativos.`];
    if (payload.tipo_anuncio !== "normal" && meus.filter((i) => i.ativo && i.tipo_anuncio !== "normal").length >= plano.destaques) erros.tipo_anuncio = [`Seu plano permite ${plano.destaques} destaques.`];
    if (Object.keys(erros).length) return { ok: false, erros, mensagem: "Verifique os campos destacados." };

    const objetivoTitulo = payload.preco_venda ? "à venda" : payload.preco_locacao ? "para alugar" : "para temporada";
    const titulo = `${tipo!.nome} ${objetivoTitulo} em ${bairro!.nome}, ${cidade!.nome} - ${cidade!.uf}`;
    const agora = new Date().toISOString();
    const imovel: Imovel = {
      ...(base ?? {
        id: proximoId("imovel"),
        anunciante_id: anunciante.id,
        portal_id: anunciante.portal_id,
        fotos: [],
        foto_principal_url: null,
        visualizacoes: 0,
        criado_em: agora,
        status: "publicado",
      }),
      ...payload,
      titulo,
      slug: `${slugify(titulo)}-${payload.codigo.toLowerCase()}`,
      tipo_nome: tipo!.nome,
      cidade_nome: cidade!.nome,
      bairro_nome: bairro!.nome,
      uf: cidade!.uf,
      status: "publicado",
      atualizado_em: agora,
    };
    if (base) Object.assign(base, imovel);
    else s.imoveis.unshift(imovel);
    return { ok: true, dados: base ?? imovel, mensagem: base ? "Imóvel atualizado." : "Imóvel cadastrado." };
  }

  async criarImovel(anuncianteId: string, payload: ImovelPayload) {
    const a = this.anunciante(anuncianteId);
    if (!a) return { ok: false, mensagem: "Anunciante não encontrado." };
    return this.montarImovel(a, payload);
  }

  async atualizarImovel(anuncianteId: string, imovelId: string, payload: ImovelPayload) {
    const a = this.anunciante(anuncianteId);
    const base = await this.getMeuImovel(anuncianteId, imovelId);
    if (!a || !base) return { ok: false, mensagem: "Imóvel não encontrado." };
    return this.montarImovel(a, payload, base);
  }

  async excluirImovel(anuncianteId: string, imovelId: string): Promise<ResultadoAcao> {
    const s = getStore();
    const idx = s.imoveis.findIndex((i) => i.id === imovelId && i.anunciante_id === anuncianteId);
    if (idx < 0) return { ok: false, mensagem: "Imóvel não encontrado." };
    s.imoveis.splice(idx, 1);
    return { ok: true, mensagem: "Imóvel excluído." };
  }

  private async comFotos(anuncianteId: string, imovelId: string, fn: (i: Imovel) => ResultadoAcao<Imovel> | void): Promise<ResultadoAcao<Imovel>> {
    const i = await this.getMeuImovel(anuncianteId, imovelId);
    if (!i) return { ok: false, mensagem: "Imóvel não encontrado." };
    const r = fn(i);
    if (r) return r;
    i.fotos.forEach((f, idx) => (f.ordem = idx + 1));
    if (i.fotos.length && !i.fotos.some((f) => f.principal)) i.fotos[0]!.principal = true;
    i.foto_principal_url = i.fotos.find((f) => f.principal)?.mini_url ?? null;
    i.atualizado_em = new Date().toISOString();
    return { ok: true, dados: i };
  }

  async adicionarFotos(anuncianteId: string, imovelId: string, urls: string[]) {
    const a = this.anunciante(anuncianteId);
    const plano = PLANOS.find((p) => p.id === a?.plano_id)!;
    return this.comFotos(anuncianteId, imovelId, (i) => {
      if (i.fotos.length + urls.length > plano.fotos) return { ok: false, mensagem: `Seu plano permite ${plano.fotos} fotos por imóvel.` };
      for (const url of urls) {
        const id = proximoId("foto");
        i.fotos.push({ id, url, mini_url: url, ordem: i.fotos.length + 1, principal: i.fotos.length === 0 });
      }
    });
  }

  async removerFoto(anuncianteId: string, imovelId: string, fotoId: string) {
    return this.comFotos(anuncianteId, imovelId, (i) => {
      i.fotos = i.fotos.filter((f) => f.id !== fotoId);
    });
  }

  async removerTodasFotos(anuncianteId: string, imovelId: string) {
    return this.comFotos(anuncianteId, imovelId, (i) => {
      i.fotos = [];
    });
  }

  async definirFotoPrincipal(anuncianteId: string, imovelId: string, fotoId: string) {
    return this.comFotos(anuncianteId, imovelId, (i) => {
      i.fotos.forEach((f) => (f.principal = f.id === fotoId));
    });
  }

  async reordenarFotos(anuncianteId: string, imovelId: string, fotoIds: string[]) {
    return this.comFotos(anuncianteId, imovelId, (i) => {
      const mapa = new Map(i.fotos.map((f) => [f.id, f]));
      i.fotos = fotoIds.map((id) => mapa.get(id)).filter((f): f is NonNullable<typeof f> => Boolean(f)).concat(i.fotos.filter((f) => !fotoIds.includes(f.id)));
    });
  }

  async listMensagens(anuncianteId: string, opts: { inicio?: string; fim?: string; pagina: number; por_pagina: number }) {
    const lista = getStore()
      .mensagens.filter((m) => m.anunciante_id === anuncianteId)
      .filter((m) => (!opts.inicio || m.criado_em >= opts.inicio) && (!opts.fim || m.criado_em.slice(0, 10) <= opts.fim))
      .sort((a, b) => b.criado_em.localeCompare(a.criado_em));
    return paginar(lista, opts.pagina, opts.por_pagina);
  }

  async listEncomendasRecebidas(anuncianteId: string) {
    const a = this.anunciante(anuncianteId);
    if (!a?.recebe_encomenda) return [];
    return getStore().encomendas.filter((e) => e.parceiro && e.portal_id === a.portal_id);
  }

  async getEstatisticasMensais(anuncianteId: string, meses = 3): Promise<EstatisticaMensal[]> {
    const s = getStore();
    const hoje = new Date(dataAtras(0));
    const out: EstatisticaMensal[] = [];
    for (let k = 0; k < meses; k++) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - k, 1);
      const anoMes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const noMes = (iso: string) => iso.startsWith(anoMes);
      const rnd = criarRandom(Number(anuncianteId.slice(-6).replace(/\D/g, "") || "1") + k);
      out.push({
        ano_mes: anoMes,
        imoveis: s.imoveis.filter((i) => i.anunciante_id === anuncianteId && i.ativo).length,
        visualizacoes: s.imoveis.filter((i) => i.anunciante_id === anuncianteId).reduce((acc, i) => acc + Math.round(i.visualizacoes * (0.25 + rnd.next() * 0.2)), 0),
        cliques_telefone: s.cliques.filter((c) => c.anunciante_id === anuncianteId && c.tipo === "telefone" && noMes(c.data)).length,
        cliques_whatsapp: s.cliques.filter((c) => c.anunciante_id === anuncianteId && c.tipo === "whatsapp" && noMes(c.data)).length,
        mensagens: s.mensagens.filter((m) => m.anunciante_id === anuncianteId && noMes(m.criado_em)).length,
        encomendas: s.encomendas.filter((e) => e.parceiro && noMes(e.criado_em)).length,
      });
    }
    return out;
  }

  async getEstatisticasPeriodo(anuncianteId: string, inicio: string, fim: string): Promise<EstatisticaPeriodo> {
    const s = getStore();
    const dentro = (iso: string) => iso.slice(0, 10) >= inicio && iso.slice(0, 10) <= fim;
    const meus = s.imoveis.filter((i) => i.anunciante_id === anuncianteId);
    const cliques = s.cliques.filter((c) => c.anunciante_id === anuncianteId && dentro(c.data));
    const mensagens = s.mensagens.filter((m) => m.anunciante_id === anuncianteId && dentro(m.criado_em));
    const encomendas = s.encomendas.filter((e) => e.parceiro && dentro(e.criado_em)).length;
    const dias = Math.max(1, Math.round((new Date(fim).getTime() - new Date(inicio).getTime()) / 86400000) + 1);
    const fator = Math.min(1, dias / 240);
    const porImovel = meus
      .map((i) => ({
        imovel_id: i.id,
        codigo: i.codigo,
        titulo: i.titulo,
        visualizacoes: Math.round(i.visualizacoes * fator),
        cliques_telefone: cliques.filter((c) => c.imovel_id === i.id && c.tipo === "telefone").length,
        cliques_whatsapp: cliques.filter((c) => c.imovel_id === i.id && c.tipo === "whatsapp").length,
        mensagens: mensagens.filter((m) => m.imovel_id === i.id).length,
      }))
      .sort((a, b) => b.visualizacoes - a.visualizacoes);
    const tel = cliques.filter((c) => c.tipo === "telefone").length;
    const wpp = cliques.filter((c) => c.tipo === "whatsapp").length;
    return {
      anunciante_id: anuncianteId,
      inicio,
      fim,
      imoveis: meus.filter((i) => i.ativo).length,
      visualizacoes: porImovel.reduce((a, b) => a + b.visualizacoes, 0),
      cliques_telefone: tel,
      cliques_whatsapp: wpp,
      mensagens: mensagens.length,
      encomendas,
      total_leads: tel + wpp + mensagens.length + encomendas,
      por_imovel: porImovel,
    };
  }

  async getRelatorioImportacao(anuncianteId: string): Promise<RelatorioImportacao | null> {
    const a = this.anunciante(anuncianteId);
    if (!a?.url_xml) return null;
    const meus = getStore().imoveis.filter((i) => i.anunciante_id === anuncianteId);
    const rnd = criarRandom(meus.length * 31);
    const invalidos = rnd.sample(meus, Math.min(3, meus.length)).map((i, k) => ({
      codigo: `${i.codigo}-X${k + 1}`,
      motivo: k === 0 ? "Cidade fora da área de cobertura do portal" : k === 1 ? "Imóvel rejeitado pela moderação" : "Tipo de imóvel não reconhecido",
    }));
    return {
      anunciante_id: anuncianteId,
      url_xml: a.url_xml,
      ultima_importacao: dataAtras(0),
      total_xml: meus.length + invalidos.length,
      validos: meus.length,
      invalidos,
      erros: [{ data: dataAtras(2), mensagem: "Foto não acessível em 1 imóvel (HTTP 404)." }],
    };
  }
}
