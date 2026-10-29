# Índices e RLS do banco — plano

**Objetivo:** índices que cobrem as consultas reais do app, sem índices inúteis, e políticas RLS que não reavaliam `auth.uid()` por linha.

**Base:** `pg_stat_user_indexes`, advisors de performance do Supabase e as consultas do código (`src/`, `supabase/functions/`).

## Consultas mais frequentes/críticas

| Onde | Consulta | Índice hoje |
|---|---|---|
| Checkout, Pedidos, pedido de teste | `companies where user_id = ? order by updated_at desc` | nenhum (FK sem índice) |
| Pedidos (cliente) + RLS de `orders` | `orders where company_id in (...) order by created_at desc` | nenhum (FK sem índice) |
| Painel admin | `orders order by created_at desc limit 2000` | nenhum |
| Webhooks, status, e-mails | `orders where id = ?` | `orders_pkey` ✔ |
| AuthContext, has_role | `user_roles where user_id = ? and role = ?` | `user_roles_user_id_role_key` ✔ |
| Carrinho | `carts where user_id = ?` | `carts_pkey` ✔ |
| Reset de senha | `password_reset_codes where email = ? [and created_at >= ?] order by created_at desc` | só `email` |

## Tarefas

1. **Migration `20261029180000_query_indexes.sql`**
   - criar `companies (user_id, updated_at desc)`
   - criar `orders (company_id, created_at desc)`
   - criar `orders (created_at desc)`
   - criar `password_reset_codes (email, created_at desc)`
   - remover `idx_password_reset_codes_email` (prefixo do novo) e `idx_password_reset_codes_expires_at` (nunca usado; a limpeza usa `OR used`, que não usa o índice)
   - manter: PKs, `companies_cnpj_key` e `orders_payment_ref_key` (garantem unicidade), `user_roles_user_id_role_key`
2. **Mesma migration — RLS**
   - trocar `auth.uid()` por `(select auth.uid())` e `has_role(...)` por `(select has_role(...))`
   - juntar políticas SELECT duplicadas (dono OU admin) em uma por tabela
   - remover `"Admins can manage roles"` (duplica as políticas por comando)
   - **Mesmas permissões de antes**
3. **Verificar:** deploy aplica a migration → listar índices e políticas → advisors de performance sem `unindexed_foreign_keys`, `auth_rls_initplan` e `multiple_permissive_policies`.
