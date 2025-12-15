// Payment webhook for AbacatePay - handles billing.paid events
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature',
};

// Send payment notification email
async function sendPaymentNotificationEmail(orderId: string, amount: number) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.error("[PAYMENT-WEBHOOK] RESEND_API_KEY not configured, skipping email");
    return;
  }

  const resend = new Resend(resendApiKey);
  const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount / 100);

  try {
    await resend.emails.send({
      from: "Fanezze Supply <noreply@fanezzesupply.com.br>",
      to: ["fanezzesupply@gmail.com"],
      subject: `💰 Novo pagamento PIX recebido - ${formattedAmount}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1B2845 0%, #0A1128 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: #F5E6D3; margin: 0; font-size: 24px;">Novo Pagamento PIX Recebido!</h1>
          </div>
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
              Um novo pagamento via PIX foi confirmado no sistema.
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
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333;">PIX</td>
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
    console.log("[PAYMENT-WEBHOOK] Payment notification email sent");
  } catch (error) {
    console.error("[PAYMENT-WEBHOOK] Error sending email:", error);
  }
}

// Constant-time string comparison to prevent timing attacks
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// Verify HMAC signature using constant-time comparison
async function verifySignature(rawBody: string, signatureFromHeader: string): Promise<boolean> {
  try {
    // Get HMAC key from environment (moved from hardcoded value)
    const publicKey = Deno.env.get('ABACATEPAY_PUBLIC_KEY');
    if (!publicKey) {
      console.error('ABACATEPAY_PUBLIC_KEY not configured');
      return false;
    }

    const encoder = new TextEncoder();
    const keyData = encoder.encode(publicKey);
    const bodyData = encoder.encode(rawBody);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign("HMAC", cryptoKey, bodyData);
    const expectedSig = btoa(String.fromCharCode(...new Uint8Array(signature)));

    // Use constant-time comparison to prevent timing attacks
    return constantTimeCompare(expectedSig, signatureFromHeader);
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const webhookSecret = url.searchParams.get('webhookSecret');
    const expectedSecret = Deno.env.get('ABACATEPAY_WEBHOOK_SECRET');

    // Validate webhook secret from URL
    if (!expectedSecret || webhookSecret !== expectedSecret) {
      console.error('Invalid webhook secret');
      return new Response(
        JSON.stringify({ error: 'Invalid webhook secret' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get raw body for signature verification
    const rawBody = await req.text();
    console.log('Received webhook payload:', rawBody);

    // Verify HMAC signature if present
    const signatureHeader = req.headers.get('x-webhook-signature');
    if (signatureHeader) {
      const isValid = await verifySignature(rawBody, signatureHeader);
      if (!isValid) {
        console.error('Invalid webhook signature');
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.log('Webhook signature verified successfully');
    }

    // Parse the payload
    const payload = JSON.parse(rawBody);
    console.log('Webhook event:', payload.event);

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle billing.paid event
    if (payload.event === 'billing.paid') {
      const paymentData = payload.data;
      
      // Extract metadata to find the order
      let externalId: string | null = null;
      let amount: number = 0;
      
      // Check different locations for externalId based on API version
      if (paymentData.pixQrCode?.metadata?.externalId) {
        // Old pixQrCode format
        externalId = paymentData.pixQrCode.metadata.externalId;
        amount = paymentData.pixQrCode?.amount || paymentData.amount || 0;
      } else if (paymentData.billing?.metadata?.externalId) {
        // New billing format - metadata at billing level
        externalId = paymentData.billing.metadata.externalId;
        amount = paymentData.billing?.amount || paymentData.amount || 0;
      } else if (paymentData.metadata?.externalId) {
        // Direct metadata on data object
        externalId = paymentData.metadata.externalId;
        amount = paymentData.amount || 0;
      }

      console.log('External ID (company_id):', externalId);

      if (externalId) {
        // Update order status to paid
        const { data: orders, error: selectError } = await supabase
          .from('orders')
          .select('id, total_amount')
          .eq('company_id', externalId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1);

        if (selectError) {
          console.error('Error finding order:', selectError);
        } else if (orders && orders.length > 0) {
          const orderId = orders[0].id;
          const orderAmount = orders[0].total_amount;
          
          // Use secure RPC function instead of direct update
          const { error: updateError } = await supabase.rpc('update_order_status', {
            p_order_id: orderId,
            p_new_status: 'paid'
          });

          if (updateError) {
            console.error('Error updating order status:', updateError);
          } else {
            console.log('Order status updated to paid:', orderId);
            
            // Send payment notification email
            await sendPaymentNotificationEmail(orderId, Math.round(orderAmount * 100));
          }
        } else {
          console.log('No pending order found for company:', externalId);
        }
      } else {
        console.log('No external ID found in payment data');
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error processing webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});