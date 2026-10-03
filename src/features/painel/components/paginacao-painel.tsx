import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Paginado } from "@/lib/api/types";

interface Props {
  dados: Pick<Paginado<unknown>, "pagina" | "total_paginas" | "total" | "por_pagina">;
  /** Monta o href de uma página mantendo os outros filtros. */
  hrefDe: (pagina: number) => string;
  rotuloItens?: string;
}

export function PaginacaoPainel({ dados, hrefDe, rotuloItens = "registros" }: Props) {
  const { pagina, total_paginas, total, por_pagina } = dados;
  if (total === 0) return null;
  const inicio = (pagina - 1) * por_pagina + 1;
  const fim = Math.min(total, pagina * por_pagina);
  return (
    <nav aria-label="Paginação" className="flex flex-col items-center justify-between gap-3 text-sm sm:flex-row">
      <p className="text-muted-foreground">
        Exibindo <span className="font-medium text-foreground">{inicio}</span>–<span className="font-medium text-foreground">{fim}</span> de{" "}
        <span className="font-medium text-foreground">{total}</span> {rotuloItens}
      </p>
      {total_paginas > 1 && (
        <div className="flex items-center gap-2">
          {pagina > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link href={hrefDe(pagina - 1)} rel="prev">
                <ChevronLeft data-icon="inline-start" /> Anterior
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              <ChevronLeft data-icon="inline-start" /> Anterior
            </Button>
          )}
          <span className="px-1 tabular-nums text-muted-foreground">
            Página {pagina} de {total_paginas}
          </span>
          {pagina < total_paginas ? (
            <Button asChild variant="outline" size="sm">
              <Link href={hrefDe(pagina + 1)} rel="next">
                Próxima <ChevronRight data-icon="inline-end" />
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Próxima <ChevronRight data-icon="inline-end" />
            </Button>
          )}
        </div>
      )}
    </nav>
  );
}
