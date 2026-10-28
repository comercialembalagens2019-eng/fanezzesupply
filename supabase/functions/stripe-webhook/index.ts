import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// Send payment notification email
async function sendPaymentNotificationEmail(orderId: string, amount: number, paymentMethod: string) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.error("[STRIPE-WEBHOOK] RESEND_API_KEY not configured, skipping email");
    return;
  }

  const resend = new Resend(resendApiKey);
  const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount / 100);

  try {
    await resend.emails.send({
      from: "Fanezze Supply <noreply@fanezzesupply.com.br>",
      to: ["fanezzesupply@gmail.com"],
      subject: `💰 Novo pagamento recebido - ${formattedAmount}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1B2845 0%, #0A1128 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: #F5E6D3; margin: 0; font-size: 24px;">Novo Pagamento Recebido!</h1>
          </div>
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
              Um novo pagamento foi confirmado no sistema.
            </p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">Pedido:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333; font-weight: bold;">${orderId}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">Valor:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #22c55e; font-weight: bold; font-size: 18px;">${formattedAmount}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">Método:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333;">${paymentMethod}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #666;">Data:</td>
                <td style="padding: 10px 0; color: #333;">${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</td>
              </tr>
            </table>
            <p style="color: #888; font-size: 12px; margin-top: 30px; text-align: center;">
              Este é um email automático do sistema Fanezze Supply.
            </p>
          </div>
        </div>
      `,
    });
    console.log("[STRIPE-WEBHOOK] Payment notification email sent");
  } catch (error) {
    console.error("[STRIPE-WEBHOOK] Error sending email:", error);
  }
}

// Card payments send both checkout.session.completed and payment_intent.succeeded;
// only the first one that changes the order should notify, so check before updating.
// deno-lint-ignore no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function markOrderPaid(supabaseClient: any, orderId: string): Promise<"updated" | "already_paid"> {
  const { data: order, error: selectError } = await supabaseClient
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .maybeSingle();
  if (selectError) throw new Error("Order lookup failed");
  if (!order) throw new Error("Order not found");
  if (order.status === "paid") return "already_paid";

  const { error } = await supabaseClient.rpc("update_order_status", {
    p_order_id: orderId,
    p_new_status: "paid",
  });
  if (error) throw new Error("Order update failed");
  return "updated";
}

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

      const orderId = session.metadata?.order_id;

      if (orderId && session.payment_status === "paid") {
        console.log("[STRIPE-WEBHOOK] Updating order:", orderId);

        const result = await markOrderPaid(supabaseClient, orderId);
        console.log("[STRIPE-WEBHOOK] Order", result, orderId);

        if (result === "updated") {
          await sendPaymentNotificationEmail(orderId, session.amount_total || 0, "Cartão de Crédito");
        }
      } else {
        console.log("[STRIPE-WEBHOOK] Order ID not found in metadata or payment not completed");
      }
    }

    // Handle payment_intent.succeeded event (backup for card/boleto)
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      console.log("[STRIPE-WEBHOOK] Payment intent succeeded:", paymentIntent.id);
      console.log("[STRIPE-WEBHOOK] Payment method types:", paymentIntent.payment_method_types);

      const orderId = paymentIntent.metadata?.order_id;

      if (orderId) {
        console.log("[STRIPE-WEBHOOK] Updating order from payment_intent:", orderId);

        const result = await markOrderPaid(supabaseClient, orderId);
        console.log("[STRIPE-WEBHOOK] Order", result, orderId);

        if (result === "updated") {
          const paymentMethodType = paymentIntent.payment_method_types?.includes("boleto") ? "Boleto" : "Cartão";
          await sendPaymentNotificationEmail(orderId, paymentIntent.amount, paymentMethodType);
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

        // Use secure RPC function instead of direct update
        const { error } = await supabaseClient.rpc('update_order_status', {
          p_order_id: orderId,
          p_new_status: 'failed'
        });

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
        // Use secure RPC function instead of direct update
        const { error } = await supabaseClient.rpc('update_order_status', {
          p_order_id: orderId,
          p_new_status: 'processing'
        });

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
    console.error("[STRIPE-WEBHOOK] Error:", error instanceof Error ? error.message : String(error));
    return new Response(
      JSON.stringify({ error: "Webhook processing failed" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});