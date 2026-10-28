# Arquitetura

## Front-end
React 18 + Vite + Tailwind + shadcn/ui, rotas com `react-router` (lazy). Fonte Manrope.
Cores do tema bento: navy `#1B2845`, areia `#F5E6D3`, fundo `#F4F5F8`; classe `.tile` para os cartões.

- Páginas: `src/pages/` (Produtos, Carrinho, Pedidos, Admin, Login, Cadastro, RecuperarSenha, Termos, Privacidade…)
- Preços no front: `src/lib/pricing.ts` (importa o catálogo compartilhado)
- Erros de login em PT: `src/lib/authErrors.ts`
- Carrinho: `src/contexts/CartContext.tsx` (sincroniza com a tabela `carts` quando logado)
- Auth/admin: `src/contexts/AuthContext.tsx`
- Produtos: `src/data/products.ts`

## Back-end (Supabase)
- Banco com RLS; esquema em `supabase/migrations/`
- Edge functions em `supabase/functions/`:
  - Pagamento: `create-pix-payment`, `check-pix-status`, `payment-webhook` (AbacatePay), `create-boleto-payment`, `create-stripe-checkout`, `stripe-webhook`
  - Senha: `request-password-reset`, `validate-reset-code`, `reset-password-with-code`
- Código compartilhado `supabase/functions/_shared/`:
  - `catalog.ts` — **fonte única de preços** e frete (usada pelo servidor e pelo site)
  - `orders.ts` — cria pedido pendente no servidor, confere dono da empresa e produtos só-admin
  - `emails.ts` — templates de e-mail de pedido (pago/enviado/entregue)

## Fluxo de compra
1. Cliente monta carrinho → checkout chama a edge function de pagamento
2. A function calcula o preço no servidor e cria o pedido `pending`
3. Webhook do provedor confirma → pedido vira `paid`
4. Admin muda para enviado/entregue no painel (`admin_set_fulfillment_status`)

Ver também [[Pagamentos]] e [[Infraestrutura]].
