# Pagamentos

## Decisão: Asaas para tudo (Pix, boleto, cartão)
- Regulado pelo Banco Central
- Cartão: 2,99% + R$ 0,49
- Precisa: contas sandbox e produção criadas pelo dono

## Descartados
- **HeroPay**: documentação contradiz a página de taxas (3,99% + R$ 1 no Pix), sem Pix transparente, domínio beta
- **AbacatePay**: limite inicial de R$ 5.000 diurno, não regulado (integração atual de Pix ainda usa ele)

## Hoje no código (Asaas)
- `create-asaas-payment`: cria o pedido no servidor e a cobrança (PIX / BOLETO / CREDIT_CARD). Cliente Asaas buscado pelo CNPJ a cada cobrança.
- Pix: QR Code + copia e cola; boleto: PDF + linha digitável (vence em 3 dias); cartão: redireciona para a página do Asaas (dados do cartão nunca passam pelo site)
- `asaas-webhook`: eventos PAYMENT_RECEIVED / PAYMENT_CONFIRMED, valida header `asaas-access-token`, confere id da cobrança e valor
- `check-asaas-payment`: checkout consulta o status a cada 5 s enquanto o cliente paga
- Só o secret `ASAAS_API_KEY` é manual. O token do webhook é derivado da chave no deploy e o webhook é cadastrado por `scripts/asaas-webhook.mjs`
- Chave `$aact_hmlg_` = sandbox, outras = produção (detectado automaticamente)
- Funções antigas de AbacatePay/Stripe continuam no projeto, mas o site não usa mais
