import Link from "next/link";
import Image from "next/image";
import { Megaphone, UserRound } from "lucide-react";
import type { Portal, SessaoUsuario } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Container } from "./container";
import { NavLinks } from "./nav-links";
import { MobileMenu } from "./mobile-menu";

interface Props {
  portal: Portal;
  sessao: SessaoUsuario | null;
}

export function Header({ portal, sessao }: Props) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <Container className="flex h-16 items-center gap-4 lg:h-[72px]">
        <Link href="/" className="flex shrink-0 items-center" aria-label={portal.nome}>
          <Image
            src={portal.logo_url}
            alt={portal.nome}
            width={portal.logo_largura}
            height={portal.logo_altura}
            priority
            className="h-10 w-auto lg:h-12"
          />
        </Link>

        <nav className="ml-6 hidden flex-1 items-center gap-1 lg:flex" aria-label="Principal">
          <NavLinks itens={portal.menu} />
        </nav>

        <div className="ml-auto hidden items-center gap-2 lg:flex">
          {sessao ? (
            <Button asChild variant="outline">
              <Link href="/painel">
                <UserRound data-icon="inline-start" />
                {sessao.nome.split(" ")[0]}
              </Link>
            </Button>
          ) : (
            <Button asChild variant="ghost">
              <Link href="/anunciar">Entrar</Link>
            </Button>
          )}
          <Button asChild className="bg-cta text-cta-foreground hover:bg-cta/90">
            <Link href={sessao ? "/painel/imoveis/novo" : "/anunciar"}>
              <Megaphone data-icon="inline-start" />
              Anunciar imóvel
            </Link>
          </Button>
        </div>

        <div className="ml-auto lg:hidden">
          <MobileMenu portal={portal} sessao={sessao} />
        </div>
      </Container>
    </header>
  );
}
