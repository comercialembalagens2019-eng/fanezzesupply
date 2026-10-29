# Pagamentos

## Decisão: Asaas para tudo (Pix, boleto, cartão)
- Regulado pelo Banco Central
- Cartão: 2,99% + R$ 0,49
- Precisa: contas sandbox e produção criadas pelo dono

## Descartados
- **HeroPay**: documentação contradiz a página de taxas (3,99% + R$ 1 no Pix), sem Pix transparente, domínio beta
- **AbacatePay**: limite inicial de R$ 5.000 diurno, não regulado (integração atual de Pix ainda usa ele)

## Hoje no código: AbacatePay (Pix e boleto), desde 2026-10-29
- `create-abacate-payment` (API v2, checkout transparente): Pix com QR Code (vale 1 dia); boleto com linha digitável e Pix alternativo (vence em 3 dias)
- `abacate-webhook`: evento `transparent.completed`; segredo em `?webhookSecret=` + assinatura `X-Webhook-Signature` (HMAC); pedido achado pelo `payment_ref`
- `check-abacate-payment`: checkout consulta o Pix a cada 5 s
- Só o secret `ABACATEPAY_API_KEY` é manual: o segredo do webhook é derivado da chave e o webhook é cadastrado por `scripts/abacatepay-webhook.mjs` no deploy
- Limite inicial da conta: R$ 5.000 de dia / R$ 1.000 à noite (pedir aumento)

## Asaas (integrado, mas fora de uso)
A chave atual é de conta pessoa física (CPF); o CNPJ da FNZ está preso em outra conta Asaas
- `create-asaas-payment`: cria o pedido no servidor e a cobrança (PIX / BOLETO / CREDIT_CARD). Cliente Asaas buscado pelo CNPJ a cada cobrança.
- Pix: QR Code + copia e cola; boleto: PDF + linha digitável (vence em 3 dias); cartão: redireciona para a página do Asaas (dados do cartão nunca passam pelo site)
- `asaas-webhook`: eventos PAYMENT_RECEIVED / PAYMENT_CONFIRMED, valida header `asaas-access-token`, confere id da cobrança e valor
- `check-asaas-payment`: checkout consulta o status a cada 5 s enquanto o cliente paga
- Só o secret `ASAAS_API_KEY` é manual. O token do webhook é derivado da chave no deploy e o webhook é cadastrado por `scripts/asaas-webhook.mjs`
- Chave `$aact_hmlg_` = sandbox, outras = produção (detectado automaticamente)
- Funções antigas de AbacatePay/Stripe continuam no projeto, mas o site não usa mais
