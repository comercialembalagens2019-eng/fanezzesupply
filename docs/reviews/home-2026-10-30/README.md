# Revisão visual e funcional da home — #62

Referência: `24bb562` (main após PR #61). Capturas do build de produção em Chrome, com movimento reduzido. Autenticação e carrinho remoto simulados; nenhum cadastro, pedido ou pagamento real.

## Comparação

- [Antes, 1.920 px](before/home-1920-full.png) · [Depois, 1.920 px](after/home-1920-full.png)
- [Antes, 390 px](before/home-390-full.png) · [Depois, 390 px](after/home-390-full.png)
- [Protótipo a 1.920 px antes do polimento](prototype/home-1920-fold.png): o recuo do cabeçalho foi avaliado como aceitável; ele não foi alargado.
- Calculadora empilhada conferida em 1.024 e 1.279 px; primeira dobra conferida em 1.280, 1.440 × 900 e 1.920 px.
- Cabeçalho conferido como visitante e com sessão simulada, em celular e desktop. Capturas adicionais são geradas pelo script em `test-results/home-review/` (ignorado pelo Git).

Fotos reais mantidas: Envelope e COEX usam a mesma imagem, com identificação textual e faixa bege no COEX. Cinza usa foto própria. Personalizado tem um único destaque de orçamento e legenda de imagem ilustrativa. Mínimos, prazos e preços vêm dos dados existentes.

## Larguras medidas e inspeção

| Tela | Conteúdo da home | Calculadora | Disposição |
| --- | ---: | ---: | --- |
| 320 | 288 | 288 | Empilhada, sem rolagem horizontal da página |
| 390 | 358 | 358 | Empilhada, cadastro explícito e foto visível |
| 768 | 720 | 560 | Materiais em duas colunas; calculadora centralizada |
| 1.024 | 976 | 560 | Calculadora centralizada após materiais |
| 1.279 | 1.231 | 560 | Calculadora centralizada após materiais |
| 1.280 | 1.216 | 360 | Banner e calculadora lado a lado; materiais abaixo em largura inteira |
| 1.440 | 1.376 | 360 | Mensagem, foto, ação de compra e calculadora na primeira dobra |
| 1.920 | 1.440 | 360 | Margens de 240 px, cabeçalho preservado |

Inspeção das capturas: sem sobreposição entre mensagem/foto/ações; campos e preços legíveis nas larguras críticas; calculadora não se estica em tablets. Guia de tamanhos e Pedido rápido permanecem em `Index.tsx`. Seus controles continuam funcionando.

Cabeçalho e rodapé mantêm `.container-custom`. Só abaixo de 640 px o cabeçalho ganha duas linhas (logo acima, busca/carrinho/menu abaixo), preservando ordem do DOM e largura. `--header-height` é a definição compartilhada de altura (108 px abaixo de 640 px; 64 px nas demais telas), usada pelo cabeçalho, espaçamento do `Layout` e barras fixas. O campo de busca ganha espaço no celular. Logo continua na mesma posição ao navegar entre rotas na mesma tela.

Foram geradas e conferidas capturas antes/depois de catálogo, Sobre, Contato, carrinho vazio/com itens, login, cadastro, Termos, Privacidade e Meus pedidos com sessão simulada. [Medições e comparação](comparison.json): conteúdo das outras páginas, cabeçalho e rodapé mantêm suas larguras. `/pedidos` sem sessão redireciona ao login esperado.

Após o parecer do Claude, só cinco imagens essenciais ficam versionadas: protótipo de 1.920 px e antes/depois da home inteira em 1.920 e 390 px. As demais são reproduzíveis pelo script e ficam fora do histórico da main; o PR será mergeado por squash.

## Correções após a primeira revisão

A barra de filtros do catálogo e a barra do admin ficam no fluxo normal abaixo de 640 px. Assim não ocupam, junto do cabeçalho, 252 px de uma tela baixa. A partir de 640 px, usam a altura compartilhada como posição fixa. Resumos do carrinho/checkout e navegação lateral legal só fixam a partir de `lg`, com espaçamento adicional de 1 rem em relação ao cabeçalho. Nenhum resumo fixa sobre os controles no celular.

O E2E rola o catálogo 600 px em 390, 639, 640 e 1.280 px, confere o comportamento da barra, clica na busca (trazendo-a de volta à tela quando necessário), verifica foco, posição abaixo do cabeçalho e ausência de outro elemento cobrindo seu centro. Também confere que o padding do `main` corresponde à altura real do cabeçalho, eliminando a diferença anterior de 112/108 px.

[Medição após a correção](header-measurements.json), em tela de 450 px de altura:

| Largura | Cabeçalho / padding do main | Barra após rolar 600 px | Busca ao clicar | Coberta |
| --- | --- | --- | --- | --- |
| 390 | 108 / 108 px | Fluxo normal, topo -292 px | Topo 203 px | Não |
| 639 | 108 / 108 px | Fluxo normal, topo -316 px | Topo 203 px | Não |
| 640 | 64 / 64 px | Fixa em 64 px | Topo 88 px | Não |
| 1.280 | 64 / 64 px | Fixa em 64 px | Topo 88 px | Não |

## Evidências funcionais

`e2e/home-layout.spec.ts` cobre:

- Instância única da calculadora, largura e ordem real do DOM em todas as telas da tabela.
- Cada controle do grid (incluindo links dos materiais) mantém o mesmo nó e o foco em 1.280 → 1.279 → 1.280 → 1.279 → 1.280 px. Produto, tamanho e quantidade permanecem selecionados. Foco externo ao grid permanece externo.
- Tab percorre cabeçalho e grid na ordem apresentada, em 390, 1.279 e 1.280 px.
- Ação do banner chega aos materiais sem esconder o título sob o cabeçalho. Filtro do guia e Pedido rápido funcionam.
- Busca → sugestão de Envelope → tamanho 32x40 → cor branca → 2.500 unidades → carrinho.
- Reflow correspondente a zoom de 200%: viewport CSS com metade da largura e altura física, incluindo 320 × 450 e as faixas críticas. Isso verifica o reflow; não é uma captura do indicador nativo de zoom do Chrome.

Os testes de auth também conferem cadastro explícito para visitante e convite do banner ausente após login simulado. Suítes anteriores de catálogo e cadastro continuam passando.

Verificação local revisada: lint sem erros (avisos existentes), TypeScript, Knip, 65 unitários com cobertura, 60 E2E, build e 5 testes Deno aprovados. Resultados e nova medição são registrados em `COMMUNICATION.md`.

Pendência já registrada em `memoria/Status.md`: confirmação real por e-mail com `returnTo` no Supabase de produção. Os mocks não demonstram a aceitação de `redirect_to` pelo serviço real.

## Reproduzir as capturas

Com o build servido pelo Vite Preview e Chrome instalado:

```powershell
$env:PW_EXECUTABLE_PATH='C:/Program Files/Google/Chrome/Application/chrome.exe'
node scripts/capture-home-review.mjs before
node scripts/capture-home-review.mjs prototype
node scripts/capture-home-review.mjs after
```

Saída padrão em `test-results/home-review/`; `HOME_REVIEW_OUTPUT` permite escolher outra pasta. Use `HOME_REVIEW_URL` para apontar a referência para um build separado. `before` desta revisão foi servido a partir de uma cópia isolada de `24bb562`, sem trocar os arquivos de trabalho. `prototype` é o registro anterior ao polimento, não a versão final.
