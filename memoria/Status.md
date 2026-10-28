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
- [x] Páginas Termos e Privacidade

## Falta
- [ ] **Virada do domínio**: apontar fanezzesupply.com.br e www para o Cloudflare Pages (corrige erro 1000 no www e tira o site antigo do Lovable do ar)
- [ ] **Migrar dados do Lovable** (clientes/pedidos antigos) — precisa de export do Lovable
- [ ] **Asaas**: O dono cria contas sandbox e produção e coloca `ASAAS_API_KEY` e `ASAAS_WEBHOOK_TOKEN` nos secrets do GitHub → integrar Pix, boleto e cartão
- [ ] **E-mails de pedido**: aguardando aprovação do texto para ligar "pago" (webhooks) e "enviado/entregue" (painel admin)
- [ ] **Fotos dos produtos**: o dono vai mandar
- [ ] **Razão social e CNPJ** para Termos/Privacidade (`COMPANY` em `src/components/legal/LegalPage.tsx`)
- [ ] Fase 5: mais testes, refatorar `CheckoutModal`
- [ ] Revogar o token Supabase que foi colado no chat e gerar outro no secret `SUPABASE_ACCESS_TOKEN`
