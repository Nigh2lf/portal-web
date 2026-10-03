import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const perguntas = (portalNome: string) => [
  {
    p: "Como funciona a cobrança?",
    r: `Os planos são mensais, com renovação automática e sem fidelidade. Não há pagamento online: após o cadastro, a equipe do ${portalNome} entra em contato para confirmar e ativar o plano.`,
  },
  {
    p: "Posso trocar de plano depois?",
    r: "Sim. Você pode fazer upgrade ou downgrade a qualquer momento falando com a nossa equipe. As cotas de anúncios, fotos e destaques são ajustadas na hora.",
  },
  {
    p: "O que acontece se eu ultrapassar o limite de anúncios?",
    r: "O painel avisa quando o plano estiver cheio. Para publicar mais imóveis, basta desativar um anúncio antigo ou migrar para um plano maior.",
  },
  {
    p: "Sou proprietário. Preciso pagar para anunciar?",
    r: "Não. Proprietários anunciam um imóvel gratuitamente, com até 5 fotos. Basta escolher o perfil Proprietário no cadastro.",
  },
  {
    p: "O que é o hotsite?",
    r: `É uma página exclusiva dentro do ${portalNome} com a sua marca, seus contatos e somente os seus imóveis, com busca própria. Ideal para divulgar nas redes sociais.`,
  },
  {
    p: "Vocês integram com o meu CRM imobiliário?",
    r: "Sim. Os planos Prata, Ouro e Max aceitam carga automática via XML: seus anúncios são atualizados todos os dias sem trabalho manual. Veja a documentação em Integração XML.",
  },
];

export function FaqPlanos({ portalNome }: { portalNome: string }) {
  return (
    <Accordion type="single" collapsible className="card-elevated px-5 sm:px-6">
      {perguntas(portalNome).map((item, i) => (
        <AccordionItem key={i} value={`faq-${i}`}>
          <AccordionTrigger className="py-4 text-base font-semibold hover:no-underline">{item.p}</AccordionTrigger>
          <AccordionContent className="pb-5 text-sm text-muted-foreground">{item.r}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
