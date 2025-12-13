import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[STRIPE-WEBHOOK] Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    // Get the raw body and signature
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    console.log("[STRIPE-WEBHOOK] Signature present:", !!signature);

    let event: Stripe.Event;

    // Verify webhook signature if secret is configured
    if (webhookSecret && signature) {
      try {
        // Use async version for Deno compatibility
        event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
        console.log("[STRIPE-WEBHOOK] Signature verified successfully");
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error("[STRIPE-WEBHOOK] Signature verification failed:", errorMessage);
        return new Response(
          JSON.stringify({ error: "Webhook signature verification failed" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // SECURITY: Reject requests when webhook secret is not configured
      console.error("[STRIPE-WEBHOOK] STRIPE_WEBHOOK_SECRET not configured or missing signature");
      return new Response(
        JSON.stringify({ error: "Webhook not properly configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[STRIPE-WEBHOOK] Event type:", event.type);

    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Handle checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log("[STRIPE-WEBHOOK] Checkout session completed:", session.id);
      console.log("[STRIPE-WEBHOOK] Payment status:", session.payment_status);
      console.log("[STRIPE-WEBHOOK] Metadata:", session.metadata);

      const orderId = session.metadata?.order_id;

      if (orderId && session.payment_status === "paid") {
        console.log("[STRIPE-WEBHOOK] Updating order:", orderId);

        const { data, error } = await supabaseClient
          .from("orders")
          .update({ 
            status: "paid",
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId)
          .select()
          .single();

        if (error) {
          console.error("[STRIPE-WEBHOOK] Error updating order:", error);
          throw new Error(`Failed to update order: ${error.message}`);
        }

        console.log("[STRIPE-WEBHOOK] Order updated successfully:", data.id);
      } else {
        console.log("[STRIPE-WEBHOOK] Order ID not found in metadata or payment not completed");
      }
    }

    // Handle payment_intent.succeeded event (backup for card/boleto)
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      console.log("[STRIPE-WEBHOOK] Payment intent succeeded:", paymentIntent.id);
      console.log("[STRIPE-WEBHOOK] Payment method types:", paymentIntent.payment_method_types);
      console.log("[STRIPE-WEBHOOK] Metadata:", paymentIntent.metadata);

      const orderId = paymentIntent.metadata?.order_id;

      if (orderId) {
        console.log("[STRIPE-WEBHOOK] Updating order from payment_intent:", orderId);

        const { data, error } = await supabaseClient
          .from("orders")
          .update({ 
            status: "paid",
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId)
          .select()
          .single();

        if (error) {
          console.error("[STRIPE-WEBHOOK] Error updating order:", error);
        } else {
          console.log("[STRIPE-WEBHOOK] Order updated successfully:", data.id);
        }
      }
    }

    // Handle payment_intent.payment_failed (boleto expired or failed)
    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      console.log("[STRIPE-WEBHOOK] Payment failed:", paymentIntent.id);
      console.log("[STRIPE-WEBHOOK] Failure reason:", paymentIntent.last_payment_error?.message);

      const orderId = paymentIntent.metadata?.order_id;

      if (orderId) {
        console.log("[STRIPE-WEBHOOK] Marking order as failed:", orderId);

        const { error } = await supabaseClient
          .from("orders")
          .update({ 
            status: "failed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId);

        if (error) {
          console.error("[STRIPE-WEBHOOK] Error updating order:", error);
        } else {
          console.log("[STRIPE-WEBHOOK] Order marked as failed");
        }
      }
    }

    // Handle payment_intent.processing (boleto awaiting payment)
    if (event.type === "payment_intent.processing") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      console.log("[STRIPE-WEBHOOK] Payment processing:", paymentIntent.id);

      const orderId = paymentIntent.metadata?.order_id;

      if (orderId) {
        const { error } = await supabaseClient
          .from("orders")
          .update({ 
            status: "processing",
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId);

        if (error) {
          console.error("[STRIPE-WEBHOOK] Error updating order:", error);
        } else {
          console.log("[STRIPE-WEBHOOK] Order marked as processing");
        }
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[STRIPE-WEBHOOK] Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
