import { Mail, Phone, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Bairro, Cidade, Encomenda, ImovelTipo } from "@/lib/api/types";
import { formatarMoeda, formatarTelefone } from "@/lib/utils/format";
import { OBJETIVO_LABEL, RECURSO_LABEL, formatarDataHora } from "../utils";
import { EmptyState } from "./empty-state";

interface Props {
  encomendas: Encomenda[];
  tipos: ImovelTipo[];
  cidades: Cidade[];
  bairros: Bairro[];
}

export function EncomendasLista({ encomendas, tipos, cidades, bairros }: Props) {
  if (encomendas.length === 0) {
    return <EmptyState icon={Search} titulo="Nenhuma encomenda no momento" descricao="Pedidos de imóveis enviados por visitantes do portal aparecem aqui para você oferecer opções." className="py-8" />;
  }
  const nome = <T extends { id: string; nome: string }>(lista: T[], id: string | null) => (id ? lista.find((x) => x.id === id)?.nome : undefined);

  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {encomendas.map((e) => {
        const faixa =
          e.valor_min || e.valor_max
            ? `${e.valor_min ? formatarMoeda(e.valor_min) : "até"}${e.valor_min && e.valor_max ? " a " : " "}${e.valor_max ? formatarMoeda(e.valor_max) : ""}`.trim()
            : null;
        const tel = e.telefone.replace(/\D/g, "");
        return (
          <li key={e.id} className="card-elevated flex flex-col gap-2 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{e.nome}</p>
                <time dateTime={e.criado_em} className="text-xs text-muted-foreground tabular-nums">
                  {formatarDataHora(e.criado_em)}
                </time>
              </div>
              <Badge className="bg-brand-soft text-brand">{OBJETIVO_LABEL[e.objetivo]}</Badge>
            </div>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Tipo</dt>
                <dd>{nome(tipos, e.tipo_id) ?? "Qualquer"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Local</dt>
                <dd>{[nome(bairros, e.bairro_id), nome(cidades, e.cidade_id)].filter(Boolean).join(", ") || "Qualquer"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Faixa de valor</dt>
                <dd>{faixa ?? "Não informada"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Condomínio</dt>
                <dd>{e.dentro_condominio === null ? "Indiferente" : e.dentro_condominio ? "Dentro" : "Fora"}</dd>
              </div>
              {e.recurso && (
                <div className="col-span-2">
                  <dt className="text-xs text-muted-foreground">Recurso</dt>
                  <dd>{RECURSO_LABEL[e.recurso]}</dd>
                </div>
              )}
            </dl>
            {e.mensagem && <p className="text-sm text-foreground/80">{e.mensagem}</p>}
            <div className="flex flex-wrap gap-3 pt-1 text-sm">
              <a href={`mailto:${e.email}`} className="inline-flex items-center gap-1.5 text-brand hover:underline">
                <Mail className="size-3.5" aria-hidden /> {e.email}
              </a>
              {tel && (
                <a href={`tel:+55${tel}`} className="inline-flex items-center gap-1.5 hover:underline">
                  <Phone className="size-3.5" aria-hidden /> {formatarTelefone(e.telefone)}
                </a>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
