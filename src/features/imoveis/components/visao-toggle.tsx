"use client";

import { LayoutGrid, Rows3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VisaoImoveis } from "../visao-config";
import { useVisao } from "./visao-area";

const OPCOES: Array<{ valor: VisaoImoveis; rotulo: string; Icone: typeof LayoutGrid }> = [
  { valor: "grade", rotulo: "Ver em grade", Icone: LayoutGrid },
  { valor: "lista", rotulo: "Ver um por linha", Icone: Rows3 },
];

/** Alterna grade / um por linha. Some no celular, onde a lista já é sempre um por linha. */
export function VisaoToggle() {
  const { visao, definir } = useVisao();
  return (
    <div
      className="bg-card hidden rounded-lg border p-0.5 sm:inline-flex"
      role="group"
      aria-label="Modo de exibição"
    >
      {OPCOES.map(({ valor, rotulo, Icone }) => (
        <button
          key={valor}
          type="button"
          aria-label={rotulo}
          aria-pressed={visao === valor}
          onClick={() => definir(valor)}
          className={cn(
            "flex size-8 items-center justify-center rounded-md transition-colors",
            visao === valor
              ? "bg-brand text-brand-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <Icone className="size-4" aria-hidden />
        </button>
      ))}
    </div>
  );
}
