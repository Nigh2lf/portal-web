import { z } from "zod";
import { somenteDigitos } from "@/features/contato/lib/mascaras";

// --------------------------------------------------------------- CPF / CNPJ

export function validarCPF(valor: string) {
  const d = somenteDigitos(valor);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const calc = (tam: number) => {
    let soma = 0;
    for (let i = 0; i < tam; i++) soma += Number(d[i]) * (tam + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return calc(9) === Number(d[9]) && calc(10) === Number(d[10]);
}

export function validarCNPJ(valor: string) {
  const d = somenteDigitos(valor);
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const calc = (tam: number) => {
    let soma = 0;
    let pos = tam - 7;
    for (let i = tam; i >= 1; i--) {
      soma += Number(d[tam - i]) * pos--;
      if (pos < 2) pos = 9;
    }
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === Number(d[12]) && calc(13) === Number(d[13]);
}

// ------------------------------------------------------------------- login

export const loginSchema = z.object({
  email: z.email("Informe um e-mail válido"),
  senha: z.string().min(1, "Informe a senha"),
  next: z.string().optional(),
});

export type LoginForm = z.infer<typeof loginSchema>;

// ---------------------------------------------------------- recuperar senha

export const recuperarSenhaSchema = z.object({
  email: z.email("Informe um e-mail válido"),
});

export type RecuperarSenhaForm = z.infer<typeof recuperarSenhaSchema>;

// ---------------------------------------------------------------- cadastro

export const TIPOS_ANUNCIANTE = [
  {
    valor: "proprietario",
    titulo: "Proprietário",
    descricao: "Quero anunciar o meu próprio imóvel. Plano grátis.",
    documento: "CPF",
  },
  {
    valor: "corretor",
    titulo: "Corretor",
    descricao: "Sou corretor autônomo com CRECI e tenho vários imóveis.",
    documento: "CPF",
  },
  {
    valor: "imobiliaria",
    titulo: "Imobiliária",
    descricao: "Represento uma empresa e quero divulgar a carteira completa.",
    documento: "CNPJ",
  },
] as const;

const telefone = z.string().refine((v) => somenteDigitos(v).length >= 10, "Informe um telefone com DDD");

export const cadastroSchema = z
  .object({
    tipo: z.enum(["proprietario", "corretor", "imobiliaria"], { error: "Escolha o seu perfil" }),
    plano_id: z.string().min(1, "Selecione um plano"),
    nome: z.string().trim().min(3, "Informe o nome completo ou razão social"),
    documento: z.string().min(1, "Informe o documento"),
    email: z.email("Informe um e-mail válido"),
    senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
    confirmar_senha: z.string().min(1, "Confirme a senha"),
    telefone,
    telefone2: z.string().optional(),
    contato: z.string().optional(),
    site: z.string().optional(),
    endereco: z.string().optional(),
    creci: z.string().optional(),
    cupom: z.string().optional(),
    aceite_termos: z.boolean().refine((v) => v, "Você precisa aceitar os Termos de Uso"),
  })
  .superRefine((d, ctx) => {
    if (d.tipo === "imobiliaria") {
      if (!validarCNPJ(d.documento)) ctx.addIssue({ code: "custom", path: ["documento"], message: "CNPJ inválido" });
    } else if (!validarCPF(d.documento)) {
      ctx.addIssue({ code: "custom", path: ["documento"], message: "CPF inválido" });
    }
    if (d.senha !== d.confirmar_senha) {
      ctx.addIssue({ code: "custom", path: ["confirmar_senha"], message: "As senhas não são iguais" });
    }
    if (d.telefone2 && somenteDigitos(d.telefone2).length > 0 && somenteDigitos(d.telefone2).length < 10) {
      ctx.addIssue({ code: "custom", path: ["telefone2"], message: "Telefone incompleto" });
    }
    if (d.tipo !== "proprietario" && !d.creci?.trim()) {
      ctx.addIssue({ code: "custom", path: ["creci"], message: "Informe o CRECI" });
    }
  });

export type CadastroForm = z.infer<typeof cadastroSchema>;

/** Campos de cada etapa do wizard, para validação parcial. */
export const CAMPOS_ETAPA: Record<1 | 2 | 3, Array<keyof CadastroForm>> = {
  1: ["tipo"],
  2: ["plano_id"],
  3: ["nome", "documento", "email", "senha", "confirmar_senha", "telefone", "telefone2", "contato", "site", "endereco", "creci", "cupom", "aceite_termos"],
};

export const cadastroValoresIniciais: CadastroForm = {
  tipo: "proprietario",
  plano_id: "",
  nome: "",
  documento: "",
  email: "",
  senha: "",
  confirmar_senha: "",
  telefone: "",
  telefone2: "",
  contato: "",
  site: "",
  endereco: "",
  creci: "",
  cupom: "",
  aceite_termos: false,
};
