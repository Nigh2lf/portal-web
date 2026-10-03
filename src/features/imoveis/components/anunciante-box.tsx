"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, ExternalLink, Globe, Mail, MapPin, Phone } from "lucide-react";
import type { AnuncianteResumo } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { IconWhatsApp } from "@/components/icons/social";
import { registrarClique } from "@/features/imoveis/actions";
import { formatarTelefone, iniciais, linkWhatsApp, ocultarTelefone } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

interface Props {
  anunciante: AnuncianteResumo;
  portalNome: string;
  /** Contexto de um imóvel (detalhe): registra o clique no imóvel e monta o texto do WhatsApp. */
  imovelId?: string;
  codigo?: string;
  /** Mostra link "Ver todos os imóveis" para o hotsite quando o anunciante tem um. */
  linkHotsite?: boolean;
  /** Exibe endereço, site e e-mail (cabeçalho do hotsite). */
  completo?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const ROTULO_TIPO = { proprietario: "Proprietário", corretor: "Corretor", imobiliaria: "Imobiliária" } as const;

export function AnuncianteBox({ anunciante: a, portalNome, imovelId, codigo, linkHotsite = true, completo, className, children }: Props) {
  const [revelado, setRevelado] = useState(false);
  const textoWhats = codigo ? `Olá, vi o imóvel ${codigo} no ${portalNome} e gostaria de mais informações.` : `Olá, vi seus imóveis no ${portalNome} e gostaria de mais informações.`;

  function revelarTelefone() {
    setRevelado(true);
    void registrarClique({ imovelId, anuncianteId: a.id, tipo: "telefone" });
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-center gap-3">
        <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-foreground/10">
          {a.logo_url ? (
            <Image src={a.logo_url} alt={a.nome} width={64} height={64} className="size-full object-contain p-1" />
          ) : (
            <span className="flex size-full items-center justify-center bg-brand-soft text-base font-semibold text-brand">{iniciais(a.nome)}</span>
          )}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{ROTULO_TIPO[a.tipo]}</p>
          <p className="truncate font-heading text-base font-semibold leading-tight">{a.nome}</p>
          {a.creci && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <BadgeCheck className="size-3.5 text-success" aria-hidden />
              CRECI {a.creci}
            </p>
          )}
        </div>
      </div>

      {completo && (
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          {a.endereco && (
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{a.endereco}</span>
            </li>
          )}
          {a.site && (
            <li className="flex items-center gap-2">
              <Globe className="size-4 shrink-0" aria-hidden />
              <a href={a.site.startsWith("http") ? a.site : `https://${a.site}`} target="_blank" rel="noopener noreferrer nofollow" className="truncate hover:text-brand hover:underline">
                {a.site.replace(/^https?:\/\//, "")}
              </a>
            </li>
          )}
          {a.email && (
            <li className="flex items-center gap-2">
              <Mail className="size-4 shrink-0" aria-hidden />
              <a href={`mailto:${a.email}`} className="truncate hover:text-brand hover:underline">
                {a.email}
              </a>
            </li>
          )}
        </ul>
      )}

      <div className="grid gap-2">
        {revelado ? (
          <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
            <p className="mb-1 text-xs text-muted-foreground">Telefone{a.telefone2 ? "s" : ""}</p>
            <a href={`tel:+55${a.telefone.replace(/\D/g, "")}`} className="flex items-center gap-2 font-semibold text-brand hover:underline">
              <Phone className="size-4" aria-hidden />
              {formatarTelefone(a.telefone)}
            </a>
            {a.telefone2 && (
              <a href={`tel:+55${a.telefone2.replace(/\D/g, "")}`} className="mt-1 flex items-center gap-2 font-semibold text-brand hover:underline">
                <Phone className="size-4" aria-hidden />
                {formatarTelefone(a.telefone2)}
              </a>
            )}
          </div>
        ) : (
          <Button type="button" variant="outline" size="lg" onClick={revelarTelefone} className="w-full justify-start">
            <Phone data-icon="inline-start" />
            <span className="flex-1 text-left">
              Ver telefone <span className="ml-1 text-muted-foreground tabular-nums">{ocultarTelefone(a.telefone)}</span>
            </span>
          </Button>
        )}

        {a.whatsapp && (
          <Button asChild size="lg" className="w-full bg-[#25D366] text-white hover:bg-[#1ebe5b]">
            <a href={linkWhatsApp(a.whatsapp, textoWhats)} target="_blank" rel="noopener noreferrer" onClick={() => void registrarClique({ imovelId, anuncianteId: a.id, tipo: "whatsapp" })}>
              <IconWhatsApp data-icon="inline-start" className="size-5" />
              Falar pelo WhatsApp
            </a>
          </Button>
        )}

        {linkHotsite && a.hotsite && (
          <Button asChild variant="ghost" size="sm" className="text-brand">
            <Link href={`/imobiliarias/${a.slug}`}>
              <ExternalLink data-icon="inline-start" />
              Ver todos os imóveis de {a.nome.split(" ")[0]}
            </Link>
          </Button>
        )}
      </div>

      {children}
    </div>
  );
}
