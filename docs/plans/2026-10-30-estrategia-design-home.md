# Estratégia de design da home — FNZ Supply

Data: 2026-10-30. Planejamento: Issue #52. Implementação: Issue #51.

Revisão 2: Issue #54, após parecer do Claude em `COMMUNICATION.md`.

**Estado: APROVADO pelo Claude com condições**, registradas em `COMMUNICATION.md` na seção “Parecer do Claude — revisão 2”. As condições foram incorporadas abaixo. A implementação segue três PRs separados, com revisão do Claude entre etapas. A retirada do Guia de tamanhos e do Pedido rápido depende também de decisão explícita do dono, separada para cada seção. Sem decisão, ambas permanecem; `Index.tsx` mantém ambas em todos os PRs.

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

- Área útil da home com máximo inicial de **1.440 px**, excluindo as margens externas. Criar `.container-wide`, com `width: min(1440px, calc(100% - 2 * var(--page-gutter)))`, `margin-inline: auto` e sem padding horizontal adicional. `--page-gutter`: 16 px abaixo de 768 px, 24 px entre 768 e 1.279 px, 32 px a partir de 1.280 px. Em 1.920 px, conteúdo de 1.440 px e margens de 240 px; em 1.440 px, conteúdo de 1.376 px e margens de 32 px. A largura exata é um ponto de partida para o protótipo.
- A partir de **1.280 px de viewport**, reservar aproximadamente **340–380 px** para a calculadora, com intervalo de **24–32 px** até o conteúdo principal. O restante fica com a vitrine.
- Entre **768 e 1.279 px**, retirar a coluna lateral e organizar os módulos na sequência da página. Materiais em duas colunas; calculadora com `width: 100%`, `max-width: 560px` e margens automáticas, sem esticar até a largura inteira do grid. Conferir especificamente 1.024 e 1.279 px. Em 1.280 px, conferir que a vitrine ao lado dos 340–380 px da calculadora continua confortável. Se o limite precisar mudar, atualizar CSS e `matchMedia` juntos.
- Abaixo de **768 px**, usar uma coluna. Fotos e textos devem caber sem rolagem horizontal. No cabeçalho estreito, colocar a busca em uma linha própria quando necessário.
- **Não alterar `.container-custom`**, que é compartilhada pelo site. Adicionar `contentWidth?: "default" | "wide"` ao `Layout`, com padrão `"default"`; apenas `Index` solicita `<Layout contentWidth="wide">`. No modo wide, o `main` recebe um único wrapper `.container-wide`, e as seções da home deixam de aplicar seus próprios `.container-custom`, evitando um limite de 1.280 px aninhado. No padrão, preservar a árvore atual sem wrapper novo. Essa opção muda somente o conteúdo principal.
- **Cabeçalho e rodapé continuam com `.container-custom` em todas as rotas**, inclusive na home. Não recebem a opção wide. Assim o logo, a busca, os links e o carrinho mantêm as posições na navegação home → catálogo → Sobre → Contato → carrinho. A borda do conteúdo ampliado da home não precisa coincidir com a borda do cabeçalho. Isso substitui a proposta anterior de alargar cabeçalho e rodapé na home. Em 1.920 px, conteúdo começa em 240 px e o conteúdo do cabeçalho em cerca de 352 px; incluir essa captura no PR antes do polimento. Se o desalinhamento ficar ruim, parar e trazer a questão a `COMMUNICATION.md` antes de qualquer ampliação do cabeçalho.
- Catálogo, Sobre, Contato, Meus pedidos, páginas legais e carrinho usam o `Layout` padrão. Login/cadastro mantêm seus contêineres atuais; o modal de checkout mantém suas dimensões. Caso Guia de tamanhos ou Pedido rápido permaneçam na home, seus wrappers também se adaptam ao único contêiner wide, sem alterar a apresentação em outras rotas.
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
│ Guia de tamanhos / Pedido rápido: permanência a decidir      │
├─────────────────────────────────────────────────────────────┤
│ Personalizado: faixa própria com uma ação de orçamento      │
├─────────────────────────────────────────────────────────────┤
│ Como comprar: 3 passos curtos  │ Dúvidas em acordeão          │
├─────────────────────────────────────────────────────────────┤
│ Rodapé                                                     │
└─────────────────────────────────────────────────────────────┘
```

A coluna da calculadora ocupa somente o módulo de abertura. As seções seguintes recuperam a largura inteira, evitando um corredor vazio abaixo da ferramenta. A primeira versão usa posicionamento normal; fixação durante a rolagem só será considerada se o protótipo demonstrar utilidade e não houver cortes ou conflito com o cabeçalho.

### Uma calculadora e ordem de foco coerente

Extrair `PriceCalculator` de `HeroSection`: o banner passa a conter somente sua mensagem, imagem e ações. Um novo `HomePurchaseSection` reúne banner, diferenciais, materiais e **uma única instância** de `PriceCalculator` como quatro filhos do mesmo grid. Seus componentes não aplicam outro contêiner horizontal.

O posicionamento e a ordem real dos elementos mudam juntos:

| Faixa | Ordem dos filhos no DOM e do teclado | Áreas do grid |
| --- | --- | --- |
| A partir de 1.280 px | Banner → calculadora → diferenciais → materiais | Primeira linha: banner / calculadora. Segunda: diferenciais / calculadora. Terceira: materiais em largura inteira |
| Abaixo de 1.280 px | Banner → diferenciais → materiais → calculadora | Quatro blocos empilhados na mesma ordem |

Definir a faixa com um único `matchMedia("(min-width: 1280px)")`, inicializado antes da primeira renderização da aplicação cliente e atualizado no evento `change`. O CSS usa exatamente o mesmo limite. O grid renderiza uma lista de quatro elementos com chaves estáveis (`banner`, `calculator`, `differentials`, `materials`), alterando somente a ordem da lista. A calculadora tem a mesma chave, tipo e pai em ambas as faixas; o React move o elemento existente sem remontar nem duplicar seu estado. Não usar dois ramos com calculadoras independentes, cópias escondidas, portais, `order`, `tabindex` positivo ou `aria-flowto` para simular uma ordem diferente.

Na troca de faixa, guardar a referência de **qualquer controle focado do grid**, incluindo links dos materiais e ações do banner/diferenciais. Depois da atualização, conferir o foco e restaurá-lo no mesmo controle conectado se a movimentação tiver causado sua perda; usar `preventScroll` e trazer o controle à área visível somente se necessário. A restauração vale nos dois sentidos: o React pode mover a calculadora ao estreitar e os materiais/diferenciais ao alargar. Não transferir foco de outro lugar para a calculadora. Material, tamanho e quantidade selecionados devem sobreviver à troca de faixa.

Validar no E2E: uma única ocorrência de “Calculadora de preço” e do botão “Adicionar ao carrinho” da calculadora; seleção → redimensionamento nos dois sentidos → mesmos valores e foco; repetir o redimensionamento com um link dos materiais focado, nos dois sentidos; percurso de Tab igual à ordem visível de cada faixa, inclusive cabeçalho, links dos materiais e campos da calculadora. Manter as asserções existentes de instância única. A disposição está especificada, mas ainda precisa ser implementada e verificada.

## Hierarquia e destino do conteúdo

| Bloco atual | Proposta | Motivo |
| --- | --- | --- |
| Banner | Uma promessa curta, uma frase de apoio, foto em área própria e uma ação principal para os materiais | Dar uma entrada clara e separar texto de imagem |
| Produto sobreposto no banner | Incorporar a foto à composição; retirar o pequeno cartão inclinado com preço | Ampliar presença visual e reduzir informação concorrente |
| Calculadora | Manter em coluna à direita no desktop; após os materiais no celular e tablet | Preservar compra rápida sem ocupar a abertura inteira no celular |
| Diferenciais | Faixa leve com NF-e, preço por quantidade e entrega; condições completas acessíveis | Reduzir cartões e repetições de confiança |
| Escolha o material | Três cartões de compra online: Envelope, COEX e Cinza | Concentrar a comparação de materiais em um lugar |
| Conteúdo de cada cartão | Foto, nome, uma diferença essencial, preço inicial com contexto, mínimo próprio e ação | Facilitar comparação sem listar todas as variantes |
| Guia de tamanhos | **Decisão do dono pendente.** Se ficar, preservar filtros e acesso a todos os tamanhos, melhorando espaçamento. Se sair, retirar a seção e manter acesso pelo filtro exato do catálogo definido abaixo | Não retirar uma seção recém-entregue sem autorização |
| Pedido rápido | **Decisão do dono pendente.** Se ficar, preservar as duas linhas e adição ao carrinho. Se sair, a calculadora permanece como ferramenta de compra rápida | Respeitar a escolha anterior do dono pelo Bento / Pedido Rápido |
| Como funciona | Três passos curtos em composição leve, sem três grandes cartões | Explicar a compra com menos peso visual |
| Personalizado | Um único destaque próprio abaixo dos materiais, com orçamento via WhatsApp | Distinguir orçamento da compra online e eliminar duplicação |
| Pedido mínimo / cadastro | Exibir mínimo no produto; manter acesso explícito ao cadastro e corrigir o retorno ao carrinho conforme contrato abaixo | Preservar descoberta do cadastro e continuidade da compra |
| FAQ | Manter perguntas fechadas em acordeão no final | Deixar respostas completas disponíveis sem expandir a página |

O mínimo não pode virar uma promessa geral de 500 unidades: Envelope e Personalizado começam em 2.000; COEX e Cinza em 500. Preço inicial precisa manter unidade e contexto da faixa. Frete grátis deve continuar explicitamente restrito a Joinville/SC. Não inventar prazos, avaliações, números de clientes ou benefícios.

### 1. Filtro exato do catálogo — pré-requisito dos links da home

`q` é busca livre e `matchesProduct` inclui a descrição. Por isso `/produtos?q=Envelope` não identifica um produto, e `q=Envelope Cinza` também encontra COEX. Não usar essa busca para representar uma escolha exata de material.

Adicionar parâmetro **`produto`**, comparado por igualdade a `product.id`. Exemplos: `/produtos?produto=envelope`, `/produtos?produto=envelope-coex` e `/produtos?produto=envelope-cinza`. Em `Produtos.tsx`, ler o id diretamente de `searchParams` em cada navegação, sem estado inicial que fique desatualizado. Primeiro aplicar visibilidade por permissão; depois o filtro por id; depois `q`, categoria e ordenação. Quando ambos existirem, a regra é **id exato E busca livre**, nunca uma união.

- `produto=envelope-cinza` mostra só Cinza, mesmo que a descrição de COEX diga “cinza por dentro”. `produto=envelope` mostra só Envelope.
- Mostrar o filtro ativo com nome do produto e ação “Limpar material”. Limpar remove apenas `produto` da URL, preservando `q` e os demais parâmetros; a lista é recalculada imediatamente.
- Id vazio ou inexistente produz estado explícito de filtro inválido/sem resultados com ação para limpar. Id de produto admin não pode revelar dados para visitante; usar a mesma resposta de produto indisponível. Não abrir silenciosamente o catálogo inteiro.
- Nova busca enviada pelo cabeçalho continua usando somente `q`, removendo o contexto do material ao navegar. Busca dentro do catálogo mantém o material ativo, de modo visível.
- Atualizar os links determinísticos de `FeaturedProducts` e do destaque de produto do banner. Se o Guia de tamanhos ficar, seus links usam `produto=<id>&q=<tamanho>`; `q` restringe a busca dentro do material, sem prometer pré-selecionar o tamanho no formulário. Personalizado mantém orçamento via WhatsApp.
- Testes unitários para igualdade de id, combinação com busca, ids inválidos e visibilidade admin; E2E para abrir Cinza sem COEX, abrir Envelope sem outros produtos, limpar filtro, navegar entre dois ids na mesma rota e usar voltar/avançar do navegador. Preservar os testes de busca livre existentes.

Essa correção deve acompanhar ou preceder a mudança dos links da home na #51, independentemente da decisão sobre o Guia. Todos os tamanhos, cores e faixas continuam acessíveis. A melhoria visual das tabelas no catálogo pode vir depois, com expansão rotulada e preço selecionado, mínimo e total próximos dos controles.

### 4. Componentes sem uso e documentação

Ao retirar uma seção **autorizada**, remover seu import e também o arquivo que ficar sem consumidores: `SizeGuide.tsx` somente se o dono escolher sair; `QuickOrder.tsx` somente se escolher sair. Não manter arquivos mortos só para evitar decidir. Se ficarem, preservar componentes e funcionalidade e ajustar seus wrappers para a home wide.

O conteúdo de `CTASection.tsx` será redistribuído: personalizado para um destaque de orçamento único, mínimo para cada material e cadastro para os acessos descritos abaixo. Após essa substituição completa, remover o import e o arquivo antigo se não houver outros consumidores. Checar referências com `rg` antes de remover; não apagar ativos compartilhados.

Na mesma implementação, atualizar a estrutura de pastas e o estado da home em `CLAUDE.md` para refletir os arquivos realmente presentes. Executar Knip após a reorganização. Nesta revisão documental nenhum componente é removido e a estrutura atual do `CLAUDE.md` continua correta.

### 5. Cadastro acessível e retorno ao pedido

Manter “Cadastre sua empresa” no rodapé e adicionar um link secundário explícito para visitantes junto à ação principal do banner. O cabeçalho continua com “Entrar”; login mantém acesso a cadastro. Usuários autenticados não precisam do convite para criar conta. A saída do grande cartão de cadastro não elimina o acesso ao cadastro.

Hoje o checkout passa `state.from = "/carrinho"` para login, mas não para cadastro; `Cadastro.tsx` redireciona para `/` ou `/login`. Corrigir esse percurso em PR próprio, após o PR do filtro e antes do PR do layout ou da remoção do cartão antigo:

- Links de login e cadastro no checkout recebem o destino `/carrinho`. Login → cadastro e cadastro → login preservam o destino.
- Usar um parâmetro `returnTo` para sobreviver a recarregamento e ao link de confirmação por e-mail. Neste escopo, aceitar somente os destinos constantes `/carrinho` e `/produtos`; valor ausente/inválido usa o comportamento padrão atual. Não aceitar URL externa, `//`, barras invertidas ou caminho arbitrário. Validar em todas as entradas, sem confiar em query string nem em `location.state`.
- Cadastro com sessão retorna ao destino validado; sem sessão, leva ao login com o mesmo destino e informa a confirmação por e-mail. Configurar `emailRedirectTo` para a página de login da mesma origem com esse `returnTo` validado; login encaminha ao destino depois da sessão. Não mudar a exigência de confirmação de e-mail nem a política de senha.
- Preservar a compatibilidade com o `state.from` seguro já usado no login. Destino explícito validado prevalece; sem destino manter encaminhamento atual de usuário/admin. Não reabrir nem cobrar o checkout automaticamente ao retornar.
- E2E com respostas de auth controladas, sem criar contas reais: visitante → carrinho → cadastro, troca login/cadastro, cadastro com sessão, cadastro sem sessão seguido de confirmação simulada/login, manutenção dos itens no carrinho e rejeição de destinos inválidos. A confirmação em outro dispositivo não transfere o carrinho local; não prometer esse comportamento.

### 6. Diferenciar os materiais usando as fotos existentes

`Envelope`, `COEX` e `Personalizado` usam a mesma foto `envelope.webp` (1.200 × 900). Preservar a imagem como foto ilustrativa compartilhada, sem recolorir, inventar impressão, fabricar outra foto ou apresentá-la como prova de diferenças de material.

- **Envelope:** foto em fundo branco, título “Envelope”, identificação “Preto ou branco” e mínimo de 2.000 unidades. Não atribuir à foto uma cor que ela não mostra.
- **COEX:** mesma foto com escala e enquadramento consistentes, identificação textual “Branco por fora, cinza por dentro”, tamanho e mínimo próprios; uma faixa bege discreta no cabeçalho do cartão pode reforçar a distinção. Não simular a camada interna na fotografia.
- **Cinza:** usar sua foto própria `envelope-cinza.webp`, com as mesmas proporções dos outros cartões.
- **Personalizado:** sair da grade dos três materiais de compra online e aparecer em um destaque horizontal de orçamento, com tipografia e composição próprias. Se a foto compartilhada for usada, exibir “Imagem ilustrativa — personalização sob orçamento”; não sobrepor logomarca no envelope como se fosse um exemplar fabricado. Informar mínimo e prazo reais.

Nome, descrição curta e tipo de ação devem distinguir as ofertas mesmo em tons de cinza e para leitores de tela. A mudança de layout independe das novas fotos da #32, mas não elimina essa necessidade futura.

## Regras de acabamento

- Mais área de fotografia e espaçamento; menos molduras e cartões dentro de cartões.
- Títulos e parágrafos alinhados à esquerda. Um título dominante por região.
- Azul-marinho nos pontos de maior importância; fundos claros no restante; bege como apoio.
- Uma ação visualmente dominante por módulo. WhatsApp e links de ajuda com peso secundário.
- Espaçamento consistente: 24–32 px entre módulos relacionados, 48–64 px entre seções no desktop e 32–40 px no celular.
- Reaproveitar fotos reais disponíveis e não depender de novas fotos para reorganizar a página. Novos materiais fotográficos seguem a #32.
- Interações por clique e teclado, sem informações essenciais exclusivas de hover. Foco visível, controles de pelo menos 44 px, contraste adequado e respeito a movimento reduzido.

## Ordem de execução na #51

0. **Respeitar a aprovação e suas condições.** O Claude registrou `Status: APROVADO` com condições para esta revisão. Manter Guia de tamanhos e Pedido rápido em `Index.tsx` em todos os PRs enquanto não houver decisão explícita do dono registrada no canal. A aprovação do plano não valida a implementação futura.
1. **Registrar a referência atual.** Capturar home em 390, 768, 1.024, 1.440 e 1.920 px, incluindo primeira dobra e página completa. Conferir visitantes e usuários autenticados no cabeçalho, além das outras rotas para comparação de largura e posição do logo.
2. **PR 1 — filtro do catálogo.** Implementar o filtro exato por id e seus testes, com os links determinísticos que dependem dele. Ao concluir, registrar `Status: CONCLUIDO` e o número do PR em `COMMUNICATION.md`; aguardar revisão do Claude antes do próximo PR.
3. **PR 2 — cadastro e retorno ao carrinho.** Implementar o contrato de cadastro em PR próprio, depois da revisão do filtro. Não agrupar mudanças de login com o redesenho, para permitir reversão independente. Registrar conclusão e PR no canal e aguardar nova revisão antes do layout.
4. **PR 3 — estrutura e layout da home.** Aplicar `.container-wide` apenas ao conteúdo da home, extrair a calculadora para o grid compartilhado e implementar a lista de filhos com chaves estáveis e ordem responsiva real. Revisar desktop, celular, teclado, foco de campos e links e estado ao redimensionar nos dois sentidos. Incluir a captura de 1.920 px antes do polimento e validar 1.024, 1.279 e 1.280 px conforme as condições acima.
5. **Acabamento no PR 3.** Reduzir informações nos cartões, consolidar personalizado e condensar diferenciais e passos. Retirar Guia ou Pedido rápido somente conforme cada decisão explícita; caso contrário, preservar suas funções. Remover arquivos sem uso conforme item 4 e atualizar `CLAUDE.md`. Refinar visualmente o catálogo depois, preservando o filtro exato já entregue.
6. **Conferir e publicar cada etapa.** Executar as checagens locais e CI, seguir o fluxo de PR e registrar conclusão e número no canal para revisão do Claude antes de avançar. No layout, comparar capturas antes/depois nas mesmas larguras e validar compra e acessibilidade; testes do código existente não substituem esses critérios.

## Critérios para considerar o redesenho pronto

- Em 1.920 px, a área útil chega ao alvo de 1.440 px, mantendo margens simétricas. Em 1.440 px, usa a largura disponível menos as margens definidas.
- Na primeira dobra de referência, em 1.440 × 900, há mensagem principal, produto visível, ação de compra e calculadora, sem sobreposição. O teste com zoom tem prioridade sobre forçar tudo a caber na dobra.
- A calculadora fica ao lado da vitrine apenas a partir de 1.280 px. Nas larguras menores, segue o fluxo da página sem esconder controles.
- Há uma única instância da calculadora, preservando seleção e foco ao cruzar o limite de 1.280 px. Ordem de Tab acompanha a ordem visual em cada faixa, sem cópias ocultas nem ordenação artificial de foco.
- `.container-custom` permanece inalterada; capturas antes/depois de catálogo, Sobre, Contato, Meus pedidos, carrinho, login/cadastro e páginas legais confirmam larguras preservadas. Cabeçalho e rodapé têm a mesma largura na home e nas outras rotas; posição do logo não muda em navegação com viewport constante.
- Guia de tamanhos e Pedido rápido seguem as decisões individuais do dono. Sem decisão explícita de saída, ambos permanecem funcionais. A aprovação do restante do plano não autoriza removê-los.
- `produto=envelope-cinza` e `produto=envelope` retornam somente o id pedido. Limpar filtro, combinar com busca, navegar entre ids e ocultar produtos admin funcionam conforme o contrato do item 1.
- Personalizado aparece uma vez como oferta de orçamento, separado dos três produtos de compra online.
- Em 390 px, há caminho claro até os materiais, a busca permanece utilizável e o usuário consegue acessar a calculadora sem atravessar tabelas extensas.
- Em 320 px, nas larguras de referência e com zoom de 200%, não há conteúdo cortado, texto sobreposto nem rolagem horizontal da página.
- Busca → material → tamanho/cor/quantidade → carrinho continua funcionando. A calculadora mantém preços e faixas corretos; usuários comuns não veem o produto de teste.
- Links para WhatsApp, orçamento, conta e carrinho funcionam; teclado e foco permitem concluir as ações.
- Cadastro continua visível ao visitante e o caminho carrinho → cadastro/login → carrinho preserva o destino validado e os itens, inclusive com confirmação de e-mail simulada. URL de retorno inválida não redireciona para fora nem para destinos fora da lista permitida.
- Os três materiais e a oferta personalizada são distinguíveis por texto e composição, usando as fotos reais disponíveis e identificação da imagem compartilhada quando necessário.
- Nenhum componente retirado fica sem uso no repositório; Knip passa e `CLAUDE.md` descreve a estrutura efetivamente implementada.
- Rodar lint, TypeScript, Knip, Vitest com cobertura, build, E2E e testes compartilhados de Deno conforme `AGENTS.md` e CI. Atualizar testes existentes apenas quando a nova interação exigir.

Esses são critérios de entrega visual e funcional para a implementação futura. O CI do PR #53 e as checagens desta revisão documental apenas confirmam que a documentação não introduziu regressões no código existente; não validam o desenho proposto, o filtro novo, a reordenação nem o fluxo de cadastro descrito. A aprovação do plano cabe ao Claude no canal compartilhado, e a validação visual depende do protótipo e das capturas. Não há evidência nesta sessão para prometer aumento de conversão. Se houver medição disponível, comparar acesso ao catálogo e adição ao carrinho antes/depois; uma nova integração de análise exige escopo próprio.
