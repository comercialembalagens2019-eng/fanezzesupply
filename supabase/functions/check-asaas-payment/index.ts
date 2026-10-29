// Polled by the checkout while the customer pays: asks Asaas for the charge status, in
// case the webhook is slow, and confirms the order the same way the webhook does.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { isValidUUID, PAID_STATUSES } from "../_shared/orders.ts";
import { asaas, ASAAS_PAID_STATUSES } from "../_shared/asaas.ts";
import { confirmOrderPayment } from "../_shared/confirm.ts";

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
    const { data: userData, error: authErr } = await authClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authErr || !userData?.user) return jsonResponse({ error: "Unauthorized" }, 401);

    const { orderId } = await req.json().catch(() => ({}));
    if (!isValidUUID(orderId)) return jsonResponse({ error: "Pedido inválido" }, 400);

    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: order } = await supabase
      .from("orders")
      .select("status, payment_ref, companies(user_id)")
      .eq("id", orderId)
      .maybeSingle();
    if (!order) return jsonResponse({ error: "Pedido não encontrado" }, 404);
    const owner = (order as { companies?: { user_id?: string } | null }).companies?.user_id;
    if (owner !== userData.user.id) return jsonResponse({ error: "Forbidden" }, 403);

    if (PAID_STATUSES.includes(order.status)) return jsonResponse({ status: "PAID" }, 200);

    const apiKey = Deno.env.get("ASAAS_API_KEY");
    if (!apiKey || !order.payment_ref) return jsonResponse({ status: "PENDING" }, 200);

    const charge = await asaas<{ id: string; status: string; value: number }>(apiKey, "GET", `/payments/${order.payment_ref}`);
    if (!ASAAS_PAID_STATUSES.includes(charge.status)) return jsonResponse({ status: "PENDING" }, 200);

    const result = await confirmOrderPayment(supabase, orderId, { id: charge.id, value: charge.value });
    return jsonResponse({ status: result === "ignored" ? "PENDING" : "PAID" }, 200);
  } catch (error) {
    console.error("[CHECK-ASAAS] Error:", error instanceof Error ? error.message : error);
    return jsonResponse({ error: "Falha ao consultar pagamento" }, 500);
  }
});
