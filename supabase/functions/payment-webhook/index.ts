// Payment webhook for AbacatePay - handles billing.paid events
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature',
};

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
      
      // Check different locations for externalId based on API version
      if (paymentData.pixQrCode?.metadata?.externalId) {
        // Old pixQrCode format
        externalId = paymentData.pixQrCode.metadata.externalId;
      } else if (paymentData.billing?.metadata?.externalId) {
        // New billing format - metadata at billing level
        externalId = paymentData.billing.metadata.externalId;
      } else if (paymentData.metadata?.externalId) {
        // Direct metadata on data object
        externalId = paymentData.metadata.externalId;
      }

      console.log('External ID (company_id):', externalId);

      if (externalId) {
        // Update order status to paid
        const { data: orders, error: selectError } = await supabase
          .from('orders')
          .select('id')
          .eq('company_id', externalId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1);

        if (selectError) {
          console.error('Error finding order:', selectError);
        } else if (orders && orders.length > 0) {
          const orderId = orders[0].id;
          
          const { error: updateError } = await supabase
            .from('orders')
            .update({ status: 'paid' })
            .eq('id', orderId);

          if (updateError) {
            console.error('Error updating order status:', updateError);
          } else {
            console.log('Order status updated to paid:', orderId);
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