import Link from "next/link";
import { ArrowRight, BadgeCheck, Globe, Mail, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AnuncianteResumo } from "@/lib/api/types";
import { linkBusca } from "@/lib/busca/filtros";
import { formatarNumero, plural } from "@/lib/utils/format";
import { BotaoTelefone } from "./botao-telefone";
import { BotaoWhatsApp } from "./botao-whatsapp";
import { LogoAnunciante } from "./logo-anunciante";

interface Props {
  anunciante: AnuncianteResumo;
  portalNome: string;
}

function hostDoSite(site: string) {
  try {
    return new URL(site.startsWith("http") ? site : `https://${site}`).host.replace(/^www\./, "");
  } catch {
    return site;
  }
}

export function AnuncianteCard({ anunciante: a, portalNome }: Props) {
  const hrefImoveis = a.hotsite ? `/imobiliarias/${a.slug}` : linkBusca({ anunciante: a.slug });
  const totais = a.totais_por_objetivo;
  const whatsapp = a.whatsapp ?? a.telefone2 ?? null;

  return (
    <article className="card-elevated card-elevated-hover flex h-full flex-col p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <LogoAnunciante nome={a.nome} logoUrl={a.logo_url} tamanho={72} />
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-lg font-semibold leading-snug">
            {a.hotsite ? (
              <Link href={hrefImoveis} className="hover:text-brand">
                {a.nome}
              </Link>
            ) : (
              a.nome
            )}
          </h3>
          {a.creci && (
            <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <BadgeCheck className="size-3.5 text-brand" aria-hidden />
              CRECI {a.creci}
            </p>
          )}
          {a.hotsite && (
            <Badge variant="secondary" className="mt-2 bg-brand-soft text-brand">
              Hotsite no portal
            </Badge>
          )}
        </div>
      </div>

      {a.endereco && (
        <p className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span className="line-clamp-2">{a.endereco}</span>
        </p>
      )}

      <dl className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-muted/60 p-3 text-center">
        <div>
          <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Venda</dt>
          <dd className="font-heading text-base font-semibold text-brand">{formatarNumero(totais.comprar)}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Aluguel</dt>
          <dd className="font-heading text-base font-semibold text-brand">{formatarNumero(totais.alugar)}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Temporada</dt>
          <dd className="font-heading text-base font-semibold text-brand">{formatarNumero(totais.temporada)}</dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <BotaoTelefone anuncianteId={a.id} telefone={a.telefone} telefone2={a.telefone2} />
        {whatsapp && (
          <BotaoWhatsApp anuncianteId={a.id} numero={whatsapp} texto={`Olá! Vi o perfil de ${a.nome} no ${portalNome} e gostaria de mais informações.`} />
        )}
      </div>

      <ul className="mt-3 space-y-1 text-sm">
        {a.email && (
          <li className="flex items-center gap-2 text-muted-foreground">
            <Mail className="size-4 shrink-0" aria-hidden />
            <a href={`mailto:${a.email}`} className="truncate hover:text-brand hover:underline">
              {a.email}
            </a>
          </li>
        )}
        {a.site && (
          <li className="flex items-center gap-2 text-muted-foreground">
            <Globe className="size-4 shrink-0" aria-hidden />
            <a href={a.site.startsWith("http") ? a.site : `https://${a.site}`} target="_blank" rel="noopener noreferrer nofollow" className="truncate hover:text-brand hover:underline">
              {hostDoSite(a.site)}
            </a>
          </li>
        )}
      </ul>

      <div className="mt-auto pt-5">
        <Button asChild variant="secondary" className="w-full justify-between">
          <Link href={hrefImoveis}>
            Ver {formatarNumero(a.total_imoveis)} {plural(a.total_imoveis, "imóvel", "imóveis")}
            <ArrowRight data-icon="inline-end" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
