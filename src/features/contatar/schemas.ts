import { z } from "zod";

export const PREFERENCIAS = [
  { valor: "whatsapp", label: "WhatsApp" },
  { valor: "telefone", label: "Telefone" },
  { valor: "email", label: "E-mail" },
] as const;

export const contatarSchema = z.object({
  imovel_id: z.string().min(1, "Imóvel inválido."),
  nome: z.string().trim().min(3, "Informe seu nome.").max(120),
  email: z.email("Informe um e-mail válido.").max(160),
  telefone: z
    .string()
    .trim()
    .refine((v) => v.replace(/\D/g, "").length >= 10, "Informe um telefone com DDD."),
  mensagem: z.string().trim().min(10, "Escreva uma mensagem com pelo menos 10 caracteres.").max(2000),
  preferencias: z.array(z.enum(["whatsapp", "telefone", "email"])).min(1, "Escolha ao menos uma forma de contato."),
});

export type ContatarValores = z.infer<typeof contatarSchema>;

export function mensagemPadrao(codigo: string, titulo: string, portalNome: string) {
  return `Olá, vi o imóvel ${codigo} (${titulo}) no ${portalNome} e gostaria de mais informações.`;
}
