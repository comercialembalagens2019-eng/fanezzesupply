import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RATE_LIMIT_MAX_ATTEMPTS = 3;
const RATE_LIMIT_WINDOW_HOURS = 1;
const CODE_EXPIRY_MINUTES = 15;

// Generate 6-digit code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Simple hash function for code storage
async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Serviço de email não configurado" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: "Email é obrigatório" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log(`Password reset request for: ${normalizedEmail.substring(0, 3)}***`);

    // Check if user exists
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error("Error checking user:", userError);
      return new Response(
        JSON.stringify({ success: true, message: "Se o email estiver cadastrado, você receberá um código." }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userExists = userData.users.some(u => u.email?.toLowerCase() === normalizedEmail);
    
    if (!userExists) {
      console.log("User with this email not found");
      return new Response(
        JSON.stringify({ success: true, message: "Se o email estiver cadastrado, você receberá um código." }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Rate limiting - check recent attempts
    const rateLimitTime = new Date();
    rateLimitTime.setHours(rateLimitTime.getHours() - RATE_LIMIT_WINDOW_HOURS);

    const { data: recentAttempts, error: rateError } = await supabase
      .from('password_reset_codes')
      .select('id')
      .eq('email', normalizedEmail)
      .gte('created_at', rateLimitTime.toISOString());

    if (rateError) {
      console.error("Error checking rate limit:", rateError);
    }

    const attemptCount = recentAttempts?.length || 0;
    console.log(`Rate limit check: ${attemptCount}/${RATE_LIMIT_MAX_ATTEMPTS} attempts in last ${RATE_LIMIT_WINDOW_HOURS}h`);

    if (attemptCount >= RATE_LIMIT_MAX_ATTEMPTS) {
      console.log("Rate limit exceeded");
      return new Response(
        JSON.stringify({ 
          error: "Muitas tentativas. Aguarde 1 hora antes de solicitar novamente.",
          rateLimited: true 
        }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate 6-digit code
    const code = generateCode();
    const codeHash = await hashCode(code);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + CODE_EXPIRY_MINUTES);

    // Invalidate any existing codes for this email
    await supabase
      .from('password_reset_codes')
      .update({ used: true })
      .eq('email', normalizedEmail)
      .eq('used', false);

    // Store the new code
    const { error: insertError } = await supabase
      .from('password_reset_codes')
      .insert({
        email: normalizedEmail,
        code_hash: codeHash,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Error storing code:", insertError);
      return new Response(
        JSON.stringify({ error: "Erro ao gerar código" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Code generated successfully, sending email...");

    // Send email with code
    const emailResult = await resend.emails.send({
      from: "Fanezze Supply <noreply@fanezze.com.br>",
      to: [normalizedEmail],
      subject: "Código de Recuperação - Fanezze Supply",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background-color: #1B2845; color: white; padding: 40px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { padding: 40px 30px; }
            .code-box { background: linear-gradient(135deg, #1B2845 0%, #2a3d5f 100%); color: white; padding: 30px; text-align: center; border-radius: 10px; margin: 30px 0; }
            .code { font-size: 48px; font-weight: bold; letter-spacing: 10px; font-family: 'Courier New', monospace; margin: 10px 0; }
            .warning-box { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .info-box { background-color: #F5E6D3; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { background-color: #f8f9fa; padding: 30px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Fanezze Supply</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Distribuição de Embalagens</p>
            </div>
            
            <div class="content">
              <h2 style="color: #1B2845; margin-top: 0;">Código de Recuperação de Senha</h2>
              
              <p>Olá,</p>
              
              <p>Você solicitou a recuperação da senha da sua conta na <strong>Fanezze Supply</strong>.</p>
              
              <p>Use o código abaixo para redefinir sua senha:</p>
              
              <div class="code-box">
                <p style="margin: 0; font-size: 14px; opacity: 0.9;">Seu código de verificação:</p>
                <div class="code">${code}</div>
                <p style="margin: 0; font-size: 12px; opacity: 0.8;">Digite este código no site</p>
              </div>
              
              <div class="info-box">
                <p style="margin: 0 0 10px 0; font-weight: bold; color: #1B2845;">📋 Como usar:</p>
                <ol style="margin: 0; padding-left: 20px;">
                  <li>Volte à página de recuperação de senha</li>
                  <li>Digite este código de 6 dígitos</li>
                  <li>Crie sua nova senha</li>
                </ol>
              </div>
              
              <div class="warning-box">
                <p style="margin: 0 0 10px 0; font-weight: bold;">⚠️ Importante:</p>
                <ul style="margin: 0; padding-left: 20px;">
                  <li><strong>Este código expira em ${CODE_EXPIRY_MINUTES} minutos</strong></li>
                  <li>Use apenas uma vez</li>
                  <li>Se não solicitou, ignore este email</li>
                  <li>Nunca compartilhe este código</li>
                </ul>
              </div>
              
              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                Se você não solicitou a recuperação de senha, pode ignorar este email com segurança.
              </p>
            </div>
            
            <div class="footer">
              <p style="margin: 0 0 10px 0;"><strong>Fanezze Supply</strong></p>
              <p style="margin: 0 0 5px 0;">Distribuição de Embalagens</p>
              <p style="margin: 0; color: #999;">Este é um email automático, não responda.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email result:", emailResult);

    if (emailResult.error) {
      console.error("Error sending email:", emailResult.error);
      return new Response(
        JSON.stringify({ error: "Erro ao enviar email. Verifique se o domínio está verificado no Resend." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Cleanup old codes (probabilistic, 10% chance)
    if (Math.random() < 0.1) {
      console.log("Running cleanup of expired codes...");
      await supabase.rpc('cleanup_expired_reset_codes');
    }

    return new Response(
      JSON.stringify({ success: true, message: "Código enviado com sucesso!" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
