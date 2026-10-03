import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  icon: LucideIcon;
  titulo: string;
  descricao?: string;
  acao?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, titulo, descricao, acao, className }: Props) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center", className)}>
      <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-brand-soft text-brand">
        <Icon className="size-6" aria-hidden />
      </div>
      <h3 className="text-base font-semibold">{titulo}</h3>
      {descricao && <p className="mt-1 max-w-md text-sm text-muted-foreground">{descricao}</p>}
      {acao && <div className="mt-4">{acao}</div>}
    </div>
  );
}
