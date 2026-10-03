"use client";

import { useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Bairro, Cidade, ImovelTipo } from "@/lib/api/types";
import { Campo } from "@/features/contato/components/campo";
import { aplicarErros, mensagemErro } from "@/features/contato/lib/form";
import { mascaraMoeda, mascaraTelefone } from "@/features/contato/lib/mascaras";
import { useRecaptcha } from "@/features/contato/use-recaptcha";
import { enviarEncomenda, listarBairrosEncomenda } from "../actions";
import { CONDOMINIO_OPCOES, OBJETIVOS_ENCOMENDA, RECURSOS_ENCOMENDA, encomendaSchema, encomendaValoresIniciais, type EncomendaForm as Valores } from "../schemas";

interface Props {
  tipos: ImovelTipo[];
  cidades: Cidade[];
  /** Bairros já carregados quando o portal tem uma única cidade. */
  bairrosIniciais?: Bairro[];
  parceiro?: boolean;
  /** Texto do botão. */
  rotulo?: string;
  className?: string;
}

const NENHUM = "__nenhum__";

export function EncomendaForm({ tipos, cidades, bairrosIniciais = [], parceiro = false, rotulo = "Enviar pedido", className }: Props) {
  const cidadeUnica = cidades.length === 1 ? cidades[0]!.id : "";
  const [bairros, setBairros] = useState<Bairro[]>(bairrosIniciais);
  const [carregandoBairros, startBairros] = useTransition();
  const [enviando, startEnvio] = useTransition();
  const [sucesso, setSucesso] = useState<string | null>(null);
  const { obterToken } = useRecaptcha();

  const form = useForm<Valores>({
    resolver: zodResolver(encomendaSchema),
    defaultValues: { ...encomendaValoresIniciais, cidade_id: cidadeUnica },
  });
  const { register, control, handleSubmit, setError, setValue, reset, formState: { errors } } = form;
  const cidadeId = useWatch({ control, name: "cidade_id" });

  function carregarBairros(novaCidade: string) {
    if (!novaCidade) {
      setBairros([]);
      return;
    }
    if (novaCidade === cidadeUnica && bairrosIniciais.length) {
      setBairros(bairrosIniciais);
      return;
    }
    startBairros(async () => {
      const lista = await listarBairrosEncomenda(novaCidade);
      setBairros(lista);
    });
  }

  const onSubmit = handleSubmit((valores) => {
    startEnvio(async () => {
      const recaptcha_token = await obterToken("encomenda");
      const r = await enviarEncomenda({ ...valores, recaptcha_token }, parceiro);
      if (r.ok) {
        setSucesso(r.mensagem ?? "Encomenda enviada com sucesso.");
        toast.success(r.mensagem ?? "Encomenda enviada.");
        reset({ ...encomendaValoresIniciais, cidade_id: cidadeUnica });
        setBairros(bairrosIniciais);
      } else {
        aplicarErros(r, setError);
        toast.error(mensagemErro(r, "Revise os campos destacados."));
      }
    });
  });

  if (sucesso) {
    return (
      <div className={`flex flex-col items-center gap-3 rounded-xl border border-success/30 bg-success/5 p-8 text-center ${className ?? ""}`} role="status">
        <CheckCircle2 className="size-10 text-success" aria-hidden />
        <h3 className="text-lg font-semibold">Pedido enviado!</h3>
        <p className="max-w-md text-sm text-muted-foreground">{sucesso}</p>
        <Button type="button" variant="outline" onClick={() => setSucesso(null)}>
          Fazer outra encomenda
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className={`space-y-6 ${className ?? ""}`}>
      <fieldset className="space-y-4">
        <legend className="mb-1 text-sm font-semibold text-brand">Seus dados</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Nome" htmlFor="enc-nome" obrigatorio erro={errors.nome?.message} className="sm:col-span-2">
            <Input id="enc-nome" className="h-10" autoComplete="name" aria-invalid={!!errors.nome} {...register("nome")} />
          </Campo>
          <Campo label="E-mail" htmlFor="enc-email" obrigatorio erro={errors.email?.message}>
            <Input id="enc-email" type="email" className="h-10" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
          </Campo>
          <Campo label="Telefone / WhatsApp" htmlFor="enc-telefone" obrigatorio erro={errors.telefone?.message}>
            <Input
              id="enc-telefone"
              type="tel"
              inputMode="tel"
              className="h-10"
              autoComplete="tel"
              placeholder="(24) 99999-9999"
              aria-invalid={!!errors.telefone}
              {...register("telefone", { onChange: (e) => setValue("telefone", mascaraTelefone(e.target.value)) })}
            />
          </Campo>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-1 text-sm font-semibold text-brand">O que você procura</legend>
        <Campo label="Objetivo" obrigatorio erro={errors.objetivo?.message}>
          <Controller
            control={control}
            name="objetivo"
            render={({ field }) => (
              <RadioGroup value={field.value} onValueChange={field.onChange} className="grid-cols-3 gap-2">
                {OBJETIVOS_ENCOMENDA.map((o) => (
                  <label
                    key={o.valor}
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors has-data-checked:border-brand has-data-checked:bg-brand-soft has-data-checked:text-brand hover:bg-muted"
                  >
                    <RadioGroupItem value={o.valor} className="sr-only" />
                    {o.label}
                  </label>
                ))}
              </RadioGroup>
            )}
          />
        </Campo>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Tipo de imóvel" htmlFor="enc-tipo" erro={errors.tipo_id?.message}>
            <Controller
              control={control}
              name="tipo_id"
              render={({ field }) => (
                <Select value={field.value || NENHUM} onValueChange={(v) => field.onChange(v === NENHUM ? "" : v)}>
                  <SelectTrigger id="enc-tipo" className="h-10 w-full">
                    <SelectValue placeholder="Qualquer tipo" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value={NENHUM}>Qualquer tipo</SelectItem>
                    {tipos.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Campo>
          <Campo label="Cidade" htmlFor="enc-cidade" erro={errors.cidade_id?.message}>
            <Controller
              control={control}
              name="cidade_id"
              render={({ field }) => (
                <Select
                  value={field.value || NENHUM}
                  onValueChange={(v) => {
                    const nova = v === NENHUM ? "" : v;
                    field.onChange(nova);
                    setValue("bairro_id", "");
                    carregarBairros(nova);
                  }}
                  disabled={cidades.length === 1}
                >
                  <SelectTrigger id="enc-cidade" className="h-10 w-full">
                    <SelectValue placeholder="Qualquer cidade" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {cidades.length !== 1 && <SelectItem value={NENHUM}>Qualquer cidade</SelectItem>}
                    {cidades.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome} - {c.uf}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Campo>
          <Campo label="Bairro" htmlFor="enc-bairro" erro={errors.bairro_id?.message} dica={!cidadeId ? "Escolha a cidade para listar os bairros." : undefined}>
            <Controller
              control={control}
              name="bairro_id"
              render={({ field }) => (
                <Select value={field.value || NENHUM} onValueChange={(v) => field.onChange(v === NENHUM ? "" : v)} disabled={!cidadeId || carregandoBairros}>
                  <SelectTrigger id="enc-bairro" className="h-10 w-full">
                    {carregandoBairros ? (
                      <span className="inline-flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="size-4 animate-spin" aria-hidden /> Carregando...
                      </span>
                    ) : (
                      <SelectValue placeholder="Qualquer bairro" />
                    )}
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value={NENHUM}>Qualquer bairro</SelectItem>
                    {bairros.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Campo>
          <Campo label="Condomínio" htmlFor="enc-condominio" erro={errors.condominio?.message}>
            <Controller
              control={control}
              name="condominio"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="enc-condominio" className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {CONDOMINIO_OPCOES.map((o) => (
                      <SelectItem key={o.valor} value={o.valor}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Campo>
          <Campo label="Valor mínimo (R$)" htmlFor="enc-valor-min" erro={errors.valor_min?.message}>
            <Input id="enc-valor-min" inputMode="numeric" className="h-10" placeholder="Ex.: 300.000" {...register("valor_min", { onChange: (e) => setValue("valor_min", mascaraMoeda(e.target.value)) })} />
          </Campo>
          <Campo label="Valor máximo (R$)" htmlFor="enc-valor-max" erro={errors.valor_max?.message}>
            <Input id="enc-valor-max" inputMode="numeric" className="h-10" placeholder="Ex.: 800.000" aria-invalid={!!errors.valor_max} {...register("valor_max", { onChange: (e) => setValue("valor_max", mascaraMoeda(e.target.value)) })} />
          </Campo>
          <Campo label="Recurso para pagamento" htmlFor="enc-recurso" erro={errors.recurso?.message} className="sm:col-span-2">
            <Controller
              control={control}
              name="recurso"
              render={({ field }) => (
                <Select value={field.value || NENHUM} onValueChange={(v) => field.onChange(v === NENHUM ? "" : v)}>
                  <SelectTrigger id="enc-recurso" className="h-10 w-full">
                    <SelectValue placeholder="Não informar" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value={NENHUM}>Não informar</SelectItem>
                    {RECURSOS_ENCOMENDA.map((r) => (
                      <SelectItem key={r.valor} value={r.valor}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Campo>
        </div>

        <Campo label="Observações" htmlFor="enc-mensagem" erro={errors.mensagem?.message} dica="Quartos, vagas, área, vista, prazo... quanto mais detalhes, melhor.">
          <Textarea id="enc-mensagem" rows={4} className="min-h-24" {...register("mensagem")} />
        </Campo>
      </fieldset>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {parceiro ? "Seu pedido será enviado às imobiliárias parceiras que recebem encomendas." : "Seu pedido será analisado pela equipe do portal."}
        </p>
        <Button type="submit" size="lg" disabled={enviando} className="bg-cta text-cta-foreground hover:bg-cta/90">
          {enviando ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Send data-icon="inline-start" />}
          {enviando ? "Enviando..." : rotulo}
        </Button>
      </div>
    </form>
  );
}
