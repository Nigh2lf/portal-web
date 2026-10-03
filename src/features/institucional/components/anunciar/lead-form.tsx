"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Campo } from "@/features/contato/components/campo";
import { aplicarErros, mensagemErro } from "@/features/contato/lib/form";
import { mascaraTelefone } from "@/features/contato/lib/mascaras";
import { enviarLeadSite } from "../../actions";
import { leadSiteSchema, type LeadSiteForm as Valores } from "../../schemas";

const iniciais: Valores = { nome: "", email: "", telefone: "", imobiliaria: "", mensagem: "" };

export function LeadForm() {
  const [enviando, startTransition] = useTransition();
  const [sucesso, setSucesso] = useState<string | null>(null);
  const { register, handleSubmit, setError, setValue, reset, formState: { errors } } = useForm<Valores>({
    resolver: zodResolver(leadSiteSchema),
    defaultValues: iniciais,
  });

  const onSubmit = handleSubmit((valores) => {
    startTransition(async () => {
      const r = await enviarLeadSite(valores);
      if (r.ok) {
        setSucesso(r.mensagem ?? "Recebemos seu interesse.");
        reset(iniciais);
      } else {
        aplicarErros(r, setError);
        toast.error(mensagemErro(r, "Revise os campos destacados."));
      }
    });
  });

  if (sucesso) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center" role="status">
        <CheckCircle2 className="size-10 text-success" aria-hidden />
        <h3 className="text-lg font-semibold">Obrigado!</h3>
        <p className="max-w-sm text-sm text-muted-foreground">{sucesso}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
      <Campo label="Nome" htmlFor="lead-nome" obrigatorio erro={errors.nome?.message}>
        <Input id="lead-nome" className="h-10" autoComplete="name" aria-invalid={!!errors.nome} {...register("nome")} />
      </Campo>
      <Campo label="Imobiliária" htmlFor="lead-imob" obrigatorio erro={errors.imobiliaria?.message}>
        <Input id="lead-imob" className="h-10" autoComplete="organization" placeholder="Nome da empresa ou 'autônomo'" aria-invalid={!!errors.imobiliaria} {...register("imobiliaria")} />
      </Campo>
      <Campo label="E-mail" htmlFor="lead-email" obrigatorio erro={errors.email?.message}>
        <Input id="lead-email" type="email" className="h-10" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
      </Campo>
      <Campo label="Telefone / WhatsApp" htmlFor="lead-tel" obrigatorio erro={errors.telefone?.message}>
        <Input id="lead-tel" type="tel" inputMode="tel" className="h-10" placeholder="(24) 99999-9999" aria-invalid={!!errors.telefone} {...register("telefone", { onChange: (e) => setValue("telefone", mascaraTelefone(e.target.value)) })} />
      </Campo>
      <Campo label="Mensagem" htmlFor="lead-msg" erro={errors.mensagem?.message} className="sm:col-span-2">
        <Textarea id="lead-msg" rows={3} className="min-h-20" placeholder="Quantos imóveis você tem? Usa algum CRM?" {...register("mensagem")} />
      </Campo>
      <div className="sm:col-span-2">
        <Button type="submit" size="lg" className="w-full bg-cta text-cta-foreground hover:bg-cta/90" disabled={enviando}>
          {enviando ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Send data-icon="inline-start" />}
          {enviando ? "Enviando..." : "Quero saber mais"}
        </Button>
      </div>
    </form>
  );
}
