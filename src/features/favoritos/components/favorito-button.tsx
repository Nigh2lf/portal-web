"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { iniciarNavegacao } from "@/components/layout/navegacao-progresso";
import { Heart, Trash } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { alternarFavorito } from "@/features/favoritos/actions";
import { cn } from "@/lib/utils";

interface Props {
  imovelId: string;
  /** Estado inicial lido no servidor (`lerFavoritos()`). */
  inicial: boolean;
  /**
   * `icone`: coração flutuante no card. `botao`: botão com texto (detalhe).
   * `remover`: botão "Remover" da página de favoritos (atualiza a lista).
   */
  variante?: "icone" | "botao" | "remover";
  className?: string;
}

export function FavoritoButton({ imovelId, inicial, variante = "icone", className }: Props) {
  const [favorito, setFavorito] = useState(inicial);
  const [pendente, iniciar] = useTransition();
  const router = useRouter();

  function alternar() {
    const anterior = favorito;
    setFavorito(!anterior);
    iniciar(async () => {
      const r = await alternarFavorito(imovelId);
      if (!r.ok || !r.dados) {
        setFavorito(anterior);
        toast.error(r.mensagem ?? "Não foi possível atualizar os favoritos.");
        return;
      }
      setFavorito(r.dados.favorito);
      if (variante === "remover") {
        toast.success(r.mensagem);
        router.refresh();
        return;
      }
      if (r.dados.favorito) {
        toast.success("Imóvel salvo nos favoritos.", {
          action: { label: "Ver favoritos", onClick: () => {
              iniciarNavegacao();
              router.push("/favoritos");
            } },
        });
      } else {
        toast(r.mensagem);
      }
    });
  }

  if (variante === "remover") {
    return (
      <Button type="button" variant="outline" size="sm" onClick={alternar} disabled={pendente} className={className}>
        <Trash data-icon="inline-start" />
        Remover
      </Button>
    );
  }

  if (variante === "botao") {
    return (
      <Button type="button" variant="outline" onClick={alternar} disabled={pendente} aria-pressed={favorito} className={className}>
        <Heart data-icon="inline-start" className={cn(favorito && "fill-destructive text-destructive")} />
        {favorito ? "Favoritado" : "Favoritar"}
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={alternar}
      disabled={pendente}
      aria-pressed={favorito}
      aria-label={favorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      title={favorito ? "Remover dos favoritos" : "Favoritar"}
      className={cn(
        "flex size-9 items-center justify-center rounded-full bg-white/90 text-foreground shadow-sm backdrop-blur transition-all hover:scale-105 hover:bg-white focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-70",
        className,
      )}
    >
      <Heart className={cn("size-[18px] transition-colors", favorito ? "fill-destructive text-destructive" : "text-foreground/70")} aria-hidden />
    </button>
  );
}

/** Atalho para o header/menu: link para favoritos com contador. */
export function LinkFavoritos({ total }: { total: number }) {
  return (
    <Button asChild variant="ghost" size="sm">
      <Link href="/favoritos">
        <Heart data-icon="inline-start" />
        Favoritos{total > 0 && ` (${total})`}
      </Link>
    </Button>
  );
}
