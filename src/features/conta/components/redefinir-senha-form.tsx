"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Campo } from "@/features/contato/components/campo";
import { aplicarErros, mensagemErro } from "@/features/contato/lib/form";
import { redefinirSenha } from "../actions";
import { redefinirSenhaSchema, type RedefinirSenhaForm as Valores } from "../schemas";

export function RedefinirSenhaForm({ email, hash }: { email: string; hash: string }) {
  const [enviando, startTransition] = useTransition();
  const [sucesso, setSucesso] = useState<string | null>(null);
  const { register, handleSubmit, setError, formState: { errors } } = useForm<Valores>({
    resolver: zodResolver(redefinirSenhaSchema),
    defaultValues: { email, hash, senha: "", confirmar: "" },
  });

  const onSubmit = handleSubmit((valores) => {
    startTransition(async () => {
      const r = await redefinirSenha(valores);
      if (r.ok) setSucesso(r.mensagem ?? "Senha redefinida.");
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
          <CheckCircle2 className="size-7" aria-hidden />
        </span>
        <h2 className="text-xl font-semibold">Senha redefinida</h2>
        <p className="max-w-sm text-sm text-muted-foreground">{sucesso}</p>
        <Button asChild size="lg" className="mt-2">
          <Link href="/anunciar">Entrar com a nova senha</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <input type="hidden" {...register("email")} />
      <input type="hidden" {...register("hash")} />
      {errors.hash?.message && <p className="text-sm text-destructive">{errors.hash.message}</p>}
      <Campo label="Nova senha" htmlFor="nova-senha" erro={errors.senha?.message}>
        <Input id="nova-senha" type="password" className="h-11" autoComplete="new-password" aria-invalid={!!errors.senha} {...register("senha")} />
      </Campo>
      <Campo label="Confirmar nova senha" htmlFor="confirmar-senha" erro={errors.confirmar?.message}>
        <Input id="confirmar-senha" type="password" className="h-11" autoComplete="new-password" aria-invalid={!!errors.confirmar} {...register("confirmar")} />
      </Campo>
      <Button type="submit" size="lg" className="w-full" disabled={enviando}>
        {enviando ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <LockKeyhole data-icon="inline-start" />}
        Salvar nova senha
      </Button>
    </form>
  );
}
