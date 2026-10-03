"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Bairro, Cidade, Imovel, ImovelTipo, Infraestrutura, UsoPlano } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { atualizarImovelAction, criarImovelAction, listarBairrosPainel } from "../actions";
import { DESCRICAO_MAX, IMOVEL_VALORES_INICIAIS, imovelParaForm, imovelSchema, type ImovelFormValues } from "../schemas";
import { Campo, a11yCampo } from "./campo";
import { CampoMoeda } from "./campo-moeda";
import { Stepper } from "./stepper";

interface Props {
  imovel?: Imovel;
  tipos: ImovelTipo[];
  cidades: Cidade[];
  bairrosIniciais: Bairro[];
  infraestruturas: Infraestrutura[];
  uso: UsoPlano;
}

export function ImovelForm({ imovel, tipos, cidades, bairrosIniciais, infraestruturas, uso }: Props) {
  const [pendente, iniciar] = useTransition();
  const [bairros, setBairros] = useState<Bairro[]>(bairrosIniciais);
  const [carregandoBairros, setCarregandoBairros] = useState(false);
  const edicao = Boolean(imovel);

  const form = useForm<ImovelFormValues>({
    resolver: zodResolver(imovelSchema),
    defaultValues: imovel ? imovelParaForm(imovel, infraestruturas) : IMOVEL_VALORES_INICIAIS,
  });
  const { register, control, handleSubmit, setError, setValue, formState } = form;
  const erros = formState.errors;

  const cidadeId = useWatch({ control, name: "cidade_id" });
  const dentroCondominio = useWatch({ control, name: "dentro_condominio" });
  const descricao = useWatch({ control, name: "descricao" });
  const ativo = useWatch({ control, name: "ativo" });

  // Cota de destaque: ao editar um imóvel já destacado, ele não conta contra si mesmo.
  const destaquesOcupados = uso.destaques_usados - (imovel?.destaque && imovel.ativo ? 1 : 0);
  const destaqueBloqueado = !imovel?.destaque && destaquesOcupados >= uso.plano.destaques;
  const imoveisOcupados = uso.imoveis_usados - (imovel?.ativo ? 1 : 0);
  const ativoBloqueado = !imovel?.ativo && imoveisOcupados >= uso.plano.imoveis;

  // Bairros dependentes da cidade: carregados ao trocar a cidade (evento), com
  // contador para descartar respostas atrasadas de uma seleção anterior.
  const requisicaoBairros = useRef(0);
  function aoMudarCidade(novaCidade: string, onChange: (v: string) => void) {
    onChange(novaCidade);
    setValue("bairro_id", "", { shouldDirty: true });
    setBairros([]);
    if (!novaCidade) return;
    const id = ++requisicaoBairros.current;
    setCarregandoBairros(true);
    listarBairrosPainel(novaCidade)
      .then((lista) => {
        if (id === requisicaoBairros.current) setBairros(lista);
      })
      .catch(() => {
        if (id === requisicaoBairros.current) toast.error("Não foi possível carregar os bairros.");
      })
      .finally(() => {
        if (id === requisicaoBairros.current) setCarregandoBairros(false);
      });
  }

  const infraImovel = infraestruturas.filter((i) => i.escopo === "imovel");
  const infraCond = infraestruturas.filter((i) => i.escopo === "condominio");

  const onSubmit = handleSubmit((valores) => {
    iniciar(async () => {
      const r = imovel ? await atualizarImovelAction(imovel.id, valores) : await criarImovelAction(valores);
      // criarImovelAction redireciona em caso de sucesso; só chega aqui com erro.
      if (r?.ok) {
        toast.success(r.mensagem ?? "Imóvel salvo.");
        form.reset(valores);
        return;
      }
      if (r?.erros) {
        for (const [campo, msgs] of Object.entries(r.erros)) setError(campo as keyof ImovelFormValues, { message: msgs[0] });
      }
      toast.error(r?.mensagem ?? "Não foi possível salvar o imóvel.");
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      {/* Identificação */}
      <Card>
        <CardHeader>
          <CardTitle>Identificação</CardTitle>
          <CardDescription>O código é o seu identificador interno e aparece no anúncio.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <Campo id="codigo" rotulo="Código do imóvel" obrigatorio erro={erros.codigo?.message} dica="Até 12 caracteres. Ex.: AP-1020">
            <Input {...register("codigo")} {...a11yCampo("codigo", erros.codigo?.message)} maxLength={12} className="uppercase" autoComplete="off" />
          </Campo>

          <div className="flex flex-col gap-4 sm:pt-6">
            <Controller
              control={control}
              name="ativo"
              render={({ field }) => (
                <div className="flex items-start gap-3">
                  <Switch id="ativo" checked={field.value} onCheckedChange={field.onChange} disabled={ativoBloqueado && !field.value} aria-describedby="ativo-dica" />
                  <div className="grid gap-0.5">
                    <Label htmlFor="ativo">Anúncio ativo</Label>
                    <p id="ativo-dica" className="text-xs text-muted-foreground">
                      {ativoBloqueado && !field.value ? `Limite de ${uso.plano.imoveis} imóveis ativos do plano atingido.` : "Inativo fica salvo, mas não aparece no site."}
                    </p>
                    {erros.ativo?.message && (
                      <p role="alert" className="text-xs text-destructive">
                        {erros.ativo.message}
                      </p>
                    )}
                  </div>
                </div>
              )}
            />
            <Controller
              control={control}
              name="destaque"
              render={({ field }) => (
                <div className="flex items-start gap-3">
                  <Switch id="destaque" checked={field.value} onCheckedChange={field.onChange} disabled={(destaqueBloqueado && !field.value) || !ativo} aria-describedby="destaque-dica" />
                  <div className="grid gap-0.5">
                    <Label htmlFor="destaque">Imóvel em destaque</Label>
                    <p id="destaque-dica" className="text-xs text-muted-foreground">
                      {!ativo
                        ? "Só imóveis ativos podem ser destacados."
                        : destaqueBloqueado && !field.value
                          ? `Seu plano permite ${uso.plano.destaques} ${uso.plano.destaques === 1 ? "destaque" : "destaques"}; todos em uso.`
                          : `Aparece na página inicial. ${Math.max(0, uso.plano.destaques - destaquesOcupados)} de ${uso.plano.destaques} disponíveis.`}
                    </p>
                    {erros.destaque?.message && (
                      <p role="alert" className="text-xs text-destructive">
                        {erros.destaque.message}
                      </p>
                    )}
                  </div>
                </div>
              )}
            />
            <Controller
              control={control}
              name="dentro_condominio"
              render={({ field }) => (
                <div className="flex items-start gap-3">
                  <Switch id="dentro_condominio" checked={field.value} onCheckedChange={field.onChange} />
                  <div className="grid gap-0.5">
                    <Label htmlFor="dentro_condominio">Dentro de condomínio</Label>
                    <p className="text-xs text-muted-foreground">Habilita a infraestrutura do condomínio e a taxa condominial.</p>
                  </div>
                </div>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Localização */}
      <Card>
        <CardHeader>
          <CardTitle>Localização e tipo</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-3">
          <Controller
            control={control}
            name="tipo_id"
            render={({ field }) => (
              <Campo id="tipo_id" rotulo="Tipo do imóvel" obrigatorio erro={erros.tipo_id?.message}>
                <Select value={field.value || undefined} onValueChange={field.onChange}>
                  <SelectTrigger id="tipo_id" className="w-full" aria-invalid={erros.tipo_id ? true : undefined}>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {tipos.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Campo>
            )}
          />
          <Controller
            control={control}
            name="cidade_id"
            render={({ field }) => (
              <Campo id="cidade_id" rotulo="Cidade" obrigatorio erro={erros.cidade_id?.message}>
                <Select value={field.value || undefined} onValueChange={(v) => aoMudarCidade(v, field.onChange)}>
                  <SelectTrigger id="cidade_id" className="w-full" aria-invalid={erros.cidade_id ? true : undefined}>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {cidades.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome} - {c.uf}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Campo>
            )}
          />
          <Controller
            control={control}
            name="bairro_id"
            render={({ field }) => (
              <Campo id="bairro_id" rotulo="Bairro" obrigatorio erro={erros.bairro_id?.message} dica={!cidadeId ? "Escolha a cidade primeiro." : undefined}>
                <Select value={field.value || undefined} onValueChange={field.onChange} disabled={!cidadeId || carregandoBairros}>
                  <SelectTrigger id="bairro_id" className="w-full" aria-invalid={erros.bairro_id ? true : undefined}>
                    {carregandoBairros ? (
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="size-4 animate-spin" /> Carregando…
                      </span>
                    ) : (
                      <SelectValue placeholder="Selecione" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {bairros.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.nome}
                      </SelectItem>
                    ))}
                    {bairros.length === 0 && <div className="px-2 py-1.5 text-xs text-muted-foreground">Nenhum bairro disponível.</div>}
                  </SelectContent>
                </Select>
              </Campo>
            )}
          />
        </CardContent>
      </Card>

      {/* Características */}
      <Card>
        <CardHeader>
          <CardTitle>Características</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ["quartos", "Quartos"],
              ["suites", "Suítes"],
              ["banheiros", "Banheiros"],
              ["vagas", "Vagas na garagem"],
            ] as const
          ).map(([nome, rotulo]) => (
            <Controller
              key={nome}
              control={control}
              name={nome}
              render={({ field }) => (
                <Campo id={nome} rotulo={rotulo} erro={erros[nome]?.message}>
                  <Stepper rotulo={rotulo} value={field.value} onChange={field.onChange} max={nome === "vagas" ? 100 : 50} {...a11yCampo(nome, erros[nome]?.message)} />
                </Campo>
              )}
            />
          ))}
          <Controller
            control={control}
            name="area_construida"
            render={({ field }) => (
              <Campo id="area_construida" rotulo="Área construída (m²)" erro={erros.area_construida?.message} className="lg:col-span-2">
                <CampoMoeda prefixo="m²" decimais={0} value={field.value} onChange={field.onChange} {...a11yCampo("area_construida", erros.area_construida?.message)} />
              </Campo>
            )}
          />
          <Controller
            control={control}
            name="area_total"
            render={({ field }) => (
              <Campo id="area_total" rotulo="Área total (m²)" erro={erros.area_total?.message} className="lg:col-span-2">
                <CampoMoeda prefixo="m²" decimais={0} value={field.value} onChange={field.onChange} {...a11yCampo("area_total", erros.area_total?.message)} />
              </Campo>
            )}
          />
        </CardContent>
      </Card>

      {/* Valores */}
      <Card>
        <CardHeader>
          <CardTitle>Valores</CardTitle>
          <CardDescription>Preencha ao menos uma forma de negociação. Deixe em branco o que não se aplica.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="grid gap-5 sm:grid-cols-3">
            <Controller
              control={control}
              name="preco_venda"
              render={({ field }) => (
                <Campo id="preco_venda" rotulo="Preço para venda" erro={erros.preco_venda?.message}>
                  <CampoMoeda value={field.value} onChange={field.onChange} placeholder="0,00" {...a11yCampo("preco_venda", erros.preco_venda?.message)} />
                </Campo>
              )}
            />
            <Controller
              control={control}
              name="preco_locacao"
              render={({ field }) => (
                <Campo id="preco_locacao" rotulo="Preço para alugar (mensal)" erro={erros.preco_locacao?.message}>
                  <CampoMoeda value={field.value} onChange={field.onChange} placeholder="0,00" {...a11yCampo("preco_locacao", erros.preco_locacao?.message)} />
                </Campo>
              )}
            />
            <Controller
              control={control}
              name="preco_temporada"
              render={({ field }) => (
                <Campo id="preco_temporada" rotulo="Preço por temporada (diária)" erro={erros.preco_temporada?.message}>
                  <CampoMoeda value={field.value} onChange={field.onChange} placeholder="0,00" {...a11yCampo("preco_temporada", erros.preco_temporada?.message)} />
                </Campo>
              )}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <fieldset className="grid gap-1.5">
              <legend className="mb-1.5 text-sm font-medium">IPTU (opcional)</legend>
              <div className="flex gap-2">
                <Controller control={control} name="iptu_valor" render={({ field }) => <CampoMoeda value={field.value} onChange={field.onChange} placeholder="0,00" aria-label="Valor do IPTU" className="flex-1" />} />
                <Controller
                  control={control}
                  name="iptu_periodo"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger aria-label="Periodicidade do IPTU" className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="anual">Anual</SelectItem>
                        <SelectItem value="mensal">Mensal</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              {erros.iptu_valor?.message && (
                <p role="alert" className="text-xs text-destructive">
                  {erros.iptu_valor.message}
                </p>
              )}
            </fieldset>

            <fieldset className={cn("grid gap-1.5", !dentroCondominio && "opacity-60")} disabled={!dentroCondominio}>
              <legend className="mb-1.5 text-sm font-medium">Condomínio (opcional)</legend>
              <div className="flex gap-2">
                <Controller control={control} name="condominio_valor" render={({ field }) => <CampoMoeda value={field.value} onChange={field.onChange} placeholder="0,00" aria-label="Valor do condomínio" className="flex-1" disabled={!dentroCondominio} />} />
                <Controller
                  control={control}
                  name="condominio_periodo"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={!dentroCondominio}>
                      <SelectTrigger aria-label="Periodicidade do condomínio" className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mensal">Mensal</SelectItem>
                        <SelectItem value="anual">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              {!dentroCondominio && <p className="text-xs text-muted-foreground">Marque “Dentro de condomínio” para informar.</p>}
            </fieldset>
          </div>
        </CardContent>
      </Card>

      {/* Descrição */}
      <Card>
        <CardHeader>
          <CardTitle>Descrição</CardTitle>
          <CardDescription>Conte o que torna o imóvel especial: localização, acabamento, vista, proximidades.</CardDescription>
        </CardHeader>
        <CardContent>
          <Campo id="descricao" rotulo="Descrição do anúncio" obrigatorio erro={erros.descricao?.message}>
            <Textarea {...register("descricao")} {...a11yCampo("descricao", erros.descricao?.message)} rows={7} maxLength={DESCRICAO_MAX} className="min-h-40" />
            <p className="text-right text-xs text-muted-foreground tabular-nums" aria-live="polite">
              {descricao?.length ?? 0}/{DESCRICAO_MAX}
            </p>
          </Campo>
        </CardContent>
      </Card>

      {/* Infraestrutura */}
      <Card>
        <CardHeader>
          <CardTitle>Infraestrutura</CardTitle>
          <CardDescription>Marque os itens que o imóvel e o condomínio oferecem.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <Controller
            control={control}
            name="infraestrutura"
            render={({ field }) => (
              <fieldset>
                <legend className="mb-3 text-sm font-medium">Do imóvel</legend>
                <GradeCheckbox prefixo="infra" itens={infraImovel} selecionados={field.value} onChange={field.onChange} />
              </fieldset>
            )}
          />
          <Controller
            control={control}
            name="infra_condominio"
            render={({ field }) => (
              <fieldset disabled={!dentroCondominio} className={cn(!dentroCondominio && "opacity-60")}>
                <legend className="mb-1 text-sm font-medium">Do condomínio</legend>
                {!dentroCondominio && (
                  <p className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Info className="size-3.5" aria-hidden /> Disponível apenas para imóveis dentro de condomínio.
                  </p>
                )}
                <GradeCheckbox prefixo="cond" itens={infraCond} selecionados={field.value} onChange={field.onChange} desabilitado={!dentroCondominio} />
              </fieldset>
            )}
          />
        </CardContent>
      </Card>

      <div className="sticky bottom-0 -mx-4 flex items-center justify-between gap-3 border-t bg-background/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:mx-0 lg:rounded-xl lg:border lg:px-4">
        <p className="hidden text-xs text-muted-foreground sm:block">* Campos obrigatórios</p>
        <div className="ml-auto flex gap-2">
          <Button asChild variant="outline" type="button">
            <Link href={edicao ? `/painel/imoveis/${imovel!.id}/fotos` : "/painel/imoveis"}>{edicao ? "Gerenciar fotos" : "Cancelar"}</Link>
          </Button>
          <Button type="submit" disabled={pendente} className="min-w-40">
            {pendente ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Save data-icon="inline-start" />}
            {edicao ? "Salvar alterações" : "Salvar e adicionar fotos"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function GradeCheckbox({ prefixo, itens, selecionados, onChange, desabilitado }: { prefixo: string; itens: Infraestrutura[]; selecionados: string[]; onChange: (v: string[]) => void; desabilitado?: boolean }) {
  if (itens.length === 0) return <p className="text-sm text-muted-foreground">Nenhum item cadastrado.</p>;
  return (
    <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
      {itens.map((item) => {
        const id = `${prefixo}-${item.id}`;
        const marcado = selecionados.includes(item.id);
        return (
          <li key={item.id} className="flex items-center gap-2.5">
            <Checkbox
              id={id}
              checked={marcado}
              disabled={desabilitado}
              onCheckedChange={(c) => onChange(c === true ? [...selecionados, item.id] : selecionados.filter((x) => x !== item.id))}
            />
            <Label htmlFor={id} className="cursor-pointer font-normal">
              {item.nome}
            </Label>
          </li>
        );
      })}
    </ul>
  );
}
