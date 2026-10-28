# Status

Atualizado em: 2026-10-28

## Pronto
- [x] Fase 1 — Segurança: pedidos e preços calculados no servidor, webhooks validam id/valor/método, reset de senha com código forte e token guardado como hash, RLS revisado
- [x] Fase 2 — Bugs: frete (R$ 19,90, grátis só em Joinville/SC), e-mail duplicado do Stripe, carrinho limpo no logout
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
- [ ] **Virada do domínio**: apontar fanezzesupply.com.br e www para o Cloudflare Pages (corrige erro 1000 no www e tira o site antigo do Lovable do ar)
- [ ] **Asaas**: O dono cria contas sandbox e produção e coloca `ASAAS_API_KEY` e `ASAAS_WEBHOOK_TOKEN` nos secrets do GitHub → integrar Pix, boleto e cartão
- [ ] **Fotos dos outros produtos** (stretch e demais): o dono vai mandar
- [ ] Fase 5: mais testes, refatorar `CheckoutModal`
- [ ] Revogar o token Supabase que foi colado no chat e gerar outro no secret `SUPABASE_ACCESS_TOKEN`
