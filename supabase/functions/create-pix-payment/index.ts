import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Product {
  externalId: string;
  name: string;
  quantity: number;
  price: number; // em centavos
}

interface Customer {
  name: string;
  cellphone: string;
  email: string;
  taxId: string; // CPF ou CNPJ
}

interface CreatePaymentRequest {
  products: Product[];
  customer: Customer;
  returnUrl?: string;
  completionUrl?: string;
  externalId?: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('ABACATEPAY_API_KEY');
    
    if (!apiKey) {
      console.error('ABACATEPAY_API_KEY not configured');
      throw new Error('API key not configured');
    }

    const requestData: CreatePaymentRequest = await req.json();
    
    console.log('Creating billing with AbacatePay:', JSON.stringify(requestData, null, 2));

    // Clean taxId - remove all non-numeric characters
    const cleanTaxId = requestData.customer.taxId.replace(/\D/g, '');
    
    // Clean cellphone - remove all non-numeric characters
    const cleanCellphone = requestData.customer.cellphone.replace(/\D/g, '');
    
    const billingPayload = {
      frequency: "ONE_TIME",
      methods: ["PIX"],
      products: requestData.products.map(p => ({
        externalId: p.externalId,
        name: p.name,
        quantity: p.quantity,
        price: p.price, // em centavos
      })),
      returnUrl: requestData.returnUrl || "https://fanezze.lovable.app/pedidos",
      completionUrl: requestData.completionUrl || "https://fanezze.lovable.app/pedidos",
      customer: {
        name: requestData.customer.name,
        cellphone: cleanCellphone,
        email: requestData.customer.email,
        taxId: cleanTaxId,
      },
      metadata: {
        externalId: requestData.externalId || Date.now().toString(),
      },
    };

    console.log('Sending to AbacatePay:', JSON.stringify(billingPayload, null, 2));

    const response = await fetch('https://api.abacatepay.com/v1/billing/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(billingPayload),
    });

    const responseText = await response.text();
    console.log('AbacatePay response status:', response.status);
    console.log('AbacatePay response:', responseText);

    if (!response.ok) {
      console.error('AbacatePay error:', responseText);
      return new Response(
        JSON.stringify({ error: 'Failed to create billing', details: responseText }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = JSON.parse(responseText);
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in create-pix-payment function:', error);
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
