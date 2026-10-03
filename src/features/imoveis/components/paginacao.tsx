import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { BuscaFiltros } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem } from "@/components/ui/pagination";
import { linkBusca } from "@/lib/busca/filtros";
import { cn } from "@/lib/utils";

interface Props {
  pagina: number;
  totalPaginas: number;
  filtros: BuscaFiltros;
  /** Rota base (`/imoveis` ou `/imobiliarias/{slug}`). A página vai na URL. */
  base?: string;
  className?: string;
}

/** Calcula as páginas visíveis: 1 … (p-1) p (p+1) … N. `null` = reticências. */
function janela(pagina: number, total: number): Array<number | null> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const itens: Array<number | null> = [1];
  const ini = Math.max(2, pagina - 1);
  const fim = Math.min(total - 1, pagina + 1);
  if (ini > 2) itens.push(null);
  for (let p = ini; p <= fim; p++) itens.push(p);
  if (fim < total - 1) itens.push(null);
  itens.push(total);
  return itens;
}

export function Paginacao({ pagina, totalPaginas, filtros, base = "/imoveis", className }: Props) {
  if (totalPaginas <= 1) return null;
  const href = (p: number) => linkBusca({ ...filtros, pagina: p }, base);
  const paginas = janela(pagina, totalPaginas);

  return (
    <Pagination className={cn("pt-2", className)} aria-label="Paginação dos resultados">
      <PaginationContent className="gap-1">
        <PaginationItem>
          <Button asChild variant="ghost" size="default" className={cn(pagina <= 1 && "pointer-events-none opacity-40")} aria-disabled={pagina <= 1}>
            <Link href={href(Math.max(1, pagina - 1))} rel="prev" aria-label="Página anterior" scroll>
              <ChevronLeft data-icon="inline-start" />
              <span className="hidden sm:inline">Anterior</span>
            </Link>
          </Button>
        </PaginationItem>
        {paginas.map((p, i) =>
          p === null ? (
            <PaginationItem key={`e-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={p}>
              <Button asChild variant={p === pagina ? "default" : "ghost"} size="icon" className={cn(p === pagina && "pointer-events-none")}>
                <Link href={href(p)} aria-current={p === pagina ? "page" : undefined} aria-label={`Página ${p}`} scroll>
                  {p}
                </Link>
              </Button>
            </PaginationItem>
          ),
        )}
        <PaginationItem>
          <Button asChild variant="ghost" size="default" className={cn(pagina >= totalPaginas && "pointer-events-none opacity-40")} aria-disabled={pagina >= totalPaginas}>
            <Link href={href(Math.min(totalPaginas, pagina + 1))} rel="next" aria-label="Próxima página" scroll>
              <span className="hidden sm:inline">Próxima</span>
              <ChevronRight data-icon="inline-end" />
            </Link>
          </Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
