import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Container } from "./container";
import { cn } from "@/lib/utils";

export interface Crumb {
  nome: string;
  href?: string;
}

interface Props {
  titulo: string;
  subtitulo?: string;
  crumbs?: Crumb[];
  acoes?: React.ReactNode;
  className?: string;
  compacto?: boolean;
}

/** Faixa de título das páginas internas (substitui `TituloPagina()` do legado). */
export function PageHeader({ titulo, subtitulo, crumbs = [], acoes, className, compacto }: Props) {
  return (
    <section className={cn("border-b bg-gradient-to-br from-brand-soft/80 via-background to-background", className)}>
      <Container className={cn("py-8 sm:py-10", compacto && "py-5 sm:py-6")}>
        {crumbs.length > 0 && (
          <nav aria-label="Navegação estrutural" className="mb-3">
            <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-foreground">
                  Início
                </Link>
              </li>
              {crumbs.map((c, i) => (
                <li key={`${c.nome}-${i}`} className="flex items-center gap-1">
                  <ChevronRight className="size-3.5" aria-hidden />
                  {c.href ? (
                    <Link href={c.href} className="hover:text-foreground">
                      {c.nome}
                    </Link>
                  ) : (
                    <span className="text-foreground" aria-current="page">
                      {c.nome}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className={cn("text-3xl font-bold text-brand sm:text-4xl", compacto && "text-2xl sm:text-3xl")}>{titulo}</h1>
            {subtitulo && <p className="mt-2 max-w-2xl text-muted-foreground">{subtitulo}</p>}
          </div>
          {acoes && <div className="flex shrink-0 gap-2">{acoes}</div>}
        </div>
      </Container>
    </section>
  );
}
