import type { Metadata } from "next";
import Link from "next/link";
import { Building2, CircleCheck, Eye, Inbox, MessageSquare, PartyPopper, Phone, Plus, Search, UserRound } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getRepository } from "@/lib/api";
import { exigirSessao } from "@/lib/auth/session";
import { montarMetadata } from "@/lib/seo/metadata";
import { getPortal } from "@/lib/tenant/get-portal";
import { formatarMesAno } from "@/lib/utils/format";
import { KpiTile } from "@/features/painel/components/kpi-tile";
import { LeadsRecentes } from "@/features/painel/components/leads-recentes";
import { PainelHeader } from "@/features/painel/components/painel-header";
import { SeletorMes } from "@/features/painel/components/seletor-mes";
import { UsoPlanoCard } from "@/features/painel/components/uso-plano-card";
import { um, type SearchParamsLike } from "@/features/painel/utils";

export async function generateMetadata(): Promise<Metadata> {
  const portal = await getPortal();
  return montarMetadata(portal, { titulo: "Painel do anunciante", noindex: true, path: "/painel" });
}

export default async function PainelPage({ searchParams }: { searchParams: Promise<SearchParamsLike> }) {
  const sessao = await exigirSessao("/painel");
  const sp = await searchParams;
  const repo = await getRepository();

  const [uso, mensais, leads] = await Promise.all([
    repo.getUsoPlano(sessao.anunciante_id),
    repo.getEstatisticasMensais(sessao.anunciante_id, 3),
    repo.listMensagens(sessao.anunciante_id, { pagina: 1, por_pagina: 5 }),
  ]);

  const meses = mensais.map((m) => m.ano_mes);
  const mesParam = um(sp.mes);
  const mesAtual = mesParam && meses.includes(mesParam) ? mesParam : (meses[0] ?? "");
  const stats = mensais.find((m) => m.ano_mes === mesAtual) ?? mensais[0];
  const bemVindo = um(sp.bemvindo) === "1";
  const primeiroNome = sessao.nome.split(" ")[0];

  return (
    <div className="flex flex-col gap-6">
      <PainelHeader
        titulo={`Olá, ${primeiroNome}`}
        descricao="Acompanhe o desempenho dos seus anúncios e gerencie sua conta."
        acoes={
          !sessao.carga_automatica && (
            <Button asChild className="bg-cta text-cta-foreground hover:bg-cta/90">
              <Link href="/painel/imoveis/novo">
                <Plus data-icon="inline-start" /> Novo imóvel
              </Link>
            </Button>
          )
        }
      />

      {bemVindo && (
        <Alert className="border-success/30 bg-success/10">
          <PartyPopper className="text-success" />
          <AlertTitle>Bem-vindo ao painel do anunciante!</AlertTitle>
          <AlertDescription>
            Seu cadastro foi concluído com sucesso.{" "}
            {sessao.carga_automatica ? "Seus imóveis serão importados automaticamente pelo XML." : "Comece cadastrando seu primeiro imóvel e adicionando fotos."}
          </AlertDescription>
        </Alert>
      )}

      {sessao.carga_automatica && (
        <Alert>
          <CircleCheck />
          <AlertTitle>Integração XML ativa</AlertTitle>
          <AlertDescription>
            Seus imóveis são atualizados automaticamente pela integração XML.{" "}
            <Link href="/painel/importacao" className="font-medium">
              Ver relatório de importação
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <section aria-labelledby="titulo-estatisticas" className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="titulo-estatisticas" className="text-lg font-semibold">
            Desempenho em <span className="capitalize">{stats ? formatarMesAno(stats.ano_mes) : "--"}</span>
          </h2>
          {meses.length > 0 && <SeletorMes meses={meses} atual={mesAtual} />}
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          <KpiTile rotulo="Visualizações" valor={stats?.visualizacoes ?? 0} icon={Eye} />
          <KpiTile rotulo="Cliques telefone" valor={stats?.cliques_telefone ?? 0} icon={Phone} />
          <KpiTile rotulo="Cliques WhatsApp" valor={stats?.cliques_whatsapp ?? 0} icon={MessageSquare} />
          <KpiTile rotulo="Mensagens" valor={stats?.mensagens ?? 0} icon={Inbox} />
          <KpiTile rotulo="Encomendas" valor={stats?.encomendas ?? 0} icon={Search} detalhe={`${stats?.imoveis ?? 0} imóveis ativos`} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <LeadsRecentes mensagens={leads.resultados} />
        </div>
        <div className="flex flex-col gap-6">
          <UsoPlanoCard uso={uso} />
          <Card>
            <CardHeader>
              <CardTitle>Ações rápidas</CardTitle>
              <CardDescription>Atalhos para o dia a dia.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {!sessao.carga_automatica && (
                <>
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/painel/imoveis/novo">
                      <Plus data-icon="inline-start" /> Cadastrar novo imóvel
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/painel/imoveis">
                      <Building2 data-icon="inline-start" /> Gerenciar meus imóveis
                    </Link>
                  </Button>
                </>
              )}
              <Button asChild variant="outline" className="justify-start">
                <Link href="/painel/ofertas">
                  <Inbox data-icon="inline-start" /> Ver ofertas recebidas
                </Link>
              </Button>
              {!sessao.carga_automatica && (
                <Button asChild variant="outline" className="justify-start">
                  <Link href="/painel/perfil">
                    <UserRound data-icon="inline-start" /> Editar meu cadastro
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
