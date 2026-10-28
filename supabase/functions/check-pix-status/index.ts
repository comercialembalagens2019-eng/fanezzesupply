import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { isValidUUID } from "../_shared/orders.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckPixRequest {
  orderId: string;
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Validate pixId format (basic alphanumeric check)
function isValidPixId(pixId: string): boolean {
  if (!pixId || typeof pixId !== 'string') return false;
  // AbacatePay IDs are typically alphanumeric
  return /^[a-zA-Z0-9_-]{5,100}$/.test(pixId);
}

// Send payment notification email
async function sendPaymentNotificationEmail(orderId: string, amount: number) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.error("[CHECK-PIX] RESEND_API_KEY not configured, skipping email");
    return;
  }

  const resend = new Resend(resendApiKey);
  const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);

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
    console.log("[CHECK-PIX] Payment notification email sent");
  } catch (error) {
    console.error("[CHECK-PIX] Error sending email:", error);
  }
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: userData, error: userErr } = await authClient.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const authedUserId = userData.user.id;

    const apiKey = Deno.env.get('ABACATEPAY_API_KEY');

    if (!apiKey) {
      console.error('[CHECK-PIX] API key not configured');
      throw new Error('API key not configured');
    }

    const { orderId }: CheckPixRequest = await req.json();

    if (!isValidUUID(orderId)) {
      return jsonResponse({ error: 'orderId is required' }, 400);
    }

    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // SECURITY: the PIX id comes from the order record, never from the client,
    // so a paid charge can only ever confirm the order it was created for.
    const { data: currentOrder, error: selectError } = await supabase
      .from('orders')
      .select('status, total_amount, payment_method, payment_ref, companies!inner(user_id)')
      .eq('id', orderId)
      .maybeSingle();

    if (selectError) {
      console.error('[CHECK-PIX] Error fetching order:', selectError.message);
      return jsonResponse({ error: 'Failed to check PIX status' }, 500);
    }
    if (!currentOrder) {
      return jsonResponse({ error: 'Order not found' }, 404);
    }
    const owner = (currentOrder as { companies?: { user_id?: string } | null }).companies?.user_id;
    if (owner !== authedUserId) {
      console.warn('[CHECK-PIX] Order ownership mismatch');
      return jsonResponse({ error: 'Forbidden' }, 403);
    }

    const pixId = currentOrder.payment_ref;
    if (currentOrder.payment_method !== 'pix' || !pixId || !isValidPixId(pixId)) {
      return jsonResponse({ error: 'Order has no PIX charge' }, 400);
    }

    if (currentOrder.status === 'paid') {
      return jsonResponse({ data: { status: 'PAID' }, orderUpdated: false }, 200);
    }

    console.log('[CHECK-PIX] Checking status for order:', orderId);

    const response = await fetch(`https://api.abacatepay.com/v1/pixQrCode/check?id=${encodeURIComponent(pixId)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    console.log('[CHECK-PIX] Response status:', response.status);

    if (!response.ok) {
      console.error('[CHECK-PIX] API error, status:', response.status);
      return jsonResponse({ error: 'Failed to check PIX status' }, 502);
    }

    const data = await response.json();
    const pixStatus = data?.data?.status;
    console.log('[CHECK-PIX] Status retrieved:', pixStatus);

    if (pixStatus === 'PAID') {
      const { error: updateError } = await supabase.rpc('update_order_status', {
        p_order_id: orderId,
        p_new_status: 'paid'
      });

      if (updateError) {
        console.error('[CHECK-PIX] Error updating order status:', updateError.message);
      } else {
        console.log('[CHECK-PIX] Order status updated to paid successfully');
        await sendPaymentNotificationEmail(orderId, currentOrder.total_amount);
        return jsonResponse({ ...data, orderUpdated: true }, 200);
      }
    }

    return jsonResponse(data, 200);
  } catch (error: unknown) {
    console.error('[CHECK-PIX] Error:', error instanceof Error ? error.message : 'Unknown error');
    return jsonResponse({ error: 'Failed to check PIX status' }, 500);
  }
});
