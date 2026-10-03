import { CircleCheck, CircleDashed, CirclePause, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Imovel } from "@/lib/api/types";
import { statusDoImovel } from "../utils";

export function StatusBadge({ imovel }: { imovel: Pick<Imovel, "ativo" | "status"> }) {
  const status = statusDoImovel(imovel);
  if (status === "ativo")
    return (
      <Badge className="bg-success/15 text-success border-success/20">
        <CircleCheck aria-hidden /> Ativo
      </Badge>
    );
  if (status === "rascunho")
    return (
      <Badge variant="outline" className="text-muted-foreground">
        <CircleDashed aria-hidden /> Rascunho
      </Badge>
    );
  return (
    <Badge variant="secondary" className="text-muted-foreground">
      <CirclePause aria-hidden /> Inativo
    </Badge>
  );
}

export function DestaqueBadge() {
  return (
    <Badge className="bg-highlight/20 text-foreground border-highlight/40">
      <Star aria-hidden className="fill-current" /> Destaque
    </Badge>
  );
}
