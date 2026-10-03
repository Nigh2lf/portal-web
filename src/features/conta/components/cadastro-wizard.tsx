"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Building2, Check, Home, Info, Loader2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { Plano, TipoAnunciante } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { Campo } from "@/features/contato/components/campo";
import { aplicarErros, mensagemErro } from "@/features/contato/lib/form";
import { mascaraCNPJ, mascaraCPF, mascaraTelefone } from "@/features/contato/lib/mascaras";
import { precoPlano, RECURSOS_PLANO } from "@/features/planos/lib/recursos";
import { cadastrar } from "../actions";
import { CAMPOS_ETAPA, TIPOS_ANUNCIANTE, cadastroSchema, cadastroValoresIniciais, type CadastroForm as Valores } from "../schemas";

interface Props {
  planos: Plano[];
  planoInicialSlug?: string;
}

type Etapa = 1 | 2 | 3;

const ETAPAS: Array<{ n: Etapa; titulo: string }> = [
  { n: 1, titulo: "Perfil" },
  { n: 2, titulo: "Plano" },
  { n: 3, titulo: "Seus dados" },
];

const ICONES: Record<TipoAnunciante, typeof Home> = { proprietario: Home, corretor: UserRound, imobiliaria: Building2 };

export function CadastroWizard({ planos, planoInicialSlug }: Props) {
  const planoGratis = planos.find((p) => p.exclusivo_proprietario);
  const planosPagos = planos.filter((p) => !p.exclusivo_proprietario);
  const planoInicial = planosPagos.find((p) => p.slug === planoInicialSlug);

  const [etapa, setEtapa] = useState<Etapa>(planoInicial ? 3 : 1);
  const [enviando, startTransition] = useTransition();
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  const form = useForm<Valores>({
    resolver: zodResolver(cadastroSchema),
    mode: "onTouched",
    defaultValues: {
      ...cadastroValoresIniciais,
      tipo: planoInicial ? "imobiliaria" : "proprietario",
      plano_id: planoInicial?.id ?? "",
    },
  });
  const { register, control, handleSubmit, setError, setValue, trigger, formState: { errors } } = form;
  const tipo = useWatch({ control, name: "tipo" });
  const planoId = useWatch({ control, name: "plano_id" });
  const proprietario = tipo === "proprietario";

  // Proprietário sempre usa o plano gratuito; demais perfis não podem usá-lo.
  useEffect(() => {
    if (proprietario && planoGratis) setValue("plano_id", planoGratis.id, { shouldValidate: false });
    else if (!proprietario && planoGratis && planoId === planoGratis.id) setValue("plano_id", "", { shouldValidate: false });
  }, [proprietario, planoGratis, planoId, setValue]);

  // Troca de perfil limpa o documento (CPF <-> CNPJ).
  useEffect(() => {
    setValue("documento", "");
  }, [tipo, setValue]);

  async function avancar() {
    const ok = await trigger(CAMPOS_ETAPA[etapa]);
    if (!ok) return;
    setEtapa((e) => (e < 3 ? ((e + 1) as Etapa) : e));
  }

  const onSubmit = handleSubmit((valores) => {
    setErroGeral(null);
    startTransition(async () => {
      const r = await cadastrar(valores);
      // Em sucesso o action redireciona; só chegamos aqui em erro.
      if (!r.ok) {
        aplicarErros(r, setError);
        const msg = mensagemErro(r, "Revise os campos destacados.");
        setErroGeral(msg);
        toast.error(msg);
        if (r.erros?.plano_id) setEtapa(2);
        else if (r.erros?.tipo) setEtapa(1);
      }
    });
  });

  const planoEscolhido = planos.find((p) => p.id === planoId);
  const planoPago = Boolean(planoEscolhido?.preco_mensal);

  return (
    <div className="card-elevated p-6 sm:p-8">
      <ol className="mb-8 grid grid-cols-3 gap-2" aria-label="Etapas do cadastro">
        {ETAPAS.map((e) => {
          const concluida = e.n < etapa;
          const atual = e.n === etapa;
          return (
            <li key={e.n} className="flex flex-col gap-2">
              <div className={cn("h-1.5 rounded-full", concluida || atual ? "bg-brand" : "bg-muted")} />
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <span className={cn("flex size-5 items-center justify-center rounded-full text-[11px] font-bold", concluida ? "bg-brand text-brand-foreground" : atual ? "bg-brand-soft text-brand ring-1 ring-brand" : "bg-muted text-muted-foreground")}>
                  {concluida ? <Check className="size-3" aria-hidden /> : e.n}
                </span>
                <span className={cn("font-medium", atual ? "text-foreground" : "text-muted-foreground")}>{e.titulo}</span>
              </div>
            </li>
          );
        })}
      </ol>

      <form onSubmit={onSubmit} noValidate>
        {/* ------------------------------------------------------- Etapa 1 */}
        {etapa === 1 && (
          <section aria-labelledby="etapa-perfil">
            <h2 id="etapa-perfil" className="text-xl font-bold">
              Quem é você?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">O perfil define o documento, o plano e os recursos disponíveis.</p>
            <Controller
              control={control}
              name="tipo"
              render={({ field }) => (
                <div role="radiogroup" aria-label="Perfil" className="mt-6 grid gap-3 sm:grid-cols-3">
                  {TIPOS_ANUNCIANTE.map((t) => {
                    const Icone = ICONES[t.valor];
                    const ativo = field.value === t.valor;
                    return (
                      <button
                        key={t.valor}
                        type="button"
                        role="radio"
                        aria-checked={ativo}
                        onClick={() => field.onChange(t.valor)}
                        className={cn(
                          "flex flex-col items-start gap-3 rounded-xl border p-5 text-left transition-all hover:border-brand/50 hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                          ativo && "border-brand bg-brand-soft/60 ring-1 ring-brand",
                        )}
                      >
                        <span className={cn("flex size-10 items-center justify-center rounded-lg", ativo ? "bg-brand text-brand-foreground" : "bg-muted text-brand")}>
                          <Icone className="size-5" aria-hidden />
                        </span>
                        <span>
                          <span className="block font-semibold">{t.titulo}</span>
                          <span className="mt-1 block text-sm text-muted-foreground">{t.descricao}</span>
                        </span>
                        <span className="mt-auto text-xs font-medium text-muted-foreground">Documento: {t.documento}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            />
            {errors.tipo && <p className="mt-2 text-xs text-destructive">{errors.tipo.message}</p>}
          </section>
        )}

        {/* ------------------------------------------------------- Etapa 2 */}
        {etapa === 2 && (
          <section aria-labelledby="etapa-plano">
            <h2 id="etapa-plano" className="text-xl font-bold">
              {proprietario ? "Seu plano" : "Escolha o plano"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {proprietario ? "Proprietários anunciam gratuitamente." : "Você pode trocar de plano a qualquer momento. Não há pagamento online: a ativação é confirmada pela nossa equipe."}
            </p>

            {proprietario && planoGratis ? (
              <div className="mt-6 flex flex-col gap-4 rounded-xl border border-brand bg-brand-soft/50 p-5 sm:flex-row sm:items-center">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-foreground">
                  <Check className="size-6" aria-hidden />
                </span>
                <div className="flex-1">
                  <p className="font-semibold">{planoGratis.nome}</p>
                  <p className="text-sm text-muted-foreground">
                    {planoGratis.imoveis} {planoGratis.imoveis === 1 ? "anúncio" : "anúncios"} · até {planoGratis.fotos} fotos por anúncio · contato direto com interessados
                  </p>
                </div>
                <span className="font-heading text-2xl font-bold text-brand">Grátis</span>
              </div>
            ) : (
              <Controller
                control={control}
                name="plano_id"
                render={({ field }) => (
                  <div role="radiogroup" aria-label="Plano" className="mt-6 grid gap-3 sm:grid-cols-2">
                    {planosPagos.map((p) => {
                      const ativo = field.value === p.id;
                      const preco = precoPlano(p);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          role="radio"
                          aria-checked={ativo}
                          onClick={() => field.onChange(p.id)}
                          className={cn(
                            "relative flex flex-col gap-3 rounded-xl border p-5 text-left transition-all hover:border-brand/50 hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                            ativo && "border-brand bg-brand-soft/60 ring-1 ring-brand",
                          )}
                        >
                          {p.recomendado && <span className="absolute top-3 right-3 rounded-full bg-highlight px-2 py-0.5 text-[11px] font-semibold">Mais escolhido</span>}
                          <span className="font-semibold">{p.nome}</span>
                          <span className="flex items-baseline gap-1">
                            <span className="font-heading text-2xl font-bold text-brand">{preco.principal}</span>
                            <span className="text-xs text-muted-foreground">{preco.sufixo}</span>
                          </span>
                          <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            {RECURSOS_PLANO.map((r) => {
                              const v = r.valor(p);
                              if (v === false) return null;
                              return (
                                <li key={r.chave} className="flex items-center gap-1">
                                  <Check className="size-3 text-success" aria-hidden />
                                  {typeof v === "string" ? `${v} ${r.label.toLowerCase()}` : r.label}
                                </li>
                              );
                            })}
                          </ul>
                        </button>
                      );
                    })}
                  </div>
                )}
              />
            )}
            {errors.plano_id && <p className="mt-2 text-xs text-destructive">{errors.plano_id.message}</p>}
          </section>
        )}

        {/* ------------------------------------------------------- Etapa 3 */}
        {etapa === 3 && (
          <section aria-labelledby="etapa-dados" className="space-y-6">
            <div>
              <h2 id="etapa-dados" className="text-xl font-bold">
                Seus dados
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Perfil <strong className="text-foreground">{TIPOS_ANUNCIANTE.find((t) => t.valor === tipo)?.titulo}</strong>
                {planoEscolhido && (
                  <>
                    {" "}
                    · Plano <strong className="text-foreground">{planoEscolhido.nome}</strong>
                  </>
                )}{" "}
                <button type="button" onClick={() => setEtapa(1)} className="text-brand underline-offset-4 hover:underline">
                  alterar
                </button>
              </p>
            </div>

            {erroGeral && (
              <Alert variant="destructive">
                <AlertDescription>{erroGeral}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Campo label={proprietario ? "Nome completo" : tipo === "imobiliaria" ? "Nome da imobiliária" : "Nome completo"} htmlFor="cad-nome" obrigatorio erro={errors.nome?.message} className="sm:col-span-2">
                <Input id="cad-nome" className="h-10" autoComplete={tipo === "imobiliaria" ? "organization" : "name"} aria-invalid={!!errors.nome} {...register("nome")} />
              </Campo>
              <Campo label={tipo === "imobiliaria" ? "CNPJ" : "CPF"} htmlFor="cad-documento" obrigatorio erro={errors.documento?.message}>
                <Input
                  id="cad-documento"
                  inputMode="numeric"
                  className="h-10"
                  placeholder={tipo === "imobiliaria" ? "00.000.000/0000-00" : "000.000.000-00"}
                  aria-invalid={!!errors.documento}
                  {...register("documento", { onChange: (e) => setValue("documento", tipo === "imobiliaria" ? mascaraCNPJ(e.target.value) : mascaraCPF(e.target.value)) })}
                />
              </Campo>
              <Campo label="E-mail" htmlFor="cad-email" obrigatorio erro={errors.email?.message} dica="Será seu login no painel.">
                <Input id="cad-email" type="email" className="h-10" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
              </Campo>
              <Campo label="Senha" htmlFor="cad-senha" obrigatorio erro={errors.senha?.message} dica="Mínimo de 6 caracteres.">
                <Input id="cad-senha" type="password" className="h-10" autoComplete="new-password" aria-invalid={!!errors.senha} {...register("senha")} />
              </Campo>
              <Campo label="Confirmar senha" htmlFor="cad-senha2" obrigatorio erro={errors.confirmar_senha?.message}>
                <Input id="cad-senha2" type="password" className="h-10" autoComplete="new-password" aria-invalid={!!errors.confirmar_senha} {...register("confirmar_senha")} />
              </Campo>
              <Campo label="Telefone 1" htmlFor="cad-tel1" obrigatorio erro={errors.telefone?.message}>
                <Input id="cad-tel1" type="tel" inputMode="tel" className="h-10" placeholder="(24) 99999-9999" autoComplete="tel" aria-invalid={!!errors.telefone} {...register("telefone", { onChange: (e) => setValue("telefone", mascaraTelefone(e.target.value)) })} />
              </Campo>
              <Campo label="Telefone 2 / WhatsApp" htmlFor="cad-tel2" erro={errors.telefone2?.message}>
                <Input id="cad-tel2" type="tel" inputMode="tel" className="h-10" placeholder="(24) 99999-9999" aria-invalid={!!errors.telefone2} {...register("telefone2", { onChange: (e) => setValue("telefone2", mascaraTelefone(e.target.value)) })} />
              </Campo>

              {!proprietario && (
                <>
                  <Campo label="Pessoa de contato" htmlFor="cad-contato" erro={errors.contato?.message}>
                    <Input id="cad-contato" className="h-10" {...register("contato")} />
                  </Campo>
                  <Campo label="CRECI" htmlFor="cad-creci" obrigatorio erro={errors.creci?.message}>
                    <Input id="cad-creci" className="h-10" placeholder="Ex.: J-1234 ou 12345" aria-invalid={!!errors.creci} {...register("creci")} />
                  </Campo>
                  <Campo label="Site" htmlFor="cad-site" erro={errors.site?.message}>
                    <Input id="cad-site" type="url" inputMode="url" className="h-10" placeholder="https://" autoComplete="url" {...register("site")} />
                  </Campo>
                  <Campo label="Cupom de desconto" htmlFor="cad-cupom" erro={errors.cupom?.message}>
                    <Input id="cad-cupom" className="h-10" {...register("cupom")} />
                  </Campo>
                  <Campo label="Endereço" htmlFor="cad-endereco" erro={errors.endereco?.message} className="sm:col-span-2">
                    <Input id="cad-endereco" className="h-10" autoComplete="street-address" {...register("endereco")} />
                  </Campo>
                </>
              )}
            </div>

            <Controller
              control={control}
              name="aceite_termos"
              render={({ field }) => (
                <div className="flex flex-col gap-1.5">
                  <label className="flex items-start gap-3 text-sm">
                    <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} className="mt-0.5" aria-invalid={!!errors.aceite_termos} />
                    <span>
                      Li e aceito os{" "}
                      <Link href="/termos-de-uso" target="_blank" className="font-medium text-brand underline-offset-4 hover:underline">
                        Termos de Uso
                      </Link>
                      .
                    </span>
                  </label>
                  {errors.aceite_termos && <p className="text-xs font-medium text-destructive">{errors.aceite_termos.message}</p>}
                </div>
              )}
            />

            {planoPago && (
              <p className="flex items-start gap-2 rounded-lg bg-brand-soft/60 p-3 text-sm text-foreground/80">
                <Info className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                Seu cadastro é criado agora; o plano {planoEscolhido?.nome} será ativado após confirmação da nossa equipe. Enquanto isso você já pode preparar seus anúncios.
              </p>
            )}
          </section>
        )}

        {/* --------------------------------------------------------- Ações */}
        <div className="mt-8 flex items-center justify-between gap-3 border-t pt-6">
          {etapa > 1 ? (
            <Button type="button" variant="ghost" onClick={() => setEtapa((e) => (e - 1) as Etapa)} disabled={enviando}>
              <ArrowLeft data-icon="inline-start" />
              Voltar
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              Já tem conta?{" "}
              <Link href="/anunciar" className="font-medium text-brand underline-offset-4 hover:underline">
                Entrar
              </Link>
            </p>
          )}
          {etapa < 3 ? (
            <Button type="button" size="lg" onClick={avancar}>
              Continuar
              <ArrowRight data-icon="inline-end" />
            </Button>
          ) : (
            <Button type="submit" size="lg" disabled={enviando} className="bg-cta text-cta-foreground hover:bg-cta/90">
              {enviando ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Check data-icon="inline-start" />}
              {enviando ? "Criando conta..." : "Criar minha conta"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
