// AbacatePay webhook (API v2): marks orders paid on transparent.completed.
// Origin is proven by the per-webhook secret AbacatePay appends as ?webhookSecret=…
// (registered by scripts/abacatepay-webhook.mjs); X-Webhook-Signature guards the body.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { constantTimeEqual, validWebhookSignature } from "../_shared/abacatepay.ts";
import { confirmOrderPayment } from "../_shared/confirm.ts";

const PAID = ["PAID", "APPROVED"];

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const expected = Deno.env.get("ABACATEPAY_WEBHOOK_SECRET");
  const received = new URL(req.url).searchParams.get("webhookSecret") ?? "";
  if (!expected || !constantTimeEqual(received, expected)) {
    console.warn("[ABACATE-WEBHOOK] Invalid secret");
    return json({ error: "Unauthorized" }, 401);
  }

  // The secret already proves origin; a signature that is present must match the body.
  const rawBody = await req.text();
  const signature = req.headers.get("X-Webhook-Signature");
  if (!signature) {
    console.warn("[ABACATE-WEBHOOK] No signature header; accepted on the secret alone");
  } else if (!(await validWebhookSignature(rawBody, signature))) {
    console.warn("[ABACATE-WEBHOOK] Invalid signature");
    return json({ error: "Invalid signature" }, 401);
  }

  try {
    const payload = JSON.parse(rawBody);
    const charge = payload?.data?.transparent;
    console.log("[ABACATE-WEBHOOK] Event", payload?.event, charge?.id, payload?.devMode ? "(dev mode)" : "");

    // Other events (refunds, disputes, payouts) need no automatic action; 2xx acknowledges.
    if (payload?.event !== "transparent.completed" || !charge?.id || !PAID.includes(charge.status)) {
      return json({ received: true }, 200);
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: order } = await supabase.from("orders").select("id").eq("payment_ref", charge.id).maybeSingle();
    if (!order) {
      console.warn("[ABACATE-WEBHOOK] No order for charge", charge.id);
      return json({ received: true }, 200);
    }

    const paidCents = Number(charge.paidAmount ?? charge.amount);
    const result = await confirmOrderPayment(supabase, order.id, { id: charge.id, value: paidCents / 100 });
    console.log("[ABACATE-WEBHOOK] Order", order.id, result);
    return json({ received: true }, 200);
  } catch (error) {
    // Non-2xx makes AbacatePay retry the delivery.
    console.error("[ABACATE-WEBHOOK] Error:", error instanceof Error ? error.message : error);
    return json({ error: "Webhook processing failed" }, 500);
  }
});
