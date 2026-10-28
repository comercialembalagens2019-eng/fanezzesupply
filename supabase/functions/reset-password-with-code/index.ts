import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// SHA-256 hex, matching validate-reset-code
async function hashToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email, resetToken, newPassword } = await req.json();

    if (typeof email !== "string" || typeof resetToken !== "string" || typeof newPassword !== "string") {
      return new Response(
        JSON.stringify({ error: "Email, token e nova senha são obrigatórios" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Validate password strength
    if (newPassword.length < 8) {
      return new Response(
        JSON.stringify({ error: "A senha deve ter pelo menos 8 caracteres" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!/[A-Z]/.test(newPassword)) {
      return new Response(
        JSON.stringify({ error: "A senha deve conter pelo menos uma letra maiúscula" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!/[0-9]/.test(newPassword)) {
      return new Response(
        JSON.stringify({ error: "A senha deve conter pelo menos um número" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Password reset attempt for: ${normalizedEmail.substring(0, 3)}***`);

    // Verify the reset token
    const { data: codeData, error: fetchError } = await supabase
      .from('password_reset_codes')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('code_hash', await hashToken(resetToken)) // Token hash stored in code_hash after validation
      .eq('attempts', -1) // -1 means code was validated
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !codeData) {
      console.log("Invalid or expired reset token");
      return new Response(
        JSON.stringify({ error: "Token inválido ou expirado. Por favor, solicite um novo código." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if token is expired (using the original expiration + 5 min grace period)
    const expirationWithGrace = new Date(codeData.expires_at);
    expirationWithGrace.setMinutes(expirationWithGrace.getMinutes() + 5);
    
    if (expirationWithGrace < new Date()) {
      console.log("Reset token expired");
      await supabase
        .from('password_reset_codes')
        .update({ used: true })
        .eq('id', codeData.id);

      return new Response(
        JSON.stringify({ error: "Sessão expirada. Por favor, solicite um novo código." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Look up the user directly (listUsers only returns the first page of users).
    const { data: userId, error: userError } = await supabase.rpc('get_user_id_by_email', {
      p_email: normalizedEmail,
    });

    if (userError) {
      console.error("Error finding user:", userError.message);
      return new Response(
        JSON.stringify({ error: "Erro ao buscar usuário" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!userId) {
      console.log("User not found");
      return new Response(
        JSON.stringify({ error: "Token inválido ou expirado. Por favor, solicite um novo código." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Update the user's password
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (updateError) {
      console.error("Error updating password:", updateError);
      return new Response(
        JSON.stringify({ error: "Erro ao atualizar senha" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Mark the code as used
    await supabase
      .from('password_reset_codes')
      .update({ used: true })
      .eq('id', codeData.id);

    console.log("Password updated successfully");

    return new Response(
      JSON.stringify({ success: true, message: "Senha atualizada com sucesso!" }),
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
