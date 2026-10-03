import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { UsoPlano } from "@/lib/api/types";

/** Botão "Novo imóvel"; desabilitado (com explicação) quando a cota do plano foi atingida. */
export function NovoImovelBotao({ uso, className }: { uso: UsoPlano; className?: string }) {
  const limiteAtingido = uso.imoveis_usados >= uso.plano.imoveis;
  if (!limiteAtingido) {
    return (
      <Button asChild className={`bg-cta text-cta-foreground hover:bg-cta/90 ${className ?? ""}`}>
        <Link href="/painel/imoveis/novo">
          <Plus data-icon="inline-start" /> Novo imóvel
        </Link>
      </Button>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} className={`inline-flex ${className ?? ""}`} aria-describedby="dica-limite-imoveis">
          <Button disabled className="pointer-events-none">
            <Plus data-icon="inline-start" /> Novo imóvel
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent id="dica-limite-imoveis" side="bottom">
        Você atingiu o limite de {uso.plano.imoveis} {uso.plano.imoveis === 1 ? "imóvel ativo" : "imóveis ativos"} do {uso.plano.nome}. Desative um imóvel ou mude de plano.
      </TooltipContent>
    </Tooltip>
  );
}
