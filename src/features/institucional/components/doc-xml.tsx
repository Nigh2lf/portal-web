import Link from "next/link";
import { AlertTriangle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Bairro, Cidade, ImovelTipo } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { CAMPOS_XML, XML_EXEMPLO } from "../xml-exemplo";
import { CopiarCodigo } from "./copiar-codigo";

export const SECOES_DOC = [
  { id: "introducao", titulo: "Introdução" },
  { id: "como-funciona", titulo: "Como funciona" },
  { id: "estrutura", titulo: "Estrutura do XML" },
  { id: "exemplo", titulo: "Exemplo" },
  { id: "valores-aceitos", titulo: "Valores aceitos" },
  { id: "observacoes", titulo: "Observações" },
] as const;

export function DocNav() {
  return (
    <nav aria-label="Seções da documentação" className="card-elevated p-4">
      <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nesta página</p>
      <ol className="space-y-0.5 text-sm">
        {SECOES_DOC.map((s, i) => (
          <li key={s.id}>
            <a href={`#${s.id}`} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-foreground/80 hover:bg-muted hover:text-foreground">
              <span className="w-4 text-xs text-muted-foreground">{i + 1}.</span>
              {s.titulo}
            </a>
          </li>
        ))}
      </ol>
      <div className="mt-4 border-t pt-4 text-xs text-muted-foreground">
        Dúvidas técnicas?{" "}
        <Link href="/contato?assunto=Quero%20anunciar" className="text-brand underline-offset-4 hover:underline">
          Fale com a equipe
        </Link>
        .
      </div>
    </nav>
  );
}

function Secao({ id, titulo, children }: { id: string; titulo: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className="scroll-mt-28">
      <h2 id={`${id}-titulo`} className="border-b pb-2 text-2xl font-bold text-brand">
        {titulo}
      </h2>
      <div className="prose-portal mt-4">{children}</div>
    </section>
  );
}

function Obrigatorio({ valor }: { valor: string }) {
  const sim = valor.startsWith("Sim");
  return <span className={cn("font-semibold", sim ? "text-destructive" : "text-success")}>{valor}</span>;
}

interface Props {
  portalNome: string;
  tipos: ImovelTipo[];
  cidades: Cidade[];
  bairros: Bairro[];
}

export function DocXml({ portalNome, tipos, cidades, bairros }: Props) {
  const porCidade = cidades.map((c) => ({ cidade: c, bairros: bairros.filter((b) => b.cidade_id === c.id) })).filter((g) => g.bairros.length > 0);

  return (
    <div className="space-y-14">
      <Secao id="introducao" titulo="1. Introdução">
        <p>
          A integração entre o {portalNome} e o sistema do anunciante acontece por meio de um arquivo <strong>XML</strong> disponibilizado no servidor do próprio
          anunciante, obedecendo ao formato descrito neste manual.
        </p>
        <p>As atualizações são feitas automaticamente a cada 24 horas: imóveis novos entram, alterados são atualizados e os que saírem do XML são removidos do portal.</p>
        <p>
          A carga automática está disponível nos planos que incluem integração. Veja os <Link href="/planos">planos</Link> ou{" "}
          <Link href="/contato?assunto=Quero%20anunciar">fale com a equipe</Link> para ativar a sua.
        </p>
      </Secao>

      <Secao id="como-funciona" titulo="2. Como funciona">
        <ol>
          <li>Você publica um arquivo XML no padrão abaixo em uma URL pública (ex.: <code className="rounded bg-muted px-1.5 py-0.5 text-sm">https://www.suaimobiliaria.com.br/portal.xml</code>).</li>
          <li>Informa essa URL à equipe do portal, que a associa ao seu cadastro.</li>
          <li>Nosso servidor faz uma requisição HTTP a essa URL uma vez por dia e processa o arquivo.</li>
          <li>Os imóveis válidos são publicados respeitando as cotas do seu plano (quantidade de imóveis, fotos e destaques).</li>
          <li>No painel, em <em>Importação</em>, você acompanha o total lido, os válidos e os rejeitados com o motivo.</li>
        </ol>
        <div className="not-prose mt-4 flex gap-3 rounded-xl border border-brand/20 bg-brand-soft/60 p-4 text-sm">
          <Info className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
          <p>Com a carga automática ativa, os menus <em>Meu cadastro</em> e <em>Meus imóveis</em> do painel ficam ocultos: as alterações devem ser feitas no seu sistema de origem.</p>
        </div>
      </Secao>

      <Secao id="estrutura" titulo="3. Estrutura do XML">
        <div className="not-prose mb-4 flex gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
          <p>
            <strong>Atenção aos itens obrigatórios:</strong> se não existirem ou vierem vazios (ex.: <code>&lt;CodigoImovel&gt;&lt;/CodigoImovel&gt;</code>) o imóvel não será exibido no portal.
          </p>
        </div>
        <div className="not-prose card-elevated overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[220px]">Elemento</TableHead>
                <TableHead className="w-[110px]">Obrigatório</TableHead>
                <TableHead>Formato</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {CAMPOS_XML.map((c) => (
                <TableRow key={c.elemento} className={cn(c.novo && "bg-highlight/10 hover:bg-highlight/15")}>
                  <TableCell className={cn("font-mono text-xs sm:text-sm", c.filho && "pl-8")}>
                    {c.filho && <span className="mr-1 text-muted-foreground">↳</span>}
                    {c.elemento}
                    {c.novo && (
                      <Badge variant="secondary" className="ml-2 bg-highlight/30 text-foreground">
                        novo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Obrigatorio valor={c.obrigatorio} />
                  </TableCell>
                  <TableCell className="text-sm text-foreground/90">{c.formato}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          * Ao menos um dos três campos de preço deve estar preenchido.
          <br />
          ** Obrigatório somente quando o elemento pai (<code>Taxas</code> ou <code>Fotos</code>) estiver presente.
        </p>
      </Secao>

      <Secao id="exemplo" titulo="4. Exemplo do XML">
        <p>Arquivo completo com dois imóveis. Use-o como ponto de partida para gerar o seu.</p>
        <div className="not-prose relative">
          <div className="absolute top-3 right-3 z-10">
            <CopiarCodigo texto={XML_EXEMPLO} />
          </div>
          <pre className="max-h-[560px] overflow-auto rounded-xl bg-[oklch(0.2_0.03_245)] p-5 text-[13px] leading-relaxed text-[oklch(0.92_0.01_240)]">
            <code>{XML_EXEMPLO}</code>
          </pre>
        </div>
      </Secao>

      <Secao id="valores-aceitos" titulo="5. Valores aceitos">
        <p>
          Os elementos <code>TipoImovel</code>, <code>Cidade</code> e <code>Bairro</code> precisam usar exatamente os textos abaixo (acentos incluídos). Imóveis com valores fora da lista são rejeitados.
        </p>

        <h3 id="tipos-aceitos">Tipos de imóvel</h3>
        <ul className="not-prose flex flex-wrap gap-2">
          {tipos.map((t) => (
            <li key={t.id} className="rounded-full border bg-card px-3 py-1 text-sm">
              {t.nome}
            </li>
          ))}
        </ul>

        <h3 id="cidades-bairros-aceitos">Cidades e bairros</h3>
        <div className="not-prose card-elevated overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[200px]">Cidade</TableHead>
                <TableHead>Bairros</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {porCidade.map(({ cidade, bairros: lista }) => (
                <TableRow key={cidade.id} className="align-top">
                  <TableCell className="py-3 font-semibold">
                    {cidade.nome} <span className="text-xs font-normal text-muted-foreground">- {cidade.uf}</span>
                  </TableCell>
                  <TableCell className="py-3 text-sm leading-relaxed whitespace-normal text-foreground/90">{lista.map((b) => b.nome).join(" · ")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Secao>

      <Secao id="observacoes" titulo="6. Observações importantes">
        <ul>
          <li>
            O arquivo XML deve utilizar encoding <strong>UTF-8</strong>.
          </li>
          <li>Imóveis que não estiverem no XML serão removidos do portal na próxima atualização.</li>
          <li>A quantidade de imóveis, fotos por imóvel e destaques disponíveis depende do plano contratado.</li>
          <li>Fotos são baixadas pela URL informada; use links públicos, estáveis e em alta resolução (recomendado 800×600 ou maior).</li>
          <li>
            Os campos <code>QtdSuites</code> e <code>DestaquePortal</code> são novos e opcionais; arquivos antigos continuam válidos.
          </li>
        </ul>
      </Secao>
    </div>
  );
}
