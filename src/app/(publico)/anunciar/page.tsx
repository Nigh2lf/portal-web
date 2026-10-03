import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { LoginForm } from "@/features/conta/components/login-form";
import { LeadForm } from "@/features/institucional/components/anunciar/lead-form";
import { Beneficios, FaqAnunciar, PitchB2B, PreviewPlanos } from "@/features/institucional/components/anunciar/secoes";
import { getRepository } from "@/lib/api";
import { getSessao } from "@/lib/auth/session";
import { montarMetadata } from "@/lib/seo/metadata";
import { getPortal } from "@/lib/tenant/get-portal";

export async function generateMetadata(): Promise<Metadata> {
  const portal = await getPortal();
  return montarMetadata(portal, {
    titulo: "Anuncie seus imóveis",
    descricao: `Imobiliárias e corretores: divulgue sua carteira no ${portal.nome}, o portal de imóveis de ${portal.cidade_principal_nome}. Entre no painel ou cadastre-se.`,
    path: "/anunciar",
  });
}

function um(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AnunciarPage({ searchParams }: PageProps<"/anunciar">) {
  const [portal, repo, sessao, sp] = await Promise.all([getPortal(), getRepository(), getSessao(), searchParams]);
  const next = um(sp.next);
  if (sessao) redirect(next && next.startsWith("/") && !next.startsWith("//") ? next : "/painel");

  const [{ imobiliarias }, planos] = await Promise.all([repo.listAnunciantes(portal.id), repo.listPlanos()]);
  const comLogo = imobiliarias.filter((a) => a.logo_url);
  const planosPreview = planos.filter((p) => !p.exclusivo_proprietario && p.preco_mensal !== null).slice(0, 3);
  const dicaMock = process.env.NODE_ENV !== "production" && (process.env.DATA_SOURCE ?? "mock") === "mock";

  return (
    <>
      <section className="border-b bg-gradient-to-br from-brand-soft/80 via-background to-background">
        <Container className="grid items-center gap-12 py-12 lg:grid-cols-[1.15fr_1fr] lg:py-20">
          <PitchB2B portal={portal} anunciantes={comLogo.length ? comLogo : imobiliarias} />
          <div id="entrar" className="card-elevated mx-auto w-full max-w-md p-6 sm:p-8 lg:ml-auto">
            <h2 className="text-2xl font-bold">Área do anunciante</h2>
            <p className="mt-1 text-sm text-muted-foreground">Entre para gerenciar seus imóveis, fotos e contatos recebidos.</p>
            <LoginForm next={next} dicaMock={dicaMock} className="mt-6" />
          </div>
        </Container>
      </section>

      <section aria-labelledby="beneficios">
        <Container className="py-14 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="beneficios" className="text-3xl font-bold">
              Por que anunciar no {portal.nome}?
            </h2>
            <p className="mt-3 text-muted-foreground">Uma mídia especializada no mercado imobiliário da região, com público que está realmente decidindo.</p>
          </div>
          <div className="mt-10">
            <Beneficios />
          </div>
        </Container>
      </section>

      {planosPreview.length > 0 && (
        <section className="border-y bg-muted/30" aria-labelledby="planos-preview">
          <Container className="py-14 sm:py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 id="planos-preview" className="text-3xl font-bold">
                Planos para cada necessidade
              </h2>
              <p className="mt-3 text-muted-foreground">Sem fidelidade. Comece pequeno e cresça quando quiser.</p>
            </div>
            <div className="mt-10">
              <PreviewPlanos planos={planosPreview} />
            </div>
          </Container>
        </section>
      )}

      <section aria-labelledby="lead">
        <Container className="grid gap-10 py-14 lg:grid-cols-2 sm:py-20">
          <div>
            <h2 id="lead" className="text-3xl font-bold">
              Fale com a nossa equipe
            </h2>
            <p className="mt-3 text-muted-foreground">
              Quer uma proposta sob medida, ajuda para integrar o seu CRM ou tirar dúvidas antes de assinar? Deixe seus dados e retornamos em até 1 dia útil.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              <li>
                <strong className="text-foreground">E-mail:</strong>{" "}
                <a href={`mailto:${portal.email}`} className="hover:text-brand hover:underline">
                  {portal.email}
                </a>
              </li>
              <li>
                <strong className="text-foreground">Telefone / WhatsApp:</strong> {portal.telefone}
              </li>
              <li>
                <strong className="text-foreground">Endereço:</strong> {portal.endereco}
              </li>
            </ul>
            <div className="mt-8 rounded-2xl bg-brand p-6 text-brand-foreground">
              <p className="font-heading text-xl font-bold">Prefere começar agora?</p>
              <p className="mt-1 text-sm text-brand-foreground/80">O cadastro leva menos de 3 minutos.</p>
              <Button asChild size="lg" className="mt-4 bg-cta text-cta-foreground hover:bg-cta/90">
                <Link href="/cadastro">Cadastre-se</Link>
              </Button>
            </div>
          </div>
          <div className="card-elevated p-6 sm:p-8">
            <LeadForm />
          </div>
        </Container>
      </section>

      <section className="border-t bg-muted/30" aria-labelledby="faq-anunciar">
        <Container className="grid gap-10 py-14 lg:grid-cols-[1fr_1.4fr] sm:py-20">
          <div>
            <h2 id="faq-anunciar" className="text-3xl font-bold">
              Perguntas frequentes
            </h2>
            <p className="mt-3 text-muted-foreground">Não encontrou a resposta? Use o formulário acima ou acesse a página de contato.</p>
            <Button asChild variant="outline" className="mt-5">
              <Link href="/contato?assunto=Quero%20anunciar">Página de contato</Link>
            </Button>
          </div>
          <FaqAnunciar portal={portal} />
        </Container>
      </section>
    </>
  );
}
