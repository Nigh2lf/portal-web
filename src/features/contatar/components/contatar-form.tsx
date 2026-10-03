"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheck, LoaderCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { contatarAnunciante } from "@/features/contatar/actions";
import { PREFERENCIAS, contatarSchema, mensagemPadrao, type ContatarValores } from "@/features/contatar/schemas";
import { cn } from "@/lib/utils";

export interface ContatarFormProps {
  imovelId: string;
  codigo: string;
  titulo: string;
  portalNome: string;
  onSucesso?: () => void;
  className?: string;
}

export function ContatarForm({ imovelId, codigo, titulo, portalNome, onSucesso, className }: ContatarFormProps) {
  const [enviado, setEnviado] = useState(false);
  const form = useForm<ContatarValores>({
    resolver: zodResolver(contatarSchema),
    defaultValues: {
      imovel_id: imovelId,
      nome: "",
      email: "",
      telefone: "",
      mensagem: mensagemPadrao(codigo, titulo, portalNome),
      preferencias: ["whatsapp"],
    },
  });
  const { register, handleSubmit, control, setError, formState } = form;
  const { errors, isSubmitting } = formState;

  async function enviar(valores: ContatarValores) {
    const r = await contatarAnunciante(valores);
    if (!r.ok) {
      if (r.erros) {
        for (const [campo, msgs] of Object.entries(r.erros)) {
          setError(campo as keyof ContatarValores, { message: msgs[0] });
        }
      }
      toast.error(r.mensagem ?? "Não foi possível enviar sua mensagem.");
      return;
    }
    toast.success(r.mensagem ?? "Mensagem enviada ao anunciante.");
    setEnviado(true);
    onSucesso?.();
  }

  if (enviado) {
    return (
      <div className={cn("flex flex-col items-center gap-3 rounded-xl bg-brand-soft/60 p-6 text-center", className)}>
        <CircleCheck className="size-10 text-success" aria-hidden />
        <p className="font-heading text-lg font-semibold text-brand">Mensagem enviada!</p>
        <p className="text-sm text-muted-foreground">O anunciante recebeu seu contato e deve responder em breve pelos canais que você escolheu.</p>
        <Button type="button" variant="outline" size="sm" onClick={() => setEnviado(false)}>
          Enviar outra mensagem
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(enviar)} noValidate className={cn("grid gap-3.5", className)}>
      <input type="hidden" {...register("imovel_id")} />
      <div className="grid gap-1.5">
        <Label htmlFor={`${imovelId}-nome`}>Nome</Label>
        <Input id={`${imovelId}-nome`} autoComplete="name" placeholder="Seu nome" aria-invalid={!!errors.nome} className="h-10" {...register("nome")} />
        <Erro msg={errors.nome?.message} />
      </div>
      <div className="grid gap-3.5 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor={`${imovelId}-email`}>E-mail</Label>
          <Input id={`${imovelId}-email`} type="email" autoComplete="email" placeholder="voce@exemplo.com" aria-invalid={!!errors.email} className="h-10" {...register("email")} />
          <Erro msg={errors.email?.message} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`${imovelId}-telefone`}>Telefone</Label>
          <Input id={`${imovelId}-telefone`} type="tel" inputMode="tel" autoComplete="tel" placeholder="(24) 99999-9999" aria-invalid={!!errors.telefone} className="h-10" {...register("telefone")} />
          <Erro msg={errors.telefone?.message} />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={`${imovelId}-mensagem`}>Mensagem</Label>
        <Textarea id={`${imovelId}-mensagem`} rows={4} aria-invalid={!!errors.mensagem} {...register("mensagem")} />
        <Erro msg={errors.mensagem?.message} />
      </div>
      <fieldset className="grid gap-2">
        <legend className="mb-1 text-sm font-medium">Como prefere ser contatado?</legend>
        <Controller
          control={control}
          name="preferencias"
          render={({ field }) => (
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {PREFERENCIAS.map((p) => {
                const marcado = field.value.includes(p.valor);
                return (
                  <label key={p.valor} className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                      checked={marcado}
                      onCheckedChange={(v) => field.onChange(v ? [...field.value, p.valor] : field.value.filter((x) => x !== p.valor))}
                      aria-invalid={!!errors.preferencias}
                    />
                    {p.label}
                  </label>
                );
              })}
            </div>
          )}
        />
        <Erro msg={errors.preferencias?.message} />
      </fieldset>
      <Button type="submit" size="lg" disabled={isSubmitting} className="mt-1 w-full bg-cta text-cta-foreground hover:bg-cta/90">
        {isSubmitting ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : <Send data-icon="inline-start" />}
        {isSubmitting ? "Enviando..." : "Enviar mensagem"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">Seus dados são enviados apenas ao anunciante deste imóvel.</p>
    </form>
  );
}

function Erro({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p role="alert" className="text-xs text-destructive">
      {msg}
    </p>
  );
}
