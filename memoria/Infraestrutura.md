# Infraestrutura

## Supabase (próprio)
- Projeto `krmrnoqkkimhlmbcinmd` (sa-east-1, plano free) — https://krmrnoqkkimhlmbcinmd.supabase.co
- O antigo `stzsmhpaixxjgdrrqvmi` é do Lovable Cloud (sem acesso) e ainda atende fanezzesupply.com.br
- Configuração de Auth em código: `scripts/supabase-auth-config.mjs` (site URL, redirects, SMTP Resend, templates PT-BR)

## Hospedagem
- Cloudflare Pages, projeto `fnzsupply` → https://fnzsupply.pages.dev
- DNS do domínio já está no Cloudflare; registro A ainda aponta para o Lovable (185.158.133.1)

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

## Secrets do GitHub
`SUPABASE_ACCESS_TOKEN`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `RESEND_API_KEY`.
Futuros: `ASAAS_API_KEY`, `ASAAS_WEBHOOK_TOKEN`. O deploy repassa para as edge functions.
