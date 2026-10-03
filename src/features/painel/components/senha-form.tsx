"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { alterarSenhaAction } from "../actions";
import { senhaSchema, type SenhaFormValues } from "../schemas";
import { Campo, a11yCampo } from "./campo";

export function SenhaForm() {
  const [pendente, iniciar] = useTransition();
  const form = useForm<SenhaFormValues>({
    resolver: zodResolver(senhaSchema),
    defaultValues: { senha_atual: "", senha_nova: "", confirmar: "" },
  });
  const { register, handleSubmit, setError, reset, formState } = form;
  const erros = formState.errors;

  const onSubmit = handleSubmit((valores) => {
    iniciar(async () => {
      const r = await alterarSenhaAction(valores);
      if (r.ok) {
        toast.success(r.mensagem ?? "Senha alterada com sucesso.");
        reset();
        return;
      }
      if (r.erros) {
        for (const [campo, msgs] of Object.entries(r.erros)) setError(campo as keyof SenhaFormValues, { message: msgs[0] });
      }
      toast.error(r.mensagem ?? "Não foi possível alterar a senha.");
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Trocar senha</CardTitle>
          <CardDescription>Use ao menos 6 caracteres. Você continuará conectado após a troca.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Campo id="senha_atual" rotulo="Senha atual" obrigatorio erro={erros.senha_atual?.message}>
            <Input type="password" autoComplete="current-password" {...register("senha_atual")} {...a11yCampo("senha_atual", erros.senha_atual?.message)} />
          </Campo>
          <Campo id="senha_nova" rotulo="Nova senha" obrigatorio erro={erros.senha_nova?.message}>
            <Input type="password" autoComplete="new-password" {...register("senha_nova")} {...a11yCampo("senha_nova", erros.senha_nova?.message)} />
          </Campo>
          <Campo id="confirmar" rotulo="Confirmar nova senha" obrigatorio erro={erros.confirmar?.message}>
            <Input type="password" autoComplete="new-password" {...register("confirmar")} {...a11yCampo("confirmar", erros.confirmar?.message)} />
          </Campo>
          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={pendente}>
              {pendente ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <KeyRound data-icon="inline-start" />}
              Alterar senha
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
