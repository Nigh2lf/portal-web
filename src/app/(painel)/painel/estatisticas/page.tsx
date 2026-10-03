import type { Metadata } from "next";
import { BarChart3, Building2, Eye, Inbox, MessageSquare, Percent, Phone, Search, Users } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getRepository } from "@/lib/api";
import { exigirSessao } from "@/lib/auth/session";
import { montarMetadata } from "@/lib/seo/metadata";
import { getPortal } from "@/lib/tenant/get-portal";
import { formatarNumero } from "@/lib/utils/format";
import { EmptyState } from "@/features/painel/components/empty-state";
import { GraficoBarras } from "@/features/painel/components/grafico-barras";
import { KpiTile } from "@/features/painel/components/kpi-tile";
import { PainelHeader } from "@/features/painel/components/painel-header";
import { PeriodoFiltro } from "@/features/painel/components/periodo-filtro";
import { diasAtrasISO, fimDoMesISO, formatarDataCurta, hojeISO, inicioDoMesISO, periodoDe, type SearchParamsLike } from "@/features/painel/utils";

export async function generateMetadata(): Promise<Metadata> {
  const portal = await getPortal();
  return montarMetadata(portal, { titulo: "Estatísticas", noindex: true, path: "/painel/estatisticas" });
}

export default async function EstatisticasPage({ searchParams }: { searchParams: Promise<SearchParamsLike> }) {
  const sessao = await exigirSessao("/painel/estatisticas");
  const sp = await searchParams;
  const hoje = hojeISO();
  const { inicio, fim } = periodoDe(sp, { inicio: inicioDoMesISO(), fim: hoje });
  const [repo, portal] = await Promise.all([getRepository(), getPortal()]);

  const [periodo, mensais] = await Promise.all([repo.getEstatisticasPeriodo(sessao.anunciante_id, inicio, fim), repo.getEstatisticasMensais(sessao.anunciante_id, 6)]);

  const taxa = periodo.visualizacoes > 0 ? (periodo.total_leads / periodo.visualizacoes) * 100 : 0;
  const porImovel = [...periodo.por_imovel].sort((a, b) => b.visualizacoes - a.visualizacoes);
  const slugsPorId = porImovel.length ? Object.fromEntries((await repo.listImoveisPorIds(portal.id, porImovel.map((p) => p.imovel_id))).map((r) => [r.id, r.slug])) : {};

  return (
    <div className="flex flex-col gap-5">
      <PainelHeader titulo="Estatísticas" descricao="Desempenho dos seus anúncios no período: audiência, contatos e leads por imóvel." crumbs={[{ nome: "Estatísticas" }]} />

      <PeriodoFiltro
        action="/painel/estatisticas"
        inicio={inicio}
        fim={fim}
        atalhos={[
          { label: "Este mês", inicio: inicioDoMesISO(), fim: hoje },
          { label: "Mês passado", inicio: inicioDoMesISO(-1), fim: fimDoMesISO(-1) },
          { label: "90 dias", inicio: diasAtrasISO(90), fim: hoje },
        ]}
      />

      <section aria-labelledby="titulo-periodo" className="flex flex-col gap-3">
        <h2 id="titulo-periodo" className="text-lg font-semibold">
          De {formatarDataCurta(inicio)} a {formatarDataCurta(fim)}
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiTile rotulo="Imóveis ativos" valor={periodo.imoveis} icon={Building2} />
          <KpiTile rotulo="Visualizações" valor={periodo.visualizacoes} icon={Eye} />
          <KpiTile rotulo="Cliques telefone" valor={periodo.cliques_telefone} icon={Phone} />
          <KpiTile rotulo="Cliques WhatsApp" valor={periodo.cliques_whatsapp} icon={MessageSquare} />
          <KpiTile rotulo="Mensagens" valor={periodo.mensagens} icon={Inbox} />
          <KpiTile rotulo="Encomendas" valor={periodo.encomendas} icon={Search} />
          <KpiTile rotulo="Total de leads" valor={periodo.total_leads} icon={Users} detalhe="telefone + WhatsApp + mensagens + encomendas" className="bg-brand-soft/60" />
          <KpiTile rotulo="Leads / visualização" valor={`${taxa.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`} icon={Percent} detalhe="conversão do período" />
        </div>
      </section>

      <section aria-labelledby="titulo-mensal" className="flex flex-col gap-3">
        <h2 id="titulo-mensal" className="text-lg font-semibold">
          Últimos 6 meses
        </h2>
        <GraficoBarras dados={mensais} />
      </section>

      <section aria-labelledby="titulo-por-imovel" className="flex flex-col gap-3">
        <h2 id="titulo-por-imovel" className="text-lg font-semibold">
          Por imóvel
        </h2>
        {porImovel.length === 0 ? (
          <EmptyState icon={BarChart3} titulo="Sem dados no período" descricao="Quando seus imóveis receberem visitas e contatos, o detalhamento aparece aqui." />
        ) : (
          <div className="card-elevated overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Imóvel</TableHead>
                  <TableHead className="text-right">Visualizações</TableHead>
                  <TableHead className="text-right">Telefone</TableHead>
                  <TableHead className="text-right">WhatsApp</TableHead>
                  <TableHead className="text-right">Mensagens</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {porImovel.map((p) => {
                  const leads = p.cliques_telefone + p.cliques_whatsapp + p.mensagens;
                  const slug = slugsPorId[p.imovel_id];
                  return (
                    <TableRow key={p.imovel_id}>
                      <TableCell className="max-w-sm whitespace-normal">
                        {slug ? (
                          <a href={`/imovel/${slug}?preview=1`} target="_blank" rel="noopener noreferrer" className="font-medium hover:text-brand hover:underline">
                            {p.titulo}
                          </a>
                        ) : (
                          <span className="font-medium">{p.titulo}</span>
                        )}
                        <p className="text-xs text-muted-foreground">Cód. {p.codigo}</p>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatarNumero(p.visualizacoes)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatarNumero(p.cliques_telefone)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatarNumero(p.cliques_whatsapp)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatarNumero(p.mensagens)}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{formatarNumero(leads)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
