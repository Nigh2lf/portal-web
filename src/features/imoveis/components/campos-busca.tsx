"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, LoaderCircle, Search, X } from "lucide-react";
import type { Bairro, BuscaFiltros, Objetivo } from "@/lib/api/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { listarBairros } from "@/features/imoveis/actions";
import { OBJETIVOS, degrausPreco } from "@/lib/busca/filtros";
import { formatarMoeda } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

/** Valor-sentinela dos selects ("Todos"); Radix não aceita string vazia. */
export const TODOS = "todos";

export type EstadoBusca = Pick<
  BuscaFiltros,
  | "objetivo"
  | "tipo"
  | "cidade"
  | "bairros"
  | "condominio"
  | "quartos"
  | "vagas"
  | "valor_min"
  | "valor_max"
  | "codigo"
>;

export function estadoInicial(f: Partial<BuscaFiltros>): EstadoBusca {
  return {
    objetivo: f.objetivo ?? "comprar",
    tipo: f.tipo,
    cidade: f.cidade,
    bairros: f.bairros ?? [],
    condominio: f.condominio,
    quartos: f.quartos ?? [],
    vagas: f.vagas,
    valor_min: f.valor_min,
    valor_max: f.valor_max,
    codigo: f.codigo,
  };
}

export function totalFiltrosAtivos(e: EstadoBusca) {
  return [
    e.tipo,
    e.cidade,
    e.bairros?.length,
    e.condominio,
    e.quartos?.length,
    e.vagas,
    e.valor_min,
    e.valor_max,
    e.codigo,
  ].filter(Boolean).length;
}

/**
 * Bairros dependentes da cidade. Mantém um cache por cidade; a lista inicial
 * (renderizada no servidor) entra no cache e as demais vêm da server action.
 */
export function useBairros(cidadeSlug: string | undefined, iniciais: Bairro[], anuncianteId?: string) {
  const [cache, setCache] = useState<Record<string, Bairro[]>>(() =>
    cidadeSlug ? { [cidadeSlug]: iniciais } : {},
  );
  const emCache = cidadeSlug ? cache[cidadeSlug] : undefined;

  useEffect(() => {
    if (!cidadeSlug || emCache) return;
    let ativo = true;
    listarBairros(cidadeSlug, anuncianteId)
      .then((lista) => {
        if (ativo) setCache((c) => ({ ...c, [cidadeSlug]: lista }));
      })
      .catch(() => {
        if (ativo) setCache((c) => ({ ...c, [cidadeSlug]: [] }));
      });
    return () => {
      ativo = false;
    };
  }, [cidadeSlug, anuncianteId, emCache]);

  return { bairros: emCache ?? [], carregando: Boolean(cidadeSlug) && !emCache };
}

// ---------------------------------------------------------------- campos

interface SelectCampoProps {
  id: string;
  label: string;
  valor: string | undefined;
  onChange: (v: string | undefined) => void;
  opcoes: Array<{ valor: string; label: string }>;
  placeholder?: string;
  carregando?: boolean;
  desabilitado?: boolean;
  className?: string;
  /** Oculta o rótulo visualmente (hero). */
  rotuloOculto?: boolean;
}

export function SelectCampo({
  id,
  label,
  valor,
  onChange,
  opcoes,
  placeholder = "Todos",
  carregando,
  desabilitado,
  className,
  rotuloOculto,
}: SelectCampoProps) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={id} className={cn(rotuloOculto && "sr-only")}>
        {label}
      </Label>
      <Select
        value={valor ?? TODOS}
        onValueChange={(v) => onChange(v === TODOS ? undefined : v)}
        disabled={desabilitado || carregando}
      >
        <SelectTrigger id={id} className="bg-card h-10 w-full" aria-label={label}>
          {carregando ? (
            <span className="text-muted-foreground flex items-center gap-2">
              <LoaderCircle className="size-4 animate-spin" aria-hidden /> Carregando...
            </span>
          ) : (
            <SelectValue placeholder={placeholder} />
          )}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TODOS}>{placeholder}</SelectItem>
          {opcoes.map((o) => (
            <SelectItem key={o.valor} value={o.valor}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface SelectBairrosProps {
  id: string;
  label?: string;
  bairros: Bairro[];
  valor: string[];
  onChange: (slugs: string[]) => void;
  carregando?: boolean;
  desabilitado?: boolean;
  placeholder?: string;
  className?: string;
  /** Mostra os bairros escolhidos como etiquetas removíveis abaixo do campo. */
  comEtiquetas?: boolean;
}

/** Seleção de vários bairros: lista com caixas de marcação e busca por nome. */
export function SelectBairros({
  id,
  label = "Bairros",
  bairros,
  valor,
  onChange,
  carregando,
  desabilitado,
  placeholder = "Todos os bairros",
  className,
  comEtiquetas,
}: SelectBairrosProps) {
  const [aberto, setAberto] = useState(false);
  const [termo, setTermo] = useState("");
  const escolhidos = new Set(valor);
  const nomes = bairros.filter((b) => escolhidos.has(b.slug)).map((b) => b.nome);
  const normalizar = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const visiveis = termo ? bairros.filter((b) => normalizar(b.nome).includes(normalizar(termo))) : bairros;
  const resumo = !valor.length
    ? placeholder
    : valor.length === 1
      ? (nomes[0] ?? "1 bairro")
      : `${valor.length} bairros`;
  const alternar = (slug: string, marcado: boolean) =>
    onChange(marcado ? [...valor, slug] : valor.filter((v) => v !== slug));

  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Popover
        open={aberto}
        onOpenChange={(v) => {
          setAberto(v);
          if (!v) setTermo("");
        }}
      >
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            disabled={desabilitado || carregando}
            aria-haspopup="dialog"
            aria-expanded={aberto}
            className="bg-card focus-visible:border-ring focus-visible:ring-ring/50 flex h-10 w-full items-center justify-between gap-2 rounded-md border px-3 text-left text-sm shadow-xs transition-colors outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {carregando ? (
              <span className="text-muted-foreground flex items-center gap-2">
                <LoaderCircle className="size-4 animate-spin" aria-hidden /> Carregando...
              </span>
            ) : (
              <span className={cn("truncate", !valor.length && "text-muted-foreground")}>{resumo}</span>
            )}
            <ChevronDown className="text-muted-foreground size-4 shrink-0" aria-hidden />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] min-w-64 p-0">
          {bairros.length > 8 && (
            <div className="relative border-b p-2">
              <Search
                className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2"
                aria-hidden
              />
              <Input
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                placeholder="Buscar bairro"
                aria-label="Buscar bairro"
                className="h-9 pl-8"
                autoFocus
              />
            </div>
          )}
          <ul className="max-h-72 overflow-y-auto p-1" aria-label={label}>
            {visiveis.map((b) => {
              const marcado = escolhidos.has(b.slug);
              return (
                <li key={b.slug}>
                  <label className="hover:bg-muted flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm">
                    <Checkbox checked={marcado} onCheckedChange={(v) => alternar(b.slug, v === true)} />
                    <span className="flex-1 truncate">{b.nome}</span>
                    <span className="text-muted-foreground text-xs tabular-nums">{b.total_imoveis}</span>
                  </label>
                </li>
              );
            })}
            {!visiveis.length && (
              <li className="text-muted-foreground px-2 py-6 text-center text-sm">
                Nenhum bairro encontrado.
              </li>
            )}
          </ul>
          <div className="flex items-center justify-between gap-2 border-t p-2">
            <button
              type="button"
              onClick={() => onChange([])}
              disabled={!valor.length}
              className="text-muted-foreground hover:text-foreground rounded-md px-2 py-1 text-sm disabled:opacity-50"
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={() => setAberto(false)}
              className="bg-brand text-brand-foreground flex items-center gap-1 rounded-md px-3 py-1 text-sm font-medium"
            >
              <Check className="size-4" aria-hidden />
              {valor.length ? `Pronto (${valor.length})` : "Pronto"}
            </button>
          </div>
        </PopoverContent>
      </Popover>
      {comEtiquetas && valor.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Bairros escolhidos">
          {valor.map((slug) => (
            <li key={slug}>
              <button
                type="button"
                onClick={() => alternar(slug, false)}
                className="bg-brand-soft text-brand hover:bg-brand/15 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs"
                aria-label={`Remover ${bairros.find((b) => b.slug === slug)?.nome ?? slug}`}
              >
                {bairros.find((b) => b.slug === slug)?.nome ?? slug}
                <X className="size-3" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SeletorObjetivo({
  valor,
  onChange,
  className,
  tamanho = "md",
}: {
  valor: Objetivo;
  onChange: (o: Objetivo) => void;
  className?: string;
  tamanho?: "sm" | "md";
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Objetivo"
      className={cn("bg-muted inline-flex gap-1 rounded-xl p-1", className)}
    >
      {OBJETIVOS.map((o) => (
        <button
          key={o.valor}
          type="button"
          role="radio"
          aria-checked={valor === o.valor}
          onClick={() => onChange(o.valor)}
          className={cn(
            "focus-visible:ring-ring/50 flex-1 rounded-lg font-medium transition-colors focus-visible:ring-3 focus-visible:outline-none",
            tamanho === "md" ? "px-4 py-2 text-sm" : "px-3 py-1.5 text-xs",
            valor === o.valor
              ? "bg-card text-brand shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const QUARTOS = [
  { valor: 1, label: "1" },
  { valor: 2, label: "2" },
  { valor: 3, label: "3" },
  { valor: 4, label: "4+" },
];

export function ChipsQuartos({
  valor = [],
  onChange,
  className,
}: {
  valor?: number[];
  onChange: (v: number[]) => void;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <span className="text-sm leading-none font-medium">Quartos</span>
      <div role="group" aria-label="Quartos" className="flex gap-1.5">
        {QUARTOS.map((q) => {
          const ativo = valor.includes(q.valor);
          return (
            <button
              key={q.valor}
              type="button"
              aria-pressed={ativo}
              onClick={() =>
                onChange(ativo ? valor.filter((v) => v !== q.valor) : [...valor, q.valor].sort())
              }
              className={cn(
                "focus-visible:ring-ring/50 h-10 min-w-10 flex-1 rounded-lg border text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:outline-none",
                ativo
                  ? "border-brand bg-brand text-brand-foreground"
                  : "border-input bg-card text-foreground hover:border-brand/50 hover:bg-brand-soft/60",
              )}
            >
              {q.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const VAGAS = [1, 2, 3, 4, 5]
  .map((n) => ({ valor: String(n), label: `${n} ${n === 1 ? "vaga" : "vagas"}` }))
  .concat([{ valor: "6", label: "6 ou mais" }]);

export function SelectVagas({
  id = "f-vagas",
  valor,
  onChange,
  className,
}: {
  id?: string;
  valor?: number;
  onChange: (v: number | undefined) => void;
  className?: string;
}) {
  return (
    <SelectCampo
      id={id}
      label="Vagas de garagem"
      valor={valor ? String(valor) : undefined}
      onChange={(v) => onChange(v ? Number(v) : undefined)}
      opcoes={VAGAS}
      placeholder="Qualquer"
      className={className}
    />
  );
}

export const CONDOMINIO = [
  { valor: "dentro", label: "Dentro de condomínio" },
  { valor: "fora", label: "Fora de condomínio" },
];

interface FaixaPrecoProps {
  objetivo: Objetivo;
  maximo: number;
  valorMin?: number;
  valorMax?: number;
  onChange: (min: number | undefined, max: number | undefined) => void;
  className?: string;
}

function indiceMin(degraus: number[], valor?: number) {
  if (!valor) return 0;
  let idx = 0;
  degraus.forEach((d, i) => {
    if (d <= valor) idx = i;
  });
  return idx;
}

function indiceMax(degraus: number[], valor?: number) {
  if (!valor) return degraus.length - 1;
  const i = degraus.findIndex((d) => d >= valor);
  return i === -1 ? degraus.length - 1 : i;
}

/** Slider não linear de preço (degraus do legado), aplicado sobre o preço da aba ativa. */
export function FaixaPreco({ objetivo, maximo, valorMin, valorMax, onChange, className }: FaixaPrecoProps) {
  const degraus = degrausPreco(objetivo, maximo);
  const ultimo = degraus.length - 1;
  const a = indiceMin(degraus, valorMin);
  const b = indiceMax(degraus, valorMax);
  const rotuloMin = a === 0 ? "Mínimo" : formatarMoeda(degraus[a]);
  const rotuloMax = b === ultimo ? "Sem limite" : formatarMoeda(degraus[b]);

  return (
    <div className={cn("grid gap-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="leading-none font-medium">Faixa de preço</span>
        <span className="text-muted-foreground text-xs tabular-nums">
          {rotuloMin} — {rotuloMax}
        </span>
      </div>
      <Slider
        min={0}
        max={ultimo}
        step={1}
        minStepsBetweenThumbs={1}
        value={[a, b]}
        onValueChange={([na, nb]) =>
          onChange(na === 0 ? undefined : degraus[na], nb === ultimo ? undefined : degraus[nb])
        }
        aria-label="Faixa de preço"
        className="py-2 **:data-[slot=slider-thumb]:size-4 **:data-[slot=slider-track]:h-1.5"
      />
    </div>
  );
}
