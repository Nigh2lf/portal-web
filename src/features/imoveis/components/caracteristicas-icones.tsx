import { Bath, BedDouble, Car, LandPlot, Ruler, ShowerHead } from "lucide-react";
import { formatarArea, plural } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

interface Caracteristicas {
  quartos: number;
  suites: number;
  banheiros: number;
  vagas: number;
  area_construida: number | null;
  area_total: number | null;
}

interface Props {
  imovel: Caracteristicas;
  /** `compacto` para cards (ícone + número); `detalhado` para a página (ícone + rótulo). */
  variante?: "compacto" | "detalhado";
  className?: string;
}

export function CaracteristicasIcones({ imovel, variante = "compacto", className }: Props) {
  const itens = [
    imovel.quartos > 0 && { Icon: BedDouble, valor: imovel.quartos, rotulo: plural(imovel.quartos, "quarto") },
    imovel.suites > 0 && { Icon: ShowerHead, valor: imovel.suites, rotulo: plural(imovel.suites, "suíte") },
    imovel.banheiros > 0 && { Icon: Bath, valor: imovel.banheiros, rotulo: plural(imovel.banheiros, "banheiro") },
    imovel.vagas > 0 && { Icon: Car, valor: imovel.vagas, rotulo: plural(imovel.vagas, "vaga") },
    imovel.area_construida ? { Icon: Ruler, valor: formatarArea(imovel.area_construida), rotulo: "construídos" } : false,
    imovel.area_total ? { Icon: LandPlot, valor: formatarArea(imovel.area_total), rotulo: "de área total" } : false,
  ].filter(Boolean) as Array<{ Icon: typeof BedDouble; valor: number | string; rotulo: string }>;

  if (!itens.length) return null;

  if (variante === "detalhado") {
    return (
      <ul className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3", className)}>
        {itens.map(({ Icon, valor, rotulo }) => (
          <li key={rotulo} className="flex items-center gap-3 rounded-xl bg-muted/60 px-3 py-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
              <Icon className="size-5" aria-hidden />
            </span>
            <span className="leading-tight">
              <span className="block font-semibold tabular-nums">{valor}</span>
              <span className="block text-xs text-muted-foreground">{rotulo}</span>
            </span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className={cn("flex flex-wrap items-center gap-x-3.5 gap-y-1 text-sm text-muted-foreground", className)}>
      {itens.map(({ Icon, valor, rotulo }) => (
        <li key={rotulo} className="flex items-center gap-1.5" title={`${valor} ${rotulo}`}>
          <Icon className="size-4 shrink-0 text-brand/70" aria-hidden />
          <span className="tabular-nums">{valor}</span>
          <span className="sr-only">{rotulo}</span>
        </li>
      ))}
    </ul>
  );
}
