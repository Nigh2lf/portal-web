"use client";

import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { enviarContato } from "../actions";
import { aplicarErros, mensagemErro } from "../lib/form";
import { mascaraTelefone } from "../lib/mascaras";
import { ASSUNTOS_CONTATO, contatoSchema, type ContatoForm as Valores } from "../schemas";
import { useRecaptcha } from "../use-recaptcha";
import { Campo } from "./campo";

const iniciais: Valores = { nome: "", email: "", telefone: "", assunto: "", mensagem: "" };

export function ContatoForm({ assuntoInicial }: { assuntoInicial?: string }) {
  const [enviando, startTransition] = useTransition();
  const [sucesso, setSucesso] = useState<string | null>(null);
  const { ativo: recaptchaAtivo, obterToken } = useRecaptcha();
  const { register, control, handleSubmit, setError, setValue, reset, formState: { errors } } = useForm<Valores>({
    resolver: zodResolver(contatoSchema),
    defaultValues: { ...iniciais, assunto: assuntoInicial ?? "" },
  });

  const onSubmit = handleSubmit((valores) => {
    startTransition(async () => {
      const recaptcha_token = await obterToken("contato");
      const r = await enviarContato({ ...valores, recaptcha_token });
      if (r.ok) {
        setSucesso(r.mensagem ?? "Mensagem enviada.");
        toast.success(r.mensagem ?? "Mensagem enviada.");
        reset(iniciais);
      } else {
        aplicarErros(r, setError);
        toast.error(mensagemErro(r, "Revise os campos destacados."));
      }
    });
  });

  if (sucesso) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-success/30 bg-success/5 p-8 text-center" role="status">
        <CheckCircle2 className="size-10 text-success" aria-hidden />
        <h3 className="text-lg font-semibold">Mensagem enviada!</h3>
        <p className="max-w-md text-sm text-muted-foreground">{sucesso}</p>
        <Button type="button" variant="outline" onClick={() => setSucesso(null)}>
          Enviar outra mensagem
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="Nome" htmlFor="ctt-nome" obrigatorio erro={errors.nome?.message} className="sm:col-span-2">
          <Input id="ctt-nome" className="h-10" autoComplete="name" aria-invalid={!!errors.nome} {...register("nome")} />
        </Campo>
        <Campo label="E-mail" htmlFor="ctt-email" obrigatorio erro={errors.email?.message}>
          <Input id="ctt-email" type="email" className="h-10" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
        </Campo>
        <Campo label="Telefone / WhatsApp" htmlFor="ctt-telefone" obrigatorio erro={errors.telefone?.message}>
          <Input
            id="ctt-telefone"
            type="tel"
            inputMode="tel"
            className="h-10"
            autoComplete="tel"
            placeholder="(24) 99999-9999"
            aria-invalid={!!errors.telefone}
            {...register("telefone", { onChange: (e) => setValue("telefone", mascaraTelefone(e.target.value)) })}
          />
        </Campo>
        <Campo label="Assunto" htmlFor="ctt-assunto" obrigatorio erro={errors.assunto?.message} className="sm:col-span-2">
          <Controller
            control={control}
            name="assunto"
            render={({ field }) => (
              <Select value={field.value || undefined} onValueChange={field.onChange}>
                <SelectTrigger id="ctt-assunto" className="h-10 w-full" aria-invalid={!!errors.assunto}>
                  <SelectValue placeholder="Selecione o assunto" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {ASSUNTOS_CONTATO.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Campo>
        <Campo label="Mensagem" htmlFor="ctt-mensagem" obrigatorio erro={errors.mensagem?.message} className="sm:col-span-2">
          <Textarea id="ctt-mensagem" rows={6} className="min-h-32" aria-invalid={!!errors.mensagem} {...register("mensagem")} />
        </Campo>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {recaptchaAtivo ? "Protegido por reCAPTCHA. Aplicam-se a Política de Privacidade e os Termos do Google." : "Respondemos em horário comercial, normalmente em até 1 dia útil."}
        </p>
        <Button type="submit" size="lg" disabled={enviando}>
          {enviando ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Send data-icon="inline-start" />}
          {enviando ? "Enviando..." : "Enviar mensagem"}
        </Button>
      </div>
    </form>
  );
}
