"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown, LoaderCircle } from "lucide-react";
import type { BuscaFiltros, Ordenacao } from "@/lib/api/types";
import { iniciarNavegacao } from "@/components/layout/navegacao-progresso";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ORDENACOES, linkBusca } from "@/lib/busca/filtros";

interface Props {
  filtros: BuscaFiltros;
  base?: string;
}

export function OrdenacaoSelect({ filtros, base = "/imoveis" }: Props) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  return (
    <label className="flex items-center gap-2 text-sm text-muted-foreground">
      {pendente ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <ArrowUpDown className="size-4" aria-hidden />}
      <span className="hidden sm:inline">Ordenar por</span>
      <Select value={filtros.ordenacao} onValueChange={(v) => {
          iniciarNavegacao();
          iniciar(() => router.push(linkBusca({ ...filtros, ordenacao: v as Ordenacao, pagina: 1 }, base)));
        }}
      >
        <SelectTrigger className="h-9 min-w-40 bg-card" aria-label="Ordenar por" disabled={pendente}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {ORDENACOES.map((o) => (
            <SelectItem key={o.valor} value={o.valor}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}
