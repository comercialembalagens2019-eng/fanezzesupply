import { COMPANY, CompanyIdentification, LegalPage } from "@/components/legal/LegalPage";

const sections = [
  {
    id: "controlador",
    title: "Quem somos",
    body: (
      <>
        <p>
          Esta Política explica como a {COMPANY.name} trata dados pessoais no site fanezzesupply.com.br, conforme a Lei
          Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD). A {COMPANY.name} é a controladora dos dados:
        </p>
        <CompanyIdentification />
      </>
    ),
  },
  {
    id: "dados",
    title: "Dados que coletamos",
    body: (
      <ul className="list-disc pl-5 space-y-2">
        <li><b className="text-foreground">Conta de acesso:</b> e-mail e senha (a senha é armazenada de forma criptografada pelo provedor de autenticação; não temos acesso a ela).</li>
        <li><b className="text-foreground">Dados da empresa:</b> razão social, nome fantasia, CNPJ, inscrições estadual e municipal, data de abertura, natureza jurídica e CNAE.</li>
        <li><b className="text-foreground">Endereço e contato:</b> CEP, endereço, cidade, estado, telefone, WhatsApp e e-mail comercial.</li>
        <li><b className="text-foreground">Pagamento por boleto:</b> CPF do pagador, exigido pela emissão do boleto.</li>
        <li><b className="text-foreground">Pedidos:</b> produtos, quantidades, valores, forma de pagamento, status e datas de envio e entrega.</li>
        <li><b className="text-foreground">Recuperação de senha:</b> códigos de verificação temporários, guardados de forma cifrada e apagados após o uso ou a expiração.</li>
        <li><b className="text-foreground">Dados técnicos:</b> registros de acesso mantidos pelos provedores de hospedagem, como endereço IP, data e hora.</li>
      </ul>
    ),
  },
  {
    id: "finalidades",
    title: "Para que usamos e com qual base legal",
    body: (
      <ul className="list-disc pl-5 space-y-2">
        <li><b className="text-foreground">Cadastro, pedidos, pagamento e entrega:</b> execução de contrato (art. 7º, V).</li>
        <li><b className="text-foreground">Emissão de nota fiscal e registros contábeis:</b> cumprimento de obrigação legal (art. 7º, II).</li>
        <li><b className="text-foreground">Prevenção a fraudes e segurança da conta:</b> legítimo interesse (art. 7º, IX) e proteção ao crédito (art. 7º, X).</li>
        <li><b className="text-foreground">Atendimento e avisos sobre seus pedidos:</b> execução de contrato (art. 7º, V).</li>
      </ul>
    ),
  },
  {
    id: "compartilhamento",
    title: "Com quem compartilhamos",
    body: (
      <>
        <p>Não vendemos dados pessoais. Compartilhamos apenas o necessário com prestadores que operam o site em nosso nome:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><b className="text-foreground">Hospedagem e banco de dados:</b> Lovable Cloud (infraestrutura Supabase).</li>
          <li><b className="text-foreground">Pagamentos:</b> AbacatePay (Pix) e Stripe (cartão e boleto), que recebem os dados necessários para processar a cobrança.</li>
          <li><b className="text-foreground">E-mails transacionais:</b> Resend, para envio de códigos de recuperação de senha e avisos de pedidos.</li>
          <li><b className="text-foreground">Consulta de CEP:</b> ViaCEP, que recebe apenas o CEP digitado.</li>
          <li><b className="text-foreground">Fontes do site:</b> Google Fonts, que recebe o endereço IP do navegador ao carregar as fontes.</li>
          <li><b className="text-foreground">Autoridades:</b> quando exigido por lei ou ordem judicial.</li>
        </ul>
        <p>Alguns desses prestadores podem armazenar dados fora do Brasil, com as garantias previstas no art. 33 da LGPD.</p>
      </>
    ),
  },
  {
    id: "armazenamento",
    title: "Por quanto tempo guardamos",
    body: (
      <ul className="list-disc pl-5 space-y-2">
        <li>Dados de conta e da empresa: enquanto a conta estiver ativa.</li>
        <li>Pedidos e dados fiscais: pelo prazo exigido pela legislação tributária (em regra, 5 anos).</li>
        <li>Códigos de recuperação de senha: até o uso ou a expiração (15 minutos).</li>
      </ul>
    ),
  },
  {
    id: "cookies",
    title: "Cookies e armazenamento no navegador",
    body: (
      <p>
        Não usamos cookies de publicidade nem de rastreamento. O site guarda no seu navegador apenas o necessário para
        funcionar: a sessão de login e os itens do carrinho. Você pode apagá-los a qualquer momento nas configurações do
        navegador; isso encerra a sessão e esvazia o carrinho.
      </p>
    ),
  },
  {
    id: "direitos",
    title: "Seus direitos",
    body: (
      <>
        <p>Pelo art. 18 da LGPD, você pode solicitar a qualquer momento:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>confirmação e acesso aos seus dados;</li>
          <li>correção de dados incompletos, inexatos ou desatualizados;</li>
          <li>anonimização, bloqueio ou eliminação de dados desnecessários;</li>
          <li>portabilidade dos dados;</li>
          <li>informação sobre com quem compartilhamos seus dados;</li>
          <li>eliminação dos dados, ressalvados os que precisamos guardar por obrigação legal.</li>
        </ul>
        <p>
          Para exercer seus direitos, escreva para{" "}
          <a href={`mailto:${COMPANY.email}`} className="text-foreground underline underline-offset-4">{COMPANY.email}</a>.
          Respondemos em até 15 dias. Você também pode apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD).
        </p>
      </>
    ),
  },
  {
    id: "seguranca",
    title: "Segurança",
    body: (
      <p>
        Usamos conexão criptografada (HTTPS), controle de acesso por usuário no banco de dados e processamento de
        pagamentos por provedores especializados. Não armazenamos números de cartão de crédito no site. Nenhum sistema é
        totalmente imune a falhas; se ocorrer um incidente relevante, comunicaremos os titulares afetados e a ANPD, como
        determina a lei.
      </p>
    ),
  },
  {
    id: "alteracoes",
    title: "Alterações desta Política",
    body: (
      <p>
        Podemos atualizar esta Política. A data no topo da página indica a versão em vigor. Mudanças relevantes serão
        comunicadas no site ou por e-mail.
      </p>
    ),
  },
];

const Privacidade = () => (
  <LegalPage
    title="Política de Privacidade"
    description="Como a FNZ Supply coleta, usa, compartilha e protege dados pessoais, conforme a LGPD."
    path="/privacidade"
    sections={sections}
  />
);

export default Privacidade;
