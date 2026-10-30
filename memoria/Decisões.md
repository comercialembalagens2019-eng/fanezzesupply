# Decisões

- **Direção proposta para o redesenho da home (2026-10-30, #52; execução #51)**: aproveitar as laterais com área útil de até 1.440 px e calculadora à direita em telas grandes; reduzir duplicações entre materiais, tamanhos e pedido rápido; personalizado em destaque único e detalhes sob demanda. Preservar identidade e dados reais. Validar a composição em protótipo e capturas antes de considerar o desenho definitivo.

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
- **AbacatePay no lugar do Asaas**: a conta Asaas disponível é no CPF do dono e o CNPJ ficou preso; AbacatePay tem Pix mais barato (R$ 0,80)
- **Toda tarefa vira Issue e todo deploy passa por PR** citando a Issue (`Closes #N`); regras em `AGENTS.md`, válidas para qualquer agente
- **Movimento com contenção**: entradas de 220 ms com ease-out forte e nada em interações frequentes (skill design-motion-principles, lente e-commerce). Não animar "todos os elementos"

- **2026-10-30**: dados públicos da empresa ficam em `src/lib/company.ts`. Só o WhatsApp (47) 99149-0027 é canal de telefone (o fixo não atende). Horário: atendimento 24h. Na página Sobre só entra número confirmado pelo dono (hoje: 40+ anos). Sem formulário de contato: orçamento vai pelo WhatsApp com mensagem pronta.
- **2026-10-30**: o site não informa prazo de entrega da pronta-entrega (combinado pelo WhatsApp); só o personalizado tem prazo publicado (30 dias).
