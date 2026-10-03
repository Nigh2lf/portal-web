import type {
  Anunciante,
  AnuncianteResumo,
  Bairro,
  BuscaFiltros,
  BuscaResultado,
  CadastroPayload,
  Cidade,
  ContatarAnunciantePayload,
  ContatoPayload,
  Dica,
  Encomenda,
  EncomendaPayload,
  EstatisticaMensal,
  EstatisticaPeriodo,
  HomeDados,
  Imovel,
  ImovelPayload,
  ImovelResumo,
  ImovelTipo,
  Infraestrutura,
  LeadSitePayload,
  Mensagem,
  Objetivo,
  Paginado,
  PerfilPayload,
  PesquisaPopular,
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

export interface ImovelDetalhe {
  imovel: Imovel;
  anunciante: AnuncianteResumo;
  relacionados: ImovelResumo[];
  links_relacionados: PesquisaPopular[];
}

export interface FiltrosMeusImoveis {
  busca?: string;
  objetivo?: Objetivo;
  tipo?: string;
  cidade?: string;
  bairro?: string;
  status?: "ativo" | "inativo" | "rascunho";
  pagina: number;
  por_pagina: number;
}

/**
 * Contrato de acesso a dados do portal. Implementado por `src/mocks` (dados em
 * memória) e por `http-repository` (API Django). Páginas usam só esta interface.
 */
export interface PortalRepository {
  // Portal / tenant
  getPortalByHost(host: string): Promise<Portal | null>;
  getPortalBySlug(slug: string): Promise<Portal | null>;
  listPortais(): Promise<Portal[]>;

  // Catálogos
  listCidades(portalId: string): Promise<Cidade[]>;
  listBairros(opts: { cidadeId?: string; cidadeSlug?: string; portalId?: string; anuncianteId?: string; comImoveis?: boolean }): Promise<Bairro[]>;
  listTipos(): Promise<ImovelTipo[]>;
  listInfraestruturas(): Promise<Infraestrutura[]>;
  listPlanos(): Promise<Plano[]>;
  getTabelaPublicidade(): Promise<TabelaPublicidade[]>;

  // Público
  getHome(portalId: string): Promise<HomeDados>;
  buscarImoveis(portalId: string, filtros: BuscaFiltros): Promise<BuscaResultado>;
  getImovel(portalId: string, slugOuId: string, opts?: { preview?: boolean; anuncianteId?: string }): Promise<ImovelDetalhe | null>;
  listImoveisPorIds(portalId: string, ids: string[]): Promise<ImovelResumo[]>;
  listAnunciantes(portalId: string): Promise<{ imobiliarias: AnuncianteResumo[]; corretores: AnuncianteResumo[] }>;
  getAnunciantePublico(portalId: string, slug: string): Promise<AnuncianteResumo | null>;
  listPosts(pagina: number, porPagina?: number): Promise<Paginado<Post>>;
  getPost(slug: string): Promise<Post | null>;
  listDicas(): Promise<Dica[]>;
  getPublicidade(portalId: string, categoria: Publicidade["categoria"]): Promise<Publicidade | null>;
  getPesquisasPopulares(portalId: string, limite?: number): Promise<PesquisaPopular[]>;
  registrarClique(input: { imovelId?: string; anuncianteId: string; tipo: "telefone" | "whatsapp" }): Promise<void>;
  registrarCliquePublicidade(publicidadeId: string): Promise<string | null>;

  // Formulários públicos
  enviarContato(portalId: string, payload: ContatoPayload): Promise<ResultadoAcao>;
  contatarAnunciante(portalId: string, payload: ContatarAnunciantePayload): Promise<ResultadoAcao>;
  enviarEncomenda(portalId: string, payload: EncomendaPayload): Promise<ResultadoAcao>;
  enviarLeadSite(portalId: string, payload: LeadSitePayload): Promise<ResultadoAcao>;

  // Conta
  login(email: string, senha: string): Promise<ResultadoAcao<SessaoUsuario>>;
  cadastrar(portalId: string, payload: CadastroPayload): Promise<ResultadoAcao<SessaoUsuario>>;
  recuperarSenha(email: string): Promise<ResultadoAcao>;
  alterarSenha(anuncianteId: string, atual: string, nova: string): Promise<ResultadoAcao>;
  getSessaoPorAnunciante(anuncianteId: string): Promise<SessaoUsuario | null>;

  // Painel
  getAnunciante(anuncianteId: string): Promise<Anunciante | null>;
  atualizarPerfil(anuncianteId: string, payload: PerfilPayload): Promise<ResultadoAcao<Anunciante>>;
  getUsoPlano(anuncianteId: string): Promise<UsoPlano>;
  listMeusImoveis(anuncianteId: string, filtros: FiltrosMeusImoveis): Promise<Paginado<Imovel>>;
  getMeuImovel(anuncianteId: string, imovelId: string): Promise<Imovel | null>;
  criarImovel(anuncianteId: string, payload: ImovelPayload): Promise<ResultadoAcao<Imovel>>;
  atualizarImovel(anuncianteId: string, imovelId: string, payload: ImovelPayload): Promise<ResultadoAcao<Imovel>>;
  excluirImovel(anuncianteId: string, imovelId: string): Promise<ResultadoAcao>;
  adicionarFotos(anuncianteId: string, imovelId: string, urls: string[]): Promise<ResultadoAcao<Imovel>>;
  removerFoto(anuncianteId: string, imovelId: string, fotoId: string): Promise<ResultadoAcao<Imovel>>;
  removerTodasFotos(anuncianteId: string, imovelId: string): Promise<ResultadoAcao<Imovel>>;
  definirFotoPrincipal(anuncianteId: string, imovelId: string, fotoId: string): Promise<ResultadoAcao<Imovel>>;
  reordenarFotos(anuncianteId: string, imovelId: string, fotoIds: string[]): Promise<ResultadoAcao<Imovel>>;
  listMensagens(anuncianteId: string, opts: { inicio?: string; fim?: string; pagina: number; por_pagina: number }): Promise<Paginado<Mensagem>>;
  listEncomendasRecebidas(anuncianteId: string): Promise<Encomenda[]>;
  getEstatisticasMensais(anuncianteId: string, meses?: number): Promise<EstatisticaMensal[]>;
  getEstatisticasPeriodo(anuncianteId: string, inicio: string, fim: string): Promise<EstatisticaPeriodo>;
  getRelatorioImportacao(anuncianteId: string): Promise<RelatorioImportacao | null>;
}
