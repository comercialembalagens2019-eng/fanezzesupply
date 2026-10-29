# Status

Atualizado em: 2026-10-28

## Pronto
- [x] Fase 1 — Segurança: pedidos e preços calculados no servidor, webhooks validam id/valor/método, reset de senha com código forte e token guardado como hash, RLS revisado
- [x] Fase 2 — Bugs: frete (R$ 19,90, grátis só em Joinville/SC), e-mail duplicado do Stripe, carrinho limpo no logout
- [x] Token Supabase antigo revogado (o secret do GitHub tem um novo)
- [x] Domínio fanezzesupply.com.br e www apontando para o site novo (workflow `domain.yml`, 2026-10-29)
- [x] Asaas integrado (Pix com QR Code, boleto com linha digitável, cartão na página segura do Asaas); webhook cadastrado automaticamente no deploy
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
- [ ] **Testar pagamento real no Asaas**: comprar o produto teste (500 un = R$ 5,00) com Pix e conferir e-mails e status no painel
- [ ] **Fotos dos outros produtos** (stretch e demais): o dono vai mandar
- [ ] Fase 5: mais testes, refatorar `CheckoutModal`
