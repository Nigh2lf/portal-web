"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid, Rows3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { definirVisao } from "../actions";
import type { VisaoImoveis } from "../visao";

const OPCOES: Array<{ valor: VisaoImoveis; rotulo: string; Icone: typeof LayoutGrid }> = [
  { valor: "grade", rotulo: "Ver em grade", Icone: LayoutGrid },
  { valor: "lista", rotulo: "Ver um por linha", Icone: Rows3 },
];

/** Alterna a listagem entre grade (padrão) e um imóvel por linha; preferência fica em cookie. */
export function VisaoToggle({ visao }: { visao: VisaoImoveis }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div className="inline-flex rounded-lg border bg-card p-0.5" role="group" aria-label="Modo de exibição">
      {OPCOES.map(({ valor, rotulo, Icone }) => (
        <button
          key={valor}
          type="button"
          aria-label={rotulo}
          aria-pressed={visao === valor}
          disabled={pending}
          onClick={() =>
            start(async () => {
              if (visao === valor) return;
              await definirVisao(valor);
              router.refresh();
            })
          }
          className={cn(
            "flex size-8 items-center justify-center rounded-md transition-colors",
            visao === valor ? "bg-brand text-brand-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <Icone className="size-4" aria-hidden />
        </button>
      ))}
    </div>
  );
}
