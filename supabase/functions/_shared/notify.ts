// Sends the customer e-mail for an order step (paid / shipped / delivered) through Resend.
// Each kind is claimed in order_emails first, so it goes out at most once per order.
// Never throws: a failed e-mail must not fail the payment or status update that triggered it.
// Resolves true only for the call that sent it, so callers can piggyback one-time work.
import { EMAIL_FROM, EMAIL_REPLY_TO, renderOrderEmail, type OrderEmailKind } from "./emails.ts";

// Structural type so callers on any supabase-js version can pass their client.
// deno-lint-ignore no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = { from: (table: string) => any; auth: { admin: { getUserById: (id: string) => Promise<any> } } };

interface CompanyRow {
  user_id: string | null;
  nome_fantasia: string | null;
  razao_social: string | null;
  email: string | null;
  endereco: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

const formatAddress = (c: CompanyRow) =>
  [
    `${c.endereco}, ${c.numero}${c.complemento ? ` ${c.complemento}` : ""}`,
    c.bairro,
    `${c.cidade}/${c.estado}`,
    c.cep,
  ].join(" · ");

export async function sendOrderEmail(supabase: Client, orderId: string, kind: OrderEmailKind): Promise<boolean> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    console.error("[ORDER-EMAIL] RESEND_API_KEY not configured, skipping", kind);
    return false;
  }

  try {
    const { data: order, error } = await supabase
      .from("orders")
      .select("id, items, total_amount, shipping_amount, payment_method, created_at, companies(*)")
      .eq("id", orderId)
      .maybeSingle();
    if (error || !order) {
      console.error("[ORDER-EMAIL] Order lookup failed:", error?.message ?? "not found");
      return false;
    }

    const company = order.companies as CompanyRow | null;
    let to = company?.email?.trim() || null;
    if (!to && company?.user_id) {
      const { data } = await supabase.auth.admin.getUserById(company.user_id);
      to = data?.user?.email ?? null;
    }
    if (!to) {
      console.error("[ORDER-EMAIL] No recipient for order", orderId);
      return false;
    }

    const { error: claimError } = await supabase.from("order_emails").insert({ order_id: orderId, kind });
    if (claimError) {
      // 23505 = already sent by another request.
      if (claimError.code !== "23505") console.error("[ORDER-EMAIL] Claim failed:", claimError.message);
      return false;
    }

    const email = renderOrderEmail(kind, {
      orderId,
      customerName: company?.nome_fantasia || company?.razao_social || "cliente",
      items: Array.isArray(order.items) ? order.items : [],
      shippingAmount: Number(order.shipping_amount ?? 0),
      totalAmount: Number(order.total_amount),
      paymentMethod: order.payment_method,
      address: company ? formatAddress(company) : "",
      createdAt: order.created_at,
    });

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: EMAIL_FROM, to: [to], reply_to: EMAIL_REPLY_TO, ...email }),
    });
    if (!res.ok) {
      console.error("[ORDER-EMAIL] Resend error", res.status, await res.text());
      // Release the claim so a later retry can send it.
      await supabase.from("order_emails").delete().eq("order_id", orderId).eq("kind", kind);
      return false;
    }
    console.log("[ORDER-EMAIL] Sent", kind, "for order", orderId);
    return true;
  } catch (err) {
    console.error("[ORDER-EMAIL] Unexpected error:", err instanceof Error ? err.message : err);
    return false;
  }
}

const ADMIN_EMAIL = "fanezzesupply@gmail.com";
const METHOD_LABEL: Record<string, string> = { pix: "Pix", boleto: "Boleto", card: "Cartão de crédito" };

// Internal heads-up to the sales inbox that an order was paid.
export async function sendAdminPaymentEmail(orderId: string, amountCents: number, method: string | null): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) return;
  const amount = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amountCents / 100);
  const label = METHOD_LABEL[method ?? ""] ?? "—";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [ADMIN_EMAIL],
        subject: `Novo pagamento ${label} — ${amount}`,
        text: `Pagamento confirmado.\n\nPedido: ${orderId}\nValor: ${amount}\nForma: ${label}\n\nVeja no painel: https://fanezzesupply.com.br/admin`,
      }),
    });
    if (!res.ok) console.error("[ADMIN-EMAIL] Resend error", res.status, await res.text());
  } catch (err) {
    console.error("[ADMIN-EMAIL] Unexpected error:", err instanceof Error ? err.message : err);
  }
}
