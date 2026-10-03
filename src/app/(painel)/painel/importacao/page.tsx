import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, CircleAlert, CircleCheck, Clock, FileCode2, FileDown, Link2, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getRepository } from "@/lib/api";
import { exigirSessao } from "@/lib/auth/session";
import { montarMetadata } from "@/lib/seo/metadata";
import { getPortal } from "@/lib/tenant/get-portal";
import { EmptyState } from "@/features/painel/components/empty-state";
import { KpiTile } from "@/features/painel/components/kpi-tile";
import { PainelHeader } from "@/features/painel/components/painel-header";
import { formatarDataHora } from "@/features/painel/utils";

export async function generateMetadata(): Promise<Metadata> {
  const portal = await getPortal();
  return montarMetadata(portal, { titulo: "Importação XML", noindex: true, path: "/painel/importacao" });
}

export default async function ImportacaoPage() {
  const sessao = await exigirSessao("/painel/importacao");
  const repo = await getRepository();
  const relatorio = await repo.getRelatorioImportacao(sessao.anunciante_id);

  if (!relatorio) {
    return (
      <div className="flex flex-col gap-6">
        <PainelHeader titulo="Importação XML" descricao="Integre o sistema da sua imobiliária ao portal e mantenha os anúncios sincronizados automaticamente." crumbs={[{ nome: "Importação XML" }]} />
        <EmptyState
          icon={FileCode2}
          titulo="Sua conta ainda não tem integração XML"
          descricao="Com a integração, os imóveis do seu sistema são importados e atualizados automaticamente, sem cadastro manual. Veja o padrão aceito e como solicitar a ativação."
          acao={
            <Button asChild>
              <Link href="/integracao-xml">
                Conhecer a integração XML <ArrowUpRight data-icon="inline-end" />
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  const totalInvalidos = relatorio.invalidos.length;

  return (
    <div className="flex flex-col gap-6">
      <PainelHeader titulo="Importação XML" descricao="Resultado da última leitura do seu arquivo XML." crumbs={[{ nome: "Importação XML" }]} />

      <Alert>
        <Clock />
        <AlertTitle>A importação roda automaticamente</AlertTitle>
        <AlertDescription>
          O portal lê seu XML periodicamente e aplica as diferenças: novos imóveis entram, alterados são atualizados e removidos saem do site. Não é necessária nenhuma ação sua; corrija os itens inválidos no seu sistema e eles entrarão na próxima leitura.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiTile rotulo="Imóveis no XML" valor={relatorio.total_xml} icon={FileDown} />
        <KpiTile rotulo="Válidos" valor={relatorio.validos} icon={CircleCheck} detalhe="publicados no portal" />
        <KpiTile rotulo="Inválidos" valor={totalInvalidos} icon={CircleAlert} detalhe={totalInvalidos ? "exigem correção" : "nenhum problema"} className={totalInvalidos ? "ring-1 ring-destructive/30" : undefined} />
        <KpiTile rotulo="Última importação" valor={relatorio.ultima_importacao ? formatarDataHora(relatorio.ultima_importacao) : "--"} icon={Clock} className="[&>span:nth-child(2)]:text-lg" />
      </div>

      <Card size="sm">
        <CardContent className="flex flex-wrap items-center gap-2 text-sm">
          <Link2 className="size-4 text-muted-foreground" aria-hidden />
          <span className="text-muted-foreground">URL do XML:</span>
          <a href={relatorio.url_xml} target="_blank" rel="noopener noreferrer" className="truncate font-medium text-brand hover:underline">
            {relatorio.url_xml}
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Imóveis inválidos</CardTitle>
          <CardDescription>
            Imóveis presentes no XML que não puderam ser publicados e o motivo.{" "}
            <Link href="/integracao-xml#valores-aceitos" className="text-brand underline underline-offset-4">
              Consulte o padrão das informações
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          {totalInvalidos === 0 ? (
            <p className="flex items-center gap-2 text-sm text-success">
              <CircleCheck className="size-4" aria-hidden /> Todos os imóveis do XML foram importados.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-40">Código do imóvel</TableHead>
                  <TableHead>Problema</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relatorio.invalidos.map((i) => (
                  <TableRow key={i.codigo}>
                    <TableCell className="font-medium">{i.codigo}</TableCell>
                    <TableCell className="whitespace-normal">{i.motivo}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {relatorio.erros.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Avisos da importação</CardTitle>
            <CardDescription>Ocorrências registradas durante as últimas leituras.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2">
              {relatorio.erros.map((e, k) => (
                <li key={`${e.data}-${k}`} className="flex items-start gap-2 rounded-lg bg-warning/10 p-3 text-sm">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
                  <div>
                    <time dateTime={e.data} className="text-xs text-muted-foreground tabular-nums">
                      {formatarDataHora(e.data)}
                    </time>
                    <p>{e.mensagem}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
