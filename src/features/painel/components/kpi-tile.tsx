import type { LucideIcon } from "lucide-react";
import { formatarNumero } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

interface Props {
  rotulo: string;
  valor: number | string;
  icon?: LucideIcon;
  detalhe?: string;
  className?: string;
}

/** Tile de indicador: número em destaque, rótulo em texto secundário. */
export function KpiTile({ rotulo, valor, icon: Icon, detalhe, className }: Props) {
  return (
    <div className={cn("card-elevated flex flex-col gap-1 p-4", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{rotulo}</span>
        {Icon && <Icon className="size-4 text-brand/70" aria-hidden />}
      </div>
      <span className="font-heading text-2xl font-bold tabular-nums text-foreground sm:text-3xl">{typeof valor === "number" ? formatarNumero(valor) : valor}</span>
      {detalhe && <span className="text-xs text-muted-foreground">{detalhe}</span>}
    </div>
  );
}
