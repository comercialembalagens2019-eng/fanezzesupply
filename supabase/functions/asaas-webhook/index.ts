// Asaas webhook: marks orders paid on PAYMENT_RECEIVED / PAYMENT_CONFIRMED.
// Asaas sends the token we registered (scripts/asaas-webhook.mjs) in `asaas-access-token`.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { isValidUUID } from "../_shared/orders.ts";
import { confirmOrderPayment } from "../_shared/confirm.ts";

const PAID_EVENTS = ["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"];

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const expected = Deno.env.get("ASAAS_WEBHOOK_TOKEN");
  const received = req.headers.get("asaas-access-token") ?? "";
  if (!expected || !constantTimeEqual(received, expected)) {
    console.warn("[ASAAS-WEBHOOK] Invalid token");
    return json({ error: "Unauthorized" }, 401);
  }

  try {
    const payload = await req.json();
    const event: string = payload?.event ?? "";
    const payment = payload?.payment;
    console.log("[ASAAS-WEBHOOK] Event", event, payment?.id);

    // Anything else (created, viewed, overdue…) needs no action; 200 keeps the queue moving.
    if (!PAID_EVENTS.includes(event) || !payment?.id || !isValidUUID(payment.externalReference)) {
      return json({ received: true }, 200);
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const result = await confirmOrderPayment(supabase, payment.externalReference, {
      id: payment.id,
      value: Number(payment.value),
    });
    console.log("[ASAAS-WEBHOOK] Order", payment.externalReference, result);
    return json({ received: true }, 200);
  } catch (error) {
    // 500 makes Asaas retry later.
    console.error("[ASAAS-WEBHOOK] Error:", error instanceof Error ? error.message : error);
    return json({ error: "Webhook processing failed" }, 500);
  }
});
