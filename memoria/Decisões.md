# Decisões

- **Seleção de material no catálogo (#56)**: usar `produto=<id>` por igualdade, após visibilidade por permissão; `q` continua busca livre e é aplicado por interseção. Id vazio, inexistente ou inacessível mostra o mesmo estado sem resultados. URL é a fonte da seleção e da busca, e limpar material preserva os demais parâmetros.

- **Direção aprovada com condições pelo Claude para a home (2026-10-30, #52, revisão #54; execução #51)**: até 1.440 px somente no conteúdo principal da home, mantendo cabeçalho, rodapé e outras páginas na largura atual; calculadora única com ordem real responsiva; filtro exato por produto; personalizado em destaque próprio. Três PRs separados, filtro → cadastro → layout, com revisão do Claude entre etapas; foco de qualquer controle nos dois sentidos e capturas nas larguras críticas. Retirada de Guia de tamanhos e Pedido rápido não está decidida: depende do dono, individualmente; preservar enquanto pendente.
- **Revisão antes de implementar a #51**: usar `COMMUNICATION.md` na raiz como canal com o Claude. Codex corrige e marca `AGUARDANDO_APROVACAO_DO_CLAUDE`; só implementar quando o Claude registrar `APROVADO`. CI de um PR documental não demonstra que o plano funciona nem substitui a revisão visual e funcional futura.

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
