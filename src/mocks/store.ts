import type { Anunciante, Encomenda, Imovel, Mensagem } from "@/lib/api/types";
import { criarRandom, dataAtras, uuidFake } from "./random";
import { ANUNCIANTES } from "./data/anunciantes";
import { gerarImoveis } from "./data/imoveis";

export interface ContatoRegistro {
  id: string;
  portal_id: string;
  nome: string;
  email: string;
  telefone: string;
  assunto: string;
  mensagem: string;
  criado_em: string;
}

export interface CliqueRegistro {
  imovel_id: string | null;
  anunciante_id: string;
  tipo: "telefone" | "whatsapp";
  data: string;
}

export interface PesquisaRegistro {
  portal_id: string;
  objetivo: string;
  tipo?: string;
  cidade?: string;
  bairro?: string;
  data: string;
}

export interface UsuarioMock {
  anunciante_id: string;
  email: string;
  senha: string;
}

export interface MockState {
  imoveis: Imovel[];
  anunciantes: Anunciante[];
  usuarios: UsuarioMock[];
  mensagens: Mensagem[];
  encomendas: Encomenda[];
  contatos: ContatoRegistro[];
  cliques: CliqueRegistro[];
  pesquisas: PesquisaRegistro[];
  leads: Array<{ id: string; portal_id: string; nome: string; email: string; telefone: string; imobiliaria: string; criado_em: string }>;
  seq: number;
}

const nomesLead = ["Carlos Henrique", "Juliana Prado", "Roberta Lima", "Fábio Nascimento", "Patrícia Gomes", "Eduardo Ramos", "Camila Duarte", "Thiago Moreira", "Larissa Pinto", "Renato Alves"];
const textosLead = [
  "Olá, tenho interesse neste imóvel. Podemos agendar uma visita?",
  "Gostaria de saber se o valor é negociável e se aceita financiamento.",
  "O imóvel ainda está disponível? Qual o valor do condomínio?",
  "Tenho interesse em alugar. Quais são as garantias aceitas?",
  "Poderia me enviar mais fotos e a planta do imóvel?",
];

function gerarMensagens(imoveis: Imovel[]): Mensagem[] {
  const rnd = criarRandom(777);
  const publicados = imoveis.filter((i) => i.status === "publicado");
  return Array.from({ length: 420 }, (_, i) => {
    const imovel = rnd.pick(publicados);
    const nome = rnd.pick(nomesLead);
    const dias = rnd.int(0, 120);
    return {
      id: uuidFake("msg", i + 1),
      anunciante_id: imovel.anunciante_id,
      imovel_id: imovel.id,
      imovel_codigo: imovel.codigo,
      imovel_titulo: imovel.titulo,
      portal_id: imovel.portal_id,
      nome,
      email: `${nome.toLowerCase().replace(/\s+/g, ".")}@email.com`,
      telefone: `24 9${rnd.int(1000, 9999)}-${rnd.int(1000, 9999)}`,
      mensagem: rnd.pick(textosLead),
      preferencias: rnd.sample(["whatsapp", "telefone", "email"] as const, rnd.int(1, 2)),
      origem: rnd.chance(0.85) ? "imovel" : "hotsite",
      criado_em: dataAtras(dias),
    };
  });
}

function gerarCliques(imoveis: Imovel[]): CliqueRegistro[] {
  const rnd = criarRandom(888);
  const publicados = imoveis.filter((i) => i.status === "publicado");
  return Array.from({ length: 2600 }, () => {
    const imovel = rnd.pick(publicados);
    return {
      imovel_id: imovel.id,
      anunciante_id: imovel.anunciante_id,
      tipo: rnd.chance(0.55) ? "whatsapp" : "telefone",
      data: dataAtras(rnd.int(0, 120)),
    };
  });
}

function gerarEncomendas(): Encomenda[] {
  const rnd = criarRandom(999);
  return Array.from({ length: 36 }, (_, i) => {
    const nome = rnd.pick(nomesLead);
    return {
      id: uuidFake("enc", i + 1),
      portal_id: uuidFake("portal", rnd.chance(0.7) ? 1 : rnd.int(2, 4)),
      nome,
      email: `${nome.toLowerCase().replace(/\s+/g, ".")}@email.com`,
      telefone: `24 9${rnd.int(1000, 9999)}-${rnd.int(1000, 9999)}`,
      objetivo: rnd.chance(0.7) ? "comprar" : "alugar",
      tipo_id: String(rnd.int(1, 5)),
      cidade_id: "1",
      bairro_id: String(rnd.int(1, 20)),
      valor_min: rnd.int(2, 6) * 100000,
      valor_max: rnd.int(7, 15) * 100000,
      dentro_condominio: rnd.chance(0.5) ? true : null,
      recurso: rnd.pick(["financiamento", "a_vista", "fgts", null] as const),
      mensagem: "Procuro imóvel com pelo menos 3 quartos e garagem.",
      parceiro: rnd.chance(0.6),
      criado_em: dataAtras(rnd.int(0, 90)),
    };
  });
}

function criarEstado(): MockState {
  const imoveis = gerarImoveis();
  return {
    imoveis,
    anunciantes: ANUNCIANTES.map((a) => ({ ...a })),
    usuarios: ANUNCIANTES.map((a) => ({ anunciante_id: a.id, email: a.email, senha: "123456" })),
    mensagens: gerarMensagens(imoveis),
    encomendas: gerarEncomendas(),
    contatos: [],
    cliques: gerarCliques(imoveis),
    pesquisas: [],
    leads: [],
    seq: 100000,
  };
}

const chave = "__portal_mock_state__";
type G = typeof globalThis & { [chave]?: MockState };

/** Estado único por processo; sobrevive ao HMR do Next em desenvolvimento. */
export function getStore(): MockState {
  const g = globalThis as G;
  if (!g[chave]) g[chave] = criarEstado();
  return g[chave]!;
}

export function proximoId(prefixo: string) {
  const s = getStore();
  s.seq += 1;
  return uuidFake(prefixo, s.seq);
}

export function resetarStore() {
  (globalThis as G)[chave] = criarEstado();
}
