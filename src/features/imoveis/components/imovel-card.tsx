import Image from "next/image";
import Link from "next/link";
import { Crown, MapPin, Star } from "lucide-react";
import type { ImovelResumo, Objetivo } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";
import { FavoritoButton } from "@/features/favoritos/components/favorito-button";
import { ContatarButton } from "@/features/contatar/components/contatar-dialog";
import { iniciais } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { CardPhotos } from "./card-photos";
import { CaracteristicasIcones } from "./caracteristicas-icones";
import { PrecoImovel, objetivoExibido, objetivosDisponiveis } from "./preco-imovel";

interface Props {
  imovel: ImovelResumo;
  /** Objetivo ativo na busca: define qual preço aparece em destaque. */
  objetivo?: Objetivo;
  favorito: boolean;
  portalNome: string;
  /** `priority` no `next/image` para os primeiros cards acima da dobra. */
  prioridade?: boolean;
  /** Na página de favoritos o coração vira um botão "Remover". */
  modoFavoritos?: boolean;
  /** Dentro de `<VisaoArea>`: vira card horizontal quando o visitante escolhe "um por linha". */
  alternavel?: boolean;
  className?: string;
}

// Classes aplicadas só quando o contêiner está em `data-visao="lista"` e a tela é sm+.
const LISTA = {
  card: "sm:group-data-[visao=lista]/visao:flex-row",
  foto: "sm:group-data-[visao=lista]/visao:w-72 sm:group-data-[visao=lista]/visao:shrink-0 sm:group-data-[visao=lista]/visao:self-stretch md:group-data-[visao=lista]/visao:w-80 lg:group-data-[visao=lista]/visao:w-96",
  corpo: "sm:group-data-[visao=lista]/visao:p-5",
  resumo: "sm:group-data-[visao=lista]/visao:line-clamp-3",
};

export function ImovelCard({
  imovel,
  objetivo,
  favorito,
  portalNome,
  prioridade,
  modoFavoritos,
  alternavel,
  className,
}: Props) {
  const href = `/imovel/${imovel.slug}`;
  const obj = objetivoExibido(imovel, objetivo);
  const outros = objetivosDisponiveis(imovel).filter((o) => o !== obj);
  const local = `${imovel.bairro_nome}, ${imovel.cidade_nome} - ${imovel.uf}`;

  return (
    <article
      className={cn(
        "card-elevated card-elevated-hover group relative flex flex-col overflow-hidden",
        alternavel && LISTA.card,
        className,
      )}
    >
      <div className={cn("bg-muted relative aspect-[4/3] overflow-hidden", alternavel && LISTA.foto)}>
        <CardPhotos
          slug={imovel.slug}
          href={href}
          title={imovel.titulo}
          coverUrl={imovel.foto_principal_url}
          total={imovel.total_fotos}
          priority={prioridade}
          sizes="(min-width: 1280px) 400px, (min-width: 640px) 50vw, 100vw"
        />

        <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {imovel.tipo_anuncio === "superdestaque" ? (
              <Badge className="bg-brand text-brand-foreground pointer-events-auto shadow-sm">
                <Crown className="fill-current" aria-hidden />
                Superdestaque
              </Badge>
            ) : imovel.tipo_anuncio === "destaque" ? (
              <Badge className="bg-highlight text-foreground pointer-events-auto shadow-sm">
                <Star className="fill-current" aria-hidden />
                Destaque
              </Badge>
            ) : null}
            {outros.map((o) => (
              <Badge
                key={o}
                variant="secondary"
                className="text-foreground pointer-events-auto bg-white/90 shadow-sm"
              >
                {o === "comprar" ? "Venda" : o === "alugar" ? "Aluguel" : "Temporada"}
              </Badge>
            ))}
          </div>
          {!modoFavoritos && (
            <div className="pointer-events-auto">
              <FavoritoButton imovelId={imovel.id} inicial={favorito} />
            </div>
          )}
        </div>

        {/* O contador de fotos fica no canto direito, dentro de `CardPhotos`. */}
        <div className="pointer-events-none absolute inset-x-4 bottom-3 flex items-end justify-between gap-3 pr-16 text-white">
          <PrecoImovel precos={imovel} objetivo={obj} tamanho="md" comRotulo className="drop-shadow" />
        </div>
      </div>

      <div className={cn("flex flex-1 flex-col gap-2.5 p-4", alternavel && LISTA.corpo)}>
        <div>
          <h3 className="font-heading text-base leading-snug font-semibold">
            <Link href={href} className="hover:text-brand line-clamp-2 focus-visible:outline-none">
              {imovel.titulo}
            </Link>
          </h3>
          <p className="text-muted-foreground mt-1 flex items-center gap-1 text-sm">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{local}</span>
            <span className="text-muted-foreground/80 ml-auto shrink-0 text-xs">Cód. {imovel.codigo}</span>
          </p>
        </div>

        <CaracteristicasIcones imovel={imovel} />

        {imovel.descricao_resumo && (
          <p className={cn("text-muted-foreground line-clamp-2 text-sm", alternavel && LISTA.resumo)}>
            {imovel.descricao_resumo}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 border-t pt-3">
          <Anunciante imovel={imovel} />
          <div className="flex shrink-0 items-center gap-1.5">
            {modoFavoritos && <FavoritoButton imovelId={imovel.id} inicial={true} variante="remover" />}
            <ContatarButton
              imovelId={imovel.id}
              codigo={imovel.codigo}
              titulo={imovel.titulo}
              portalNome={portalNome}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

function Anunciante({ imovel }: { imovel: ImovelResumo }) {
  const conteudo = (
    <>
      <span className="ring-foreground/10 flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-1">
        {imovel.anunciante_logo_url ? (
          <Image
            src={imovel.anunciante_logo_url}
            alt=""
            width={32}
            height={32}
            className="size-full object-contain p-0.5"
          />
        ) : (
          <span className="bg-brand-soft text-brand flex size-full items-center justify-center text-[10px] font-semibold">
            {iniciais(imovel.anunciante_nome)}
          </span>
        )}
      </span>
      <span className="text-muted-foreground truncate text-xs">{imovel.anunciante_nome}</span>
    </>
  );
  if (imovel.anunciante_slug) {
    return (
      <Link
        href={`/imobiliarias/${imovel.anunciante_slug}`}
        className="hover:text-brand flex min-w-0 items-center gap-2"
        title={`Ver imóveis de ${imovel.anunciante_nome}`}
      >
        {conteudo}
      </Link>
    );
  }
  return <div className="flex min-w-0 items-center gap-2">{conteudo}</div>;
}
