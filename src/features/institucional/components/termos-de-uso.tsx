import Link from "next/link";
import type { Portal } from "@/lib/api/types";

/** Texto dos Termos de Uso (adaptado de `TermosDeUso.php`), com nome do portal e domínio interpolados. */
export function TermosDeUso({ portal }: { portal: Portal }) {
  const P = portal.nome;
  const dominio = portal.dominio.replace(/^www\./, "");
  return (
    <div className="prose-portal max-w-none">
      <p className="text-sm text-muted-foreground">Última atualização em 09/12/2015.</p>

      <h2 id="definicoes">Definições</h2>
      <p>Para os fins destes Termos de Uso, as seguintes definições serão adotadas:</p>
      <ul>
        <li>
          <strong>Anunciantes:</strong> são todas as pessoas que anunciam no {P}.
        </li>
        <li>
          <strong>Usuários:</strong> são todas as pessoas que acessam o {P}.
        </li>
        <li>
          <strong>{P}:</strong> são as páginas na web cujo endereço é {dominio}.
        </li>
        <li>
          <strong>Contratada:</strong> TrustInfo Soluções S/S Ltda - ME, CNPJ nº 04.141.568/0001-83, empresa proprietária e responsável pelo {P}.
        </li>
        <li>
          <strong>Você:</strong> são os Usuários ou Anunciantes, dependendo do contexto em que esta definição é utilizada.
        </li>
      </ul>

      <h2 id="aceitacao">Leitura e aceitação</h2>
      <p>Antes de acessar ou utilizar qualquer parte do {P}, Você deverá ler com atenção este documento.</p>
      <p>O uso do {P}, ou o acesso a este, implicará que Você leu, concordou e aceitou cumprir os termos deste documento.</p>
      <p>
        A Contratada poderá modificar este documento sem aviso prévio. Estas modificações serão incorporadas imediatamente a partir de sua publicação no {P}. Você entende e aceita que deverá rever
        este documento periodicamente e que, ao usar e acessar o {P}, Você está tacitamente aceitando os termos que estiverem em vigor.
      </p>
      <p>
        <strong>
          Se Você não concordar com qualquer parte deste documento, recomendamos que não faça qualquer uso do {P}, pois, ao fazê-lo, sob qualquer forma ou pretexto, estará afirmando a sua integral
          concordância com este documento.
        </strong>
      </p>

      <h2 id="compromissos-contratada">Compromissos da Contratada</h2>
      <ol>
        <li>A Contratada oferece um sistema de classificados via internet por meio do {P}, através do qual Você está autorizado a publicar anúncios de imóveis.</li>
        <li>
          O {P} é somente um mecanismo de divulgação e consulta, portanto não interfere em hipótese alguma na negociação entre os seus usuários. Dessa forma, o negócio só poderá ser efetivamente
          realizado diretamente entre os interessados, não sendo possível o seu fechamento através do {P}.
        </li>
        <li>Prestar todos os esclarecimentos necessários ao desenvolvimento do serviço prestado a Você.</li>
        <li>
          Empenhar-se para manter em perfeito funcionamento todos os recursos do site ininterruptamente. No entanto, partindo-se da premissa de que em prestação de serviços on-line não existe
          garantia integral (100%) de nível de serviço, denomina-se acordo de nível de serviço ou SLA (Service Level Agreement) do {P}, para efeito do presente documento, em 97%.
        </li>
        <li>
          Conceder anúncios de imóveis no período contratado mediante confirmação do pagamento. Após esse período o anúncio é desativado automaticamente e cabe a Você, se desejar, reativá-lo
          através do seu Painel de Controle efetuando um novo pagamento.
        </li>
        <li>
          Fazer varreduras regulares em seu banco de dados com o objetivo de oferecer o máximo de consistência e integridade das informações. Caso julgue necessário, o {P} poderá excluir e/ou
          bloquear qualquer informação a qualquer momento sem aviso prévio.
        </li>
      </ol>

      <h2 id="seus-compromissos">Seus compromissos</h2>
      <ol>
        <li>Manter somente 1 (um) cadastro no {P}.</li>
        <li>Manter os dados cadastrais devidamente atualizados.</li>
        <li>Informar corretamente o valor total do imóvel anunciado, seja para venda, locação ou locação por temporada.</li>
        <li>
          Não causar nenhum dano ou destruição total ou parcial ao {P}, bem como não praticar, em prejuízo de outros, nenhum dos seguintes atos: colocar, transmitir ou disponibilizar qualquer
          material dentro do {P} que contenha vírus ou qualquer outro tipo de programação para computador que possa causar prejuízo ou dano ao {P}; interceptar, interferir ou expropriar do {P}{" "}
          qualquer informação, registro ou dado, que são protegidos por direitos autorais e pela legislação de propriedade intelectual.
        </li>
        <li>
          Você compromete-se ainda a: a) não invadir ou tentar invadir a privacidade de outros usuários; b) não quebrar ou tentar quebrar a segurança do computador de outro usuário, programa ou
          dados, sem o conhecimento e expresso consentimento de tal usuário.
        </li>
        <li>Você não tem direito ao backup (cópia de segurança) de fotos e/ou dados publicados no {P}.</li>
      </ol>

      <h2 id="conteudo">Responsabilidade pelo conteúdo das informações</h2>
      <ol>
        <li>
          A Contratada não se responsabiliza pela veracidade das informações divulgadas no {P} pelos usuários. Você concorda e declara que a Contratada não tem qualquer obrigação de monitorar e
          verificar o conteúdo das informações divulgadas no {P}, expressamente isentando-a de qualquer responsabilidade relativa a tais conteúdos.
        </li>
        <li>
          Não obstante estar a Contratada isenta de responsabilidade quanto à verificação do conteúdo das informações divulgadas no {P}, Você se compromete a: a) não divulgar informações
          fraudulentas; b) não promover a oferta de bens ou serviços decorrentes de atos ilícitos; c) não violar regras, regimentos, portarias, leis ou qualquer norma que discipline as atividades
          exercidas pelo {P}; d) não divulgar conteúdo obsceno, indecente ou pornográfico; e) não difamar ou ameaçar terceiros, bem como não utilizar meios desleais e contrários aos princípios da
          livre concorrência; f) não vincular informações, produtos, serviços ou dados que sejam proibidos por este instrumento ou pela lei brasileira.
        </li>
        <li>
          A Contratada não se responsabiliza pelo conteúdo, informações ou serviços de sites de terceiros cujos anúncios ou links são disponibilizados pelo {P}, cuja responsabilidade é
          integralmente dos titulares desses sites.
        </li>
      </ol>

      <h2 id="precos">Preços e informações dos anúncios</h2>
      <p>
        Os preços, taxas e características dos imóveis são informados pelos Anunciantes e estão sujeitos a confirmação. O {P} recomenda que o Usuário confirme todas as informações diretamente com o
        Anunciante antes de qualquer negociação.
      </p>

      <h2 id="contato">Contato</h2>
      <p>
        Dúvidas sobre estes Termos podem ser enviadas para{" "}
        <a href={`mailto:${portal.email}`}>{portal.email}</a> ou pela nossa <Link href="/contato">página de contato</Link>.
      </p>
    </div>
  );
}

export const SECOES_TERMOS = [
  { id: "definicoes", titulo: "Definições" },
  { id: "aceitacao", titulo: "Leitura e aceitação" },
  { id: "compromissos-contratada", titulo: "Compromissos da Contratada" },
  { id: "seus-compromissos", titulo: "Seus compromissos" },
  { id: "conteudo", titulo: "Responsabilidade pelo conteúdo" },
  { id: "precos", titulo: "Preços e informações" },
  { id: "contato", titulo: "Contato" },
];
