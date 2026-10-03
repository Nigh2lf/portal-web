/** Conteúdo de `../portaisnovo/Interno/Documentacao/XML-Exemplo.xml`, exibido em `/integracao-xml`. */
export const XML_EXEMPLO = `<?xml version='1.0' encoding='UTF-8'?>
<Carga xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema'>
<Imoveis>
  <Imovel>
    <CodigoImovel>1</CodigoImovel>
    <TipoImovel>Apartamento</TipoImovel>
    <Cidade>Petrópolis</Cidade>
    <Bairro>Itaipava</Bairro>
    <UF>RJ</UF>
    <QtdDormitorios>3</QtdDormitorios>
    <QtdBanheiros>1</QtdBanheiros>
    <QtdSuites>1</QtdSuites>
    <QtdVagas>1</QtdVagas>
    <AreaUtil>300</AreaUtil>
    <AreaTotal>800</AreaTotal>
    <PrecoVenda>1500000</PrecoVenda>
    <PrecoLocacao>2000</PrecoLocacao>
    <PrecoLocacaoTemporada>40000</PrecoLocacaoTemporada>
    <DestaquePortal>1</DestaquePortal>
    <InfraEstruturaImovel>Piscina;Sauna seca;Play ground;Churrasqueira;Garagem;Casa de hóspedes;Portão eletrônico;</InfraEstruturaImovel>
    <DentroCondominio>1</DentroCondominio>
    <InfraEstruturaCondominio>Campo de futebol;Piscina;</InfraEstruturaCondominio>
    <Taxas>
      <Taxa>
        <TaxaValor>167</TaxaValor>
        <TaxaDescricao>IPTU</TaxaDescricao>
        <TaxaObs>Iptu R$ 2.000 ano</TaxaObs>
      </Taxa>
      <Taxa>
        <TaxaValor>1000</TaxaValor>
        <TaxaDescricao>Caseiro</TaxaDescricao>
      </Taxa>
    </Taxas>
    <Observacao>
      <![CDATA[
        Descrição Imóvel
      ]]>
    </Observacao>
    <Fotos>
      <Foto>
        <URLArquivo>http://www.petropolisimoveis.com.br/Upload/Imovel-cod-1-foto1.jpg</URLArquivo>
        <Principal>1</Principal>
      </Foto>
      <Foto>
        <URLArquivo>http://www.petropolisimoveis.com.br/Upload/Imovel-cod-1-foto2.jpg</URLArquivo>
        <Principal>0</Principal>
      </Foto>
    </Fotos>
  </Imovel>
  <Imovel>
    <CodigoImovel>2</CodigoImovel>
    <TipoImovel>Casa</TipoImovel>
    <Cidade>Petrópolis</Cidade>
    <Bairro>Itaipava</Bairro>
    <UF>RJ</UF>
    <QtdDormitorios>3</QtdDormitorios>
    <QtdBanheiros>1</QtdBanheiros>
    <QtdSuites>0</QtdSuites>
    <QtdVagas>1</QtdVagas>
    <AreaUtil>300</AreaUtil>
    <AreaTotal>800</AreaTotal>
    <PrecoVenda>1500000</PrecoVenda>
    <PrecoLocacao>2000</PrecoLocacao>
    <PrecoLocacaoTemporada>40000</PrecoLocacaoTemporada>
    <DestaquePortal>0</DestaquePortal>
    <InfraEstruturaImovel>Piscina;Sauna seca;Play ground;Churrasqueira;Garagem;Casa de hóspedes;Portão eletrônico;</InfraEstruturaImovel>
    <DentroCondominio>1</DentroCondominio>
    <InfraEstruturaCondominio>Campo de futebol;Piscina;</InfraEstruturaCondominio>
    <Taxas>
      <Taxa>
        <TaxaValor>167</TaxaValor>
        <TaxaDescricao>IPTU</TaxaDescricao>
        <TaxaObs>Iptu R$ 2.000 ano</TaxaObs>
      </Taxa>
      <Taxa>
        <TaxaValor>1000</TaxaValor>
        <TaxaDescricao>Caseiro</TaxaDescricao>
      </Taxa>
    </Taxas>
    <Observacao>
      <![CDATA[
        Descrição Imóvel
      ]]>
    </Observacao>
    <Fotos>
      <Foto>
        <URLArquivo>http://www.petropolisimoveis.com.br/Upload/Imovel-cod-1-foto1.jpg</URLArquivo>
        <Principal>1</Principal>
      </Foto>
      <Foto>
        <URLArquivo>http://www.petropolisimoveis.com.br/Upload/Imovel-cod-1-foto2.jpg</URLArquivo>
        <Principal>0</Principal>
      </Foto>
    </Fotos>
  </Imovel>
</Imoveis>
</Carga>`;

export interface CampoXML {
  elemento: string;
  obrigatorio: "Sim" | "Não" | "Sim *" | "Sim **";
  formato: string;
  novo?: boolean;
  filho?: boolean;
}

/** Estrutura do XML (paridade com a tabela de `DocumentacaoPortal.php`). */
export const CAMPOS_XML: CampoXML[] = [
  { elemento: "CodigoImovel", obrigatorio: "Sim", formato: "Número inteiro. Código único do imóvel no sistema do cliente." },
  { elemento: "TipoImovel", obrigatorio: "Sim", formato: "Máx. 150 caracteres. Use um dos valores aceitos listados abaixo." },
  { elemento: "Cidade", obrigatorio: "Sim", formato: "Máx. 150 caracteres. Use um dos valores aceitos listados abaixo." },
  { elemento: "Bairro", obrigatorio: "Sim", formato: "Máx. 150 caracteres. Use um dos valores aceitos listados abaixo." },
  { elemento: "UF", obrigatorio: "Sim", formato: "Sigla do estado. Ex.: RJ" },
  { elemento: "QtdDormitorios", obrigatorio: "Não", formato: "Número inteiro. Caso não tenha, informar 0." },
  { elemento: "QtdBanheiros", obrigatorio: "Não", formato: "Número inteiro. Caso não tenha, informar 0." },
  { elemento: "QtdSuites", obrigatorio: "Não", formato: "Número inteiro. Quantidade de suítes. Caso não tenha, informar 0.", novo: true },
  { elemento: "QtdVagas", obrigatorio: "Não", formato: "Número inteiro. Caso não tenha, informar 0." },
  { elemento: "AreaUtil", obrigatorio: "Não", formato: "Número inteiro (m²). Caso não tenha, informar 0." },
  { elemento: "AreaTotal", obrigatorio: "Não", formato: "Número inteiro (m²). Caso não tenha, informar 0." },
  { elemento: "PrecoVenda", obrigatorio: "Sim *", formato: "Número inteiro, sem pontos, vírgulas ou R$. Ex.: 1500000" },
  { elemento: "PrecoLocacao", obrigatorio: "Sim *", formato: "Número inteiro, sem pontos, vírgulas ou R$. Ex.: 2000" },
  { elemento: "PrecoLocacaoTemporada", obrigatorio: "Sim *", formato: "Número inteiro, sem pontos, vírgulas ou R$. Ex.: 40000" },
  { elemento: "DestaquePortal", obrigatorio: "Não", formato: "0 = sem destaque (padrão), 1 = destaque, 2 = super destaque. A quantidade disponível depende do plano.", novo: true },
  { elemento: "InfraEstruturaImovel", obrigatorio: "Não", formato: "Texto com itens separados por ponto e vírgula. Ex.: Piscina;Sauna;Churrasqueira;" },
  { elemento: "DentroCondominio", obrigatorio: "Sim", formato: "0 ou 1 — 1 para imóvel dentro de condomínio e 0 para fora." },
  { elemento: "InfraEstruturaCondominio", obrigatorio: "Não", formato: "Texto com itens separados por ponto e vírgula. Ex.: Portaria 24h;Piscina;" },
  { elemento: "Taxas", obrigatorio: "Não", formato: "Lista de <Taxa>. Quando presente, TaxaValor e TaxaDescricao são obrigatórios." },
  { elemento: "TaxaValor", obrigatorio: "Sim **", formato: "Valor da taxa, número inteiro.", filho: true },
  { elemento: "TaxaDescricao", obrigatorio: "Sim **", formato: "Nome da taxa. Ex.: IPTU", filho: true },
  { elemento: "TaxaObs", obrigatorio: "Não", formato: "Observação sobre a taxa.", filho: true },
  { elemento: "Observacao", obrigatorio: "Sim", formato: "Descrição do imóvel. O conteúdo deve estar entre <![CDATA[ ... ]]>." },
  { elemento: "Fotos", obrigatorio: "Não", formato: "Lista de <Foto>. Quando presente, URLArquivo e Principal são obrigatórios." },
  { elemento: "URLArquivo", obrigatorio: "Sim **", formato: "Máx. 300 caracteres. URL completa da imagem. Ex.: https://www.site.com.br/Upload/foto1.jpg", filho: true },
  { elemento: "Principal", obrigatorio: "Sim **", formato: "0 ou 1 — a foto com valor 1 será a capa do imóvel.", filho: true },
];
