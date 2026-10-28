// Server-side order creation. Clients cannot insert orders directly (see RLS),
// so every order is priced from the trusted catalog here.
import { priceOrder, type PricedOrderLine } from "./catalog.ts";

// Functions pin different supabase-js versions, so accept any client structurally.
// deno-lint-ignore no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = { from: (table: string) => any };

export type PaymentMethod = "pix" | "card" | "boleto";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUUID(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

export interface CreatedOrder {
  orderId: string;
  totalCents: number;
  lines: PricedOrderLine[];
}

export async function createPendingOrder(
  serviceClient: SupabaseClient,
  params: { userId: string; companyId: unknown; items: unknown; method: PaymentMethod },
): Promise<CreatedOrder | { error: string; status: number }> {
  if (!isValidUUID(params.companyId)) {
    return { error: "Empresa inválida", status: 400 };
  }

  const { data: company, error: companyError } = await serviceClient
    .from("companies")
    .select("user_id")
    .eq("id", params.companyId)
    .maybeSingle();

  if (companyError) {
    console.error("[ORDERS] Company lookup failed:", companyError.message);
    return { error: "Erro ao verificar empresa", status: 500 };
  }
  if (!company || company.user_id !== params.userId) {
    return { error: "Empresa não encontrada", status: 403 };
  }

  const priced = priceOrder(params.items);
  if ("error" in priced) {
    return { error: priced.error, status: 400 };
  }

  const orderItems = priced.lines.map((line) => ({
    productId: line.productId,
    productName: line.productName,
    quantity: line.quantity,
    unit: line.unit,
    unitPrice: line.unitPriceCents / 100,
    totalPrice: line.totalCents / 100,
  }));

  const { data: order, error: orderError } = await serviceClient
    .from("orders")
    .insert({
      company_id: params.companyId,
      total_amount: priced.totalCents / 100,
      status: "pending",
      items: orderItems,
      payment_method: params.method,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    console.error("[ORDERS] Order insert failed:", orderError?.message);
    return { error: "Erro ao criar pedido", status: 500 };
  }

  return { orderId: order.id, totalCents: priced.totalCents, lines: priced.lines };
}

// Used when the payment provider rejects the charge, so no orphan pending order remains.
export async function discardOrder(serviceClient: SupabaseClient, orderId: string) {
  const { error } = await serviceClient.from("orders").delete().eq("id", orderId);
  if (error) console.error("[ORDERS] Failed to discard order:", error.message);
}

export function orderAmountCents(totalAmount: number | string): number {
  return Math.round(Number(totalAmount) * 100);
}
