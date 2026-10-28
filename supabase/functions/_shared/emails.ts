// Customer e-mails for order updates (Resend). Pure functions, so the same templates
// run in edge functions (Deno) and in scripts/send-test-email.mjs (Node).

export type OrderEmailKind = "paid" | "shipped" | "delivered";

export interface OrderEmailItem {
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderEmailData {
  orderId: string;
  customerName: string;
  items: OrderEmailItem[];
  shippingAmount: number;
  totalAmount: number;
  paymentMethod: "pix" | "card" | "boleto" | string | null;
  address: string;
  createdAt: string;
}

export const SITE_URL = "https://fanezzesupply.com.br";
export const EMAIL_FROM = "FNZ Supply <noreply@fanezzesupply.com.br>";
const SUPPORT_EMAIL = "vendas@fnzsupply.com.br";
// Replies to the no-reply sender reach the sales inbox.
export const EMAIL_REPLY_TO = SUPPORT_EMAIL;
const WHATSAPP = "(47) 99149-0027";

const NAVY = "#1B2845";
const SAND = "#F5E6D3";
const CANVAS = "#F4F5F8";
const MUTED = "#5B6478";

const COPY: Record<OrderEmailKind, { subject: string; title: string; intro: string; step: number }> = {
  paid: {
    subject: "Pedido recebido",
    title: "Recebemos o seu pagamento",
    intro: "Seu pedido foi confirmado e já entrou na nossa fila de separação. Avisaremos assim que ele sair para entrega.",
    step: 0,
  },
  shipped: {
    subject: "Pedido enviado",
    title: "Seu pedido saiu para entrega",
    intro: "Os produtos já foram separados e estão a caminho do endereço cadastrado.",
    step: 1,
  },
  delivered: {
    subject: "Pedido entregue",
    title: "Pedido entregue",
    intro: "Seu pedido foi entregue. Obrigado por comprar com a FNZ Supply! Se precisar de algo, é só responder este e-mail.",
    step: 2,
  },
};

const STEPS = ["Recebido", "Enviado", "Entregue"];

const PAYMENT_LABEL: Record<string, string> = { pix: "PIX", card: "Cartão de crédito", boleto: "Boleto" };

const brl = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const unitLabel = (unit: string, quantity: number) => (unit === "unidade" && quantity !== 1 ? "unidades" : unit);

export const shortOrderId = (orderId: string) => orderId.slice(0, 8).toUpperCase();

export function renderOrderEmail(kind: OrderEmailKind, data: OrderEmailData) {
  const copy = COPY[kind];
  const code = shortOrderId(data.orderId);
  const subject = `${copy.subject} #${code} — FNZ Supply`;
  const subtotal = data.items.reduce((sum, item) => sum + item.totalPrice, 0);
  const date = new Date(data.createdAt).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const payment = PAYMENT_LABEL[data.paymentMethod ?? ""] ?? "—";
  // B2B customers are companies, so greet by the full trade name.
  const greeting = escapeHtml(data.customerName);

  const steps = STEPS.map((label, i) => {
    const done = i <= copy.step;
    return `<td align="center" style="padding:0 4px;">
      <div style="width:32px;height:32px;line-height:32px;border-radius:16px;margin:0 auto;font-weight:800;font-size:14px;background:${done ? NAVY : "#E3E6EE"};color:${done ? "#FFFFFF" : MUTED};">${done ? "✓" : i + 1}</div>
      <div style="margin-top:6px;font-size:12px;font-weight:700;color:${done ? NAVY : MUTED};">${label}</div>
    </td>`;
  }).join("");

  const rows = data.items
    .map(
      (item) => `<tr>
      <td style="padding:10px 0;border-bottom:1px solid #EEF0F4;font-size:14px;color:${NAVY};">
        <b>${escapeHtml(item.productName)}</b><br>
        <span style="color:${MUTED};font-size:12px;">${item.quantity.toLocaleString("pt-BR")} ${escapeHtml(unitLabel(item.unit, item.quantity))} × ${brl(item.unitPrice)}</span>
      </td>
      <td align="right" style="padding:10px 0;border-bottom:1px solid #EEF0F4;font-size:14px;font-weight:700;color:${NAVY};white-space:nowrap;">${brl(item.totalPrice)}</td>
    </tr>`
    )
    .join("");

  const html = `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:${CANVAS};font-family:Manrope,Segoe UI,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(copy.intro)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CANVAS};padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <tr><td style="padding:0 4px 16px;font-size:18px;font-weight:800;color:${NAVY};">FNZ Supply</td></tr>

        <tr><td style="background:${NAVY};border-radius:24px;padding:28px;color:#FFFFFF;">
          <div style="display:inline-block;background:rgba(255,255,255,0.12);border-radius:999px;padding:6px 12px;font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">Pedido #${code}</div>
          <h1 style="margin:16px 0 8px;font-size:26px;line-height:1.2;font-weight:800;color:#FFFFFF;">${copy.title}</h1>
          <p style="margin:0;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.8);">Olá, ${greeting}! ${escapeHtml(copy.intro)}</p>
        </td></tr>

        <tr><td style="height:12px;"></td></tr>
        <tr><td style="background:#FFFFFF;border-radius:24px;padding:20px 12px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${steps}</tr></table>
        </td></tr>

        <tr><td style="height:12px;"></td></tr>
        <tr><td style="background:#FFFFFF;border-radius:24px;padding:24px;">
          <div style="font-size:16px;font-weight:800;color:${NAVY};margin-bottom:4px;">Resumo do pedido</div>
          <div style="font-size:12px;color:${MUTED};margin-bottom:8px;">Feito em ${date} · ${payment}</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${rows}
            <tr><td style="padding:10px 0 0;font-size:14px;color:${MUTED};">Subtotal</td><td align="right" style="padding:10px 0 0;font-size:14px;color:${NAVY};">${brl(subtotal)}</td></tr>
            <tr><td style="padding:4px 0 0;font-size:14px;color:${MUTED};">Frete</td><td align="right" style="padding:4px 0 0;font-size:14px;color:${NAVY};">${data.shippingAmount > 0 ? brl(data.shippingAmount) : "Grátis"}</td></tr>
            <tr><td style="padding:12px 0 0;font-size:16px;font-weight:800;color:${NAVY};">Total</td><td align="right" style="padding:12px 0 0;font-size:18px;font-weight:800;color:${NAVY};">${brl(data.totalAmount)}</td></tr>
          </table>
        </td></tr>

        <tr><td style="height:12px;"></td></tr>
        <tr><td style="background:${SAND};border-radius:24px;padding:20px 24px;">
          <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:${NAVY};opacity:0.7;">Entrega</div>
          <div style="margin-top:6px;font-size:14px;line-height:1.5;color:${NAVY};">${escapeHtml(data.address)}</div>
        </td></tr>

        <tr><td style="height:20px;"></td></tr>
        <tr><td align="center">
          <a href="${SITE_URL}/pedidos" style="display:inline-block;background:${NAVY};color:#FFFFFF;text-decoration:none;font-weight:800;font-size:14px;padding:14px 28px;border-radius:12px;">Acompanhar pedido</a>
        </td></tr>

        <tr><td style="padding:24px 8px 0;font-size:12px;line-height:1.6;color:${MUTED};text-align:center;">
          Dúvidas? Responda este e-mail, escreva para <a href="mailto:${SUPPORT_EMAIL}" style="color:${NAVY};">${SUPPORT_EMAIL}</a> ou chame no WhatsApp ${WHATSAPP}.<br>
          FNZ Supply · Av. Antonio Ramos Alvim, 1084 · Joinville/SC
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    `${copy.title} — Pedido #${code}`,
    "",
    `Olá, ${data.customerName}! ${copy.intro}`,
    "",
    ...data.items.map((i) => `- ${i.productName}: ${i.quantity.toLocaleString("pt-BR")} × ${brl(i.unitPrice)} = ${brl(i.totalPrice)}`),
    `Frete: ${data.shippingAmount > 0 ? brl(data.shippingAmount) : "Grátis"}`,
    `Total: ${brl(data.totalAmount)} (${payment})`,
    "",
    `Entrega: ${data.address}`,
    `Acompanhe: ${SITE_URL}/pedidos`,
    "",
    `Dúvidas: ${SUPPORT_EMAIL} · WhatsApp ${WHATSAPP}`,
  ].join("\n");

  return { subject, html, text };
}
