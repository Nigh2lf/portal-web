"use client";

import { IconWhatsApp } from "@/components/icons/social";
import { Button } from "@/components/ui/button";
import { linkWhatsApp } from "@/lib/utils/format";
import { registrarCliqueAnunciante } from "../actions";

interface Props {
  anuncianteId: string;
  numero: string;
  texto: string;
  className?: string;
}

export function BotaoWhatsApp({ anuncianteId, numero, texto, className }: Props) {
  return (
    <Button asChild size="sm" className={`bg-[#25D366] text-white hover:bg-[#1ebe5b] ${className ?? ""}`}>
      <a
        href={linkWhatsApp(numero, texto)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          void registrarCliqueAnunciante(anuncianteId, "whatsapp");
        }}
      >
        <IconWhatsApp data-icon="inline-start" className="size-4" />
        WhatsApp
      </a>
    </Button>
  );
}
