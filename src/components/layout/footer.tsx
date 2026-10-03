import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { IconFacebook, IconInstagram } from "@/components/icons/social";
import type { Portal } from "@/lib/api/types";
import { Container } from "./container";
import { PortalSwitcher } from "./portal-switcher";

const linksAdicionais = [
  { label: "Dicas", href: "/dicas" },
  { label: "Blog", href: "/blog" },
  { label: "Quem somos", href: "/quem-somos" },
  { label: "Termos de uso", href: "/termos-de-uso" },
  { label: "Mapa do site", href: "/mapa-do-site" },
  { label: "Publicidade", href: "/publicidade" },
  { label: "Integração XML", href: "/integracao-xml" },
];

const linksAnunciante = [
  { label: "Anunciar", href: "/anunciar" },
  { label: "Planos", href: "/planos" },
  { label: "Cadastre-se", href: "/cadastro" },
  { label: "Encomende um imóvel", href: "/encomendar" },
  { label: "Área do anunciante", href: "/painel" },
];

export function Footer({ portal, portais }: { portal: Portal; portais: Portal[] }) {
  return (
    <footer className="mt-auto border-t bg-brand text-brand-foreground">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h2 className="text-lg font-semibold">O que somos</h2>
          <p className="mt-3 text-sm leading-relaxed text-brand-foreground/80">{portal.o_que_somos}</p>
          <p className="mt-4 text-sm text-brand-foreground/70">Mais de {portal.total_imoveis.toLocaleString("pt-BR")} imóveis anunciados.</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Links adicionais</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {linksAdicionais.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-brand-foreground/80 hover:text-brand-foreground hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Para anunciantes</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {linksAnunciante.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-brand-foreground/80 hover:text-brand-foreground hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Contato</h2>
          <ul className="mt-3 space-y-2 text-sm text-brand-foreground/80">
            <li className="flex items-start gap-2">
              <Mail className="mt-0.5 size-4 shrink-0" aria-hidden />
              <a href={`mailto:${portal.email}`} className="hover:underline">
                {portal.email}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <Phone className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{portal.telefone}</span>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{portal.endereco}</span>
            </li>
          </ul>
          {(portal.facebook || portal.instagram) && (
            <div className="mt-4 flex gap-3">
              {portal.facebook && (
                <a href={portal.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="rounded-full bg-white/10 p-2 hover:bg-white/20">
                  <IconFacebook className="size-4" />
                </a>
              )}
              {portal.instagram && (
                <a href={portal.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="rounded-full bg-white/10 p-2 hover:bg-white/20">
                  <IconInstagram className="size-4" />
                </a>
              )}
            </div>
          )}
        </div>
      </Container>
      <div className="border-t border-white/10">
        <Container className="flex flex-col items-center justify-between gap-3 py-5 text-xs text-brand-foreground/60 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {portal.nome}. Todos os direitos reservados. Desenvolvido por TrustImóvel / TrustInfo.
          </p>
          <PortalSwitcher atual={portal.slug} portais={portais.map((p) => ({ slug: p.slug, nome: p.nome }))} />
        </Container>
      </div>
    </footer>
  );
}
