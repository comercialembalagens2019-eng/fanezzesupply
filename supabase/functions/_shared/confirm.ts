// Marks an Asaas-paid order as paid and sends the e-mails. Shared by the webhook and the
// status check, which can both see the same payment; only the first one notifies.
import { PAID_STATUSES, orderAmountCents } from "./orders.ts";
import { sendAdminPaymentEmail, sendOrderEmail } from "./notify.ts";

// deno-lint-ignore no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = any;

export interface PaidCharge {
  id: string;
  /** In reais, as Asaas reports it. */
  value: number;
}

export async function confirmOrderPayment(
  supabase: Client,
  orderId: string,
  charge: PaidCharge,
): Promise<"updated" | "already_paid" | "ignored"> {
  const { data: order, error } = await supabase
    .from("orders")
    .select("id, status, total_amount, payment_ref, payment_method")
    .eq("id", orderId)
    .maybeSingle();
  if (error) throw new Error(`Order lookup failed: ${error.message}`);
  if (!order) return "ignored";

  if (order.payment_ref !== charge.id) {
    console.warn("[CONFIRM] Charge does not belong to order", orderId);
    return "ignored";
  }
  if (Math.round(Number(charge.value) * 100) < orderAmountCents(order.total_amount)) {
    console.warn("[CONFIRM] Paid amount lower than order total", orderId);
    return "ignored";
  }
  if (PAID_STATUSES.includes(order.status)) return "already_paid";

  const { error: updateError } = await supabase.rpc("update_order_status", { p_order_id: orderId, p_new_status: "paid" });
  if (updateError) throw new Error(`Order update failed: ${updateError.message}`);

  // order_emails makes the e-mails go out once even if both paths get here.
  if (await sendOrderEmail(supabase, orderId, "paid")) {
    await sendAdminPaymentEmail(orderId, orderAmountCents(order.total_amount), order.payment_method);
  }
  return "updated";
}
