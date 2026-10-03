import Link from "next/link";
import { Bell, ClipboardList, Handshake, Search } from "lucide-react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { getRepository } from "@/lib/api";
import { getPortal } from "@/lib/tenant/get-portal";
import { EncomendaForm } from "./encomenda-form";

const passos = [
  { icone: ClipboardList, titulo: "Descreva o imóvel", texto: "Tipo, bairro, faixa de preço e o que não pode faltar." },
  { icone: Search, titulo: "Nós procuramos", texto: "O pedido chega a quem tem imóveis compatíveis." },
  { icone: Bell, titulo: "Você recebe as opções", texto: "Contato direto por e-mail, telefone ou WhatsApp." },
];

/** Página de encomenda (versões "portal" e "parceiro"), composta pelas rotas `/encomendar` e `/encomendar/parceiro`. */
export async function EncomendaSecao({ parceiro }: { parceiro: boolean }) {
  const [portal, repo] = await Promise.all([getPortal(), getRepository()]);
  const [tipos, cidades] = await Promise.all([repo.listTipos(), repo.listCidades(portal.id)]);
  const bairrosIniciais = cidades.length === 1 ? await repo.listBairros({ cidadeId: cidades[0]!.id, portalId: portal.id }) : [];

  return (
    <>
      <PageHeader
        titulo={parceiro ? "Encomende seu imóvel às imobiliárias" : "Encomende um imóvel"}
        subtitulo={
          parceiro
            ? `Preencha o pedido e ele será enviado a todas as imobiliárias parceiras do ${portal.nome} que recebem encomendas.`
            : `Não encontrou o que procura? Conte para nós o imóvel ideal e a equipe do ${portal.nome} ajuda você a encontrá-lo.`
        }
        crumbs={parceiro ? [{ nome: "Encomendar", href: "/encomendar" }, { nome: "Parceiros" }] : [{ nome: "Encomendar" }]}
      />
      <Container className="grid gap-10 py-10 lg:grid-cols-[1fr_340px] sm:py-14">
        <div className="card-elevated p-6 sm:p-8">
          <EncomendaForm tipos={tipos} cidades={cidades} bairrosIniciais={bairrosIniciais} parceiro={parceiro} />
        </div>
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="card-elevated p-6">
            <h2 className="text-lg font-semibold">Como funciona</h2>
            <ol className="mt-4 space-y-4">
              {passos.map((p, i) => (
                <li key={p.titulo} className="flex gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                    <p.icone className="size-4" aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">
                      {i + 1}. {p.titulo}
                    </p>
                    <p className="text-sm text-muted-foreground">{p.texto}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-xl border border-dashed p-5 text-sm">
            <Handshake className="size-6 text-brand" aria-hidden />
            {parceiro ? (
              <p className="mt-2 text-muted-foreground">
                Prefere falar só com o portal?{" "}
                <Link href="/encomendar" className="font-medium text-brand underline-offset-4 hover:underline">
                  Use a encomenda simples
                </Link>
                .
              </p>
            ) : (
              <p className="mt-2 text-muted-foreground">
                Quer que as imobiliárias parceiras recebam seu pedido diretamente?{" "}
                <Link href="/encomendar/parceiro" className="font-medium text-brand underline-offset-4 hover:underline">
                  Encomendar às imobiliárias
                </Link>
                .
              </p>
            )}
          </div>
        </aside>
      </Container>
    </>
  );
}
