# Histórico

- **2026-10-30**: PR #61 aprovado pelo Claude, mergeado e publicado. Layout #62 implementado separadamente, com capturas antes/protótipo/depois de 320 a 1.920 px, calculadora única e foco/estado nos dois sentidos, 3 materiais e personalizado próprio. Guia e Pedido rápido preservados. 65 unitários, 58 E2E e 5 Deno passaram; revisão específica do layout ainda pendente.

- **2026-10-30**: PR #59 aprovado pelo Claude e mergeado com CI/deploy aprovados. #60 implementada no PR #61: retorno restrito entre cadastro/login/carrinho e confirmação por e-mail, com 65 unitários, 44 E2E e 5 Deno aprovados. Conclusão registrada no canal para nova revisão do Claude; layout aguarda esse parecer.

- **2026-10-30**: PR #57 aprovado pelo Claude e mergeado. Correção adicional #58 implementa sugestões exatas no cabeçalho, com testes por clique, teclado e tamanho; Enter sem seleção preserva busca livre. Mantida espera pelo parecer do Claude antes do cadastro.

- **2026-10-30**: etapa 1 da #51 / #56 implementada: catálogo filtra pelo id exato do material e combina com busca livre, mantém histórico e permite limpar só o material; links de materiais e Guia corrigidos, mantendo Guia/Pedido rápido. Verificações locais passaram; próxima etapa depende da revisão do Claude.

- **2026-10-30**: Claude aprovou a revisão 2 no canal compartilhado durante a correção documental. Incorporadas cinco condições: PRs separados com revisão entre etapas, foco nos dois sentidos para campos e links, captura do desalinhamento a 1.920 px, preservação de Guia/Pedido rápido e validação dos limites de largura. Sem implementação nesta entrega.

- **2026-10-30**: parecer do Claude lido em `COMMUNICATION.md`; plano da #51 corrigido na #54 nos seis itens (filtro exato, calculadora única, largura isolada, Knip, cadastro e fotos). Canal atualizado para `AGUARDANDO_APROVACAO_DO_CLAUDE`; retiradas de Guia e Pedido rápido pendentes do dono. Nenhuma implementação nesta revisão.

- **2026-10-30**: estratégia de design da home registrada na #52, vinculada à implementação #51: área útil mais larga, fotos maiores, calculadora lateral no desktop e redução de seções redundantes; plano em `docs/plans/2026-10-30-estrategia-design-home.md`. Sem alteração visual publicada nesta entrega.

- **2026-10-28**
  - Fases 1–4 entregues (segurança, bugs, infra, front novo)
  - Painel admin, produto de R$ 0,01, usuário admin
  - Projeto Supabase próprio + Cloudflare Pages + Resend
  - PR #6: login/cadastro com um só olho, erros em PT, link de verificação para o site, e-mails de conta via Resend
  - Criado este cofre de memória
- **2026-10-28 (tarde)**
  - Foto nova dos envelopes, razão social e CNPJ no site, endereço corrigido para "Alvim"
  - E-mails de pedido (pago/enviado/entregue) aprovados e ligados ao fluxo real
  - Não há dados antigos no Lovable para migrar
- **2026-10-28 (noite)**: foto dos envelopes refeita em 4:3 com margem, centralizada e sem corte; cards usam `imageFit: "cover"`
- **2026-10-29**: logo nova (FNZ Supply, azul e amarelo) no topo, rodapé e páginas de login/cadastro (`src/components/Logo.tsx`)
- **2026-10-29**: removida a seção "Tabelas de preço" da home (imagens ficavam no Lovable); favicon novo veio de uma edição no Lovable, que também apagou tipos do Supabase (restaurados)
- **2026-10-29**: domínio virado para o site novo (o dono escolheu virar antes do Asaas, sabendo que o pagamento fica indisponível até lá)
- **2026-10-29**: Resend Forge — removidos MX/TXT antigos (Amazon SES) em send.fanezzesupply.com.br que conflitavam com o CNAME (workflow `resend-dns.yml`)
- **2026-10-29**: integração Asaas (Pix, boleto, cartão) no checkout; produto teste passa a ter mínimo de 500 un (R$ 5,00)
- **2026-10-29**: stretch removido do site e do catálogo; pedido de teste do admin (só produto teste) pula o cadastro e vai direto ao pagamento, faturado no CNPJ da FNZ
- **2026-10-29**: índices revisados (4 novos, 2 removidos) e RLS reescrito para avaliar auth.uid() uma vez por consulta; plano em `docs/plans/2026-10-29-db-indexes.md`. Skills superpowers brainstorming/executing-plans/subagent-driven-development instaladas
- **2026-10-29**: checkout passa a cobrar Pix e boleto pelo AbacatePay (conta da FNZ); cartão escondido; produto teste volta a 100 un (R$ 1,00)
- **2026-10-29**: corrigido erro do Pix no AbacatePay (travessão na descrição é recusado); cartão via abacatepay.js pronto, aguardando a chave pública
- **2026-10-29**: adotado fluxo Issue → PR → deploy (`AGENTS.md`, template de PR); Issues #25–#32 abertas para as tarefas pendentes
- **2026-10-29**: CI com Knip, Vitest (36 testes, inclui conferência de todos os preços site × servidor) e Playwright (12 testes E2E, desktop e celular); removido código morto (drizzle, componentes sem uso); botão de senha do login ganhou aria-label
- **2026-10-29**: skeletons no lugar de spinners (pedidos, admin, carregamento de página), entrada curta de páginas e cards, imagens lazy, `prefers-reduced-motion` respeitado; skill design-motion-principles instalada
- **2026-10-29**: Pix testado em produção (pedido #DB18520E, R$ 1,00, e-mail chegou). E-mail pós-compra redesenhado (logo, selo de sucesso, próximo passo, WhatsApp, endereço sem link do Gmail) e etapa de pagamento com Pix recomendado, valor no botão e sinais de confiança
- **2026-10-30**: aplicados os mockups do dono (#39): modal de pagamento com faixa azul, etapas com check, banner de frete, cartões Pix/Boleto/Cartão com selos; e-mail do pedido com foto, linha do tempo, frete grátis e rodapé azul (imagens em `public/email/`, geradas por `scripts/build-email-assets.mjs`)
- **2026-10-30**: modal de pagamento e e-mail refeitos para ficar fiéis ao mockup (#41): fundo branco, etapas com check ao lado, cartões de pagamento em 3 colunas, cena do envelope + caixa FNZ no e-mail, linha do tempo em 3 etapas
- **2026-10-30**: Meus pedidos refeito (indicadores reais, filtros, busca, status de pagamento separado do de entrega, linha do tempo, detalhes, "Comprar novamente"); Sobre só com "40+ anos" (demais números não confirmados saíram); Contato e rodapé sem o telefone fixo, atendimento 24h, link do mapa e orçamento pelo WhatsApp (#43)
- **2026-10-30**: foto própria do Envelope Cinza; banner mostra o produto real; busca do cabeçalho com sugestões e que acha tamanhos (ex.: 32x40) (#45)
- **2026-10-30**: home ampliada: banner 8/4 com calculadora, faixa de diferenciais, "Escolha o material", guia de tamanhos com filtro, "Como funciona" e FAQ; tamanho 40x00 do Envelope Cinza corrigido para 40x60 (#47)
- **2026-10-30**: CLAUDE.md reescrito com o contexto completo do projeto para o Claude Code no terminal (#49)
