// Charges a card order created by create-abacate-payment. The browser sends only the
// one-time ctok_ from abacatepay.js (card data never reaches us); the amount comes from
// the order, so it always matches what the server priced.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { isValidUUID, orderAmountCents } from "../_shared/orders.ts";
import { abacate, AbacateError, formatCellphone } from "../_shared/abacatepay.ts";
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

    const apiKey = Deno.env.get("ABACATEPAY_API_KEY");
    if (!apiKey) return jsonResponse({ error: "Pagamento indisponível no momento." }, 503);

    const { orderId, token } = await req.json().catch(() => ({}));
    if (!isValidUUID(orderId) || typeof token !== "string" || !token.startsWith("ctok_")) {
      return jsonResponse({ error: "Dados do pagamento inválidos" }, 400);
    }

    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: order } = await supabase
      .from("orders")
      .select("id, status, total_amount, payment_method, payment_ref, companies(user_id, razao_social, cnpj, email, whatsapp)")
      .eq("id", orderId)
      .maybeSingle();
    const company = order?.companies as
      | { user_id: string; razao_social: string; cnpj: string; email: string; whatsapp: string | null }
      | null
      | undefined;
    if (!order || company?.user_id !== userData.user.id) return jsonResponse({ error: "Pedido não encontrado" }, 404);
    // Only an unpaid card order without a live charge; a declined card leaves it chargeable
    // so the customer can try another card.
    if (order.payment_method !== "card" || order.status !== "pending" || order.payment_ref) {
      return jsonResponse({ error: "Este pedido não pode mais ser pago no cartão" }, 409);
    }

    const amount = orderAmountCents(order.total_amount);
    const charge = await abacate<{ id: string; status: string }>(apiKey, "POST", "/transparents/create", {
      method: "CARD",
      data: {
        amount,
        token,
        customer: {
          name: company.razao_social,
          email: company.email,
          taxId: company.cnpj.replace(/\D/g, ""),
          cellphone: formatCellphone(company.whatsapp),
        },
        metadata: { orderId },
      },
    });

    console.log("[ABACATE-CARD] Charge", charge.id, charge.status, "order", orderId);
    if (charge.status !== "APPROVED" && charge.status !== "PENDING") {
      return jsonResponse({ error: "Não foi possível processar o pagamento com este cartão." }, 402);
    }
    await supabase.from("orders").update({ payment_ref: charge.id }).eq("id", orderId);

    if (charge.status === "APPROVED") {
      await confirmOrderPayment(supabase, orderId, { id: charge.id, value: amount / 100 });
      return jsonResponse({ status: "PAID" }, 200);
    }
    // PENDING: the transparent.completed webhook confirms it.
    return jsonResponse({ status: charge.status }, 200);
  } catch (error) {
    if (error instanceof AbacateError) {
      console.error("[ABACATE-CARD] Provider error", error.status, error.message);
      // Declines come back with a generic, customer-safe message.
      const message = /cart[aã]o/i.test(error.message)
        ? error.message
        : "Não foi possível processar o pagamento com este cartão.";
      return jsonResponse({ error: message }, 402);
    }
    console.error("[ABACATE-CARD] Error:", error instanceof Error ? error.message : error);
    return jsonResponse({ error: "Erro interno ao processar o cartão" }, 500);
  }
});
