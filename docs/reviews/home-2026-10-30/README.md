# Revisão visual e funcional da home — #62

Referência: `24bb562` (main após PR #61). Capturas do build de produção em Chrome, com movimento reduzido. Autenticação e carrinho remoto simulados; nenhum cadastro, pedido ou pagamento real.

## Comparação

- [Antes, 1.920 px](before/home-1920-full.png) · [Depois, 1.920 px](after/home-1920-full.png)
- [Antes, 390 px](before/home-390-full.png) · [Depois, 390 px](after/home-390-full.png)
- [Protótipo a 1.920 px antes do polimento](prototype/home-1920-fold.png): o recuo do cabeçalho foi avaliado como aceitável; ele não foi alargado.
- Calculadora empilhada: [1.024 px](after/home-1024-calculator.png) · [1.279 px](after/home-1279-calculator.png).
- Primeira dobra: [1.280 px](after/home-1280-fold.png) · [1.440 × 900](after/home-1440-fold.png) · [1.920 px](after/home-1920-fold.png).
- Visitante e usuário autenticado: [visitante no celular](after/home-390-fold.png) · [autenticado no celular](after/home-auth-390.png) · [autenticado no desktop](after/home-auth-1920.png).

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

Cabeçalho e rodapé mantêm `.container-custom`. Só abaixo de 640 px o cabeçalho ganha duas linhas (logo acima, busca/carrinho/menu abaixo), preservando ordem do DOM e largura. `Layout` reserva a altura correspondente. O campo de busca ganha espaço no celular. Logo continua na mesma posição ao navegar entre rotas na mesma tela.

Capturas antes/depois também incluem catálogo, Sobre, Contato, carrinho vazio/com itens, login, cadastro, Termos, Privacidade e Meus pedidos com sessão simulada. [Medições e comparação](comparison.json): conteúdo das outras páginas, cabeçalho e rodapé mantêm suas larguras. As capturas de `/pedidos` sem sessão mostram o login esperado; `pedidos-auth-1920.png` mostra a página autenticada.

## Evidências funcionais

`e2e/home-layout.spec.ts` cobre:

- Instância única da calculadora, largura e ordem real do DOM em todas as telas da tabela.
- Cada controle do grid (incluindo links dos materiais) mantém o mesmo nó e o foco em 1.280 → 1.279 → 1.280 → 1.279 → 1.280 px. Produto, tamanho e quantidade permanecem selecionados. Foco externo ao grid permanece externo.
- Tab percorre cabeçalho e grid na ordem apresentada, em 390, 1.279 e 1.280 px.
- Ação do banner chega aos materiais sem esconder o título sob o cabeçalho. Filtro do guia e Pedido rápido funcionam.
- Busca → sugestão de Envelope → tamanho 32x40 → cor branca → 2.500 unidades → carrinho.
- Reflow correspondente a zoom de 200%: viewport CSS com metade da largura e altura física, incluindo 320 × 450 e as faixas críticas. Isso verifica o reflow; não é uma captura do indicador nativo de zoom do Chrome.

Os testes de auth também conferem cadastro explícito para visitante e convite do banner ausente após login simulado. Suítes anteriores de catálogo e cadastro continuam passando.

Verificação local: lint sem erros (avisos existentes), TypeScript, Knip, 65 unitários com cobertura, 58 E2E, build e 5 testes Deno aprovados. CI e parecer específico do Claude são acompanhados em `COMMUNICATION.md`.

Pendência já registrada em `memoria/Status.md`: confirmação real por e-mail com `returnTo` no Supabase de produção. Os mocks não demonstram a aceitação de `redirect_to` pelo serviço real.

## Reproduzir as capturas

Com o build servido pelo Vite Preview e Chrome instalado:

```powershell
$env:PW_EXECUTABLE_PATH='C:/Program Files/Google/Chrome/Application/chrome.exe'
node scripts/capture-home-review.mjs before
node scripts/capture-home-review.mjs prototype
node scripts/capture-home-review.mjs after
```

Use `HOME_REVIEW_URL` para apontar a referência para um build separado. `before` desta revisão foi servido a partir de uma cópia isolada de `24bb562`, sem trocar os arquivos de trabalho. `prototype` é o registro anterior ao polimento, não a versão final.
