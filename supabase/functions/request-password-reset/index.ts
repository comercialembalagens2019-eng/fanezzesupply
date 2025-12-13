import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RATE_LIMIT_MAX_ATTEMPTS = 3;
const RATE_LIMIT_WINDOW_HOURS = 1;

interface RequestBody {
  email: string;
  redirectTo: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
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

    const { email, redirectTo }: RequestBody = await req.json();

    if (!email || !redirectTo) {
      console.log("Missing required fields");
      return new Response(
        JSON.stringify({ error: "Email e redirectTo são obrigatórios" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    console.log(`Password reset request for: ${normalizedEmail.substring(0, 3)}***`);

    // Get client IP (for logging only)
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";

    // Check rate limit - count attempts in the last hour
    const windowStart = new Date();
    windowStart.setHours(windowStart.getHours() - RATE_LIMIT_WINDOW_HOURS);

    const { count, error: countError } = await supabase
      .from("password_reset_attempts")
      .select("*", { count: "exact", head: true })
      .eq("email", normalizedEmail)
      .gte("created_at", windowStart.toISOString());

    if (countError) {
      console.error("Error checking rate limit:", countError);
      return new Response(
        JSON.stringify({ error: "Erro interno do servidor" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Rate limit check: ${count}/${RATE_LIMIT_MAX_ATTEMPTS} attempts in last ${RATE_LIMIT_WINDOW_HOURS}h`);

    if ((count || 0) >= RATE_LIMIT_MAX_ATTEMPTS) {
      console.log(`Rate limit exceeded for ${normalizedEmail.substring(0, 3)}***`);
      return new Response(
        JSON.stringify({ 
          error: "Muitas tentativas. Aguarde 1 hora antes de tentar novamente.",
          rateLimited: true 
        }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Record this attempt
    const { error: insertError } = await supabase
      .from("password_reset_attempts")
      .insert({
        email: normalizedEmail,
        ip_address: clientIp,
      });

    if (insertError) {
      console.error("Error recording attempt:", insertError);
      // Continue anyway - don't block the user
    }

    // Generate password reset link using Supabase Admin API
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: normalizedEmail,
      options: {
        redirectTo: redirectTo,
      },
    });

    if (linkError) {
      console.error("Error generating reset link:", linkError);
      // Don't reveal if email exists or not for security
      return new Response(
        JSON.stringify({ 
          success: true,
          message: "Se o email estiver cadastrado, você receberá um link de recuperação." 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resetLink = linkData.properties.action_link;
    console.log("Reset link generated successfully");

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "Fanezze Supply <noreply@fanezze.com.br>",
      to: [normalizedEmail],
      subject: "Redefinir senha - Fanezze Supply",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F5E6D3;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 40px 0;">
                <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #1B2845; padding: 30px 40px; border-radius: 8px 8px 0 0; text-align: center;">
                      <h1 style="color: #F5E6D3; margin: 0; font-size: 28px; font-weight: 700;">Fanezze Supply</h1>
                      <p style="color: #F5E6D3; margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Distribuição de Embalagens</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="color: #1B2845; margin: 0 0 20px 0; font-size: 24px;">Redefinir Senha</h2>
                      
                      <p style="color: #444; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Olá,
                      </p>
                      
                      <p style="color: #444; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha:
                      </p>
                      
                      <table role="presentation" style="width: 100%; margin: 30px 0;">
                        <tr>
                          <td style="text-align: center;">
                            <a href="${resetLink}" 
                               style="display: inline-block; 
                                      padding: 16px 40px; 
                                      background-color: #1B2845; 
                                      color: #F5E6D3; 
                                      text-decoration: none; 
                                      border-radius: 6px;
                                      font-size: 16px;
                                      font-weight: 600;
                                      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                              Redefinir Minha Senha
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 20px 0;">
                        <strong>⏰ Este link expira em 1 hora.</strong>
                      </p>
                      
                      <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                        Se você não solicitou esta alteração, ignore este e-mail. Sua senha permanecerá a mesma.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f8f8; padding: 25px 40px; border-radius: 0 0 8px 8px; border-top: 1px solid #eee;">
                      <p style="color: #888; font-size: 12px; margin: 0; text-align: center;">
                        Fanezze Supply - Distribuição de Embalagens<br>
                        Avenida Antonio Ramos Alvin, 1084 - Joinville/SC<br><br>
                        Este é um e-mail automático, por favor não responda.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully via Resend:", emailResponse);

    // Clean up old attempts periodically (simple approach)
    if (Math.random() < 0.1) {
      console.log("Running cleanup of old attempts...");
      try {
        await supabase.rpc("cleanup_old_reset_attempts");
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Se o email estiver cadastrado, você receberá um link de recuperação." 
      }),
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
