import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CrumbPainel {
  nome: string;
  href?: string;
}

interface Props {
  titulo: string;
  descricao?: React.ReactNode;
  crumbs?: CrumbPainel[];
  acoes?: React.ReactNode;
  className?: string;
}

/** Cabeçalho das páginas do painel: trilha, título, descrição e ações à direita. */
export function PainelHeader({ titulo, descricao, crumbs = [], acoes, className }: Props) {
  return (
    <header className={cn("flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {crumbs.length > 0 && (
          <nav aria-label="Navegação estrutural" className="mb-1.5">
            <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              <li>
                <Link href="/painel" className="hover:text-foreground">
                  Painel
                </Link>
              </li>
              {crumbs.map((c, i) => (
                <li key={`${c.nome}-${i}`} className="flex items-center gap-1">
                  <ChevronRight className="size-3" aria-hidden />
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
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{titulo}</h1>
        {descricao && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{descricao}</p>}
      </div>
      {acoes && <div className="flex shrink-0 flex-wrap gap-2">{acoes}</div>}
    </header>
  );
}
