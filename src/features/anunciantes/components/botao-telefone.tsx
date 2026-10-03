"use client";

import { useState, useTransition } from "react";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatarTelefone, ocultarTelefone } from "@/lib/utils/format";
import { registrarCliqueAnunciante } from "../actions";

interface Props {
  anuncianteId: string;
  telefone: string;
  telefone2?: string | null;
  className?: string;
}

/** "Ver telefone": revela o número e registra o clique no servidor. */
export function BotaoTelefone({ anuncianteId, telefone, telefone2, className }: Props) {
  const [revelado, setRevelado] = useState(false);
  const [pendente, startTransition] = useTransition();

  if (revelado) {
    return (
      <div className={className}>
        <a href={`tel:${telefone.replace(/\D/g, "")}`} className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline">
          <Phone className="size-4" aria-hidden />
          {formatarTelefone(telefone)}
        </a>
        {telefone2 && (
          <a href={`tel:${telefone2.replace(/\D/g, "")}`} className="mt-1 block text-sm text-muted-foreground hover:underline">
            {formatarTelefone(telefone2)}
          </a>
        )}
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      disabled={pendente}
      onClick={() => {
        setRevelado(true);
        startTransition(async () => {
          await registrarCliqueAnunciante(anuncianteId, "telefone");
        });
      }}
      aria-label="Ver telefone"
    >
      <Phone data-icon="inline-start" />
      <span className="tabular-nums">{ocultarTelefone(telefone)}</span>
      <span className="font-semibold">Ver telefone</span>
    </Button>
  );
}
