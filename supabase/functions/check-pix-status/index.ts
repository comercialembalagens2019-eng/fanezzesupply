import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckPixRequest {
  pixId: string;
}

// Validate pixId format (basic alphanumeric check)
function isValidPixId(pixId: string): boolean {
  if (!pixId || typeof pixId !== 'string') return false;
  // AbacatePay IDs are typically alphanumeric
  return /^[a-zA-Z0-9_-]{5,100}$/.test(pixId);
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('ABACATEPAY_API_KEY');
    
    if (!apiKey) {
      console.error('[PIX-STATUS] API key not configured');
      throw new Error('API key not configured');
    }

    const { pixId }: CheckPixRequest = await req.json();
    
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

    console.log('[PIX-STATUS] Checking status for pixId:', pixId.substring(0, 8) + '...');

    const response = await fetch(`https://api.abacatepay.com/v1/pixQrCode/check?id=${encodeURIComponent(pixId)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    const responseText = await response.text();
    console.log('[PIX-STATUS] Response status:', response.status);

    if (!response.ok) {
      console.error('[PIX-STATUS] API error, status:', response.status);
      return new Response(
        JSON.stringify({ error: 'Failed to check PIX status' }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = JSON.parse(responseText);
    console.log('[PIX-STATUS] Status retrieved:', data?.data?.status);
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('[PIX-STATUS] Error:', error instanceof Error ? error.message : 'Unknown error');
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
