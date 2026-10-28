import { Link } from "react-router-dom";
import { COMPANY, CompanyIdentification, LegalPage } from "@/components/legal/LegalPage";
import { SHIPPING_FEE, formatBRL } from "@/lib/pricing";

const linkClass = "text-foreground underline underline-offset-4";

const sections = [
  {
    id: "aceite",
    title: "Aceite",
    body: (
      <>
        <p>
          Estes Termos regulam o uso do site fanezzesupply.com.br e as compras feitas por ele. Ao criar uma conta ou
          fazer um pedido, você declara que leu e concorda com estes Termos e com a{" "}
          <Link to="/privacidade" className={linkClass}>Política de Privacidade</Link>. O site é operado por:
        </p>
        <CompanyIdentification />
      </>
    ),
  },
  {
    id: "publico",
    title: "Público e cadastro",
    body: (
      <ul className="list-disc pl-5 space-y-2">
        <li>O site é voltado a vendas para empresas (B2B). As compras são feitas em nome de uma pessoa jurídica, identificada por CNPJ.</li>
        <li>Quem faz o cadastro declara ter poderes para representar a empresa e que os dados informados são verdadeiros e atualizados.</li>
        <li>Você é responsável por manter sua senha em sigilo e pelas ações feitas com a sua conta.</li>
        <li>Podemos recusar ou suspender cadastros com dados inconsistentes ou em caso de indício de fraude.</li>
      </ul>
    ),
  },
  {
    id: "precos",
    title: "Produtos, preços e pedido mínimo",
    body: (
      <ul className="list-disc pl-5 space-y-2">
        <li>Os preços são por unidade (ou por kg) e variam conforme o tamanho e a faixa de quantidade, como mostrado no catálogo.</li>
        <li>Cada produto tem um pedido mínimo, informado na página do produto.</li>
        <li>O valor final é calculado no momento do pagamento, com base na tabela vigente. Se houver erro evidente de preço, podemos cancelar o pedido e devolver integralmente o valor pago.</li>
        <li>Produtos personalizados são vendidos sob consulta, com prazo e condições combinados à parte.</li>
        <li>Imagens são ilustrativas; medidas e especificações estão na descrição de cada produto.</li>
      </ul>
    ),
  },
  {
    id: "pagamento",
    title: "Pagamento",
    body: (
      <ul className="list-disc pl-5 space-y-2">
        <li>Aceitamos Pix, boleto e cartão de crédito, processados por provedores de pagamento especializados.</li>
        <li>O pedido é confirmado somente após a aprovação do pagamento. Pix expira em 1 hora e boleto vence em 28 dias.</li>
        <li>A nota fiscal eletrônica é emitida em nome do CNPJ cadastrado.</li>
      </ul>
    ),
  },
  {
    id: "entrega",
    title: "Frete e entrega",
    body: (
      <ul className="list-disc pl-5 space-y-2">
        <li>O frete é grátis para Joinville/SC. Para as demais cidades, é cobrado um valor fixo de {formatBRL(SHIPPING_FEE)} por pedido, exibido antes do pagamento.</li>
        <li>O endereço de entrega é o endereço da empresa informado no pedido. Confira os dados antes de pagar.</li>
        <li>Você acompanha o andamento (pago, enviado e entregue) em <Link to="/pedidos" className={linkClass}>Meus pedidos</Link>.</li>
      </ul>
    ),
  },
  {
    id: "cancelamento",
    title: "Cancelamento, trocas e devoluções",
    body: (
      <ul className="list-disc pl-5 space-y-2">
        <li>Pedidos ainda não enviados podem ser cancelados pelo e-mail ou WhatsApp de atendimento, com devolução integral do valor.</li>
        <li>Produtos com defeito ou diferentes do pedido devem ser comunicados em até 7 dias após o recebimento; faremos a troca ou a devolução do valor.</li>
        <li>Produtos personalizados não podem ser devolvidos, salvo defeito de fabricação.</li>
        <li>Por se tratar de venda entre empresas, aplicam-se as regras do Código Civil e, no que couber, do Código de Defesa do Consumidor.</li>
      </ul>
    ),
  },
  {
    id: "uso",
    title: "Uso do site",
    body: (
      <p>
        É proibido usar o site para fins ilícitos, tentar acessar áreas ou dados de outros clientes, interferir no
        funcionamento do sistema ou copiar o conteúdo para fins comerciais sem autorização. Marcas, textos e imagens do
        site pertencem à {COMPANY.name} ou a seus licenciantes.
      </p>
    ),
  },
  {
    id: "responsabilidade",
    title: "Responsabilidade",
    body: (
      <p>
        Trabalhamos para manter o site disponível e as informações corretas, mas ele pode passar por interrupções para
        manutenção ou por falhas de terceiros (internet, hospedagem, provedores de pagamento). Nesses casos, nenhum
        pagamento é confirmado sem aprovação do provedor.
      </p>
    ),
  },
  {
    id: "foro",
    title: "Alterações e foro",
    body: (
      <p>
        Podemos atualizar estes Termos; a versão em vigor é a publicada nesta página, com a data no topo. Pedidos já
        pagos seguem os Termos vigentes na data da compra. Fica eleito o foro da comarca de Joinville/SC para resolver
        eventuais disputas.
      </p>
    ),
  },
];

const Termos = () => (
  <LegalPage
    title="Termos de Uso"
    description="Termos de uso e condições de venda da FNZ Supply: cadastro, preços, pagamento, frete, cancelamento e devoluções."
    path="/termos"
    sections={sections}
  />
);

export default Termos;
