import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    // Send password reset email
    const { error: resetError } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: normalizedEmail,
      options: {
        redirectTo: redirectTo,
      },
    });

    if (resetError) {
      console.error("Error sending reset email:", resetError);
      // Don't reveal if email exists or not for security
      return new Response(
        JSON.stringify({ 
          success: true,
          message: "Se o email estiver cadastrado, você receberá um link de recuperação." 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Password reset email sent successfully");

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
