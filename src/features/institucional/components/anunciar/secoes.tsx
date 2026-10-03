import Link from "next/link";
import { BarChart3, Building2, Check, Globe2, Mail, RefreshCw, Search, Sparkles, Target, Users } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import type { AnuncianteResumo, Plano, Portal } from "@/lib/api/types";
import { formatarNumero } from "@/lib/utils/format";
import { LogoAnunciante } from "@/features/anunciantes/components/logo-anunciante";
import { PlanoCard } from "@/features/planos/components/plano-card";

// ------------------------------------------------------------------ Pitch

export function PitchB2B({ portal, anunciantes }: { portal: Portal; anunciantes: AnuncianteResumo[] }) {
  const numeros = [
    { valor: "+18.000", label: "buscas por mês" },
    { valor: `+${formatarNumero(portal.total_imoveis)}`, label: "imóveis anunciados" },
    { valor: "+150", label: "imobiliárias e corretores" },
  ];
  const bullets = [
    "Público que já está procurando imóvel na região",
    "Contatos por telefone, WhatsApp e e-mail direto para você",
    "Integração automática com o seu CRM via XML",
  ];
  return (
    <div>
      <span className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
        <Sparkles className="size-3.5" aria-hidden />
        Para imobiliárias e corretores
      </span>
      <h1 className="mt-4 text-4xl font-extrabold leading-[1.1] text-brand sm:text-5xl">
        A melhor divulgação de imóveis em {portal.cidade_principal_nome}
      </h1>
      <p className="mt-4 max-w-xl text-lg text-muted-foreground">
        Milhares de pessoas pesquisam imóveis no {portal.nome} todos os meses. Coloque a sua carteira na frente de quem está decidindo comprar ou alugar.
      </p>
      <ul className="mt-6 space-y-2.5">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2.5 text-sm sm:text-base">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
              <Check className="size-3.5" aria-hidden />
            </span>
            {b}
          </li>
        ))}
      </ul>
      <dl className="mt-8 grid grid-cols-3 gap-4">
        {numeros.map((n) => (
          <div key={n.label} className="rounded-xl border bg-card/60 p-4">
            <dt className="order-2 text-xs text-muted-foreground">{n.label}</dt>
            <dd className="font-heading text-2xl font-extrabold text-brand sm:text-3xl">{n.valor}</dd>
          </div>
        ))}
      </dl>
      {anunciantes.length > 0 && (
        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quem já anuncia</p>
          <ul className="mt-3 flex flex-wrap items-center gap-3">
            {anunciantes.slice(0, 8).map((a) => (
              <li key={a.id} title={a.nome}>
                <LogoAnunciante nome={a.nome} logoUrl={a.logo_url} tamanho={48} className="rounded-lg" />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------- Benefícios

const beneficios = [
  { icone: Search, titulo: "+18.000 buscas/mês", texto: "Milhares de pesquisas sobre imóveis na região todos os meses." },
  { icone: Building2, titulo: "Milhares de anúncios", texto: "Um portal completo, com oferta real de imóveis e imobiliárias." },
  { icone: BarChart3, titulo: "Relatórios de leads", texto: "Receba todo mês a performance dos seus anúncios por e-mail." },
  { icone: RefreshCw, titulo: "Anúncios automáticos", texto: "Integramos com diversos CRMs imobiliários via XML. Zero retrabalho." },
  { icone: Mail, titulo: "Encomendas de imóveis", texto: "Receba pedidos detalhados de quem procura direto no seu e-mail." },
  { icone: Target, titulo: "Planos para cada tamanho", texto: "De 20 a milhares de anúncios: escolha o plano certo para a sua carteira." },
  { icone: Users, titulo: "Público engajado", texto: "Sem curiosos: nossa audiência está realmente decidindo comprar ou alugar." },
  { icone: Globe2, titulo: "Seu hotsite no portal", texto: "Uma página só sua, com a sua marca, dentro do portal." },
];

export function Beneficios() {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {beneficios.map((b, i) => (
        <li key={b.titulo} className="card-elevated card-elevated-hover p-5">
          <div className="flex items-center justify-between">
            <span className="flex size-10 items-center justify-center rounded-lg bg-brand-soft text-brand">
              <b.icone className="size-5" aria-hidden />
            </span>
            <span className="font-heading text-sm font-bold text-muted-foreground/60">{String(i + 1).padStart(2, "0")}</span>
          </div>
          <h3 className="mt-4 font-semibold">{b.titulo}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{b.texto}</p>
        </li>
      ))}
    </ul>
  );
}

// ------------------------------------------------------------------ Planos

export function PreviewPlanos({ planos }: { planos: Plano[] }) {
  return (
    <div>
      <ul className="grid gap-6 pt-3 md:grid-cols-3">
        {planos.map((p) => (
          <li key={p.id}>
            <PlanoCard plano={p} compacto />
          </li>
        ))}
      </ul>
      <div className="mt-6 text-center">
        <Button asChild variant="outline">
          <Link href="/planos">Ver todos os planos e comparar</Link>
        </Button>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------- FAQ

const faq = (portal: Portal) => [
  { p: "Como funciona a cobrança?", r: `Planos mensais, sem fidelidade. Não há pagamento online: a equipe do ${portal.nome} confirma o plano com você após o cadastro.` },
  { p: "Em quanto tempo meus imóveis aparecem?", r: "Imediatamente após publicar no painel. Com integração XML, a primeira carga é feita em até 24 horas." },
  { p: "Posso anunciar imóveis de outras cidades?", r: `O portal é focado em ${portal.cidade_principal_nome} e região. Imóveis fora da área de cobertura não são exibidos.` },
  { p: "Quais CRMs vocês integram?", r: "Qualquer sistema que gere um XML no padrão do portal. Veja a documentação em Integração XML ou fale com a nossa equipe." },
];

export function FaqAnunciar({ portal }: { portal: Portal }) {
  return (
    <Accordion type="single" collapsible className="card-elevated px-5 sm:px-6">
      {faq(portal).map((item, i) => (
        <AccordionItem key={i} value={`faq-${i}`}>
          <AccordionTrigger className="py-4 text-base font-semibold hover:no-underline">{item.p}</AccordionTrigger>
          <AccordionContent className="pb-5 text-sm text-muted-foreground">{item.r}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
