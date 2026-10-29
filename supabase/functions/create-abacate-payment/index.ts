// Creates the order server-side and its AbacatePay charge (transparent checkout):
// Pix returns the QR code; boleto the PDF link, linha digitável and a Pix alternative.
// Card only creates the order and returns the amount and payer for abacatepay.js;
// pay-abacate-card then charges the card token the browser produced.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { createPendingOrder, discardOrder } from "../_shared/orders.ts";
import { abacate, AbacateError, formatCellphone } from "../_shared/abacatepay.ts";
import { dueDate } from "../_shared/asaas.ts";
import { shortOrderId } from "../_shared/emails.ts";
import { testCompanyFor } from "../_shared/testOrder.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const METHODS = { pix: "PIX", boleto: "BOLETO", card: "CARD" } as const;
type Method = keyof typeof METHODS;

interface Charge {
  id: string;
  brCode?: string;
  brCodeBase64?: string;
  expiresAt?: string;
  barCode?: string;
  url?: string;
  pix?: { brCode: string; brCodeBase64: string };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  let orderId: string | null = null;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return jsonResponse({ error: "Unauthorized" }, 401);
    const authClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: userData, error: authErr } = await authClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authErr || !userData?.user) return jsonResponse({ error: "Unauthorized" }, 401);

    const apiKey = Deno.env.get("ABACATEPAY_API_KEY");
    if (!apiKey) {
      console.error("[ABACATE] ABACATEPAY_API_KEY not configured");
      return jsonResponse({ error: "Pagamento indisponível no momento. Tente novamente mais tarde." }, 503);
    }

    const body = await req.json().catch(() => ({}));
    const { items, method } = body;
    if (!(method in METHODS)) return jsonResponse({ error: "Forma de pagamento inválida" }, 400);

    let companyId = body.companyId;
    if (body.testOrder === true) {
      const test = await testCompanyFor(serviceClient, userData.user, items);
      if ("error" in test) return jsonResponse({ error: test.error }, 400);
      companyId = test.id;
    }

    const created = await createPendingOrder(serviceClient, { userId: userData.user.id, companyId, items, method });
    if ("error" in created) return jsonResponse({ error: created.error }, created.status);
    orderId = created.orderId;

    const { data: company, error: companyError } = await serviceClient
      .from("companies")
      .select("razao_social, cnpj, email, whatsapp")
      .eq("id", companyId)
      .single();
    if (companyError || !company) throw new Error("Company lookup failed");

    const data: Record<string, unknown> = {
      amount: created.totalCents,
      // AbacatePay rejects some typographic characters (e.g. em dash) in descriptions.
      description: `Pedido ${shortOrderId(created.orderId)} - FNZ Supply`,
      customer: {
        name: company.razao_social,
        email: company.email,
        taxId: company.cnpj.replace(/\D/g, ""),
        cellphone: formatCellphone(company.whatsapp),
      },
      metadata: { orderId: created.orderId },
    };
    if (method === "pix") data.expiresIn = 86_400; // one day to pay
    else data.dueDate = dueDate(3);

    if (method === "card") {
      return jsonResponse({ orderId: created.orderId, method, totalCents: created.totalCents, customer: data.customer }, 200);
    }

    const charge = await abacate<Charge>(apiKey, "POST", "/transparents/create", {
      method: METHODS[method as Method],
      data,
    });

    // Bind the charge to the order: the webhook and status check only accept this charge.
    const { error: bindError } = await serviceClient
      .from("orders")
      .update({ payment_ref: charge.id, payment_url: charge.url ?? null })
      .eq("id", created.orderId);
    if (bindError) throw new Error(`Bind failed: ${bindError.message}`);

    const response: Record<string, unknown> = { orderId: created.orderId, method, totalCents: created.totalCents };
    if (method === "pix") {
      response.pix = { image: charge.brCodeBase64, payload: charge.brCode, expiresAt: charge.expiresAt };
    } else {
      response.boleto = {
        url: charge.url,
        identificationField: charge.barCode ?? null,
        pix: charge.pix ? { image: charge.pix.brCodeBase64, payload: charge.pix.brCode } : null,
      };
    }

    console.log("[ABACATE] Charge created", method, charge.id, "order", created.orderId);
    return jsonResponse(response, 200);
  } catch (error) {
    if (orderId) await discardOrder(serviceClient, orderId);
    if (error instanceof AbacateError) {
      console.error("[ABACATE] Provider error", error.status, error.message);
      return jsonResponse({ error: "Não foi possível gerar a cobrança. Tente novamente em instantes." }, 502);
    }
    console.error("[ABACATE] Error:", error instanceof Error ? error.message : error);
    return jsonResponse({ error: "Erro interno ao criar pagamento" }, 500);
  }
});
