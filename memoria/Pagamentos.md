# Pagamentos

## Decisão: Asaas para tudo (Pix, boleto, cartão)
- Regulado pelo Banco Central
- Cartão: 2,99% + R$ 0,49
- Precisa: contas sandbox e produção criadas pelo dono

## Descartados
- **HeroPay**: documentação contradiz a página de taxas (3,99% + R$ 1 no Pix), sem Pix transparente, domínio beta
- **AbacatePay**: limite inicial de R$ 5.000 diurno, não regulado (integração atual de Pix ainda usa ele)

## Hoje no código
Pix via AbacatePay, boleto e cartão via Stripe. Todos criam o pedido no servidor e validam valor no webhook.
