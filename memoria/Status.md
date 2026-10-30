# Status

Atualizado em: 2026-10-30

## Pronto
- [x] Estratégia de equilíbrio visual da home documentada na #52 e corrigida após revisão do Claude na #54. Revisão 2 em `docs/plans/2026-10-30-estrategia-design-home.md`; canal `COMMUNICATION.md` com `Status: AGUARDANDO_APROVACAO_DO_CLAUDE`. Proposta ainda não aprovada nem implementada; CI de documentação não valida o desenho.
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
- [ ] Obter aprovação do Claude em `COMMUNICATION.md` antes de implementar qualquer parte do redesenho da #51.
- [ ] Decisão do dono, separada para cada seção: Guia de tamanhos fica/sai; Pedido rápido fica/sai. Preservar ambos enquanto estiverem pendentes.
- [ ] Depois da aprovação, implementar o restante autorizado da #51 e validar capturas em desktop, tablet e celular; retiradas de seções também exigem decisão explícita do dono.
As tarefas abertas estão nas Issues do GitHub (fluxo em `AGENTS.md`): #28 Sentry (precisa do DSN), #29 remover pagamentos antigos, #30 validar boleto e cartão, #31 refatorar CheckoutModal, #32 fotos dos produtos.

- [x] **Cartão** pelo AbacatePay (abacatepay.js + `pay-abacate-card`), chave pública no GitHub desde 2026-10-29 — falta testar com cartão real
- [ ] **Asaas**: conta atual é pessoa física (CPF do dono); CNPJ preso em outra conta, aguardando suporte. Site não usa mais o Asaas
- [ ] **Fotos dos outros produtos** (stretch e demais): o dono vai mandar
- [x] Testes no CI (Vitest + Playwright + Knip)
- [ ] Refatorar `CheckoutModal` (Issue #31)
