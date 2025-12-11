import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation helpers
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const maskEmail = (email: string): string => {
  const [local, domain] = email.split('@');
  return `${local.slice(0, 2)}***@${domain?.slice(0, 3)}***`;
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
      throw new Error("Authorization header required");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }

    console.log("[BOLETO] User authenticated:", userData.user.id.slice(0, 8) + "***");

    const body = await req.json();
    const { amount, customer_email, customer_name, order_id } = body;

    // Validate inputs
    if (!amount || typeof amount !== "number") {
      throw new Error("Amount is required and must be a number");
    }

    if (amount < 500) {
      throw new Error("Minimum amount for boleto is R$5.00 (500 centavos)");
    }

    if (amount > 100000000) {
      throw new Error("Maximum amount exceeded");
    }

    if (!customer_email || !isValidEmail(customer_email)) {
      throw new Error("Valid customer email is required");
    }

    console.log("[BOLETO] Creating payment:", { 
      amount, 
      email: maskEmail(customer_email),
      orderId: order_id?.slice(0, 8) + "***"
    });

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    // Create PaymentIntent with boleto
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "brl",
      payment_method_types: ["boleto"],
      receipt_email: customer_email,
      description: "Pagamento via Boleto - Fanezze Supply",
      metadata: {
        order_id: order_id || "",
        user_id: userData.user.id,
      },
    });

    console.log("[BOLETO] PaymentIntent created:", paymentIntent.id);

    // Get boleto details if available
    const boletoDetails = paymentIntent.next_action?.boleto_display_details;

    return new Response(
      JSON.stringify({
        success: true,
        payment_intent_id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        boleto_url: boletoDetails?.hosted_voucher_url || null,
        pdf: boletoDetails?.pdf || null,
        expires_at: boletoDetails?.expires_at || null,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[BOLETO] Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
