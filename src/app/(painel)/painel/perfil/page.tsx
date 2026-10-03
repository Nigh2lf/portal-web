import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRepository } from "@/lib/api";
import { exigirSessao } from "@/lib/auth/session";
import { montarMetadata } from "@/lib/seo/metadata";
import { getPortal } from "@/lib/tenant/get-portal";
import { formatarDataLonga, formatarDocumento } from "@/lib/utils/format";
import { PainelHeader } from "@/features/painel/components/painel-header";
import { PerfilForm } from "@/features/painel/components/perfil-form";

export async function generateMetadata(): Promise<Metadata> {
  const portal = await getPortal();
  return montarMetadata(portal, { titulo: "Meu cadastro", noindex: true, path: "/painel/perfil" });
}

const TIPO_LABEL = { proprietario: "Proprietário", corretor: "Corretor", imobiliaria: "Imobiliária" } as const;

export default async function PerfilPage() {
  const sessao = await exigirSessao("/painel/perfil");
  const repo = await getRepository();
  const [anunciante, planos] = await Promise.all([repo.getAnunciante(sessao.anunciante_id), repo.listPlanos()]);
  if (!anunciante) notFound();
  const plano = planos.find((p) => p.id === anunciante.plano_id);

  return (
    <div className="flex flex-col gap-6">
      <PainelHeader titulo="Meu cadastro" descricao="Atualize seus dados de contato. Documento, tipo de conta e plano não podem ser alterados por aqui." crumbs={[{ nome: "Meu cadastro" }]} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PerfilForm anunciante={anunciante} />
        </div>
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Informações da conta</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Tipo de conta</dt>
                <dd className="font-medium">{TIPO_LABEL[anunciante.tipo]}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{anunciante.tipo === "imobiliaria" ? "CNPJ" : "CPF"}</dt>
                <dd className="font-medium tabular-nums">{formatarDocumento(anunciante.documento)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Plano</dt>
                <dd className="font-medium">{plano?.nome ?? "--"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Cadastrado em</dt>
                <dd className="font-medium">{formatarDataLonga(anunciante.cadastrado_em)}</dd>
              </div>
              {anunciante.url_xml && (
                <div>
                  <dt className="text-xs text-muted-foreground">Integração XML</dt>
                  <dd className="truncate font-medium" title={anunciante.url_xml}>
                    {anunciante.url_xml}
                  </dd>
                </div>
              )}
            </dl>
            <p className="mt-4 text-xs text-muted-foreground">Para alterar documento ou plano, fale com o portal pela página de contato.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
