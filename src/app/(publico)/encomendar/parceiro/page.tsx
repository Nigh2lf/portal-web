import type { Metadata } from "next";
import { EncomendaSecao } from "@/features/encomenda/components/encomenda-secao";
import { montarMetadata } from "@/lib/seo/metadata";
import { getPortal } from "@/lib/tenant/get-portal";

export async function generateMetadata(): Promise<Metadata> {
  const portal = await getPortal();
  return montarMetadata(portal, {
    titulo: "Encomende um imóvel às imobiliárias parceiras",
    descricao: `Envie seu pedido de imóvel a todas as imobiliárias parceiras do ${portal.nome} de uma só vez.`,
    path: "/encomendar/parceiro",
  });
}

export default function EncomendarParceiroPage() {
  return <EncomendaSecao parceiro />;
}
