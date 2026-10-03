import type { Metadata } from "next";
import { EncomendaSecao } from "@/features/encomenda/components/encomenda-secao";
import { montarMetadata } from "@/lib/seo/metadata";
import { getPortal } from "@/lib/tenant/get-portal";

export async function generateMetadata(): Promise<Metadata> {
  const portal = await getPortal();
  return montarMetadata(portal, {
    titulo: "Encomende um imóvel",
    descricao: `Diga o que procura e o ${portal.nome} ajuda você a encontrar o imóvel ideal em ${portal.cidade_principal_nome} e região.`,
    path: "/encomendar",
  });
}

export default function EncomendarPage() {
  return <EncomendaSecao parceiro={false} />;
}
