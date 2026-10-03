"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, MailCheck, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Campo } from "@/features/contato/components/campo";
import { aplicarErros, mensagemErro } from "@/features/contato/lib/form";
import { recuperarSenha } from "../actions";
import { recuperarSenhaSchema, type RecuperarSenhaForm as Valores } from "../schemas";

export function RecuperarSenhaForm() {
  const [enviando, startTransition] = useTransition();
  const [sucesso, setSucesso] = useState<string | null>(null);
  const { register, handleSubmit, setError, formState: { errors } } = useForm<Valores>({
    resolver: zodResolver(recuperarSenhaSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit((valores) => {
    startTransition(async () => {
      const r = await recuperarSenha(valores);
      if (r.ok) setSucesso(r.mensagem ?? "Se o e-mail estiver cadastrado, enviamos as instruções.");
      else {
        aplicarErros(r, setError);
        toast.error(mensagemErro(r));
      }
    });
  });

  if (sucesso) {
    return (
      <div className="flex flex-col items-center gap-3 text-center" role="status">
        <span className="flex size-14 items-center justify-center rounded-full bg-success/15 text-success">
          <MailCheck className="size-7" aria-hidden />
        </span>
        <h2 className="text-xl font-semibold">Verifique seu e-mail</h2>
        <p className="max-w-sm text-sm text-muted-foreground">{sucesso}</p>
        <p className="text-xs text-muted-foreground">O link é válido por 1 hora. Não recebeu? Confira a caixa de spam.</p>
        <Button asChild variant="outline" className="mt-2">
          <Link href="/anunciar">
            <ArrowLeft data-icon="inline-start" />
            Voltar ao login
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <Campo label="E-mail cadastrado" htmlFor="rec-email" erro={errors.email?.message}>
        <Input id="rec-email" type="email" className="h-11" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
      </Campo>
      <Button type="submit" size="lg" className="w-full" disabled={enviando}>
        {enviando ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Send data-icon="inline-start" />}
        {enviando ? "Enviando..." : "Enviar link de redefinição"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Lembrou a senha?{" "}
        <Link href="/anunciar" className="font-semibold text-brand underline-offset-4 hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
