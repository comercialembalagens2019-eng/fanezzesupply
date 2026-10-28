// Called by the admin panel right after it moves an order to "enviado" or "entregue";
// e-mails the customer about the order's current step.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { isValidUUID } from "../_shared/orders.ts";
import { sendOrderEmail } from "../_shared/notify.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return jsonResponse({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const authClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: userData, error: userErr } = await authClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userErr || !userData?.user) return jsonResponse({ error: "Unauthorized" }, 401);

    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) return jsonResponse({ error: "Forbidden" }, 403);

    const { orderId } = await req.json().catch(() => ({}));
    if (!isValidUUID(orderId)) return jsonResponse({ error: "Invalid order id" }, 400);

    const { data: order } = await supabase.from("orders").select("status").eq("id", orderId).maybeSingle();
    if (!order) return jsonResponse({ error: "Order not found" }, 404);

    if (order.status === "shipped" || order.status === "delivered") {
      await sendOrderEmail(supabase, orderId, order.status);
    }
    return jsonResponse({ ok: true }, 200);
  } catch (error) {
    console.error("[NOTIFY-ORDER] Error:", error instanceof Error ? error.message : error);
    return jsonResponse({ error: "Failed to notify" }, 500);
  }
});
