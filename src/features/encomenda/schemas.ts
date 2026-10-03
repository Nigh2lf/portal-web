import { z } from "zod";

export const OBJETIVOS_ENCOMENDA = [
  { valor: "comprar", label: "Comprar" },
  { valor: "alugar", label: "Alugar" },
  { valor: "temporada", label: "Temporada" },
] as const;

export const RECURSOS_ENCOMENDA = [
  { valor: "financiamento", label: "Financiamento bancário" },
  { valor: "a_vista", label: "À vista" },
  { valor: "fgts", label: "FGTS" },
  { valor: "permuta", label: "Permuta" },
] as const;

export const CONDOMINIO_OPCOES = [
  { valor: "indiferente", label: "Indiferente" },
  { valor: "dentro", label: "Dentro de condomínio" },
  { valor: "fora", label: "Fora de condomínio" },
] as const;

const telefone = z.string().refine((v) => v.replace(/\D/g, "").length >= 10, "Informe um telefone com DDD");

export const encomendaSchema = z.object({
  nome: z.string().trim().min(3, "Informe seu nome"),
  email: z.email("Informe um e-mail válido"),
  telefone,
  objetivo: z.enum(["comprar", "alugar", "temporada"], { error: "Selecione o objetivo" }),
  tipo_id: z.string().optional(),
  cidade_id: z.string().optional(),
  bairro_id: z.string().optional(),
  valor_min: z.string().optional(),
  valor_max: z.string().optional(),
  condominio: z.enum(["indiferente", "dentro", "fora"]),
  recurso: z.string().optional(),
  mensagem: z.string().trim().max(2000, "Mensagem muito longa").optional(),
  recaptcha_token: z.string().optional(),
});

export type EncomendaForm = z.infer<typeof encomendaSchema>;

export const encomendaValoresIniciais: EncomendaForm = {
  nome: "",
  email: "",
  telefone: "",
  objetivo: "comprar",
  tipo_id: "",
  cidade_id: "",
  bairro_id: "",
  valor_min: "",
  valor_max: "",
  condominio: "indiferente",
  recurso: "",
  mensagem: "",
};
