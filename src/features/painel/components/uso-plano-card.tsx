import Link from "next/link";
import { ArrowUpRight, Building2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { UsoPlano } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { porcentagem } from "../utils";

function Barra({ rotulo, usado, limite, icon: Icon }: { rotulo: string; usado: number; limite: number; icon: typeof Building2 }) {
  const pct = porcentagem(usado, limite);
  const cheio = limite > 0 && usado >= limite;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 font-medium">
          <Icon className="size-4 text-brand/70" aria-hidden /> {rotulo}
        </span>
        <span className={cn("tabular-nums", cheio ? "font-semibold text-destructive" : "text-muted-foreground")}>
          {usado} de {limite}
        </span>
      </div>
      <div
        role="meter"
        aria-label={rotulo}
        aria-valuemin={0}
        aria-valuemax={limite}
        aria-valuenow={Math.min(usado, limite)}
        aria-valuetext={`${usado} de ${limite}`}
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
      >
        <div className={cn("h-full rounded-full transition-[width]", cheio ? "bg-destructive" : pct >= 80 ? "bg-warning" : "bg-brand")} style={{ width: `${limite ? pct : 0}%` }} />
      </div>
      {cheio && <p className="mt-1 text-xs text-destructive">Limite do plano atingido.</p>}
    </div>
  );
}

export function UsoPlanoCard({ uso, className }: { uso: UsoPlano; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Seu plano</CardTitle>
        <CardDescription>{uso.plano.nome}</CardDescription>
        <CardAction>
          <Button asChild variant="outline" size="sm">
            <Link href="/planos">
              Mudar de plano <ArrowUpRight data-icon="inline-end" />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Barra rotulo="Imóveis ativos" usado={uso.imoveis_usados} limite={uso.plano.imoveis} icon={Building2} />
        <Barra rotulo="Destaques" usado={uso.destaques_usados} limite={uso.plano.destaques} icon={Star} />
        <p className="text-xs text-muted-foreground">Até {uso.plano.fotos} fotos por imóvel.</p>
      </CardContent>
    </Card>
  );
}
