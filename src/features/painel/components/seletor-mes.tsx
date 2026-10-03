import Link from "next/link";
import { formatarMesAno } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

interface Props {
  meses: string[]; // "YYYY-MM", do mais recente ao mais antigo
  atual: string;
  base?: string;
}

/** Chips de seleção de mês (navegação por URL, sem JS). */
export function SeletorMes({ meses, atual, base = "/painel" }: Props) {
  return (
    <div role="group" aria-label="Mês das estatísticas" className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
      {meses.map((m) => {
        const ativo = m === atual;
        return (
          <Link
            key={m}
            href={`${base}?mes=${m}`}
            scroll={false}
            aria-current={ativo ? "true" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors",
              ativo ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {formatarMesAno(m)}
          </Link>
        );
      })}
    </div>
  );
}
