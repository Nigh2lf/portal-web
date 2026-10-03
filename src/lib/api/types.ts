/**
 * Contrato de dados entre o front e a API (`/api/v1/`).
 * Campos em snake_case, ids em string (UUID na API real), datas em ISO 8601.
 * O mock em `src/mocks/` implementa exatamente estes tipos.
 */

export type Objetivo = "comprar" | "alugar" | "temporada";
export type TipoAnunciante = "proprietario" | "corretor" | "imobiliaria";
export type Ordenacao = "recentes" | "menor_preco" | "maior_preco";
export type PreferenciaContato = "whatsapp" | "telefone" | "email";

export interface MenuItem {
  label: string;
  href: string;
}

export interface Portal {
  id: string;
  slug: string;
  nome: string;
  dominio: string;
  dominios: string[];
  cidade_principal_id: string;
  cidade_principal_nome: string;
  cidade_principal_uf: string;
  cidades_ids: string[];
  portais_combinados_ids: string[];
  exibir_cidade: boolean;
  telefone: string;
  whatsapp: string;
  endereco: string;
  email: string;
  titulo_padrao: string;
  descricao_padrao: string;
  keywords_padrao: string;
  o_que_somos: string;
  facebook: string | null;
  instagram: string | null;
  ga4_id: string | null;
  recaptcha_site_key: string | null;
  logo_url: string;
  /** Dimensões intrínsecas do arquivo do logo (px), para o next/image manter a proporção. */
  logo_largura: number;
  logo_altura: number;
  /** Imagem 1200x630 (PNG/JPG) para Open Graph; SVG não é aceito pelas redes. */
  og_image_url: string;
  /** Ícones por portal; null usa os padrões do app. */
  icones: { favicon: string; icon_192: string; icon_512: string; apple: string } | null;
  slug_imobiliarias: string;
  menu: MenuItem[];
  cor_primaria: string;
  cor_secundaria: string;
  total_imoveis: number;
}

export interface Cidade {
  id: string;
  nome: string;
  uf: string;
  slug: string;
}

export interface Bairro {
  id: string;
  cidade_id: string;
  nome: string;
  slug: string;
  total_imoveis: number;
}

export interface ImovelTipo {
  id: string;
  nome: string;
  slug: string;
}

export interface Infraestrutura {
  id: string;
  nome: string;
  escopo: "imovel" | "condominio";
}

export interface ImovelFoto {
  id: string;
  url: string;
  mini_url: string;
  ordem: number;
  principal: boolean;
}

export interface ImovelTaxa {
  descricao: string;
  valor: number;
  observacao: string | null;
}

export interface Imovel {
  id: string;
  codigo: string;
  slug: string;
  titulo: string;
  anunciante_id: string;
  portal_id: string;
  ativo: boolean;
  destaque: boolean;
  status: "rascunho" | "publicado";
  tipo_id: string;
  tipo_nome: string;
  cidade_id: string;
  cidade_nome: string;
  bairro_id: string;
  bairro_nome: string;
  uf: string;
  quartos: number;
  suites: number;
  banheiros: number;
  vagas: number;
  area_construida: number | null;
  area_total: number | null;
  descricao: string;
  infraestrutura: string[];
  infra_condominio: string[];
  dentro_condominio: boolean;
  taxas: ImovelTaxa[];
  preco_venda: number | null;
  preco_locacao: number | null;
  preco_temporada: number | null;
  fotos: ImovelFoto[];
  foto_principal_url: string | null;
  visualizacoes: number;
  criado_em: string;
  atualizado_em: string;
}

/** Card de listagem: subconjunto do imóvel + dados do anunciante. */
export interface ImovelResumo
  extends Pick<
    Imovel,
    | "id"
    | "codigo"
    | "slug"
    | "titulo"
    | "anunciante_id"
    | "destaque"
    | "tipo_nome"
    | "cidade_nome"
    | "bairro_nome"
    | "uf"
    | "quartos"
    | "suites"
    | "banheiros"
    | "vagas"
    | "area_construida"
    | "area_total"
    | "preco_venda"
    | "preco_locacao"
    | "preco_temporada"
    | "foto_principal_url"
    | "infraestrutura"
    | "atualizado_em"
  > {
  descricao_resumo: string;
  anunciante_nome: string;
  anunciante_logo_url: string | null;
  anunciante_slug: string | null;
  total_fotos: number;
}

export interface Anunciante {
  id: string;
  slug: string;
  tipo: TipoAnunciante;
  nome: string;
  documento: string;
  email: string;
  telefone: string;
  telefone2: string | null;
  whatsapp: string | null;
  logo_url: string | null;
  creci: string | null;
  contato: string | null;
  site: string | null;
  endereco: string | null;
  plano_id: string;
  portal_id: string;
  ativo: boolean;
  hotsite: boolean;
  pagina_imobiliaria: boolean;
  recebe_encomenda: boolean;
  url_xml: string | null;
  cadastrado_em: string;
}

export interface AnuncianteResumo
  extends Pick<
    Anunciante,
    "id" | "slug" | "tipo" | "nome" | "logo_url" | "creci" | "telefone" | "telefone2" | "whatsapp" | "endereco" | "email" | "site" | "hotsite"
  > {
  total_imoveis: number;
  totais_por_objetivo: Record<Objetivo, number>;
}

export interface Plano {
  id: string;
  slug: string;
  nome: string;
  /** null = sob consulta */
  preco_mensal: number | null;
  imoveis: number;
  fotos: number;
  destaques: number;
  pagina_imobiliaria: boolean;
  encomenda: boolean;
  hotsite: boolean;
  recomendado: boolean;
  /** Só visível na escolha de perfil "proprietário". */
  exclusivo_proprietario: boolean;
}

export interface Post {
  id: string;
  slug: string;
  titulo: string;
  resumo: string;
  conteudo_html: string;
  autor: string;
  imagem_url: string;
  publicado_em: string;
}

export interface Dica {
  id: string;
  titulo: string;
  descricao_html: string;
  ativo: boolean;
}

export interface Mensagem {
  id: string;
  anunciante_id: string;
  imovel_id: string | null;
  imovel_codigo: string | null;
  imovel_titulo: string | null;
  portal_id: string;
  nome: string;
  email: string;
  telefone: string;
  mensagem: string;
  preferencias: PreferenciaContato[];
  origem: "imovel" | "hotsite" | "mobile";
  criado_em: string;
}

export interface Encomenda {
  id: string;
  portal_id: string;
  nome: string;
  email: string;
  telefone: string;
  objetivo: Objetivo;
  tipo_id: string | null;
  cidade_id: string | null;
  bairro_id: string | null;
  /** Nomes já resolvidos (a API do painel devolve só nomes); quando ausentes, a tela resolve pelos ids. */
  tipo_nome?: string | null;
  cidade_nome?: string | null;
  bairro_nome?: string | null;
  valor_min: number | null;
  valor_max: number | null;
  dentro_condominio: boolean | null;
  recurso: "financiamento" | "a_vista" | "fgts" | "permuta" | null;
  mensagem: string;
  parceiro: boolean;
  criado_em: string;
}

export interface Publicidade {
  id: string;
  portal_id: string;
  nome: string;
  imagem_url: string;
  link: string;
  nova_aba: boolean;
  categoria: "popup_home" | "banner_home" | "banner_lista" | "banner_detalhe";
  inicio: string;
  fim: string;
  ativo: boolean;
}

export interface TabelaPublicidade {
  codigo: string;
  pagina: string;
  tipo: string;
  tamanho: string;
  observacao: string;
  preco_mensal: number;
}

export interface EstatisticaMensal {
  ano_mes: string; // "2026-09"
  imoveis: number;
  visualizacoes: number;
  cliques_telefone: number;
  cliques_whatsapp: number;
  mensagens: number;
  encomendas: number;
}

export interface EstatisticaPeriodo {
  anunciante_id: string;
  inicio: string;
  fim: string;
  imoveis: number;
  visualizacoes: number;
  cliques_telefone: number;
  cliques_whatsapp: number;
  mensagens: number;
  encomendas: number;
  total_leads: number;
  por_imovel: Array<{
    imovel_id: string;
    codigo: string;
    titulo: string;
    visualizacoes: number;
    cliques_telefone: number;
    cliques_whatsapp: number;
    mensagens: number;
  }>;
}

export interface RelatorioImportacao {
  anunciante_id: string;
  url_xml: string;
  ultima_importacao: string | null;
  total_xml: number;
  validos: number;
  invalidos: Array<{ codigo: string; motivo: string }>;
  erros: Array<{ data: string; mensagem: string }>;
}

export interface PesquisaPopular {
  label: string;
  href: string;
  total: number;
}

export interface HomeDados {
  destaques: ImovelResumo[];
  mais_procurados: PesquisaPopular[];
  bairros_mais_anunciados: Array<{ bairro: Bairro; cidade: Cidade; href: string }>;
  total_imoveis: number;
  hero_imagem_url: string;
  banner_home: Publicidade | null;
  popup_home: Publicidade | null;
}

export interface UsoPlano {
  plano: Plano;
  imoveis_usados: number;
  destaques_usados: number;
}

export interface SessaoUsuario {
  anunciante_id: string;
  nome: string;
  email: string;
  tipo: TipoAnunciante;
  plano_id: string;
  carga_automatica: boolean;
  /** Presente só no modo API: JWT para gravar em cookies httpOnly. */
  tokens?: { access: string; refresh: string };
}

// ---------------------------------------------------------------------------
// Busca
// ---------------------------------------------------------------------------

export interface BuscaFiltros {
  objetivo: Objetivo;
  tipo?: string; // slug
  cidade?: string; // slug
  bairro?: string; // slug
  condominio?: "dentro" | "fora";
  quartos?: number[]; // 1,2,3,4 (4 = 4+)
  vagas?: number;
  valor_min?: number;
  valor_max?: number;
  codigo?: string;
  anunciante?: string; // slug
  ordenacao: Ordenacao;
  pagina: number;
  por_pagina: number;
}

export interface Paginado<T> {
  resultados: T[];
  total: number;
  pagina: number;
  por_pagina: number;
  total_paginas: number;
}

export interface BuscaResultado extends Paginado<ImovelResumo> {
  contadores: Record<Objetivo, number>;
  valor_maximo: number;
  titulo: string;
  descricao_seo: string;
}

// ---------------------------------------------------------------------------
// Payloads de escrita
// ---------------------------------------------------------------------------

export interface ContatoPayload {
  nome: string;
  email: string;
  telefone: string;
  assunto: string;
  mensagem: string;
  recaptcha_token?: string;
}

export interface ContatarAnunciantePayload {
  imovel_id: string;
  nome: string;
  email: string;
  telefone: string;
  mensagem: string;
  preferencias: PreferenciaContato[];
  recaptcha_token?: string;
}

export type EncomendaPayload = Omit<Encomenda, "id" | "portal_id" | "criado_em">;

export interface CadastroPayload {
  tipo: TipoAnunciante;
  plano_id: string;
  nome: string;
  documento: string;
  email: string;
  senha: string;
  telefone: string;
  telefone2?: string;
  contato?: string;
  site?: string;
  endereco?: string;
  creci?: string;
  cupom?: string;
  aceite_termos: boolean;
}

export type PerfilPayload = Pick<
  Anunciante,
  "nome" | "email" | "telefone" | "telefone2" | "whatsapp" | "contato" | "site" | "endereco" | "creci"
>;

export interface ImovelPayload {
  codigo: string;
  ativo: boolean;
  destaque: boolean;
  tipo_id: string;
  cidade_id: string;
  bairro_id: string;
  dentro_condominio: boolean;
  quartos: number;
  suites: number;
  banheiros: number;
  vagas: number;
  area_construida: number | null;
  area_total: number | null;
  preco_venda: number | null;
  preco_locacao: number | null;
  preco_temporada: number | null;
  taxas: ImovelTaxa[];
  descricao: string;
  infraestrutura: string[];
  infra_condominio: string[];
}

export interface LeadSitePayload {
  nome: string;
  email: string;
  telefone: string;
  imobiliaria: string;
  mensagem?: string;
}

export interface ResultadoAcao<T = undefined> {
  ok: boolean;
  mensagem?: string;
  erros?: Record<string, string[]>;
  dados?: T;
}
