import type { Objetivo } from "@/lib/api/types";
import { OBJETIVOS } from "@/lib/busca/filtros";
import { formatarMoeda } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

export interface Precos {
  preco_venda: number | null;
  preco_locacao: number | null;
  preco_temporada: number | null;
}

export function precoPorObjetivo(p: Precos, objetivo: Objetivo) {
  return objetivo === "comprar" ? p.preco_venda : objetivo === "alugar" ? p.preco_locacao : p.preco_temporada;
}

/** Objetivo a exibir: o preferido se o imóvel tem preço para ele; senão o primeiro disponível. */
export function objetivoExibido(p: Precos, preferido?: Objetivo): Objetivo {
  if (preferido && precoPorObjetivo(p, preferido)) return preferido;
  return p.preco_venda ? "comprar" : p.preco_locacao ? "alugar" : "temporada";
}

export function objetivosDisponiveis(p: Precos): Objetivo[] {
  return OBJETIVOS.map((o) => o.valor).filter((o) => precoPorObjetivo(p, o));
}

export const SUFIXO_PRECO: Record<Objetivo, string> = { comprar: "", alugar: "/mês", temporada: "/diária" };

interface Props {
  precos: Precos;
  objetivo?: Objetivo;
  tamanho?: "sm" | "md" | "lg";
  /** Mostra "Venda" / "Aluguel" antes do valor. */
  comRotulo?: boolean;
  className?: string;
}

export function PrecoImovel({ precos, objetivo, tamanho = "md", comRotulo, className }: Props) {
  const obj = objetivoExibido(precos, objetivo);
  const valor = precoPorObjetivo(precos, obj);
  const rotulo = OBJETIVOS.find((o) => o.valor === obj)?.labelCurto;
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-1.5", className)}>
      {comRotulo && <span className="text-xs font-medium uppercase tracking-wide opacity-80">{rotulo}</span>}
      <span className={cn("font-heading font-bold tabular-nums", tamanho === "sm" && "text-base", tamanho === "md" && "text-lg", tamanho === "lg" && "text-3xl")}>
        {formatarMoeda(valor)}
      </span>
      {valor && SUFIXO_PRECO[obj] && <span className="text-xs font-medium opacity-80">{SUFIXO_PRECO[obj]}</span>}
    </span>
  );
}
