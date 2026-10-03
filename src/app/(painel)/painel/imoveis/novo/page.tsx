import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getRepository } from "@/lib/api";
import { exigirSessao } from "@/lib/auth/session";
import { montarMetadata } from "@/lib/seo/metadata";
import { getPortal } from "@/lib/tenant/get-portal";
import { ImovelForm } from "@/features/painel/components/imovel-form";
import { PainelHeader } from "@/features/painel/components/painel-header";

export async function generateMetadata(): Promise<Metadata> {
  const portal = await getPortal();
  return montarMetadata(portal, { titulo: "Novo imóvel", noindex: true, path: "/painel/imoveis/novo" });
}

export default async function NovoImovelPage() {
  const sessao = await exigirSessao("/painel/imoveis/novo");
  const [repo, portal] = await Promise.all([getRepository(), getPortal()]);
  const [tipos, cidades, infraestruturas, uso] = await Promise.all([repo.listTipos(), repo.listCidades(portal.id), repo.listInfraestruturas(), repo.getUsoPlano(sessao.anunciante_id)]);
  const limiteAtingido = uso.imoveis_usados >= uso.plano.imoveis;

  return (
    <div className="flex flex-col gap-6">
      <PainelHeader titulo="Novo imóvel" descricao="Preencha os dados do anúncio. Na próxima etapa você adiciona as fotos." crumbs={[{ nome: "Meus imóveis", href: "/painel/imoveis" }, { nome: "Novo imóvel" }]} />

      {limiteAtingido && (
        <Alert className="border-warning/40 bg-warning/10">
          <TriangleAlert />
          <AlertTitle>Limite de imóveis ativos atingido</AlertTitle>
          <AlertDescription>
            Seu {uso.plano.nome} permite {uso.plano.imoveis} {uso.plano.imoveis === 1 ? "imóvel ativo" : "imóveis ativos"} e todos estão em uso. Você pode salvar este imóvel como inativo, desativar outro anúncio ou{" "}
            <Button asChild variant="link" className="h-auto p-0 text-sm">
              <Link href="/planos">
                mudar de plano <ArrowUpRight className="size-3.5" />
              </Link>
            </Button>
            .
          </AlertDescription>
        </Alert>
      )}

      <ImovelForm tipos={tipos} cidades={cidades} bairrosIniciais={[]} infraestruturas={infraestruturas} uso={uso} />
    </div>
  );
}
