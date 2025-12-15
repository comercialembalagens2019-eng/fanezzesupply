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

interface ValidationError {
  field: string;
  message: string;
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Validate the checkout request
function validateCheckoutRequest(data: CheckoutRequest): ValidationError[] {
  const errors: ValidationError[] = [];

  // Items validation
  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    errors.push({ field: 'items', message: 'Cart is empty' });
    return errors;
  }

  if (data.items.length > 50) {
    errors.push({ field: 'items', message: 'Too many items in cart' });
  }

  // Validate each item
  for (let i = 0; i < data.items.length; i++) {
    const item = data.items[i];
    
    if (!item.productId || item.productId.length > 100) {
      errors.push({ field: `items[${i}].productId`, message: 'Invalid product ID' });
    }
    
    if (!item.productName || item.productName.length > 200) {
      errors.push({ field: `items[${i}].productName`, message: 'Invalid product name' });
    }
    
    if (!item.quantity || item.quantity < 1 || item.quantity > 10000) {
      errors.push({ field: `items[${i}].quantity`, message: 'Invalid quantity' });
    }
    
    if (!item.unitPrice || item.unitPrice < 0 || item.unitPrice > 1000000) {
      errors.push({ field: `items[${i}].unitPrice`, message: 'Invalid price' });
    }
  }

  // Company ID validation
  if (!data.companyId) {
    errors.push({ field: 'companyId', message: 'Company ID is required' });
  } else if (!isValidUUID(data.companyId)) {
    errors.push({ field: 'companyId', message: 'Invalid company ID format' });
  }

  // Customer email validation
  if (!data.customerEmail) {
    errors.push({ field: 'customerEmail', message: 'Customer email is required' });
  } else if (!isValidEmail(data.customerEmail)) {
    errors.push({ field: 'customerEmail', message: 'Invalid email format' });
  }

  // Customer name validation
  if (!data.customerName || data.customerName.trim().length < 2) {
    errors.push({ field: 'customerName', message: 'Customer name is required' });
  } else if (data.customerName.length > 100) {
    errors.push({ field: 'customerName', message: 'Customer name too long' });
  }

  return errors;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[STRIPE] Checkout function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    // Require authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.log("[STRIPE] Missing authorization header");
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !userData.user) {
      console.log("[STRIPE] Authentication failed");
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const user = userData.user;
    console.log("[STRIPE] User authenticated:", user.id.slice(0, 8) + "***");

    const requestData: CheckoutRequest = await req.json();

    // Validate request
    const validationErrors = validateCheckoutRequest(requestData);
    if (validationErrors.length > 0) {
      console.log("[STRIPE] Validation failed:", validationErrors.map(e => e.field).join(', '));
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: validationErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { items, companyId, customerEmail, customerName } = requestData;

    // SECURITY: Verify user owns the company before creating order
    const supabaseServiceClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: company, error: companyError } = await supabaseServiceClient
      .from("companies")
      .select("user_id")
      .eq("id", companyId)
      .single();

    if (companyError || !company) {
      console.log("[STRIPE] Company not found:", companyId.substring(0, 8) + '...');
      return new Response(
        JSON.stringify({ error: 'Company not found' }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (company.user_id !== user.id) {
      console.log("[STRIPE] Unauthorized: user does not own company");
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[STRIPE] Processing checkout, items:", items.length, "companyId:", companyId.substring(0, 8) + '...');

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    // Check if customer already exists
    let customerId: string | undefined;
    if (customerEmail) {
      const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        console.log("[STRIPE] Found existing customer");
      }
    }

    // Build line items using Stripe price IDs
    const lineItems = items.map((item) => {
      if (item.stripePriceId) {
        return {
          price: item.stripePriceId,
          quantity: item.quantity,
        };
      } else {
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

    // Create the order (service client already initialized above)
    const { data: order, error: orderError } = await supabaseServiceClient
      .from("orders")
      .insert({
        company_id: companyId,
        total_amount: totalAmount,
        status: "pending",
        items: orderItems,
        payment_url: "stripe_pending",
        payment_method: "card",
      })
      .select()
      .single();

    if (orderError) {
      console.error("[STRIPE] Order creation failed");
      throw new Error("Failed to create order");
    }

    console.log("[STRIPE] Order created:", order.id);

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

    console.log("[STRIPE] Checkout session created:", session.id);

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
    console.error("[STRIPE] Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
