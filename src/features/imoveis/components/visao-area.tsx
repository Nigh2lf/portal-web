"use client";

import { createContext, useContext, useState } from "react";
import { cn } from "@/lib/utils";
import { VISAO_COOKIE, VISAO_COOKIE_MAX_AGE, type VisaoImoveis } from "../visao-config";

const VisaoContext = createContext<{ visao: VisaoImoveis; definir: (v: VisaoImoveis) => void } | null>(null);

/**
 * Área da busca que alterna grade / um por linha só no navegador: marca `data-visao`
 * no contêiner e a lista e os cards trocam de layout por CSS, sem buscar nada de novo.
 * O cookie guarda a escolha para a próxima página já vir no formato certo.
 */
export function VisaoArea({
  inicial,
  className,
  children,
}: {
  inicial: VisaoImoveis;
  className?: string;
  children: React.ReactNode;
}) {
  const [visao, setVisao] = useState(inicial);
  const definir = (v: VisaoImoveis) => {
    setVisao(v);
    document.cookie = `${VISAO_COOKIE}=${v}; path=/; max-age=${VISAO_COOKIE_MAX_AGE}; samesite=lax`;
  };
  return (
    <VisaoContext.Provider value={{ visao, definir }}>
      <div data-visao={visao} className={cn("group/visao", className)}>
        {children}
      </div>
    </VisaoContext.Provider>
  );
}

export function useVisao() {
  const ctx = useContext(VisaoContext);
  if (!ctx) throw new Error("useVisao precisa estar dentro de <VisaoArea>.");
  return ctx;
}
