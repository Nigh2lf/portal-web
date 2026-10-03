import Link from "next/link";
import { Check, Sparkles, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Plano } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { DESCRICOES_PLANO, RECURSOS_PLANO, precoPlano } from "../lib/recursos";

interface Props {
  plano: Plano;
  compacto?: boolean;
  className?: string;
}

export function PlanoCard({ plano, compacto = false, className }: Props) {
  const preco = precoPlano(plano);
  const recomendado = plano.recomendado;
  const hrefCadastro = `/cadastro?plano=${plano.slug}`;

  return (
    <article
      className={cn(
        "card-elevated card-elevated-hover relative flex h-full flex-col p-6",
        recomendado && "ring-2 ring-brand",
        className,
      )}
      aria-label={plano.nome}
    >
      {recomendado && (
        <Badge className="absolute -top-3 left-6 bg-highlight text-foreground shadow-sm">
          <Sparkles className="size-3" aria-hidden />
          Mais escolhido
        </Badge>
      )}
      <header>
        <h3 className="text-xl font-bold">{plano.nome}</h3>
        <p className="mt-1 min-h-10 text-sm text-muted-foreground">{DESCRICOES_PLANO[plano.slug] ?? ""}</p>
        <p className="mt-4 flex items-baseline gap-1">
          <span className="font-heading text-3xl font-extrabold text-brand sm:text-4xl">{preco.principal}</span>
          {preco.sufixo && <span className="text-sm text-muted-foreground">{preco.sufixo}</span>}
        </p>
      </header>

      <ul className={cn("mt-6 space-y-2.5 text-sm", compacto && "space-y-2")}>
        {RECURSOS_PLANO.map((r) => {
          const v = r.valor(plano);
          const ativo = v !== false;
          return (
            <li key={r.chave} className={cn("flex items-start gap-2.5", !ativo && "text-muted-foreground/70")}>
              {ativo ? (
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                  <Check className="size-3.5" aria-hidden />
                </span>
              ) : (
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <X className="size-3.5" aria-hidden />
                </span>
              )}
              <span>
                {typeof v === "string" ? (
                  <>
                    <strong className="font-semibold">{v}</strong> {r.label.toLowerCase()}
                  </>
                ) : (
                  r.label
                )}
                <span className="sr-only">{ativo ? " (incluído)" : " (não incluído)"}</span>
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto pt-6">
        <Button asChild size="lg" className={cn("w-full", recomendado ? "bg-cta text-cta-foreground hover:bg-cta/90" : "")} variant={recomendado ? "default" : "outline"}>
          <Link href={plano.preco_mensal === null ? "/contato?assunto=Planos%20e%20pagamento" : hrefCadastro}>
            {plano.preco_mensal === null ? "Falar com a equipe" : plano.preco_mensal === 0 ? "Anunciar grátis" : "Assinar"}
          </Link>
        </Button>
      </div>
    </article>
  );
}
