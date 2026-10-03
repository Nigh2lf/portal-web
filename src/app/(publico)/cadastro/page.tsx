import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Headset, Lock, ShieldCheck } from "lucide-react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { CadastroWizard } from "@/features/conta/components/cadastro-wizard";
import { getRepository } from "@/lib/api";
import { getSessao } from "@/lib/auth/session";
import { montarMetadata } from "@/lib/seo/metadata";
import { getPortal } from "@/lib/tenant/get-portal";

export async function generateMetadata(): Promise<Metadata> {
  const portal = await getPortal();
  return montarMetadata(portal, {
    titulo: "Cadastre-se",
    descricao: `Crie sua conta no ${portal.nome} para anunciar imóveis em ${portal.cidade_principal_nome}. Proprietário anuncia grátis; imobiliárias e corretores escolhem um plano.`,
    path: "/cadastro",
  });
}

function um(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function CadastroPage({ searchParams }: PageProps<"/cadastro">) {
  const [portal, repo, sessao, sp] = await Promise.all([getPortal(), getRepository(), getSessao(), searchParams]);
  if (sessao) redirect("/painel");
  const planos = await repo.listPlanos();

  return (
    <>
      <PageHeader
        titulo="Cadastre-se"
        subtitulo={`Crie sua conta no ${portal.nome} em três passos e comece a anunciar.`}
        crumbs={[{ nome: "Cadastre-se" }]}
        compacto
      />
      <Container className="grid gap-8 py-10 lg:grid-cols-[1fr_300px] sm:py-14">
        <CadastroWizard planos={planos} planoInicialSlug={um(sp.plano)} />
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <ul className="card-elevated space-y-4 p-5 text-sm">
            <li className="flex gap-3">
              <ShieldCheck className="size-5 shrink-0 text-brand" aria-hidden />
              <span>
                <strong className="block">Sem pagamento online</strong>
                <span className="text-muted-foreground">Planos pagos são ativados após confirmação da nossa equipe.</span>
              </span>
            </li>
            <li className="flex gap-3">
              <Lock className="size-5 shrink-0 text-brand" aria-hidden />
              <span>
                <strong className="block">Seus dados protegidos</strong>
                <span className="text-muted-foreground">Telefone exibido só após o clique em &quot;Ver telefone&quot;.</span>
              </span>
            </li>
            <li className="flex gap-3">
              <Headset className="size-5 shrink-0 text-brand" aria-hidden />
              <span>
                <strong className="block">Ajuda humana</strong>
                <span className="text-muted-foreground">
                  Dúvidas?{" "}
                  <Link href="/contato?assunto=Quero%20anunciar" className="text-brand underline-offset-4 hover:underline">
                    Fale conosco
                  </Link>
                  .
                </span>
              </span>
            </li>
          </ul>
          <p className="px-1 text-xs text-muted-foreground">
            Ao se cadastrar você concorda com os{" "}
            <Link href="/termos-de-uso" className="underline underline-offset-4 hover:text-foreground">
              Termos de Uso
            </Link>{" "}
            do portal.
          </p>
        </aside>
      </Container>
    </>
  );
}
