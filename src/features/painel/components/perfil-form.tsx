"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Anunciante } from "@/lib/api/types";
import { atualizarPerfilAction } from "../actions";
import { perfilSchema, type PerfilFormValues } from "../schemas";
import { Campo, a11yCampo } from "./campo";

export function PerfilForm({ anunciante }: { anunciante: Anunciante }) {
  const [pendente, iniciar] = useTransition();
  const proprietario = anunciante.tipo === "proprietario";

  const form = useForm<PerfilFormValues>({
    resolver: zodResolver(perfilSchema),
    defaultValues: {
      nome: anunciante.nome,
      email: anunciante.email,
      telefone: anunciante.telefone,
      telefone2: anunciante.telefone2 ?? "",
      whatsapp: anunciante.whatsapp ?? "",
      contato: anunciante.contato ?? "",
      site: anunciante.site ?? "",
      endereco: anunciante.endereco ?? "",
      creci: anunciante.creci ?? "",
    },
  });
  const { register, handleSubmit, setError, formState } = form;
  const erros = formState.errors;

  const onSubmit = handleSubmit((valores) => {
    iniciar(async () => {
      const r = await atualizarPerfilAction(valores);
      if (r.ok) {
        toast.success(r.mensagem ?? "Cadastro atualizado.");
        form.reset(valores);
        return;
      }
      if (r.erros) {
        for (const [campo, msgs] of Object.entries(r.erros)) {
          setError(campo as keyof PerfilFormValues, { message: msgs[0] });
        }
      }
      toast.error(r.mensagem ?? "Não foi possível salvar o cadastro.");
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Dados de contato</CardTitle>
          <CardDescription>Estas informações aparecem nos seus anúncios para os interessados.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Campo id="nome" rotulo="Nome para exibição" obrigatorio erro={erros.nome?.message} className="sm:col-span-2">
            <Input {...register("nome")} {...a11yCampo("nome", erros.nome?.message)} autoComplete="name" maxLength={120} />
          </Campo>
          <Campo id="email" rotulo="E-mail" obrigatorio erro={erros.email?.message} dica="Usado para login e para receber as ofertas." className="sm:col-span-2">
            <Input type="email" {...register("email")} {...a11yCampo("email", erros.email?.message)} autoComplete="email" />
          </Campo>
          <Campo id="telefone" rotulo="Telefone 1" obrigatorio erro={erros.telefone?.message}>
            <Input type="tel" inputMode="tel" placeholder="(XX) XXXX-XXXX" {...register("telefone")} {...a11yCampo("telefone", erros.telefone?.message)} autoComplete="tel" />
          </Campo>
          <Campo id="telefone2" rotulo="Telefone 2" erro={erros.telefone2?.message}>
            <Input type="tel" inputMode="tel" placeholder="(XX) XXXX-XXXX" {...register("telefone2")} {...a11yCampo("telefone2", erros.telefone2?.message)} />
          </Campo>
          <Campo id="whatsapp" rotulo="WhatsApp" erro={erros.whatsapp?.message} dica="Com DDD. Exibe o botão de WhatsApp nos anúncios.">
            <Input type="tel" inputMode="tel" placeholder="(XX) 9XXXX-XXXX" {...register("whatsapp")} {...a11yCampo("whatsapp", erros.whatsapp?.message)} />
          </Campo>
        </CardContent>
      </Card>

      {!proprietario && (
        <Card>
          <CardHeader>
            <CardTitle>Dados profissionais</CardTitle>
            <CardDescription>Informações da {anunciante.tipo === "imobiliaria" ? "imobiliária" : "sua atuação como corretor"}.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Campo id="contato" rotulo="Pessoa de contato" erro={erros.contato?.message}>
              <Input {...register("contato")} {...a11yCampo("contato", erros.contato?.message)} maxLength={120} />
            </Campo>
            <Campo id="creci" rotulo="CRECI" erro={erros.creci?.message}>
              <Input {...register("creci")} {...a11yCampo("creci", erros.creci?.message)} maxLength={30} />
            </Campo>
            <Campo id="site" rotulo="Site" erro={erros.site?.message} dica="Ex.: www.suaimobiliaria.com.br">
              <Input type="url" inputMode="url" {...register("site")} {...a11yCampo("site", erros.site?.message)} maxLength={200} />
            </Campo>
            <Campo id="endereco" rotulo="Endereço" erro={erros.endereco?.message}>
              <Input {...register("endereco")} {...a11yCampo("endereco", erros.endereco?.message)} maxLength={250} autoComplete="street-address" />
            </Campo>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">* Campos obrigatórios</p>
        <Button type="submit" disabled={pendente || !formState.isDirty}>
          {pendente ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Save data-icon="inline-start" />}
          Salvar alterações
        </Button>
      </div>
    </form>
  );
}
