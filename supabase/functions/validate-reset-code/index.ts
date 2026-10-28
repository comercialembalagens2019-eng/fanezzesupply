import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_ATTEMPTS = 5;

// SHA-256 hex, matching request-password-reset and reset-password-with-code
async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email, code } = await req.json();

    if (typeof email !== "string" || typeof code !== "string") {
      return new Response(
        JSON.stringify({ error: "Email e código são obrigatórios" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedCode = code.trim();

    if (!/^\d{6}$/.test(normalizedCode)) {
      return new Response(
        JSON.stringify({ error: "Código deve ter 6 dígitos" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Validating code for: ${normalizedEmail.substring(0, 3)}***`);

    // Get the latest unused code for this email
    const { data: codeData, error: fetchError } = await supabase
      .from('password_reset_codes')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('used', false)
      .gte('attempts', 0) // skip codes that were already validated
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !codeData) {
      console.log("No valid code found for email");
      return new Response(
        JSON.stringify({ error: "Nenhum código válido encontrado. Solicite um novo." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if code is expired
    if (new Date(codeData.expires_at) < new Date()) {
      console.log("Code expired");
      await supabase
        .from('password_reset_codes')
        .update({ used: true })
        .eq('id', codeData.id);

      return new Response(
        JSON.stringify({ error: "Código expirado. Solicite um novo." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check attempts
    if (codeData.attempts >= MAX_ATTEMPTS) {
      console.log("Max attempts exceeded");
      await supabase
        .from('password_reset_codes')
        .update({ used: true })
        .eq('id', codeData.id);

      return new Response(
        JSON.stringify({ error: "Muitas tentativas incorretas. Solicite um novo código." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify the code
    const inputHash = await hashCode(normalizedCode);
    
    if (!constantTimeEqual(inputHash, codeData.code_hash)) {
      console.log("Invalid code");
      const newAttempts = codeData.attempts + 1;
      await supabase
        .from('password_reset_codes')
        .update({ attempts: newAttempts })
        .eq('id', codeData.id);

      const remaining = MAX_ATTEMPTS - newAttempts;
      return new Response(
        JSON.stringify({ 
          error: `Código incorreto. ${remaining} tentativa(s) restante(s).`,
          attemptsRemaining: remaining
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Code is valid - generate a temporary token for password reset
    const resetToken = crypto.randomUUID();
    
    // Store only a hash of the token, reusing the code_hash field
    const { error: tokenError } = await supabase
      .from('password_reset_codes')
      .update({
        code_hash: await hashCode(resetToken),
        attempts: -1 // Mark as validated
      })
      .eq('id', codeData.id);

    if (tokenError) {
      console.error("Error storing reset token:", tokenError.message);
      return new Response(
        JSON.stringify({ error: "Erro interno do servidor" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Code validated successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        resetToken,
        message: "Código validado com sucesso!" 
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
