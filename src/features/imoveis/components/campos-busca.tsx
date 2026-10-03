"use client";

import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import type { Bairro, BuscaFiltros, Objetivo } from "@/lib/api/types";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { listarBairros } from "@/features/imoveis/actions";
import { OBJETIVOS, degrausPreco } from "@/lib/busca/filtros";
import { formatarMoeda } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

/** Valor-sentinela dos selects ("Todos"); Radix não aceita string vazia. */
export const TODOS = "todos";

export type EstadoBusca = Pick<BuscaFiltros, "objetivo" | "tipo" | "cidade" | "bairro" | "condominio" | "quartos" | "vagas" | "valor_min" | "valor_max" | "codigo">;

export function estadoInicial(f: Partial<BuscaFiltros>): EstadoBusca {
  return {
    objetivo: f.objetivo ?? "comprar",
    tipo: f.tipo,
    cidade: f.cidade,
    bairro: f.bairro,
    condominio: f.condominio,
    quartos: f.quartos ?? [],
    vagas: f.vagas,
    valor_min: f.valor_min,
    valor_max: f.valor_max,
    codigo: f.codigo,
  };
}

export function totalFiltrosAtivos(e: EstadoBusca) {
  return [e.tipo, e.cidade, e.bairro, e.condominio, e.quartos?.length, e.vagas, e.valor_min, e.valor_max, e.codigo].filter(Boolean).length;
}

/**
 * Bairros dependentes da cidade. Mantém um cache por cidade; a lista inicial
 * (renderizada no servidor) entra no cache e as demais vêm da server action.
 */
export function useBairros(cidadeSlug: string | undefined, iniciais: Bairro[], anuncianteId?: string) {
  const [cache, setCache] = useState<Record<string, Bairro[]>>(() => (cidadeSlug ? { [cidadeSlug]: iniciais } : {}));
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

export function SelectCampo({ id, label, valor, onChange, opcoes, placeholder = "Todos", carregando, desabilitado, className, rotuloOculto }: SelectCampoProps) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={id} className={cn(rotuloOculto && "sr-only")}>
        {label}
      </Label>
      <Select value={valor ?? TODOS} onValueChange={(v) => onChange(v === TODOS ? undefined : v)} disabled={desabilitado || carregando}>
        <SelectTrigger id={id} className="h-10 w-full bg-card" aria-label={label}>
          {carregando ? (
            <span className="flex items-center gap-2 text-muted-foreground">
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

export function SeletorObjetivo({ valor, onChange, className, tamanho = "md" }: { valor: Objetivo; onChange: (o: Objetivo) => void; className?: string; tamanho?: "sm" | "md" }) {
  return (
    <div role="radiogroup" aria-label="Objetivo" className={cn("inline-flex gap-1 rounded-xl bg-muted p-1", className)}>
      {OBJETIVOS.map((o) => (
        <button
          key={o.valor}
          type="button"
          role="radio"
          aria-checked={valor === o.valor}
          onClick={() => onChange(o.valor)}
          className={cn(
            "flex-1 rounded-lg font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
            tamanho === "md" ? "px-4 py-2 text-sm" : "px-3 py-1.5 text-xs",
            valor === o.valor ? "bg-card text-brand shadow-sm" : "text-muted-foreground hover:text-foreground",
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

export function ChipsQuartos({ valor = [], onChange, className }: { valor?: number[]; onChange: (v: number[]) => void; className?: string }) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <span className="text-sm font-medium leading-none">Quartos</span>
      <div role="group" aria-label="Quartos" className="flex gap-1.5">
        {QUARTOS.map((q) => {
          const ativo = valor.includes(q.valor);
          return (
            <button
              key={q.valor}
              type="button"
              aria-pressed={ativo}
              onClick={() => onChange(ativo ? valor.filter((v) => v !== q.valor) : [...valor, q.valor].sort())}
              className={cn(
                "h-10 min-w-10 flex-1 rounded-lg border text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                ativo ? "border-brand bg-brand text-brand-foreground" : "border-input bg-card text-foreground hover:border-brand/50 hover:bg-brand-soft/60",
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

const VAGAS = [1, 2, 3, 4, 5].map((n) => ({ valor: String(n), label: `${n} ${n === 1 ? "vaga" : "vagas"}` })).concat([{ valor: "6", label: "6 ou mais" }]);

export function SelectVagas({ id = "f-vagas", valor, onChange, className }: { id?: string; valor?: number; onChange: (v: number | undefined) => void; className?: string }) {
  return <SelectCampo id={id} label="Vagas de garagem" valor={valor ? String(valor) : undefined} onChange={(v) => onChange(v ? Number(v) : undefined)} opcoes={VAGAS} placeholder="Qualquer" className={className} />;
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
        <span className="font-medium leading-none">Faixa de preço</span>
        <span className="text-xs tabular-nums text-muted-foreground">
          {rotuloMin} — {rotuloMax}
        </span>
      </div>
      <Slider
        min={0}
        max={ultimo}
        step={1}
        minStepsBetweenThumbs={1}
        value={[a, b]}
        onValueChange={([na, nb]) => onChange(na === 0 ? undefined : degraus[na], nb === ultimo ? undefined : degraus[nb])}
        aria-label="Faixa de preço"
        className="py-2 **:data-[slot=slider-thumb]:size-4 **:data-[slot=slider-track]:h-1.5"
      />
    </div>
  );
}
