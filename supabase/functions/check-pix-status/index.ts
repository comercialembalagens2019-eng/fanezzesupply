import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckPixRequest {
  pixId: string;
  orderId?: string;
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

    const { pixId, orderId }: CheckPixRequest = await req.json();
    
    if (!pixId) {
      return new Response(
        JSON.stringify({ error: 'pixId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isValidPixId(pixId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid pixId format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[CHECK-PIX] Checking status for pixId:', pixId.substring(0, 8) + '...', 'orderId:', orderId);

    const response = await fetch(`https://api.abacatepay.com/v1/pixQrCode/check?id=${encodeURIComponent(pixId)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    const responseText = await response.text();
    console.log('[CHECK-PIX] Response status:', response.status);

    if (!response.ok) {
      console.error('[CHECK-PIX] API error, status:', response.status);
      return new Response(
        JSON.stringify({ error: 'Failed to check PIX status' }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = JSON.parse(responseText);
    const pixStatus = data?.data?.status;
    console.log('[CHECK-PIX] Status retrieved:', pixStatus);
    
    // If payment is PAID and we have an orderId, update the order in the database
    if (pixStatus === 'PAID' && orderId) {
      console.log('[CHECK-PIX] Payment confirmed, updating order:', orderId);
      
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Verify the order belongs to the authenticated user's company
      const { data: currentOrder, error: selectError } = await supabase
        .from('orders')
        .select('status, total_amount, companies!inner(user_id)')
        .eq('id', orderId)
        .maybeSingle();
      
      if (selectError) {
        console.error('[CHECK-PIX] Error fetching order:', selectError);
      } else if (!currentOrder) {
        return new Response(
          JSON.stringify({ error: 'Order not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else if ((currentOrder as any).companies?.user_id !== authedUserId) {
        console.warn('[CHECK-PIX] Order ownership mismatch');
        return new Response(
          JSON.stringify({ error: 'Forbidden' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else if (currentOrder.status !== 'paid') {
        // Update order status using RPC
        const { error: updateError } = await supabase.rpc('update_order_status', {
          p_order_id: orderId,
          p_new_status: 'paid'
        });

        if (updateError) {
          console.error('[CHECK-PIX] Error updating order status:', updateError);
        } else {
          console.log('[CHECK-PIX] Order status updated to paid successfully');
          
          // Send payment notification email
          await sendPaymentNotificationEmail(orderId, currentOrder.total_amount);
          
          // Add orderUpdated flag to response
          return new Response(JSON.stringify({ ...data, orderUpdated: true }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } else if (currentOrder?.status === 'paid') {
        console.log('[CHECK-PIX] Order already marked as paid');
      }
    }
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('[CHECK-PIX] Error:', error instanceof Error ? error.message : 'Unknown error');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
