import { z } from "zod";
import type { Imovel, ImovelPayload, ImovelTaxa, Infraestrutura } from "@/lib/api/types";

const texto = (max: number) => z.string().trim().max(max, `Máximo de ${max} caracteres.`);
const opcional = (max: number) => texto(max).optional().or(z.literal(""));
const telefone = z
  .string()
  .trim()
  .refine((v) => v.replace(/\D/g, "").length >= 10, "Informe um telefone com DDD.");

// ---------------------------------------------------------------- perfil
export const perfilSchema = z.object({
  nome: texto(120).min(3, "Informe o nome para exibição."),
  email: z.email("Informe um e-mail válido."),
  telefone,
  telefone2: opcional(20),
  whatsapp: opcional(20),
  contato: opcional(120),
  site: opcional(200),
  endereco: opcional(250),
  creci: opcional(30),
});
export type PerfilFormValues = z.infer<typeof perfilSchema>;

// ---------------------------------------------------------------- senha
export const senhaSchema = z
  .object({
    senha_atual: z.string().min(1, "Informe a senha atual."),
    senha_nova: z.string().min(6, "A nova senha deve ter ao menos 6 caracteres.").max(72, "Senha muito longa."),
    confirmar: z.string().min(1, "Confirme a nova senha."),
  })
  .refine((v) => v.senha_nova === v.confirmar, { path: ["confirmar"], message: "As senhas não são iguais." });
export type SenhaFormValues = z.infer<typeof senhaSchema>;

// ---------------------------------------------------------------- imóvel
const inteiro = (max: number) => z.number().int("Use um número inteiro.").min(0, "Não pode ser negativo.").max(max, `Máximo ${max}.`);
const valorOpcional = z.number().min(0, "Não pode ser negativo.").nullable();
const periodicidade = z.enum(["anual", "mensal"]);
export const DESCRICAO_MAX = 4000;

export const imovelSchema = z
  .object({
    codigo: z
      .string()
      .trim()
      .min(1, "Informe o código do imóvel.")
      .max(12, "O código tem no máximo 12 caracteres.")
      .regex(/^[A-Za-z0-9._-]+$/, "Use apenas letras, números, ponto, hífen ou sublinhado."),
    ativo: z.boolean(),
    destaque: z.boolean(),
    dentro_condominio: z.boolean(),
    tipo_id: z.string().min(1, "Selecione o tipo do imóvel."),
    cidade_id: z.string().min(1, "Selecione a cidade."),
    bairro_id: z.string().min(1, "Selecione o bairro."),
    quartos: inteiro(50),
    suites: inteiro(50),
    banheiros: inteiro(50),
    vagas: inteiro(100),
    area_construida: valorOpcional,
    area_total: valorOpcional,
    preco_venda: valorOpcional,
    preco_locacao: valorOpcional,
    preco_temporada: valorOpcional,
    iptu_valor: valorOpcional,
    iptu_periodo: periodicidade,
    condominio_valor: valorOpcional,
    condominio_periodo: periodicidade,
    descricao: z.string().trim().min(20, "Descreva o imóvel com ao menos 20 caracteres.").max(DESCRICAO_MAX, `Máximo de ${DESCRICAO_MAX} caracteres.`),
    infraestrutura: z.array(z.string()),
    infra_condominio: z.array(z.string()),
  })
  .refine((v) => (v.preco_venda ?? 0) > 0 || (v.preco_locacao ?? 0) > 0 || (v.preco_temporada ?? 0) > 0, {
    path: ["preco_venda"],
    message: "Coloque preço em pelo menos uma forma de negociação (venda, locação ou temporada).",
  })
  .refine((v) => v.suites <= v.quartos, { path: ["suites"], message: "Suítes não podem exceder o número de quartos." });

export type ImovelFormValues = z.infer<typeof imovelSchema>;

export const IMOVEL_VALORES_INICIAIS: ImovelFormValues = {
  codigo: "",
  ativo: true,
  destaque: false,
  dentro_condominio: false,
  tipo_id: "",
  cidade_id: "",
  bairro_id: "",
  quartos: 0,
  suites: 0,
  banheiros: 0,
  vagas: 0,
  area_construida: null,
  area_total: null,
  preco_venda: null,
  preco_locacao: null,
  preco_temporada: null,
  iptu_valor: null,
  iptu_periodo: "anual",
  condominio_valor: null,
  condominio_periodo: "mensal",
  descricao: "",
  infraestrutura: [],
  infra_condominio: [],
};

const TAXA_IPTU = "IPTU";
const TAXA_CONDOMINIO = "Condomínio";

function periodo(obs: string | null): "anual" | "mensal" | null {
  if (!obs) return null;
  const o = obs.toLowerCase();
  if (o.startsWith("anu")) return "anual";
  if (o.startsWith("men")) return "mensal";
  return null;
}

/** Os checkboxes de infraestrutura guardam ids; o imóvel traz nomes. Com o catálogo, converte nomes em ids. */
function idsDeInfra(valores: string[], catalogo: Infraestrutura[] | undefined) {
  if (!catalogo?.length) return [...valores];
  const porNome = new Map(catalogo.map((c) => [c.nome.trim().toLowerCase(), c.id]));
  const ids = new Set(catalogo.map((c) => c.id));
  return valores.map((v) => (ids.has(v) ? v : porNome.get(v.trim().toLowerCase()))).filter((v): v is string => Boolean(v));
}

/** Converte um imóvel existente nos valores do formulário. */
export function imovelParaForm(i: Imovel, infraestruturas?: Infraestrutura[]): ImovelFormValues {
  const iptu = i.taxas.find((t) => t.descricao.toLowerCase() === TAXA_IPTU.toLowerCase());
  const cond = i.taxas.find((t) => t.descricao.toLowerCase().startsWith("condom"));
  return {
    codigo: i.codigo,
    ativo: i.ativo,
    destaque: i.destaque,
    dentro_condominio: i.dentro_condominio,
    tipo_id: i.tipo_id,
    cidade_id: i.cidade_id,
    bairro_id: i.bairro_id,
    quartos: i.quartos,
    suites: i.suites,
    banheiros: i.banheiros,
    vagas: i.vagas,
    area_construida: i.area_construida,
    area_total: i.area_total,
    preco_venda: i.preco_venda,
    preco_locacao: i.preco_locacao,
    preco_temporada: i.preco_temporada,
    iptu_valor: iptu?.valor ?? null,
    iptu_periodo: periodo(iptu?.observacao ?? null) ?? "anual",
    condominio_valor: cond?.valor ?? null,
    condominio_periodo: periodo(cond?.observacao ?? null) ?? "mensal",
    descricao: i.descricao,
    infraestrutura: idsDeInfra(i.infraestrutura, infraestruturas),
    infra_condominio: idsDeInfra(i.infra_condominio, infraestruturas),
  };
}

/** Converte os valores validados do formulário no payload da API. */
export function formParaPayload(v: ImovelFormValues): ImovelPayload {
  const taxas: ImovelTaxa[] = [];
  if (v.iptu_valor && v.iptu_valor > 0) taxas.push({ descricao: TAXA_IPTU, valor: v.iptu_valor, observacao: v.iptu_periodo });
  if (v.condominio_valor && v.condominio_valor > 0) taxas.push({ descricao: TAXA_CONDOMINIO, valor: v.condominio_valor, observacao: v.condominio_periodo });
  const zeroParaNulo = (n: number | null) => (n && n > 0 ? n : null);
  return {
    codigo: v.codigo.trim(),
    ativo: v.ativo,
    destaque: v.destaque,
    tipo_id: v.tipo_id,
    cidade_id: v.cidade_id,
    bairro_id: v.bairro_id,
    dentro_condominio: v.dentro_condominio,
    quartos: v.quartos,
    suites: v.suites,
    banheiros: v.banheiros,
    vagas: v.vagas,
    area_construida: zeroParaNulo(v.area_construida),
    area_total: zeroParaNulo(v.area_total),
    preco_venda: zeroParaNulo(v.preco_venda),
    preco_locacao: zeroParaNulo(v.preco_locacao),
    preco_temporada: zeroParaNulo(v.preco_temporada),
    taxas,
    descricao: v.descricao.trim(),
    infraestrutura: v.infraestrutura,
    infra_condominio: v.dentro_condominio ? v.infra_condominio : [],
  };
}

/** Payload equivalente ao estado atual de um imóvel (para ativar/desativar sem reenviar o formulário). */
export function payloadDeImovel(i: Imovel): ImovelPayload {
  return {
    codigo: i.codigo,
    ativo: i.ativo,
    destaque: i.destaque,
    tipo_id: i.tipo_id,
    cidade_id: i.cidade_id,
    bairro_id: i.bairro_id,
    dentro_condominio: i.dentro_condominio,
    quartos: i.quartos,
    suites: i.suites,
    banheiros: i.banheiros,
    vagas: i.vagas,
    area_construida: i.area_construida,
    area_total: i.area_total,
    preco_venda: i.preco_venda,
    preco_locacao: i.preco_locacao,
    preco_temporada: i.preco_temporada,
    taxas: i.taxas.map((t) => ({ ...t })),
    descricao: i.descricao,
    infraestrutura: [...i.infraestrutura],
    infra_condominio: [...i.infra_condominio],
  };
}
