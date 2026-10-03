import type { Metadata } from "next";
import Link from "next/link";
import { Heart, Search } from "lucide-react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { LimparFavoritosButton } from "@/features/favoritos/components/limpar-favoritos-button";
import { ListaImoveis } from "@/features/imoveis/components/lista-imoveis";
import { getRepository } from "@/lib/api";
import { lerFavoritos } from "@/lib/favoritos/cookie";
import { montarMetadata } from "@/lib/seo/metadata";
import { getPortal } from "@/lib/tenant/get-portal";
import { plural } from "@/lib/utils/format";

export async function generateMetadata(): Promise<Metadata> {
  const portal = await getPortal();
  return montarMetadata(portal, { titulo: "Imóveis favoritos", descricao: `Sua lista de imóveis favoritos no ${portal.nome}.`, path: "/favoritos", noindex: true });
}

export default async function FavoritosPage() {
  const [portal, repo, ids] = await Promise.all([getPortal(), getRepository(), lerFavoritos()]);
  const imoveis = ids.length ? await repo.listImoveisPorIds(portal.id, ids) : [];
  // Mantém a ordem em que foram favoritados (mais recente primeiro).
  const ordem = new Map(ids.map((id, i) => [id, i]));
  imoveis.sort((a, b) => (ordem.get(b.id) ?? 0) - (ordem.get(a.id) ?? 0));
  const total = imoveis.length;

  return (
    <>
      <PageHeader
        titulo="Imóveis favoritos"
        subtitulo={total ? `Você salvou ${total} ${plural(total, "imóvel", "imóveis")}. A lista fica guardada neste navegador por 30 dias.` : "Salve imóveis com o coração para compará-los depois."}
        crumbs={[{ nome: "Favoritos" }]}
        acoes={total > 0 ? <LimparFavoritosButton /> : undefined}
        compacto
      />
      <Container className="py-8">
        {total === 0 ? (
          <div className="card-elevated mx-auto flex max-w-xl flex-col items-center gap-5 px-6 py-14 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-brand-soft text-brand">
              <Heart className="size-8" aria-hidden />
            </span>
            <div>
              <h2 className="font-heading text-xl font-semibold">Nenhum favorito ainda</h2>
              <p className="mt-2 text-sm text-muted-foreground">Ao navegar pelos anúncios, toque no coração para guardar os imóveis que mais gostou. Eles aparecem aqui para você comparar e entrar em contato.</p>
            </div>
            <Button asChild size="lg" className="bg-cta text-cta-foreground hover:bg-cta/90">
              <Link href="/imoveis">
                <Search data-icon="inline-start" />
                Buscar imóveis
              </Link>
            </Button>
          </div>
        ) : (
          <ListaImoveis imoveis={imoveis} favoritos={ids} portalNome={portal.nome} modoFavoritos colunas={3} />
        )}
      </Container>
    </>
  );
}
