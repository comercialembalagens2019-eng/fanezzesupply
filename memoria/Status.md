# Status

Atualizado em: 2026-10-30

## Pronto
- [x] PR #59 aprovado pelo Claude no commit `32094b6` e mergeado; CI e deploy passaram. Correção das sugestões concluída.
- [x] Cadastro/retorno ao carrinho #60 / PR #61 aprovado pelo Claude, mergeado e publicado: `returnTo` restrito, links e confirmação por e-mail preservam destino, admin mantém padrão e carrinho fica intacto. Checagens locais e CI passaram: 65 unitários, 44 E2E, 5 Deno, lint, tipos, Knip e build. Teste real de confirmação segue pendente abaixo.
- [x] Layout da home implementado na #62 / PR #63, branch `feat/layout-home-amplo`: conteúdo de até 1.440 px, calculadora única com ordem real responsiva e foco/estado preservados, 3 materiais e personalizado separado, Guia e Pedido rápido mantidos. Claude aprovou a home, mas pediu correção de barras cobertas no celular e redução das imagens; ambas corrigidas, com altura compartilhada e 5 imagens essenciais. Capturas e medições em `docs/reviews/home-2026-10-30/`. 65 unitários, 60 E2E e 5 Deno, lint, tipos, Knip e build passaram. Aguardando CI e nova revisão.
- [x] Etapa 1 da #51 / #56 mergeada no PR #57 e aprovada pelo Claude: filtro exato `produto`, busca `q`, limpeza preservando parâmetros/histórico e links da home/guia corrigidos. O Claude pediu a correção adicional das sugestões do cabeçalho antes do cadastro (#58).
- [x] Correção adicional #58 implementada e aprovada: sugestões carregam id e tamanho separado, clique/teclado abrem material exato; Enter sem seleção mantém busca livre. Verificações locais: 48 unitários, 28 E2E e 5 Deno, lint, tipos, Knip e build.
- [x] Estratégia da home corrigida na #54 / PR #55; Claude aprovou a revisão 2 com condições em `COMMUNICATION.md`. Condições incorporadas ao plano: três PRs separados (filtro → cadastro → layout), revisão entre etapas, foco de campos e links nos dois sentidos e capturas nas larguras críticas. Nenhuma implementação nesta entrega; CI documental não valida o desenho.
- [x] Fase 1 — Segurança: pedidos e preços calculados no servidor, webhooks validam id/valor/método, reset de senha com código forte e token guardado como hash, RLS revisado
- [x] Fase 2 — Bugs: frete (R$ 19,90, grátis só em Joinville/SC), e-mail duplicado do Stripe, carrinho limpo no logout
- [x] Token Supabase antigo revogado (o secret do GitHub tem um novo)
- [x] Domínio fanezzesupply.com.br e www apontando para o site novo (workflow `domain.yml`, 2026-10-29)
- [x] Asaas integrado (Pix com QR Code, boleto com linha digitável, cartão na página segura do Asaas); webhook cadastrado automaticamente no deploy
- [x] Fluxo Issue → PR → deploy (`AGENTS.md`); testes no CI; skeletons e animações; e-mail e pagamento redesenhados (#25, #26, #27, #36) e depois refeitos conforme os mockups do dono (#39, #41)
- [x] Pix testado em produção (R$ 1,00)
- [x] Fase 3 — Infra: CI, deploy automático, keep-alive, backup semanal (ver [[Infraestrutura]])
- [x] Fase 4 — Front novo "Bento / Pedido Rápido" (proposta 4 escolhida)
- [x] Painel admin (`/admin`): pedidos com Recebido/Enviado/Entregue, cadastros, carrinhos
- [x] Produto de teste R$ 0,01 (só admin vê) e usuário admin criado
- [x] Projeto Supabase próprio (sem Lovable) + site em https://fnzsupply.pages.dev
- [x] Resend com domínio verificado; templates de e-mail de pedido prontos
- [x] Login/cadastro: um só olho na senha, erros em português, link de verificação vai pro site, e-mails de conta em PT-BR via Resend
- [x] Páginas Termos e Privacidade com razão social (FNZ Supply Embalagens para Indústria e Comércio Ltda) e CNPJ 56.008.033/0001-32
- [x] Foto nova dos envelopes (`src/assets/envelope.webp`)
- [x] E-mails de pedido ligados: "pago" nos webhooks/checagem do Pix, "enviado/entregue" ao mudar no painel admin (função `notify-order-status`); cada e-mail sai uma vez só (tabela `order_emails`)

## Falta
- [ ] Fazer um cadastro real com e-mail novo, partindo do carrinho, e confirmar que o link do e-mail volta para `/carrinho`. Se cair na home, o Supabase recusou o `redirect_to` com `?returnTo=`. Pendência indicada pelo Claude no parecer do PR #61; testes desta entrega usam auth simulada e não criam contas reais.
- [ ] Acompanhar CI e revisão específica do Claude no PR #63 antes do merge; preservar Guia e Pedido rápido.
- [ ] Implementar a #51 em três PRs separados, após a aprovação do plano já registrada; marcar cada conclusão no canal e aguardar revisão do Claude antes do próximo PR.
- [ ] Decisão do dono, separada para cada seção: Guia de tamanhos fica/sai; Pedido rápido fica/sai. Preservar ambos enquanto estiverem pendentes.
- [ ] Validar o layout nas larguras de 1.024, 1.279, 1.280 e 1.920 px e demais referências; trazer ao canal qualquer problema com desalinhamento do cabeçalho antes de alargá-lo. Retiradas de seções exigem decisão explícita do dono.
As tarefas abertas estão nas Issues do GitHub (fluxo em `AGENTS.md`): #28 Sentry (precisa do DSN), #29 remover pagamentos antigos, #30 validar boleto e cartão, #31 refatorar CheckoutModal, #32 fotos dos produtos.

- [x] **Cartão** pelo AbacatePay (abacatepay.js + `pay-abacate-card`), chave pública no GitHub desde 2026-10-29 — falta testar com cartão real
- [ ] **Asaas**: conta atual é pessoa física (CPF do dono); CNPJ preso em outra conta, aguardando suporte. Site não usa mais o Asaas
- [ ] **Fotos dos outros produtos** (stretch e demais): o dono vai mandar
- [x] Testes no CI (Vitest + Playwright + Knip)
- [ ] Refatorar `CheckoutModal` (Issue #31)
