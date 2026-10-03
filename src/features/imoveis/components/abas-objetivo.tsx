import Link from "next/link";
import type { BuscaFiltros, Objetivo } from "@/lib/api/types";
import { OBJETIVOS, linkBusca } from "@/lib/busca/filtros";
import { formatarNumero } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

interface Props {
  filtros: BuscaFiltros;
  contadores: Record<Objetivo, number>;
  base?: string;
  className?: string;
}

/**
 * Abas Comprar / Alugar / Temporada com contadores. São links: a URL é a
 * única fonte de verdade. Trocar de aba zera página e faixa de preço (escalas diferentes).
 */
export function AbasObjetivo({ filtros, contadores, base = "/imoveis", className }: Props) {
  return (
    <nav aria-label="Objetivo" className={cn("inline-flex w-full gap-1 rounded-xl bg-muted p-1 sm:w-auto", className)}>
      {OBJETIVOS.map((o) => {
        const ativo = filtros.objetivo === o.valor;
        const total = contadores[o.valor] ?? 0;
        return (
          <Link
            key={o.valor}
            href={linkBusca({ ...filtros, objetivo: o.valor, pagina: 1, valor_min: undefined, valor_max: undefined }, base)}
            aria-current={ativo ? "page" : undefined}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:flex-none sm:px-4",
              ativo ? "bg-card text-brand shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
            <span className={cn("rounded-full px-1.5 py-0.5 text-[11px] tabular-nums", ativo ? "bg-brand-soft text-brand" : "bg-background/70 text-muted-foreground")}>
              {formatarNumero(total)}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
