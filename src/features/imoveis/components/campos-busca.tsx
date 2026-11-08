"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, LoaderCircle, Search, X } from "lucide-react";
import type { Bairro, BuscaFiltros, ImovelTipo, Objetivo } from "@/lib/api/types";
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
  | "tipos"
  | "cidade"
  | "bairros"
  | "condominio"
  | "quartos"
  | "vagas"
  | "valor_min"
  | "valor_max"
  | "area_min"
  | "area_max"
  | "codigo"
>;

export function estadoInicial(f: Partial<BuscaFiltros>): EstadoBusca {
  return {
    objetivo: f.objetivo ?? "comprar",
    tipos: f.tipos ?? [],
    cidade: f.cidade,
    bairros: f.bairros ?? [],
    condominio: f.condominio,
    quartos: f.quartos ?? [],
    vagas: f.vagas ?? [],
    valor_min: f.valor_min,
    valor_max: f.valor_max,
    area_min: f.area_min,
    area_max: f.area_max,
    codigo: f.codigo,
  };
}

export function totalFiltrosAtivos(e: EstadoBusca) {
  return [
    e.tipos?.length,
    e.cidade,
    e.bairros?.length,
    e.condominio,
    e.quartos?.length,
    e.vagas?.length,
    e.valor_min,
    e.valor_max,
    e.area_min,
    e.area_max,
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

// ----------------------------------------------------------- seleção múltipla

export interface MultiSelectOption {
  value: string;
  label: string;
  /** Texto discreto à direita (ex.: total de imóveis do bairro). */
  hint?: string | number;
}

interface MultiSelectProps {
  id: string;
  label: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (values: string[]) => void;
  /** Substantivo no singular e no plural para o resumo ("1 bairro", "3 bairros"). */
  noun: [string, string];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  /** Mostra os itens escolhidos como etiquetas removíveis abaixo do campo. */
  withTags?: boolean;
}

function normalizeText(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/** Seleção de vários itens: lista com caixas de marcação, busca por nome e resumo no gatilho. */
export function MultiSelect({
  id,
  label,
  options,
  value,
  onChange,
  noun,
  placeholder = "Todos",
  searchPlaceholder = "Buscar",
  emptyMessage = "Nenhum item encontrado.",
  loading,
  disabled,
  className,
  withTags,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const selected = new Set(value);
  const labelOf = (v: string) => options.find((o) => o.value === v)?.label ?? v;
  const visible = term ? options.filter((o) => normalizeText(o.label).includes(normalizeText(term))) : options;
  const summary = !value.length
    ? placeholder
    : value.length === 1
      ? labelOf(value[0]!)
      : `${value.length} ${noun[1]}`;
  const toggle = (v: string, checked: boolean) =>
    onChange(checked ? [...value, v] : value.filter((x) => x !== v));

  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Popover
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setTerm("");
        }}
      >
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            disabled={disabled || loading}
            aria-haspopup="dialog"
            aria-expanded={open}
            className="bg-card focus-visible:border-ring focus-visible:ring-ring/50 flex h-10 w-full items-center justify-between gap-2 rounded-md border px-3 text-left text-sm shadow-xs transition-colors outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <span className="text-muted-foreground flex items-center gap-2">
                <LoaderCircle className="size-4 animate-spin" aria-hidden /> Carregando...
              </span>
            ) : (
              <span className={cn("truncate", !value.length && "text-muted-foreground")}>{summary}</span>
            )}
            <ChevronDown className="text-muted-foreground size-4 shrink-0" aria-hidden />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] min-w-64 p-0">
          {options.length > 8 && (
            <div className="relative border-b p-2">
              <Search
                className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2"
                aria-hidden
              />
              <Input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="h-9 pl-8"
                autoFocus
              />
            </div>
          )}
          <ul className="max-h-72 overflow-y-auto p-1" aria-label={label}>
            {visible.map((o) => {
              const checked = selected.has(o.value);
              return (
                <li key={o.value}>
                  <label className="hover:bg-muted flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm">
                    <Checkbox checked={checked} onCheckedChange={(v) => toggle(o.value, v === true)} />
                    <span className="flex-1 truncate">{o.label}</span>
                    {o.hint !== undefined && (
                      <span className="text-muted-foreground text-xs tabular-nums">{o.hint}</span>
                    )}
                  </label>
                </li>
              );
            })}
            {!visible.length && (
              <li className="text-muted-foreground px-2 py-6 text-center text-sm">{emptyMessage}</li>
            )}
          </ul>
          <div className="flex items-center justify-between gap-2 border-t p-2">
            <button
              type="button"
              onClick={() => onChange([])}
              disabled={!value.length}
              className="text-muted-foreground hover:text-foreground rounded-md px-2 py-1 text-sm disabled:opacity-50"
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="bg-brand text-brand-foreground flex items-center gap-1 rounded-md px-3 py-1 text-sm font-medium"
            >
              <Check className="size-4" aria-hidden />
              {value.length ? `Pronto (${value.length})` : "Pronto"}
            </button>
          </div>
        </PopoverContent>
      </Popover>
      {withTags && value.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label={`${label}: escolhidos`}>
          {value.map((v) => (
            <li key={v}>
              <button
                type="button"
                onClick={() => toggle(v, false)}
                className="bg-brand-soft text-brand hover:bg-brand/15 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs"
                aria-label={`Remover ${labelOf(v)}`}
              >
                {labelOf(v)}
                <X className="size-3" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
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

/** Seleção de vários bairros, com o total de imóveis de cada um. */
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
  return (
    <MultiSelect
      id={id}
      label={label}
      options={bairros.map((b) => ({ value: b.slug, label: b.nome, hint: b.total_imoveis }))}
      value={valor}
      onChange={onChange}
      noun={["bairro", "bairros"]}
      placeholder={placeholder}
      searchPlaceholder="Buscar bairro"
      emptyMessage="Nenhum bairro encontrado."
      loading={carregando}
      disabled={desabilitado}
      className={className}
      withTags={comEtiquetas}
    />
  );
}

/** Seleção de vários tipos de imóvel (casa, apartamento, terreno...). */
export function PropertyTypeSelect({
  id,
  types,
  value,
  onChange,
  className,
  withTags,
}: {
  id: string;
  types: ImovelTipo[];
  value: string[];
  onChange: (slugs: string[]) => void;
  className?: string;
  withTags?: boolean;
}) {
  return (
    <MultiSelect
      id={id}
      label="Tipo de imóvel"
      options={types.map((t) => ({ value: t.slug, label: t.nome }))}
      value={value}
      onChange={onChange}
      noun={["tipo", "tipos"]}
      placeholder="Todos os tipos"
      searchPlaceholder="Buscar tipo"
      emptyMessage="Nenhum tipo encontrado."
      className={className}
      withTags={withTags}
    />
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

// ------------------------------------------------------------ quartos / vagas

/** Opções de quartos e de vagas: 1, 2, 3 e "4+" (4 significa quatro ou mais). */
const COUNT_OPTIONS = [
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4+" },
];

/** Chips de contagem com várias escolhas ao mesmo tempo (quartos, vagas de garagem). */
export function CountChips({
  label,
  value = [],
  onChange,
  className,
}: {
  label: string;
  value?: number[];
  onChange: (v: number[]) => void;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <span className="text-sm leading-none font-medium">{label}</span>
      <div role="group" aria-label={label} className="flex gap-1.5">
        {COUNT_OPTIONS.map((o) => {
          const active = value.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={active}
              onClick={() =>
                onChange(active ? value.filter((v) => v !== o.value) : [...value, o.value].sort())
              }
              className={cn(
                "focus-visible:ring-ring/50 h-10 min-w-10 flex-1 rounded-lg border text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:outline-none",
                active
                  ? "border-brand bg-brand text-brand-foreground"
                  : "border-input bg-card text-foreground hover:border-brand/50 hover:bg-brand-soft/60",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const CONDOMINIO = [
  { valor: "dentro", label: "Dentro de condomínio" },
  { valor: "fora", label: "Fora de condomínio" },
];

// ------------------------------------------------------------------- números

const inteiro = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

/** "1.250.000" → 1250000; vazio ou zero → undefined. */
function lerInteiro(texto: string) {
  const digitos = texto.replace(/\D/g, "");
  const n = Number(digitos);
  return digitos && n > 0 ? n : undefined;
}

// ---------------------------------------------------------------------- área

/**
 * Área em m², mínima e máxima. A API compara com a área total e, quando o anúncio
 * não a informa, com a construída.
 */
export function AreaRange({
  id,
  min,
  max,
  onChange,
  className,
}: {
  id: string;
  min?: number;
  max?: number;
  onChange: (min: number | undefined, max: number | undefined) => void;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={`${id}-min`}>Área (m²)</Label>
      <div className="flex items-center gap-2">
        <AreaInput id={`${id}-min`} label="Área mínima" placeholder="Mínima" value={min} onChange={(v) => onChange(v, max)} />
        <span className="text-muted-foreground text-sm" aria-hidden>
          —
        </span>
        <AreaInput id={`${id}-max`} label="Área máxima" placeholder="Máxima" value={max} onChange={(v) => onChange(min, v)} />
      </div>
    </div>
  );
}

function AreaInput({
  id,
  label,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  value?: number;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <div className="relative min-w-0 flex-1">
      <Input
        id={id}
        inputMode="numeric"
        autoComplete="off"
        aria-label={label}
        placeholder={placeholder}
        value={value ? inteiro.format(value) : ""}
        onChange={(e) => onChange(lerInteiro(e.target.value))}
        className="bg-card h-10 pr-9 tabular-nums"
      />
      <span
        className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm"
        aria-hidden
      >
        m²
      </span>
    </div>
  );
}

// --------------------------------------------------------------------- preço

interface FaixaPrecoProps {
  objetivo: Objetivo;
  maximo: number;
  valorMin?: number;
  valorMax?: number;
  onChange: (min: number | undefined, max: number | undefined) => void;
  className?: string;
  /** Campos e slider na mesma linha em telas largas (hero da home). */
  emLinha?: boolean;
}

function CampoPreco({
  id,
  rotulo,
  placeholder,
  valor,
  onChange,
}: {
  id: string;
  rotulo: string;
  placeholder: string;
  valor?: number;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <div className="relative min-w-0 flex-1">
      <span
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm"
        aria-hidden
      >
        R$
      </span>
      <Input
        id={id}
        inputMode="numeric"
        autoComplete="off"
        aria-label={rotulo}
        placeholder={placeholder}
        value={valor ? inteiro.format(valor) : ""}
        onChange={(e) => onChange(lerInteiro(e.target.value))}
        className="bg-card h-10 pl-9 tabular-nums"
      />
    </div>
  );
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

/**
 * Faixa de preço: campos para digitar o mínimo e o máximo mais um slider não linear
 * (degraus do legado). Os dois ficam sincronizados; um valor digitado fora dos degraus
 * vale como foi digitado, e o slider mostra o degrau mais próximo.
 */
export function FaixaPreco({
  objetivo,
  maximo,
  valorMin,
  valorMax,
  onChange,
  className,
  emLinha,
}: FaixaPrecoProps) {
  const degraus = degrausPreco(objetivo, maximo);
  const ultimo = degraus.length - 1;
  const a = indiceMin(degraus, valorMin);
  const b = indiceMax(degraus, valorMax);
  const rotuloMin = a === 0 ? "Mínimo" : formatarMoeda(degraus[a]);
  const rotuloMax = b === ultimo ? "Sem limite" : formatarMoeda(degraus[b]);

  return (
    <div className={cn("grid gap-1.5", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="leading-none font-medium">Faixa de preço</span>
        {!emLinha && (
          <span className="text-muted-foreground text-xs tabular-nums">
            {rotuloMin} — {rotuloMax}
          </span>
        )}
      </div>
      <div className={cn("grid gap-2", emLinha && "lg:flex lg:items-center lg:gap-4")}>
        <div className={cn("flex items-center gap-2", emLinha && "lg:w-[22rem] lg:shrink-0")}>
          <CampoPreco
            id={`preco-min-${objetivo}`}
            rotulo="Preço mínimo"
            placeholder="Mínimo"
            valor={valorMin}
            onChange={(v) => onChange(v, valorMax)}
          />
          <span className="text-muted-foreground text-sm" aria-hidden>
            —
          </span>
          <CampoPreco
            id={`preco-max-${objetivo}`}
            rotulo="Preço máximo"
            placeholder="Sem limite"
            valor={valorMax}
            onChange={(v) => onChange(valorMin, v)}
          />
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
          className={cn(
            "py-2 **:data-[slot=slider-thumb]:size-4 **:data-[slot=slider-track]:h-1.5",
            emLinha && "lg:min-w-0 lg:flex-1 lg:px-2",
          )}
        />
      </div>
    </div>
  );
}
