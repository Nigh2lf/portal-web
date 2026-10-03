"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { Publicidade } from "@/lib/api/types";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

const CHAVE = "popup_home_visto";

/** Popup publicitário exibido uma vez por sessão (categoria `popup_home`). */
export function PopupHome({ pub }: { pub: Publicidade | null }) {
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    if (!pub) return;
    try {
      if (sessionStorage.getItem(CHAVE) === pub.id) return;
      sessionStorage.setItem(CHAVE, pub.id);
    } catch {
      /* sem sessionStorage: mostra mesmo assim */
    }
    const t = setTimeout(() => setAberto(true), 800);
    return () => clearTimeout(t);
  }, [pub]);

  if (!pub) return null;

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-xl [&_[data-slot=dialog-close]]:bg-white/90 [&_[data-slot=dialog-close]]:hover:bg-white">
        <DialogTitle className="sr-only">{pub.nome}</DialogTitle>
        <DialogDescription className="sr-only">Publicidade</DialogDescription>
        <a href={pub.link} target={pub.nova_aba ? "_blank" : undefined} rel="noopener noreferrer sponsored" className="relative block aspect-[4/3] bg-muted sm:aspect-[5/4]" aria-label={`Publicidade: ${pub.nome}`} onClick={() => setAberto(false)}>
          <Image src={pub.imagem_url} alt={pub.nome} fill sizes="(min-width: 640px) 576px, 100vw" className="object-cover" />
          <span className="absolute bottom-2 left-2 rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">Publicidade</span>
        </a>
      </DialogContent>
    </Dialog>
  );
}
