import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { createPendingOrder } from "../_shared/orders.ts";

const DEFAULT_ORIGIN = "https://fanezzesupply.com.br";

// Stripe redirects back to this origin, so only accept the site's own hosts.
function resolveOrigin(origin: string | null): string {
  if (!origin) return DEFAULT_ORIGIN;
  try {
    const { protocol, hostname } = new URL(origin);
    const allowed =
      hostname === "fanezzesupply.com.br" ||
      hostname === "www.fanezzesupply.com.br" ||
      hostname.endsWith(".lovable.app") ||
      hostname.endsWith(".lovableproject.com") ||
      hostname === "localhost";
    if (allowed && (protocol === "https:" || hostname === "localhost")) return origin;
  } catch {
    // fall through
  }
  return DEFAULT_ORIGIN;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Only productId and quantity are used; names and prices come from the server catalog.
interface CartItem {
  productId: string;
  quantity: number;
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

    const { items, companyId, customerEmail } = requestData;

    // SECURITY: the order is created and priced server-side; the user must own the company.
    const supabaseServiceClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const created = await createPendingOrder(supabaseServiceClient, {
      userId: user.id,
      companyId,
      items,
      method: "card",
    });
    if ("error" in created) {
      return new Response(
        JSON.stringify({ error: created.error }),
        { status: created.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const order = { id: created.orderId };

    console.log("[STRIPE] Order created:", order.id);

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

    const lineItems = created.lines.map((line) => ({
      price_data: {
        currency: "brl",
        unit_amount: line.unitPriceCents,
        product_data: { name: line.productName },
      },
      quantity: line.quantity,
    }));

    const origin = resolveOrigin(req.headers.get("origin"));

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
    const { error: bindError } = await supabaseServiceClient
      .from("orders")
      .update({ payment_url: session.url, payment_ref: session.id })
      .eq("id", order.id);
    if (bindError) {
      console.error("[STRIPE] Failed to bind session to order:", bindError.message);
    }

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
    console.error("[STRIPE] Error:", error instanceof Error ? error.message : String(error));
    return new Response(
      JSON.stringify({ error: "Erro interno ao criar checkout" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
