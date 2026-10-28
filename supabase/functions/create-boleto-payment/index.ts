import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { computeOrderTotalCents } from "../_shared/catalog.ts";
import { createPendingOrder, discardOrder } from "../_shared/orders.ts";

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

// Input validation helpers
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const maskEmail = (email: string): string => {
  const [local, domain] = email.split('@');
  return `${local.slice(0, 2)}***@${domain?.slice(0, 3)}***`;
};

// Validate CPF check digits
const isValidCPF = (cpf: string): boolean => {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits[9])) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  return remainder === parseInt(digits[10]);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[BOLETO] Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    // Authenticate user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    console.log("[BOLETO] User authenticated:", userData.user.id.slice(0, 8) + "***");

    const body = await req.json();
    const {
      customer_email,
      customer_name,
      customer_cpf,
      company_id,
      address
    } = body;

    if (!customer_email || !isValidEmail(customer_email)) {
      return jsonResponse({ error: "Valid customer email is required" }, 400);
    }

    if (!customer_name || customer_name.trim().length < 2) {
      return jsonResponse({ error: "Customer name is required" }, 400);
    }

    // Validate CPF for Boleto (required by Stripe)
    const cpfDigits = (customer_cpf || "").replace(/\D/g, "");
    if (!cpfDigits || !isValidCPF(cpfDigits)) {
      return jsonResponse({ error: "CPF válido é obrigatório para pagamento via Boleto" }, 400);
    }

    // Validate address (required by Stripe for Boleto)
    if (!address || !address.line1 || !address.city || !address.state || !address.postal_code) {
      return jsonResponse({ error: "Endereço completo é obrigatório para pagamento via Boleto" }, 400);
    }

    // SECURITY: amount is recalculated server-side from the trusted catalog,
    // never taken from the client payload.
    const totals = computeOrderTotalCents(body.items);
    if ("error" in totals) {
      console.log("[BOLETO] Order total rejected:", totals.error);
      return jsonResponse({ error: totals.error }, 400);
    }
    if (totals.totalCents < 500) {
      return jsonResponse({ error: "O valor mínimo para boleto é R$ 5,00" }, 400);
    }
    if (totals.totalCents > 100000000) {
      return jsonResponse({ error: "Valor máximo excedido" }, 400);
    }

    // SECURITY: the order is created here (never by the client), owned by the caller's company.
    const supabaseServiceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    const created = await createPendingOrder(supabaseServiceClient, {
      userId: userData.user.id,
      companyId: company_id,
      items: body.items,
      method: "boleto",
    });
    if ("error" in created) {
      return jsonResponse({ error: created.error }, created.status);
    }
    const amount = created.totalCents;
    const order_id = created.orderId;

    console.log("[BOLETO] Creating payment:", {
      amount,
      email: maskEmail(customer_email),
      orderId: order_id.slice(0, 8) + "***"
    });

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    let paymentIntent: Stripe.PaymentIntent;
    try {
      // Create and confirm PaymentIntent with boleto in one step
      paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "brl",
        payment_method_types: ["boleto"],
        receipt_email: customer_email,
        description: "Pagamento via Boleto - Fanezze Supply",
        metadata: {
          order_id,
          user_id: userData.user.id,
        },
        payment_method_options: {
          boleto: {
            expires_after_days: 28,
          },
        },
        // Provide payment method data to confirm immediately
        payment_method_data: {
          type: "boleto",
          boleto: {
            tax_id: cpfDigits,
          },
          billing_details: {
            name: customer_name,
            email: customer_email,
            address: {
              line1: address.line1,
              line2: address.line2 || undefined,
              city: address.city,
              state: address.state,
              postal_code: address.postal_code,
              country: "BR",
            },
          },
        },
        confirm: true, // Confirm immediately to generate boleto
      });
    } catch (stripeError) {
      console.error("[BOLETO] Stripe error:", stripeError instanceof Error ? stripeError.message : stripeError);
      await discardOrder(supabaseServiceClient, order_id);
      return jsonResponse({ error: "Não foi possível gerar o boleto. Verifique os dados e tente novamente." }, 502);
    }

    console.log("[BOLETO] PaymentIntent created and confirmed:", paymentIntent.id);
    console.log("[BOLETO] Status:", paymentIntent.status);

    // Get boleto details from next_action
    const boletoDetails = paymentIntent.next_action?.boleto_display_details;

    if (!boletoDetails?.hosted_voucher_url) {
      console.error("[BOLETO] No boleto URL in response, next action:", paymentIntent.next_action?.type);
      return jsonResponse({ error: "Não foi possível gerar o boleto. Tente novamente." }, 502);
    }

    const { error: bindError } = await supabaseServiceClient
      .from("orders")
      .update({ payment_ref: paymentIntent.id, payment_url: boletoDetails.hosted_voucher_url })
      .eq("id", order_id);
    if (bindError) {
      console.error("[BOLETO] Failed to bind boleto to order:", bindError.message);
    }

    console.log("[BOLETO] Boleto URL generated successfully");

    return jsonResponse({
      success: true,
      order_id,
      payment_intent_id: paymentIntent.id,
      boleto_url: boletoDetails.hosted_voucher_url,
      number: boletoDetails.number || null,
      expires_at: boletoDetails.expires_at || null,
    }, 200);
  } catch (error) {
    console.error("[BOLETO] Error:", error instanceof Error ? error.message : String(error));
    return jsonResponse({ error: "Erro interno ao gerar boleto" }, 500);
  }
});
