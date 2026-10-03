import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  pagina: number;
  totalPaginas: number;
  /** Gera a URL de uma página (ex.: `(p) => p === 1 ? "/blog" : \`/blog?pagina=${p}\``). */
  href: (pagina: number) => string;
  className?: string;
}

function paginasVisiveis(atual: number, total: number): Array<number | "..."> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set<number>([1, total, atual - 1, atual, atual + 1]);
  const ordenadas = [...set].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const saida: Array<number | "..."> = [];
  for (let i = 0; i < ordenadas.length; i++) {
    const p = ordenadas[i]!;
    if (i > 0 && p - ordenadas[i - 1]! > 1) saida.push("...");
    saida.push(p);
  }
  return saida;
}

export function Paginacao({ pagina, totalPaginas, href, className }: Props) {
  if (totalPaginas <= 1) return null;
  return (
    <nav aria-label="Paginação" className={cn("flex items-center justify-center gap-1", className)}>
      <Button asChild variant="outline" size="sm" className={cn(pagina <= 1 && "pointer-events-none opacity-50")} aria-disabled={pagina <= 1}>
        <Link href={href(Math.max(1, pagina - 1))} rel="prev">
          <ChevronLeft data-icon="inline-start" />
          Anterior
        </Link>
      </Button>
      <ul className="mx-1 hidden items-center gap-1 sm:flex">
        {paginasVisiveis(pagina, totalPaginas).map((p, i) =>
          p === "..." ? (
            <li key={`e-${i}`} className="px-1 text-muted-foreground">
              …
            </li>
          ) : (
            <li key={p}>
              <Button asChild variant={p === pagina ? "default" : "ghost"} size="icon-sm" aria-current={p === pagina ? "page" : undefined}>
                <Link href={href(p)}>{p}</Link>
              </Button>
            </li>
          ),
        )}
      </ul>
      <span className="mx-2 text-sm text-muted-foreground sm:hidden">
        {pagina} / {totalPaginas}
      </span>
      <Button asChild variant="outline" size="sm" className={cn(pagina >= totalPaginas && "pointer-events-none opacity-50")} aria-disabled={pagina >= totalPaginas}>
        <Link href={href(Math.min(totalPaginas, pagina + 1))} rel="next">
          Próxima
          <ChevronRight data-icon="inline-end" />
        </Link>
      </Button>
    </nav>
  );
}
