import { notFound, redirect } from "next/navigation";
import { getPortal } from "@/lib/tenant/get-portal";

/**
 * Catch-all do site público: resolve o slug da página de imobiliárias do portal
 * (`imobiliarias-em-petropolis`, `imobiliarias-na-serra`...) e devolve 404 para o resto.
 */
export default async function CatchAllPage({ params }: PageProps<"/[...rest]">) {
  const { rest } = await params;
  if (rest.length === 1) {
    const portal = await getPortal();
    if (rest[0]!.toLowerCase() === portal.slug_imobiliarias.toLowerCase()) redirect("/imobiliarias");
  }
  notFound();
}
