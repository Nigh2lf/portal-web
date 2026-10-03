import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { IconWhatsApp } from "@/components/icons/social";
import { Button } from "@/components/ui/button";
import { ASSUNTOS_CONTATO } from "@/features/contato/schemas";
import { ContatoTabs, type ModoContato } from "@/features/contato/components/contato-tabs";
import { getRepository } from "@/lib/api";
import { JsonLd, breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { montarMetadata } from "@/lib/seo/metadata";
import { getPortal } from "@/lib/tenant/get-portal";
import { linkWhatsApp } from "@/lib/utils/format";

export async function generateMetadata(): Promise<Metadata> {
  const portal = await getPortal();
  return montarMetadata(portal, {
    titulo: "Contato",
    descricao: `Fale com a equipe do ${portal.nome}: dúvidas, anúncios, publicidade ou encomenda de imóveis em ${portal.cidade_principal_nome}.`,
    path: "/contato",
  });
}

function um(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function ContatoPage({ searchParams }: PageProps<"/contato">) {
  const [portal, repo, sp] = await Promise.all([getPortal(), getRepository(), searchParams]);
  const [tipos, cidades] = await Promise.all([repo.listTipos(), repo.listCidades(portal.id)]);
  const bairrosIniciais = cidades.length === 1 ? await repo.listBairros({ cidadeId: cidades[0]!.id, portalId: portal.id }) : [];

  const modo: ModoContato = um(sp.tipo) === "encomenda" ? "encomenda" : "contato";
  const assuntoParam = um(sp.assunto);
  const assuntoInicial = ASSUNTOS_CONTATO.find((a) => a === assuntoParam);

  return (
    <>
      <PageHeader titulo="Contato" subtitulo="Tire dúvidas, fale sobre anúncios e publicidade ou encomende um imóvel. Estamos aqui para ajudar." crumbs={[{ nome: "Contato" }]} />
      <Container className="grid gap-10 py-10 lg:grid-cols-[1fr_360px] sm:py-14">
        <div className="card-elevated p-6 sm:p-8">
          <ContatoTabs modoInicial={modo} assuntoInicial={assuntoInicial} tipos={tipos} cidades={cidades} bairrosIniciais={bairrosIniciais} />
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="card-elevated p-6">
            <h2 className="text-lg font-semibold">{portal.nome}</h2>
            <ul className="mt-4 space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                  <Phone className="size-4" aria-hidden />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Telefone</p>
                  <a href={`tel:${portal.telefone.replace(/\D/g, "")}`} className="font-medium hover:text-brand hover:underline">
                    {portal.telefone}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                  <Mail className="size-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">E-mail</p>
                  <a href={`mailto:${portal.email}`} className="block truncate font-medium hover:text-brand hover:underline">
                    {portal.email}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                  <MapPin className="size-4" aria-hidden />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Endereço</p>
                  <p className="font-medium">{portal.endereco}</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                  <Clock className="size-4" aria-hidden />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Atendimento</p>
                  <p className="font-medium">Segunda a sexta, 9h às 18h</p>
                </div>
              </li>
            </ul>
            <Button asChild className="mt-6 w-full bg-[#25D366] text-white hover:bg-[#1ebe5b]">
              <a href={linkWhatsApp(portal.whatsapp, `Olá! Estou no ${portal.nome} e gostaria de falar com a equipe.`)} target="_blank" rel="noopener noreferrer">
                <IconWhatsApp data-icon="inline-start" className="size-4" />
                Falar no WhatsApp
              </a>
            </Button>
          </div>
          <div className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Dúvida sobre um imóvel específico?</strong> Use o botão <em>Contatar</em> na página do anúncio: a mensagem vai direto para o anunciante.
            </p>
          </div>
        </aside>
      </Container>
      <JsonLd data={breadcrumbJsonLd(portal, [{ nome: "Início", href: "/" }, { nome: "Contato", href: "/contato" }])} />
    </>
  );
}
