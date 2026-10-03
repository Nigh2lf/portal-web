import { z } from "zod";

export const ASSUNTOS_CONTATO = ["Dúvida sobre um imóvel", "Quero anunciar", "Planos e pagamento", "Publicidade no portal", "Denunciar anúncio", "Sugestão ou reclamação", "Outro assunto"] as const;

export const contatoSchema = z.object({
  nome: z.string().trim().min(3, "Informe seu nome"),
  email: z.email("Informe um e-mail válido"),
  telefone: z.string().refine((v) => v.replace(/\D/g, "").length >= 10, "Informe um telefone com DDD"),
  assunto: z.string().trim().min(3, "Informe o assunto"),
  mensagem: z.string().trim().min(10, "Escreva uma mensagem com pelo menos 10 caracteres").max(3000, "Mensagem muito longa"),
  recaptcha_token: z.string().optional(),
});

export type ContatoForm = z.infer<typeof contatoSchema>;
