"use client";

import { useState } from "react";
import { Check, Link2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { IconFacebook, IconWhatsApp } from "@/components/icons/social";
import { Button } from "@/components/ui/button";

interface Props {
  url: string;
  titulo: string;
}

export function Compartilhar({ url, titulo }: Props) {
  const [copiado, setCopiado] = useState(false);
  const texto = `${titulo} — ${url}`;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      toast.success("Link copiado.");
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  }

  async function compartilharNativo() {
    if (typeof navigator.share !== "function") return copiar();
    try {
      await navigator.share({ title: titulo, url });
    } catch {
      /* usuário cancelou */
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm font-medium text-muted-foreground">Compartilhar:</span>
      <Button type="button" variant="outline" size="sm" onClick={copiar}>
        {copiado ? <Check data-icon="inline-start" /> : <Link2 data-icon="inline-start" />}
        {copiado ? "Copiado" : "Copiar link"}
      </Button>
      <Button asChild size="sm" className="bg-[#25D366] text-white hover:bg-[#1ebe5b]">
        <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`} target="_blank" rel="noopener noreferrer">
          <IconWhatsApp data-icon="inline-start" className="size-4" />
          WhatsApp
        </a>
      </Button>
      <Button asChild variant="outline" size="sm">
        <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer">
          <IconFacebook data-icon="inline-start" className="size-4" />
          Facebook
        </a>
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={compartilharNativo} className="sm:hidden">
        <Share2 data-icon="inline-start" />
        Mais
      </Button>
    </div>
  );
}
