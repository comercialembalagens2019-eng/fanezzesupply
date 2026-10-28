# Decisões

- **Ficar no Supabase** (em vez de Appwrite/Neon/PocketBase): Auth + banco + functions + realtime juntos, já integrado
- **Sair do Lovable**: projeto Supabase próprio, deploy pelo GitHub Actions, site no Cloudflare Pages
- **Preço só no servidor**: o cliente nunca manda valor; `catalog.ts` é a única tabela
- **Asaas** como provedor de pagamento — ver [[Pagamentos]]
- **Resend** para todos os e-mails (pedido e conta)
- **Front Bento / Pedido Rápido** — proposta 4 de 5
