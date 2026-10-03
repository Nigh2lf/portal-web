import type { Metadata } from "next";
import Link from "next/link";
import { Lightbulb, MessageCircle } from "lucide-react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { getRepository } from "@/lib/api";
import { JsonLd, breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { montarMetadata } from "@/lib/seo/metadata";
import { getPortal } from "@/lib/tenant/get-portal";

export async function generateMetadata(): Promise<Metadata> {
  const portal = await getPortal();
  return montarMetadata(portal, {
    titulo: "Dicas para comprar, vender e alugar",
    descricao: `Dicas práticas do ${portal.nome} para quem vai comprar, vender ou alugar um imóvel em ${portal.cidade_principal_nome}: documentação, custos, negociação e muito mais.`,
    path: "/dicas",
  });
}

export default async function DicasPage() {
  const [portal, repo] = await Promise.all([getPortal(), getRepository()]);
  const dicas = await repo.listDicas();

  return (
    <>
      <PageHeader titulo="Dicas" subtitulo="Respostas rápidas para as dúvidas mais comuns de quem vai comprar, vender ou alugar um imóvel." crumbs={[{ nome: "Dicas" }]} />
      <Container className="grid gap-10 py-10 lg:grid-cols-[1fr_320px] sm:py-14">
        <div>
          <div className="mb-6 flex items-start gap-3 rounded-xl bg-brand-soft/70 p-4 text-sm text-brand">
            <Lightbulb className="mt-0.5 size-5 shrink-0" aria-hidden />
            <p>
              Reunimos aqui orientações da equipe do {portal.nome} e de corretores parceiros. Clique em uma pergunta para ver a resposta.
            </p>
          </div>
          {dicas.length === 0 ? (
            <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">Nenhuma dica cadastrada.</p>
          ) : (
            <Accordion type="single" collapsible className="card-elevated divide-y px-5 sm:px-6">
              {dicas.map((d, i) => (
                <AccordionItem key={d.id} value={d.id} className="border-b-0">
                  <AccordionTrigger className="py-4 text-base hover:no-underline [&>svg]:mt-1">
                    <span className="flex items-start gap-3">
                      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand">{i + 1}</span>
                      <span className="font-semibold">{d.titulo}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 pl-9">
                    <div className="prose-portal text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: d.descricao_html }} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card-elevated p-6">
            <MessageCircle className="size-8 text-brand" aria-hidden />
            <h2 className="mt-3 text-lg font-semibold">Não encontrou sua dúvida?</h2>
            <p className="mt-2 text-sm text-muted-foreground">Fale com a nossa equipe. Respondemos em horário comercial.</p>
            <Button asChild className="mt-4 w-full">
              <Link href="/contato">Fale conosco</Link>
            </Button>
            <Button asChild variant="outline" className="mt-2 w-full">
              <Link href="/encomendar">Encomendar um imóvel</Link>
            </Button>
          </div>
        </aside>
      </Container>
      <JsonLd data={breadcrumbJsonLd(portal, [{ nome: "Início", href: "/" }, { nome: "Dicas", href: "/dicas" }])} />
    </>
  );
}
