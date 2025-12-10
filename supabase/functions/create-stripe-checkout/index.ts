import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  stripePriceId?: string;
}

interface CheckoutRequest {
  items: CartItem[];
  companyId: string;
  customerEmail: string;
  customerName: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[CREATE-STRIPE-CHECKOUT] Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    // Get user from auth header if available
    const authHeader = req.headers.get("Authorization");
    let user = null;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseClient.auth.getUser(token);
      user = data.user;
    }

    const { items, companyId, customerEmail, customerName }: CheckoutRequest = await req.json();

    if (!items || items.length === 0) {
      throw new Error("Cart is empty");
    }

    console.log("[CREATE-STRIPE-CHECKOUT] Processing checkout for", items.length, "items");

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    // Check if customer already exists
    let customerId: string | undefined;
    if (customerEmail) {
      const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        console.log("[CREATE-STRIPE-CHECKOUT] Found existing customer:", customerId);
      }
    }

    // Build line items using Stripe price IDs
    const lineItems = items.map((item) => {
      if (item.stripePriceId) {
        // Use the actual Stripe price ID
        return {
          price: item.stripePriceId,
          quantity: item.quantity,
        };
      } else {
        // Fallback to price_data for products without Stripe price ID
        return {
          price_data: {
            currency: "brl",
            product_data: {
              name: item.productName,
              description: `${item.quantity} ${item.unit}`,
            },
            unit_amount: Math.round(item.unitPrice * 100),
          },
          quantity: item.quantity,
        };
      }
    });

    // Calculate total for order
    const totalAmount = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

    // Create order items for database
    const orderItems = items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      totalPrice: item.unitPrice * item.quantity,
    }));

    // Use service role key to insert order (handles RLS)
    const supabaseServiceClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: order, error: orderError } = await supabaseServiceClient
      .from("orders")
      .insert({
        company_id: companyId,
        total_amount: totalAmount,
        status: "pending",
        items: orderItems,
        payment_url: "stripe_pending",
      })
      .select()
      .single();

    if (orderError) {
      console.error("[CREATE-STRIPE-CHECKOUT] Order creation error:", orderError);
      throw new Error("Failed to create order");
    }

    console.log("[CREATE-STRIPE-CHECKOUT] Order created:", order.id);

    const origin = req.headers.get("origin") || "https://stzsmhpaixxjgdrrqvmi.lovable.app";

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : customerEmail,
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/pedidos?payment=success&order_id=${order.id}`,
      cancel_url: `${origin}/carrinho?payment=cancelled`,
      metadata: {
        order_id: order.id,
        company_id: companyId,
      },
      payment_intent_data: {
        metadata: {
          order_id: order.id,
          company_id: companyId,
        },
      },
    });

    console.log("[CREATE-STRIPE-CHECKOUT] Checkout session created:", session.id);

    // Update order with payment session info
    await supabaseServiceClient
      .from("orders")
      .update({ payment_url: session.url })
      .eq("id", order.id);

    return new Response(
      JSON.stringify({ 
        url: session.url,
        sessionId: session.id,
        orderId: order.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[CREATE-STRIPE-CHECKOUT] Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
