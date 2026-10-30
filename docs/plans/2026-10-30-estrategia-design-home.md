# Estratégia de design da home — FNZ Supply

Data: 2026-10-30. Planejamento: Issue #52. Implementação: Issue #51.

## Objetivo e escopo

Distribuir melhor o conteúdo no desktop e reduzir as decisões simultâneas no centro. A home deve ajudar o cliente a escolher o material e chegar à compra, com fotos maiores, informações curtas e detalhes disponíveis quando necessários.

Esta entrega documenta a estratégia. O redesenho será implementado na #51. Preservar a identidade azul-marinho, bege e branco, os dados reais da empresa e as regras comerciais. Banco, pagamentos e refatoração do checkout ficam fora deste trabalho.

## Diagnóstico baseado no código atual

Base analisada: `0758e94` da `origin/main`, incluindo a ampliação da home do PR #48. A navegação visual ao site não ficou disponível nesta sessão; as hipóteses abaixo precisam de confirmação com capturas na etapa de protótipo.

- `src/index.css`: `.container-custom` limita o conjunto a 1.280 px, incluindo as margens internas. Em uma tela de 1.920 px, o limite deixa 320 px externos de cada lado, mais o espaçamento interno. Isso ajuda a explicar a sensação de laterais vazias.
- `src/pages/Index.tsx`: oito seções sucessivas. O banner já combina texto, duas ações, foto do produto com preço e calculadora. Abaixo vêm diferenciais, materiais, guia de tamanhos, como funciona, pedido rápido, personalização e FAQ.
- `FeaturedProducts`, `SizeGuide`, `PriceCalculator` e `QuickOrder` oferecem caminhos semelhantes para material, tamanho e preço. A home repete a compra em formatos diferentes.
- `SizeGuide` mostra todas as variantes em telas a partir de `sm`; apenas o celular limita a exibição inicial a seis. O catálogo atual gera 18 combinações de material e tamanho. Muitos cartões pequenos aumentam a densidade visual no desktop.
- Quase todos os blocos usam cartões brancos arredondados. A repetição de bordas, títulos, ícones e botões dá importância parecida a conteúdos de prioridades diferentes.
- A foto do banner usa posicionamento absoluto junto do texto e das ações. A composição deve ser revisada nas larguras intermediárias para verificar sobreposição.
- `src/App.css` contém um limite em `#root`, mas não é importado pelo fluxo atual. Não atribuir a ele o estreitamento do site.

## Direção visual recomendada

Adotar uma vitrine mais aberta: mensagem comercial e fotos na área principal; ferramenta de compra na lateral direita. Manter margens de respiro e utilizar a largura adicional para ampliar os elementos e afastá-los entre si.

O lado esquerdo ganha presença pelo alinhamento dos títulos e pelas fotos maiores. Não criar uma barra lateral permanente de categorias: hoje há uma única categoria pública, Envelopes. Também não preencher as bordas com banners, selos ou efeitos que acrescentem disputa por atenção.

### Largura e composição

- Área útil da home com máximo inicial de **1.440 px**, excluindo as margens externas. Usar margens mínimas de 32 px em telas grandes, 24 px em tablets e 16 px em celulares. A largura exata é um ponto de partida para o protótipo.
- A partir de **1.280 px de viewport**, reservar aproximadamente **340–380 px** para a calculadora, com intervalo de **24–32 px** até o conteúdo principal. O restante fica com a vitrine.
- Entre **768 e 1.279 px**, retirar a coluna lateral e organizar os módulos na sequência da página. Materiais em duas colunas; calculadora em largura confortável.
- Abaixo de **768 px**, usar uma coluna. Fotos e textos devem caber sem rolagem horizontal. No cabeçalho estreito, colocar a busca em uma linha própria quando necessário.
- Cabeçalho e rodapé acompanham os alinhamentos da home. Aplicar a largura ampliada primeiro à home, sem alargar automaticamente formulários, páginas legais e checkout.
- Textos explicativos continuam com largura de leitura de aproximadamente 60–70 caracteres por linha.

### Esquema para desktop

```text
┌─────────────────────────────────────────────────────────────┐
│ Logo       Busca                      Menu / Conta / Carrinho│
├─────────────────────────────────────────┬───────────────────┤
│ Mensagem curta + foto real maior        │ Calculadora       │
│ Ação principal: escolher embalagens     │ Material          │
│ Link discreto para WhatsApp             │ Tamanho / Qtd.    │
├─────────────────────────────────────────┤ Total / Adicionar │
│ NF-e · Preço por quantidade · Entrega   │                   │
├─────────────────────────────────────────┴───────────────────┤
│ Escolha o material: 3 produtos para compra online           │
│ Fotografias maiores e cartões com poucas informações       │
├─────────────────────────────────────────────────────────────┤
│ Personalizado: faixa própria com uma ação de orçamento      │
├─────────────────────────────────────────────────────────────┤
│ Como comprar: 3 passos curtos  │ Dúvidas em acordeão          │
├─────────────────────────────────────────────────────────────┤
│ Rodapé                                                     │
└─────────────────────────────────────────────────────────────┘
```

A coluna da calculadora ocupa somente o módulo de abertura. As seções seguintes recuperam a largura inteira, evitando um corredor vazio abaixo da ferramenta. A primeira versão usa posicionamento normal; fixação durante a rolagem só será considerada se o protótipo demonstrar utilidade e não houver cortes ou conflito com o cabeçalho.

## Hierarquia e destino do conteúdo

| Bloco atual | Proposta | Motivo |
| --- | --- | --- |
| Banner | Uma promessa curta, uma frase de apoio, foto em área própria e uma ação principal para os materiais | Dar uma entrada clara e separar texto de imagem |
| Produto sobreposto no banner | Incorporar a foto à composição; retirar o pequeno cartão inclinado com preço | Ampliar presença visual e reduzir informação concorrente |
| Calculadora | Manter em coluna à direita no desktop; após os materiais no celular e tablet | Preservar compra rápida sem ocupar a abertura inteira no celular |
| Diferenciais | Faixa leve com NF-e, preço por quantidade e entrega; condições completas acessíveis | Reduzir cartões e repetições de confiança |
| Escolha o material | Três cartões de compra online: Envelope, COEX e Cinza | Concentrar a comparação de materiais em um lugar |
| Conteúdo de cada cartão | Foto, nome, uma diferença essencial, preço inicial com contexto, mínimo próprio e ação | Facilitar comparação sem listar todas as variantes |
| Guia de tamanhos | Retirar a grade completa da home; oferecer acesso ao catálogo filtrado pelo material | Mostrar tamanhos no contexto da escolha, mantendo todos acessíveis |
| Pedido rápido | Retirar a seção independente; manter a calculadora como atalho de compra | Evitar duas ferramentas para a mesma decisão |
| Como funciona | Três passos curtos em composição leve, sem três grandes cartões | Explicar a compra com menos peso visual |
| Personalizado | Um único destaque próprio abaixo dos materiais, com orçamento via WhatsApp | Distinguir orçamento da compra online e eliminar duplicação |
| Pedido mínimo / cadastro | Exibir mínimo no produto e cadastro no momento adequado do fluxo existente | Evitar chamadas genéricas que competem com a compra |
| FAQ | Manter perguntas fechadas em acordeão no final | Deixar respostas completas disponíveis sem expandir a página |

O mínimo não pode virar uma promessa geral de 500 unidades: Envelope e Personalizado começam em 2.000; COEX e Cinza em 500. Preço inicial precisa manter unidade e contexto da faixa. Frete grátis deve continuar explicitamente restrito a Joinville/SC. Não inventar prazos, avaliações, números de clientes ou benefícios.

No catálogo, todos os tamanhos, cores e faixas continuam acessíveis. Links da home reutilizam a busca por material existente (`/produtos?q=...`). A tabela pode ficar em uma expansão com rótulo claro, mantendo preço da seleção, quantidade mínima e total próximos dos controles de compra. O catálogo é uma segunda etapa de refinamento, depois da home.

## Regras de acabamento

- Mais área de fotografia e espaçamento; menos molduras e cartões dentro de cartões.
- Títulos e parágrafos alinhados à esquerda. Um título dominante por região.
- Azul-marinho nos pontos de maior importância; fundos claros no restante; bege como apoio.
- Uma ação visualmente dominante por módulo. WhatsApp e links de ajuda com peso secundário.
- Espaçamento consistente: 24–32 px entre módulos relacionados, 48–64 px entre seções no desktop e 32–40 px no celular.
- Reaproveitar fotos reais disponíveis e não depender de novas fotos para reorganizar a página. Novos materiais fotográficos seguem a #32.
- Interações por clique e teclado, sem informações essenciais exclusivas de hover. Foco visível, controles de pelo menos 44 px, contraste adequado e respeito a movimento reduzido.

## Ordem de execução na #51

1. **Registrar a referência atual.** Capturar home em 390, 768, 1.024, 1.440 e 1.920 px, incluindo primeira dobra e página completa. Conferir visitantes e usuários autenticados no cabeçalho.
2. **Prototipar a estrutura.** Aplicar largura, composição do banner, calculadora lateral e ordem mobile. Revisar desktop e celular antes de polir os detalhes. A estrutura deve resolver o vazio lateral e a concentração central sem aumentar a quantidade de conteúdo.
3. **Simplificar a home.** Reduzir informações nos cartões, retirar grade de tamanhos e pedido rápido redundantes, consolidar personalizado e condensar diferenciais e passos.
4. **Refinar o catálogo.** Melhorar a leitura de tamanhos e preços sob demanda, preservando busca, filtros e seleção de variantes. Prioridade posterior à home; pode virar PR separado dentro da #51.
5. **Conferir e publicar.** Comparar capturas antes/depois nas mesmas larguras, validar compra e acessibilidade, executar checagens locais e CI, abrir PR e fazer merge pelo fluxo existente.

## Critérios para considerar o redesenho pronto

- Em 1.920 px, a área útil chega ao alvo de 1.440 px, mantendo margens simétricas. Em 1.440 px, usa a largura disponível menos as margens definidas.
- Na primeira dobra de referência, em 1.440 × 900, há mensagem principal, produto visível, ação de compra e calculadora, sem sobreposição. O teste com zoom tem prioridade sobre forçar tudo a caber na dobra.
- A calculadora fica ao lado da vitrine apenas a partir de 1.280 px. Nas larguras menores, segue o fluxo da página sem esconder controles.
- A home apresenta um comparativo de materiais e uma ferramenta de compra rápida. Não repete a grade completa de variantes nem outra seção de pedido rápido.
- Personalizado aparece uma vez como oferta de orçamento, separado dos três produtos de compra online.
- Em 390 px, há caminho claro até os materiais, a busca permanece utilizável e o usuário consegue acessar a calculadora sem atravessar tabelas extensas.
- Em 320 px, nas larguras de referência e com zoom de 200%, não há conteúdo cortado, texto sobreposto nem rolagem horizontal da página.
- Busca → material → tamanho/cor/quantidade → carrinho continua funcionando. A calculadora mantém preços e faixas corretos; usuários comuns não veem o produto de teste.
- Links para WhatsApp, orçamento, conta e carrinho funcionam; teclado e foco permitem concluir as ações.
- Rodar lint, TypeScript, Knip, Vitest com cobertura, build, E2E e testes compartilhados de Deno conforme `AGENTS.md` e CI. Atualizar testes existentes apenas quando a nova interação exigir.

Esses são critérios de entrega visual e funcional. Não há evidência nesta sessão para prometer aumento de conversão. Se houver medição disponível, comparar acesso ao catálogo e adição ao carrinho antes/depois; uma nova integração de análise exige escopo próprio.
