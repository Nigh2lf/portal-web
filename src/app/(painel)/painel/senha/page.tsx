import type { Metadata } from "next";
import { exigirSessao } from "@/lib/auth/session";
import { montarMetadata } from "@/lib/seo/metadata";
import { getPortal } from "@/lib/tenant/get-portal";
import { PainelHeader } from "@/features/painel/components/painel-header";
import { SenhaForm } from "@/features/painel/components/senha-form";

export async function generateMetadata(): Promise<Metadata> {
  const portal = await getPortal();
  return montarMetadata(portal, { titulo: "Trocar senha", noindex: true, path: "/painel/senha" });
}

export default async function SenhaPage() {
  await exigirSessao("/painel/senha");
  return (
    <div className="flex flex-col gap-6">
      <PainelHeader titulo="Trocar senha" descricao="Mantenha sua conta segura com uma senha que só você conheça." crumbs={[{ nome: "Trocar senha" }]} />
      <SenhaForm />
    </div>
  );
}
