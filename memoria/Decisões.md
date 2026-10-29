# Decisões

- **Ficar no Supabase** (em vez de Appwrite/Neon/PocketBase): Auth + banco + functions + realtime juntos, já integrado
- **Sair do Lovable**: projeto Supabase próprio, deploy pelo GitHub Actions, site no Cloudflare Pages
- **Preço só no servidor**: o cliente nunca manda valor; `catalog.ts` é a única tabela
- **Asaas** como provedor de pagamento — ver [[Pagamentos]]
- **Resend** para todos os e-mails (pedido e conta)
- **Front Bento / Pedido Rápido** — proposta 4 de 5
- **Sem migração do Lovable**: nunca houve clientes ou pedidos lá
- **E-mail de pedido uma vez só**: tabela `order_emails` (chave pedido + tipo) evita duplicar quando webhook e checagem do Pix confirmam juntos
- **Editar pelo Lovable quebra o projeto**: ele regenera `src/integrations/supabase/types.ts` a partir do banco antigo. Pedir mudanças ao Claude; se usar o Lovable, o Claude restaura os tipos
- **Não instalar caveman nem rtk**: caveman deixa as respostas telegráficas (o dono precisa de explicações claras em PT); rtk é um binário que intercepta o shell e precisaria ser reinstalado a cada sessão na nuvem, com ganho pequeno aqui
