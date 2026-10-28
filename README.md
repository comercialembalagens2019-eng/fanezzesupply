# Fanezze Supply E-commerce

Crie um site completo de e-commerce B2B para distribuição de embalagens com as seguintes especificações:
🎨 DESIGN E IDENTIDADE VISUAL
Nome da empresa: Fanezze Supply
Paleta de cores:

Cor primária: Azul marinho (#1B2845 ou #0A1128)
Cor secundária: Bege (#F5E6D3 ou #E8DCC4)
Texto principal: Azul marinho escuro
Botões: Azul marinho com hover em bege
Backgrounds: Alternância entre branco, bege claro e azul marinho

Estilo: Moderno, clean, profissional B2B, com elementos que transmitam confiabilidade e solidez.

📄 ESTRUTURA DO SITE
1. PÁGINA INICIAL (HOME)

Header fixo com:

Logo "Fanezze Supply"
Menu: Home | Produtos | Sobre | Contato | Login/Cadastro
Carrinho de compras (ícone com contador)


Hero section:

Título principal: "Distribuição de Embalagens para sua Empresa"
Subtítulo: "Qualidade, preço justo e entrega rápida"
CTA: "Cadastre-se e comece a comprar"
Imagem de fundo com embalagens (bobinas, caixas, plásticos)


Seção "Por que escolher a Fanezze Supply?":

Ícone + texto: "Pedidos mínimos acessíveis"
Ícone + texto: "Nota fiscal eletrônica"
Ícone + texto: "Preços competitivos para atacado"
Ícone + texto: "Análise de crédito facilitada"


Seção "Produtos em Destaque" (grid com cards dos principais produtos)
Footer:

Redes sociais
Contato: WhatsApp, telefone, email
Links úteis
Copyright




2. PÁGINA DE PRODUTOS
Layout: Grid responsivo com cards de produtos
Cada card deve conter:

Imagem do produto
Nome do produto
Preço unitário
Pedido mínimo
Botão "Adicionar ao carrinho" (desabilitado se não atingir mínimo)
Badge mostrando "Mínimo: X unidades/kg"

Lista de produtos:

Saco Plástico PP

Preço: R$ 32,90/kg
Pedido mínimo: 30kg


Saco Plástico PE

Preço: R$ 32,90/kg
Pedido mínimo: 30kg


Plástico Bolha 21mm

Preço: R$ 77,00/unidade
Pedido mínimo: 20 unidades


Plástico Bolha 30mm

Preço: R$ 99,90/unidade
Pedido mínimo: 10 unidades


Desinfetante 5L

Preço: R$ 10,50/unidade
Pedido mínimo: 5 unidades


Bobina Semi Kraft 1,20x200m

Preço: R$ 289,00/unidade
Pedido mínimo: 1 unidade


Caixa Fita Adesiva Transparente 45x100 (72un)

Preço: R$ 389,90/caixa
Pedido mínimo: 5 caixas


Ondulado 270g com 50m

Preço: R$ 139,90/unidade
Pedido mínimo: 5 unidades


Ondulado por kg

Preço: R$ 7,99/kg
Pedido mínimo: 1000kg



10-14. Sacos de Lixo (Fardos com 50un)

30L: R$ 30,90 (mínimo 3 fardos)
50L: R$ 48,90 (mínimo 3 fardos)
100L: R$ 68,90 (mínimo 3 fardos)
150L: R$ 83,90 (mínimo 3 fardos)
200L: R$ 130,90 (mínimo 3 fardos)


Stretch em Bobina 50cm (3,5kg)


Preço: R$ 49,90/unidade
Pedido mínimo: 20 unidades

Funcionalidades:

Filtros por categoria
Ordenação por preço/nome
Validação de pedido mínimo antes de adicionar ao carrinho
Modal com detalhes do produto


3. PÁGINA DE CADASTRO
Título: "Cadastro de Empresa - Fanezze Supply"
Formulário dividido em etapas (stepper):
ETAPA 1: Dados Cadastrais da Empresa (obrigatório)

Razão social
Nome fantasia
CNPJ (com máscara XX.XXX.XXX/XXXX-XX)
Inscrição Estadual (ou checkbox "Isento")
Inscrição Municipal (opcional)
Data de abertura da empresa (date picker)
Natureza jurídica (select: MEI, ME, EPP, LTDA, etc.)
Ramo de atividade - CNAE principal (input com autocomplete)

ETAPA 2: Endereço Completo (para NF-e)

CEP (com busca automática via ViaCEP API)
Endereço (rua/avenida)
Número
Complemento
Bairro
Cidade
Estado (select)

💡 Aviso em destaque: "Importante: preencha o endereço exatamente como aparece na Receita Federal para evitar rejeição da NF-e."
ETAPA 3: Contatos da Empresa

Telefone fixo (com máscara)
WhatsApp comercial (com máscara)
E-mail para envio de NF-e e boletos

ETAPA 4: Dados do Responsável Legal (análise de crédito)

Nome completo
CPF (com máscara XXX.XXX.XXX-XX)
RG
Cargo (select: Sócio, Administrador, Diretor, Outro)
Data de nascimento (date picker)

💡 Aviso: "Esses dados serão utilizados para análise de crédito em Serasa, Boa Vista e SPC."
ETAPA 5: Criar Senha

Senha (mínimo 8 caracteres)
Confirmar senha
Checkbox: "Aceito os termos de uso e política de privacidade"

Botões:

"Voltar" (em cada etapa exceto a primeira)
"Próximo" (valida campos antes de avançar)
"Finalizar Cadastro" (última etapa)

Validações:

Todos os campos obrigatórios preenchidos
CNPJ válido
CPF válido
Email válido
Senhas coincidem
Data de nascimento (maior de 18 anos)


4. PÁGINA DE LOGIN
Layout simples e clean:

Logo Fanezze Supply
Formulário de login:

Email/CNPJ
Senha
Checkbox "Lembrar-me"
Link "Esqueci minha senha"


Botão "Entrar"
Link "Ainda não tem conta? Cadastre-se"


5. CARRINHO DE COMPRAS
Funcionalidades:

Lista de produtos adicionados
Quantidade editável (com validação de mínimo)
Remover produto
Subtotal por item
Total do pedido
Aviso se algum produto não atingir o mínimo
Botão "Continuar comprando"
Botão "Finalizar pedido" (só habilitado se todos os mínimos forem atingidos)


6. PÁGINA DE CHECKOUT
Etapas:

Revisão do pedido
Endereço de entrega (pré-preenchido do cadastro, com opção de alterar)
Forma de pagamento:

Boleto bancário
Transferência/PIX
Crédito (para clientes aprovados)


Confirmação

Informações exibidas:

Resumo dos produtos
Subtotal
Frete (a calcular ou a combinar)
Total
Prazo de entrega estimado
Observações (campo de texto livre)


💾 TECNOLOGIAS E FUNCIONALIDADES
Frontend:

React com TypeScript
Tailwind CSS para estilização (cores azul marinho e bege)
React Router para navegação
React Hook Form para formulários
Zod para validação

Backend/Database:

Supabase para:

Autenticação de usuários
Banco de dados (PostgreSQL)
Storage para imagens
Row Level Security (RLS) para segurança



APIs:

ViaCEP para busca de endereço por CEP
Validação de CNPJ/CPF no frontend

Funcionalidades especiais:

Sistema de carrinho persistente (localStorage)
Notificações toast para feedback
Loading states
Validação em tempo real
Responsivo (mobile-first)
Dashboard do cliente após login


🎯 DIFERENCIAIS IMPORTANTES

Validação de pedido mínimo: Não permitir adicionar ao carrinho se não atingir o mínimo
Badges visuais: Mostrar claramente o pedido mínimo em cada produto
UX amigável: Formulário de cadastro com stepper visual
Feedback claro: Mensagens de erro e sucesso bem visíveis
Profissionalismo B2B: Design sóbrio, informações completas, sem elementos infantis


📱 RESPONSIVIDADE

Mobile: Menu hamburguer, cards em coluna única
Tablet: Grid 2 colunas
Desktop: Grid 3-4 colunas, layout completo


Comece pela página inicial e navegação. Depois crie o cadastro, produtos, carrinho e checkout nessa ordem.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://fanezzesupply.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/63ba5aae-7e3a-445e-bb96-c769340f6361).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
