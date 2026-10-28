// Keeps the Supabase Auth settings in code: site URL and allowed redirects, password
// policy, Portuguese e-mail templates and, when RESEND_API_KEY is set, Resend SMTP so
// auth e-mails come from our domain (Supabase's built-in sender allows ~2 e-mails/hour).
// Usage: SUPABASE_ACCESS_TOKEN=... SUPABASE_PROJECT_REF=... [RESEND_API_KEY=...] node scripts/supabase-auth-config.mjs
const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = process.env.SUPABASE_PROJECT_REF;
const resendKey = process.env.RESEND_API_KEY;

if (!token || !ref) {
  console.error("SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF are required");
  process.exit(1);
}

const SITE_URL = "https://fanezzesupply.com.br";
const REDIRECTS = [
  "https://fanezzesupply.com.br/**",
  "https://www.fanezzesupply.com.br/**",
  "https://fnzsupply.pages.dev/**",
  "https://*.fnzsupply.pages.dev/**",
  "http://localhost:8080/**",
];

const NAVY = "#1B2845";

// Same visual language as supabase/functions/_shared/emails.ts.
function template(title, body, button) {
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;padding:24px 12px;background:#F4F5F8;font-family:Manrope,Segoe UI,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
<tr><td style="padding:0 4px 16px;font-size:18px;font-weight:800;color:${NAVY};">FNZ Supply</td></tr>
<tr><td style="background:#FFFFFF;border-radius:24px;padding:28px;">
<h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:${NAVY};">${title}</h1>
<p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#5B6478;">${body}</p>
<a href="{{ .ConfirmationURL }}" style="display:inline-block;background:${NAVY};color:#FFFFFF;text-decoration:none;font-weight:800;font-size:14px;padding:14px 28px;border-radius:12px;">${button}</a>
<p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#8A91A3;">Se você não fez essa solicitação, ignore este e-mail.</p>
</td></tr>
<tr><td style="padding:20px 8px 0;font-size:12px;color:#8A91A3;text-align:center;">FNZ Supply · Av. Antonio Ramos Alvin, 1084 · Joinville/SC</td></tr>
</table></td></tr></table></body></html>`;
}

const config = {
  site_url: SITE_URL,
  uri_allow_list: REDIRECTS.join(","),
  password_min_length: 8,
};

// Supabase only accepts custom templates on the free plan once custom SMTP is set.
const templates = {
  mailer_subjects_confirmation: "Confirme seu e-mail — FNZ Supply",
  mailer_templates_confirmation_content: template(
    "Confirme seu e-mail",
    "Falta só um passo para ativar sua conta na FNZ Supply. Clique no botão abaixo para confirmar seu e-mail.",
    "Confirmar e-mail"
  ),
  mailer_subjects_email_change: "Confirme seu novo e-mail — FNZ Supply",
  mailer_templates_email_change_content: template(
    "Confirme seu novo e-mail",
    "Recebemos um pedido para trocar o e-mail da sua conta para {{ .NewEmail }}. Clique abaixo para confirmar.",
    "Confirmar novo e-mail"
  ),
  mailer_subjects_magic_link: "Seu link de acesso — FNZ Supply",
  mailer_templates_magic_link_content: template(
    "Seu link de acesso",
    "Use o botão abaixo para entrar na sua conta. O link vale por pouco tempo e só pode ser usado uma vez.",
    "Entrar na conta"
  ),
  mailer_subjects_recovery: "Redefinir senha — FNZ Supply",
  mailer_templates_recovery_content: template(
    "Redefinir senha",
    "Recebemos um pedido para redefinir a senha da sua conta. Clique abaixo para criar uma nova senha.",
    "Criar nova senha"
  ),
  mailer_subjects_invite: "Você foi convidado — FNZ Supply",
  mailer_templates_invite_content: template(
    "Você foi convidado",
    "Você recebeu um convite para acessar a FNZ Supply. Clique abaixo para aceitar e criar sua senha.",
    "Aceitar convite"
  ),
};

if (resendKey) {
  Object.assign(config, templates, {
    smtp_admin_email: "noreply@fanezzesupply.com.br",
    smtp_sender_name: "FNZ Supply",
    smtp_host: "smtp.resend.com",
    smtp_port: "465",
    smtp_user: "resend",
    smtp_pass: resendKey,
    // Custom SMTP lifts the built-in sender's tiny limit.
    rate_limit_email_sent: 60,
  });
}

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
  method: "PATCH",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify(config),
});
const body = await res.text();
if (!res.ok) {
  console.error(`Auth config update failed (${res.status}): ${body}`);
  process.exit(1);
}
const saved = JSON.parse(body);
console.log("Auth config updated:", {
  site_url: saved.site_url,
  uri_allow_list: saved.uri_allow_list,
  password_min_length: saved.password_min_length,
  smtp: saved.smtp_host ? `${saved.smtp_host} (${saved.smtp_admin_email})` : "built-in",
});
