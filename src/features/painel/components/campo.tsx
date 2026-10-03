"use client";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface Props {
  id: string;
  rotulo: string;
  erro?: string;
  dica?: string;
  obrigatorio?: boolean;
  className?: string;
  children: React.ReactNode;
}

/** Rótulo + controle + mensagem de erro/dica, no padrão dos formulários do painel. */
export function Campo({ id, rotulo, erro, dica, obrigatorio, className, children }: Props) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>
        {rotulo}
        {obrigatorio && (
          <span className="text-destructive" aria-hidden>
            *
          </span>
        )}
      </Label>
      {children}
      {erro ? (
        <p id={`${id}-erro`} role="alert" className="text-xs text-destructive">
          {erro}
        </p>
      ) : dica ? (
        <p id={`${id}-dica`} className="text-xs text-muted-foreground">
          {dica}
        </p>
      ) : null}
    </div>
  );
}

/** Props de acessibilidade do controle a partir do estado do campo. */
export function a11yCampo(id: string, erro?: string, dica?: string) {
  return {
    id,
    "aria-invalid": erro ? true : undefined,
    "aria-describedby": erro ? `${id}-erro` : dica ? `${id}-dica` : undefined,
  } as const;
}
