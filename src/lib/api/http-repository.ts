import type { PortalRepository } from "./repository";

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

/**
 * Implementação HTTP do repositório (fase 3 do roadmap). Os métodos vão sendo
 * preenchidos conforme os endpoints forem criados no `portal-api`; até lá,
 * qualquer chamada lança `NaoImplementado` para deixar claro o que falta.
 */
export class HttpRepository implements PortalRepository {
  constructor(private baseUrl: string) {}

  protected async request<T>(path: string, init: RequestInit & { token?: string } = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");
    if (init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
    if (init.token) headers.set("Authorization", `Bearer ${init.token}`);
    const res = await fetch(`${this.baseUrl}${path}`, { ...init, headers });
    const json = (await res.json().catch(() => null)) as Envelope<T> | null;
    if (!res.ok || !json?.success) {
      const erros = json?.error && !("detail" in json.error) ? (json.error as Record<string, string[]>) : null;
      throw new ApiError(res.status, json?.message ?? res.statusText, erros);
    }
    return json.data;
  }

  private naoImplementado(metodo: string): never {
    throw new Error(`HttpRepository.${metodo} ainda não implementado. Use DATA_SOURCE=mock.`);
  }

  getPortalByHost = async () => this.naoImplementado("getPortalByHost");
  getPortalBySlug = async () => this.naoImplementado("getPortalBySlug");
  listPortais = async () => this.naoImplementado("listPortais");
  listCidades = async () => this.naoImplementado("listCidades");
  listBairros = async () => this.naoImplementado("listBairros");
  listTipos = async () => this.naoImplementado("listTipos");
  listInfraestruturas = async () => this.naoImplementado("listInfraestruturas");
  listPlanos = async () => this.naoImplementado("listPlanos");
  getTabelaPublicidade = async () => this.naoImplementado("getTabelaPublicidade");
  getHome = async () => this.naoImplementado("getHome");
  buscarImoveis = async () => this.naoImplementado("buscarImoveis");
  getImovel = async () => this.naoImplementado("getImovel");
  listImoveisPorIds = async () => this.naoImplementado("listImoveisPorIds");
  listAnunciantes = async () => this.naoImplementado("listAnunciantes");
  getAnunciantePublico = async () => this.naoImplementado("getAnunciantePublico");
  listPosts = async () => this.naoImplementado("listPosts");
  getPost = async () => this.naoImplementado("getPost");
  listDicas = async () => this.naoImplementado("listDicas");
  getPublicidade = async () => this.naoImplementado("getPublicidade");
  getPesquisasPopulares = async () => this.naoImplementado("getPesquisasPopulares");
  registrarClique = async () => this.naoImplementado("registrarClique");
  registrarCliquePublicidade = async () => this.naoImplementado("registrarCliquePublicidade");
  enviarContato = async () => this.naoImplementado("enviarContato");
  contatarAnunciante = async () => this.naoImplementado("contatarAnunciante");
  enviarEncomenda = async () => this.naoImplementado("enviarEncomenda");
  enviarLeadSite = async () => this.naoImplementado("enviarLeadSite");
  login = async () => this.naoImplementado("login");
  cadastrar = async () => this.naoImplementado("cadastrar");
  recuperarSenha = async () => this.naoImplementado("recuperarSenha");
  alterarSenha = async () => this.naoImplementado("alterarSenha");
  getSessaoPorAnunciante = async () => this.naoImplementado("getSessaoPorAnunciante");
  getAnunciante = async () => this.naoImplementado("getAnunciante");
  atualizarPerfil = async () => this.naoImplementado("atualizarPerfil");
  getUsoPlano = async () => this.naoImplementado("getUsoPlano");
  listMeusImoveis = async () => this.naoImplementado("listMeusImoveis");
  getMeuImovel = async () => this.naoImplementado("getMeuImovel");
  criarImovel = async () => this.naoImplementado("criarImovel");
  atualizarImovel = async () => this.naoImplementado("atualizarImovel");
  excluirImovel = async () => this.naoImplementado("excluirImovel");
  adicionarFotos = async () => this.naoImplementado("adicionarFotos");
  removerFoto = async () => this.naoImplementado("removerFoto");
  removerTodasFotos = async () => this.naoImplementado("removerTodasFotos");
  definirFotoPrincipal = async () => this.naoImplementado("definirFotoPrincipal");
  reordenarFotos = async () => this.naoImplementado("reordenarFotos");
  listMensagens = async () => this.naoImplementado("listMensagens");
  listEncomendasRecebidas = async () => this.naoImplementado("listEncomendasRecebidas");
  getEstatisticasMensais = async () => this.naoImplementado("getEstatisticasMensais");
  getEstatisticasPeriodo = async () => this.naoImplementado("getEstatisticasPeriodo");
  getRelatorioImportacao = async () => this.naoImplementado("getRelatorioImportacao");
}
