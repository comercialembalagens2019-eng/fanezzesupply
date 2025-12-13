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
      throw new Error("Authorization header required");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }

    console.log("[BOLETO] User authenticated:", userData.user.id.slice(0, 8) + "***");

    const body = await req.json();
    const { 
      amount, 
      customer_email, 
      customer_name, 
      customer_cpf, 
      order_id,
      address 
    } = body;

    // SECURITY: Verify user owns the order before processing payment
    if (order_id) {
      const supabaseServiceClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      const { data: order, error: orderError } = await supabaseServiceClient
        .from("orders")
        .select("company_id, companies!inner(user_id)")
        .eq("id", order_id)
        .single();

      if (orderError || !order) {
        console.log("[BOLETO] Order not found:", order_id?.slice(0, 8) + "***");
        return new Response(
          JSON.stringify({ error: "Order not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const companyUserId = (order as any).companies?.user_id;
      if (companyUserId !== userData.user.id) {
        console.log("[BOLETO] Unauthorized: user does not own order");
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

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

    if (!customer_name || customer_name.trim().length < 2) {
      throw new Error("Customer name is required");
    }

    // Validate CPF for Boleto (required by Stripe)
    const cpfDigits = (customer_cpf || "").replace(/\D/g, "");
    if (!cpfDigits || !isValidCPF(cpfDigits)) {
      throw new Error("CPF válido é obrigatório para pagamento via Boleto");
    }

    // Validate address (required by Stripe for Boleto)
    if (!address || !address.line1 || !address.city || !address.state || !address.postal_code) {
      throw new Error("Endereço completo é obrigatório para pagamento via Boleto");
    }

    console.log("[BOLETO] Creating payment:", { 
      amount, 
      email: maskEmail(customer_email),
      orderId: order_id?.slice(0, 8) + "***"
    });

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    // Create and confirm PaymentIntent with boleto in one step
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

    console.log("[BOLETO] PaymentIntent created and confirmed:", paymentIntent.id);
    console.log("[BOLETO] Status:", paymentIntent.status);
    console.log("[BOLETO] Next action type:", paymentIntent.next_action?.type);

    // Get boleto details from next_action
    const boletoDetails = paymentIntent.next_action?.boleto_display_details;
    
    if (!boletoDetails?.hosted_voucher_url) {
      console.error("[BOLETO] No boleto URL in response:", JSON.stringify(paymentIntent.next_action));
      throw new Error("Não foi possível gerar o boleto. Tente novamente.");
    }

    console.log("[BOLETO] Boleto URL generated successfully");

    return new Response(
      JSON.stringify({
        success: true,
        payment_intent_id: paymentIntent.id,
        boleto_url: boletoDetails.hosted_voucher_url,
        number: boletoDetails.number || null,
        expires_at: boletoDetails.expires_at || null,
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
