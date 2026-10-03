import Link from "next/link";
import { CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface AtalhoPeriodo {
  label: string;
  inicio: string;
  fim: string;
}

interface Props {
  action: string;
  inicio: string;
  fim: string;
  atalhos?: AtalhoPeriodo[];
  /** Conteúdo extra à direita (ex.: botão exportar). */
  extra?: React.ReactNode;
  /** Campos ocultos a manter na URL. */
  ocultos?: Record<string, string | undefined>;
}

/** Filtro de período por GET (funciona sem JS); atalhos como links. */
export function PeriodoFiltro({ action, inicio, fim, atalhos = [], extra, ocultos = {} }: Props) {
  return (
    <div className="card-elevated flex flex-col gap-3 p-4">
      <form method="get" action={action} className="flex flex-wrap items-end gap-3">
        {Object.entries(ocultos).map(([k, v]) => v !== undefined && <input key={k} type="hidden" name={k} value={v} />)}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="inicio">Data inicial</Label>
          <Input id="inicio" name="inicio" type="date" defaultValue={inicio} max={fim} className="w-40" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fim">Data final</Label>
          <Input id="fim" name="fim" type="date" defaultValue={fim} min={inicio} className="w-40" required />
        </div>
        <Button type="submit" variant="secondary" className="h-8" size="sm">
          <CalendarRange data-icon="inline-start" /> Aplicar
        </Button>
        {extra && <div className="ml-auto flex items-end gap-2">{extra}</div>}
      </form>
      {atalhos.length > 0 && (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Períodos rápidos">
          {atalhos.map((a) => {
            const ativo = a.inicio === inicio && a.fim === fim;
            const q = new URLSearchParams({ ...Object.fromEntries(Object.entries(ocultos).filter(([, v]) => v !== undefined) as [string, string][]), inicio: a.inicio, fim: a.fim });
            return (
              <Link
                key={a.label}
                href={`${action}?${q.toString()}`}
                aria-current={ativo ? "true" : undefined}
                className={cn("rounded-full border px-3 py-1 text-xs font-medium transition-colors", ativo ? "border-brand bg-brand text-brand-foreground" : "hover:bg-muted")}
              >
                {a.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
