# Infraestrutura

## Supabase (próprio)
- Projeto `krmrnoqkkimhlmbcinmd` (sa-east-1, plano free) — https://krmrnoqkkimhlmbcinmd.supabase.co
- O antigo `stzsmhpaixxjgdrrqvmi` é do Lovable Cloud (sem acesso) e ainda atende fanezzesupply.com.br
- Configuração de Auth em código: `scripts/supabase-auth-config.mjs` (site URL, redirects, SMTP Resend, templates PT-BR)

## Hospedagem
- Cloudflare Pages, projeto `fnzsupply` → https://fnzsupply.pages.dev
- fanezzesupply.com.br e www: CNAME com proxy para fnzsupply.pages.dev (o Lovable saiu do ar). Script: `scripts/cloudflare-domain.mjs`

## E-mail
- Resend, domínio fanezzesupply.com.br verificado (sa-east-1)
- Remetente `noreply@fanezzesupply.com.br`, resposta para `vendas@fnzsupply.com.br`

## GitHub Actions (`.github/workflows/`)
| Workflow | Quando | O que faz |
|---|---|---|
| `ci.yml` | todo PR/push | lint, typecheck, build, testes Deno |
| `deploy.yml` | push na main | secrets → migrations → auth config → functions → site no Pages |
| `keepalive.yml` | a cada 3 dias | evita pausa do Supabase free |
| `backup.yml` | semanal | exporta tabelas e usuários (artefato 90 dias) |
| `test-email.yml` | manual | envia e-mails de exemplo |
| `domain.yml` | manual | aponta o domínio para o Pages |
| `resend-dns.yml` | manual | limpa registros antigos do SES no `send.` |

## Secrets do GitHub
`SUPABASE_ACCESS_TOKEN`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `RESEND_API_KEY`.
Futuros: `ASAAS_API_KEY`, `ASAAS_WEBHOOK_TOKEN`. O deploy repassa para as edge functions.
