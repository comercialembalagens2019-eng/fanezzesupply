# AGENTS.md

Regras de trabalho para qualquer agente de IA (Claude, GPT, Gemini, Copilot…) e para pessoas neste repositório.

## Idioma e memória
- Fale com o dono **em português**, com explicações claras e sem jargão.
- A memória do projeto fica em `memoria/` (cofre do Obsidian). Antes de começar, leia `memoria/00 Início.md`, `memoria/Status.md` e `memoria/Preferências do dono.md`.
- Ao terminar, atualize `memoria/Status.md`, acrescente uma linha em `memoria/Histórico.md` e registre escolhas novas em `memoria/Decisões.md`.

## Fluxo: Issue → branch → PR → deploy
1. **Toda tarefa começa como Issue no GitHub.** O título leva o tipo:
   - `[Correção] …` (label `bug`): algo quebrado
   - `[Melhoria] …` (label `enhancement`): algo que já existe e fica melhor
   - `[Nova função] …` (label `enhancement`): algo novo
   A Issue descreve o objetivo, quando a tarefa está pronta e o que ficou de fora.
2. **Trabalhe numa branch**, nunca direto na `main`.
3. **Abra um PR que cite a Issue**, com `Closes #N` na descrição, para que o merge feche a Issue. Siga `.github/pull_request_template.md`.
4. **O merge na `main` é o deploy.** `.github/workflows/deploy.yml` aplica migrations, configurações de auth, secrets, edge functions e webhooks, e publica o site no Cloudflare Pages. Não existe deploy manual.
5. **O dono autoriza merges sem perguntar.** Abra o PR e faça o merge quando o CI e as checagens locais passarem.

## Antes de abrir o PR
Rode o mesmo que o CI roda (`.github/workflows/ci.yml`):
```bash
npm run lint && npx tsc --noEmit -p tsconfig.app.json
npm run knip && npm test
npm run build && npm run test:e2e
npx -y deno@2.5.6 test supabase/functions/_shared/
```
O `npm run test:e2e` usa o Playwright no build de produção. Se o Chromium já estiver instalado na máquina, use `PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium`.

## Regras do projeto
- **Preço só no servidor:** `supabase/functions/_shared/catalog.ts` é a única tabela de preços. O navegador nunca envia o valor a cobrar.
- **Segredos só nos secrets do GitHub.** Nunca em código, no chat ou em `memoria/`.
- **Mudança no banco = nova migration** em `supabase/migrations/`. Nunca edite uma migration já aplicada.
- **Não use o Lovable.** Ele regenera `src/integrations/supabase/types.ts` a partir do banco antigo e quebra o build.
- **Pagamentos:** AbacatePay API v2 (Pix, boleto e cartão via abacatepay.js). Os webhooks são cadastrados automaticamente pelo deploy.
