"use client";

import { Check, Link2, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { IconWhatsApp } from "@/components/icons/social";

interface Props {
  url: string;
  titulo: string;
}

export function Compartilhar({ url, titulo }: Props) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  }

  async function compartilharNativo() {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: titulo, url });
      } catch {
        /* usuário cancelou */
      }
    } else {
      await copiar();
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button type="button" variant="outline" size="sm" onClick={copiar} aria-label="Copiar link do imóvel">
        {copiado ? <Check data-icon="inline-start" className="text-success" /> : <Link2 data-icon="inline-start" />}
        {copiado ? "Copiado" : "Copiar link"}
      </Button>
      <Button asChild variant="outline" size="sm">
        <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${titulo} — ${url}`)}`} target="_blank" rel="noopener noreferrer" aria-label="Compartilhar no WhatsApp">
          <IconWhatsApp data-icon="inline-start" className="size-4 text-[#25D366]" />
          WhatsApp
        </a>
      </Button>
      <Button type="button" variant="ghost" size="icon-sm" onClick={compartilharNativo} aria-label="Compartilhar" className="sm:hidden">
        <Share2 />
      </Button>
    </div>
  );
}
