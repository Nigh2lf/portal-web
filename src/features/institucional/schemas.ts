import { z } from "zod";

export const leadSiteSchema = z.object({
  nome: z.string().trim().min(3, "Informe seu nome"),
  email: z.email("Informe um e-mail válido"),
  telefone: z.string().refine((v) => v.replace(/\D/g, "").length >= 10, "Informe um telefone com DDD"),
  imobiliaria: z.string().trim().min(2, "Informe o nome da imobiliária ou escreva 'autônomo'"),
  mensagem: z.string().trim().max(2000, "Mensagem muito longa").optional(),
});

export type LeadSiteForm = z.infer<typeof leadSiteSchema>;
