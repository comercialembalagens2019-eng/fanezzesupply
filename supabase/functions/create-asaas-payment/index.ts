// Creates the order server-side and its Asaas charge (Pix, boleto or card).
// Pix returns the QR code; boleto the PDF link and linha digitável; card the Asaas
// payment page, so card data never touches our site.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { createPendingOrder, discardOrder, type PaymentMethod } from "../_shared/orders.ts";
import { asaas, AsaasError, dueDate, ensureAsaasCustomer, type AsaasBillingType, type AsaasCompany } from "../_shared/asaas.ts";
import { shortOrderId } from "../_shared/emails.ts";

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

const BILLING: Record<PaymentMethod, AsaasBillingType> = { pix: "PIX", boleto: "BOLETO", card: "CREDIT_CARD" };
// Boleto takes days to clear; Pix and card are paid right away.
const DUE_DAYS: Record<PaymentMethod, number> = { pix: 1, boleto: 3, card: 1 };

interface AsaasPayment {
  id: string;
  invoiceUrl: string;
  bankSlipUrl?: string | null;
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

    const apiKey = Deno.env.get("ASAAS_API_KEY");
    if (!apiKey) {
      console.error("[ASAAS] ASAAS_API_KEY not configured");
      return jsonResponse({ error: "Pagamento indisponível no momento. Tente novamente mais tarde." }, 503);
    }

    const { companyId, items, method } = await req.json().catch(() => ({}));
    if (!(method in BILLING)) return jsonResponse({ error: "Forma de pagamento inválida" }, 400);

    const created = await createPendingOrder(serviceClient, { userId: userData.user.id, companyId, items, method });
    if ("error" in created) return jsonResponse({ error: created.error }, created.status);
    orderId = created.orderId;

    const { data: company, error: companyError } = await serviceClient
      .from("companies")
      .select("id, razao_social, cnpj, email, whatsapp, cep, endereco, numero, complemento, bairro")
      .eq("id", companyId)
      .single();
    if (companyError || !company) throw new Error("Company lookup failed");

    const customer = await ensureAsaasCustomer(apiKey, company as AsaasCompany);
    const payment = await asaas<AsaasPayment>(apiKey, "POST", "/payments", {
      customer,
      billingType: BILLING[method as PaymentMethod],
      value: created.totalCents / 100,
      dueDate: dueDate(DUE_DAYS[method as PaymentMethod]),
      description: `Pedido #${shortOrderId(created.orderId)} — FNZ Supply`,
      // The webhook resolves the order from this id.
      externalReference: created.orderId,
    });

    // Bind the charge to the order: the webhook and status check only accept this charge.
    const { error: bindError } = await serviceClient
      .from("orders")
      .update({ payment_ref: payment.id, payment_url: payment.invoiceUrl })
      .eq("id", created.orderId);
    if (bindError) throw new Error(`Bind failed: ${bindError.message}`);

    const response: Record<string, unknown> = {
      orderId: created.orderId,
      method,
      totalCents: created.totalCents,
      invoiceUrl: payment.invoiceUrl,
    };

    if (method === "pix") {
      const qr = await asaas<{ encodedImage: string; payload: string; expirationDate: string }>(
        apiKey, "GET", `/payments/${payment.id}/pixQrCode`,
      );
      response.pix = { image: `data:image/png;base64,${qr.encodedImage}`, payload: qr.payload, expiresAt: qr.expirationDate };
    } else if (method === "boleto") {
      const field = await asaas<{ identificationField: string }>(
        apiKey, "GET", `/payments/${payment.id}/identificationField`,
      ).catch(() => null);
      response.boleto = { url: payment.bankSlipUrl ?? payment.invoiceUrl, identificationField: field?.identificationField ?? null };
    }

    console.log("[ASAAS] Charge created", method, payment.id, "order", created.orderId);
    return jsonResponse(response, 200);
  } catch (error) {
    if (orderId) await discardOrder(serviceClient, orderId);
    if (error instanceof AsaasError) {
      console.error("[ASAAS] Provider error", error.status, error.message);
      return jsonResponse({ error: error.message }, error.status >= 500 ? 502 : 400);
    }
    console.error("[ASAAS] Error:", error instanceof Error ? error.message : error);
    return jsonResponse({ error: "Erro interno ao criar pagamento" }, 500);
  }
});
