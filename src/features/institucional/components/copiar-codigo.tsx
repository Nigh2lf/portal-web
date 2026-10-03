"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CopiarCodigo({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texto);
          setCopiado(true);
          setTimeout(() => setCopiado(false), 2000);
        } catch {
          toast.error("Não foi possível copiar.");
        }
      }}
    >
      {copiado ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
      {copiado ? "Copiado" : "Copiar"}
    </Button>
  );
}
