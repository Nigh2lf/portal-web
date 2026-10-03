import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { getRepository } from "@/lib/api";
import { getSessao } from "@/lib/auth/session";
import { JsonLd, organizacaoJsonLd } from "@/lib/seo/json-ld";
import { getPortal } from "@/lib/tenant/get-portal";

export default async function PublicoLayout({ children }: { children: React.ReactNode }) {
  const [portal, sessao, repo] = await Promise.all([getPortal(), getSessao(), getRepository()]);
  const portais = await repo.listPortais();
  return (
    <>
      <Header portal={portal} sessao={sessao} />
      <main id="conteudo" className="flex-1">
        {children}
      </main>
      <Footer portal={portal} portais={portais} />
      <JsonLd data={organizacaoJsonLd(portal)} />
    </>
  );
}
