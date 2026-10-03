"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { limparFavoritos } from "@/features/favoritos/actions";

export function LimparFavoritosButton() {
  const [pendente, iniciar] = useTransition();
  const router = useRouter();
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pendente}
      onClick={() =>
        iniciar(async () => {
          const r = await limparFavoritos();
          if (r.ok) toast.success(r.mensagem);
          else toast.error(r.mensagem ?? "Não foi possível limpar a lista.");
          router.refresh();
        })
      }
    >
      <Trash data-icon="inline-start" />
      Limpar lista
    </Button>
  );
}
