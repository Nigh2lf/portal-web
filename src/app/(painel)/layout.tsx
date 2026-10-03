import Image from "next/image";
import Link from "next/link";
import { ExternalLink, FileDown, Megaphone } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { exigirSessao } from "@/lib/auth/session";
import { getPortal } from "@/lib/tenant/get-portal";
import { itensNavPainel } from "@/features/painel/nav-items";
import { MobileNav } from "@/features/painel/components/mobile-nav";
import { PainelNav } from "@/features/painel/components/painel-nav";
import { UserMenu } from "@/features/painel/components/user-menu";

function AvisoXml() {
  return (
    <Alert className="border-brand/20 bg-brand-soft/60">
      <FileDown />
      <AlertTitle>Integração XML ativa</AlertTitle>
      <AlertDescription>Seus imóveis são atualizados automaticamente pela integração XML.</AlertDescription>
    </Alert>
  );
}

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const [sessao, portal] = await Promise.all([exigirSessao("/painel"), getPortal()]);
  const itens = itensNavPainel(sessao);

  return (
    <TooltipProvider>
      {/* Formulário único de logout, acionado pelos botões "Sair" via atributo form. */}
      <form id="form-sair" method="post" action="/api/auth/logout" className="hidden" />

      <div className="flex min-h-screen w-full bg-background">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-card lg:flex">
          <div className="flex h-16 items-center border-b px-5">
            <Link href="/" className="flex items-center" aria-label={`${portal.nome} — ir para o site`}>
              <Image src={portal.logo_url} alt={portal.nome} width={200} height={40} priority className="h-9 w-auto" />
            </Link>
          </div>
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
            <PainelNav itens={itens} />
            {sessao.carga_automatica ? (
              <AvisoXml />
            ) : (
              <Button asChild className="mt-2 bg-cta text-cta-foreground hover:bg-cta/90">
                <Link href="/painel/imoveis/novo">
                  <Megaphone data-icon="inline-start" /> Novo imóvel
                </Link>
              </Button>
            )}
          </div>
          <div className="border-t p-4 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Painel do anunciante</p>
            <p>{portal.nome}</p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:px-6">
            <MobileNav itens={itens} portalNome={portal.nome} aviso={sessao.carga_automatica ? <AvisoXml /> : undefined} />
            <Link href="/" className="flex items-center lg:hidden" aria-label={`${portal.nome} — ir para o site`}>
              <Image src={portal.logo_url} alt={portal.nome} width={160} height={32} className="h-8 w-auto" />
            </Link>
            <div className="ml-auto flex items-center gap-2">
              <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
                <Link href="/" target="_blank" rel="noopener">
                  <ExternalLink data-icon="inline-start" /> Ver site
                </Link>
              </Button>
              <UserMenu sessao={sessao} />
            </div>
          </header>
          <main id="conteudo" className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
