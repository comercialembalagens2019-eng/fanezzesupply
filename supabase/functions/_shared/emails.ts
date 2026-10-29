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
const LINE = "#E8EAF0";
const GREEN = "#15803D";
const GREEN_SOFT = "#DCFCE7";
const LOGO_URL = `${SITE_URL}/email/fnz-logo.png`;
const WHATSAPP_URL = "https://wa.me/5547991490027";

interface Copy {
  subject: string;
  badge: string;
  title: string;
  intro: string;
  step: number;
  /** What happens next, shown under the tracker. */
  next: string;
}

const COPY: Record<OrderEmailKind, Copy> = {
  paid: {
    subject: "Pedido confirmado",
    badge: "Pagamento aprovado",
    title: "Pedido confirmado!",
    intro: "Obrigado por escolher a FNZ Supply. Recebemos o seu pagamento e o seu pedido já está na fila de separação.",
    step: 0,
    next: "Vamos separar e conferir seus produtos. Assim que o pedido sair para entrega, avisamos por aqui.",
  },
  shipped: {
    subject: "Pedido a caminho",
    badge: "Saiu para entrega",
    title: "Seu pedido está a caminho",
    intro: "Os produtos foram separados, conferidos e já seguiram para o endereço cadastrado.",
    step: 1,
    next: "Quando a entrega for concluída, você recebe uma confirmação por e-mail.",
  },
  delivered: {
    subject: "Pedido entregue",
    badge: "Entregue",
    title: "Pedido entregue",
    intro: "Seu pedido foi entregue. Esperamos que as embalagens ajudem o seu negócio a crescer!",
    step: 2,
    next: "Precisa repor o estoque? Os preços por faixa de quantidade estão sempre no site.",
  },
};

const STEPS = ["Confirmado", "Enviado", "Entregue"];

const PAYMENT_LABEL: Record<string, string> = { pix: "Pix", card: "Cartão de crédito", boleto: "Boleto" };

const FONT = "Manrope,'Segoe UI',Helvetica,Arial,sans-serif";

const brl = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// Gmail turns street addresses into map links; a zero-width joiner after each digit run
// keeps the text plain without changing what the reader sees.
const noAutoLink = (value: string) => escapeHtml(value).replace(/(\d+)/g, "$1&#8205;");

const unitLabel = (unit: string, quantity: number) => (unit === "unidade" && quantity !== 1 ? "unidades" : unit);

export const shortOrderId = (orderId: string) => orderId.slice(0, 8).toUpperCase();

export function renderOrderEmail(kind: OrderEmailKind, data: OrderEmailData) {
  const copy = COPY[kind];
  const code = shortOrderId(data.orderId);
  const subject = `${copy.subject} #${code} - FNZ Supply`;
  const subtotal = data.items.reduce((sum, item) => sum + item.totalPrice, 0);
  const date = new Date(data.createdAt).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const payment = PAYMENT_LABEL[data.paymentMethod ?? ""] ?? "—";
  // B2B customers are companies, so greet by the full trade name.
  const greeting = escapeHtml(data.customerName);

  const steps = STEPS.map((label, i) => {
    const done = i <= copy.step;
    const connector =
      i < STEPS.length - 1
        ? `<td style="padding:0;" valign="top"><div style="height:2px;margin-top:15px;background:${i < copy.step ? GREEN : LINE};"></div></td>`
        : "";
    return `<td align="center" width="64" style="padding:0;" valign="top">
        <div style="width:32px;height:32px;line-height:32px;border-radius:16px;margin:0 auto;font-weight:800;font-size:14px;background:${done ? GREEN : "#EEF0F4"};color:${done ? "#FFFFFF" : MUTED};">${done ? "&#10003;" : i + 1}</div>
        <div style="margin-top:6px;font-size:12px;font-weight:700;color:${done ? NAVY : MUTED};">${label}</div>
      </td>${connector}`;
  }).join("");

  const rows = data.items
    .map(
      (item) => `<tr>
      <td style="padding:12px 0;border-bottom:1px solid ${LINE};font-size:14px;color:${NAVY};">
        <b>${escapeHtml(item.productName)}</b><br>
        <span style="color:${MUTED};font-size:12px;">${item.quantity.toLocaleString("pt-BR")} ${escapeHtml(unitLabel(item.unit, item.quantity))} × ${brl(item.unitPrice)}</span>
      </td>
      <td align="right" style="padding:12px 0;border-bottom:1px solid ${LINE};font-size:14px;font-weight:700;color:${NAVY};white-space:nowrap;">${brl(item.totalPrice)}</td>
    </tr>`,
    )
    .join("");

  const card = (inner: string, bg = "#FFFFFF") =>
    `<tr><td style="background:${bg};border-radius:20px;padding:24px;">${inner}</td></tr><tr><td style="height:12px;line-height:12px;font-size:0;">&nbsp;</td></tr>`;

  const html = `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:${CANVAS};font-family:${FONT};-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(copy.title)} ${escapeHtml(copy.intro)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CANVAS};padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <tr><td style="padding:0 4px 18px;">
          <a href="${SITE_URL}" style="text-decoration:none;"><img src="${LOGO_URL}" width="104" height="44" alt="FNZ Supply" style="display:block;border:0;height:44px;width:auto;"></a>
        </td></tr>

        ${card(`
          <div style="width:52px;height:52px;line-height:52px;border-radius:26px;background:${GREEN_SOFT};color:${GREEN};font-size:26px;font-weight:800;text-align:center;">&#10003;</div>
          <div style="margin-top:16px;display:inline-block;background:${GREEN_SOFT};color:${GREEN};border-radius:999px;padding:4px 10px;font-size:11px;font-weight:800;letter-spacing:0.4px;text-transform:uppercase;">${copy.badge}</div>
          <h1 style="margin:12px 0 8px;font-size:26px;line-height:1.2;font-weight:800;color:${NAVY};">${copy.title}</h1>
          <p style="margin:0;font-size:15px;line-height:1.6;color:${MUTED};">Olá, ${greeting}! ${escapeHtml(copy.intro)}</p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:18px;"><tr>
            <td style="background:${CANVAS};border-radius:12px;padding:10px 14px;font-size:13px;color:${MUTED};">Pedido <b style="color:${NAVY};">#${code}</b> &nbsp;·&nbsp; ${date} &nbsp;·&nbsp; ${payment}</td>
          </tr></table>
        `)}

        ${card(`
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${steps}</tr></table>
          <p style="margin:18px 0 0;font-size:14px;line-height:1.6;color:${NAVY};"><b>Próximo passo:</b> ${escapeHtml(copy.next)}</p>
        `)}

        ${card(`
          <div style="font-size:16px;font-weight:800;color:${NAVY};margin-bottom:4px;">Resumo do pedido</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${rows}
            <tr><td style="padding:12px 0 0;font-size:14px;color:${MUTED};">Subtotal</td><td align="right" style="padding:12px 0 0;font-size:14px;color:${NAVY};">${brl(subtotal)}</td></tr>
            <tr><td style="padding:4px 0 0;font-size:14px;color:${MUTED};">Frete</td><td align="right" style="padding:4px 0 0;font-size:14px;color:${data.shippingAmount > 0 ? NAVY : GREEN};font-weight:${data.shippingAmount > 0 ? 400 : 700};">${data.shippingAmount > 0 ? brl(data.shippingAmount) : "Grátis"}</td></tr>
            <tr><td style="padding:14px 0 0;font-size:16px;font-weight:800;color:${NAVY};">Total pago</td><td align="right" style="padding:14px 0 0;font-size:20px;font-weight:800;color:${NAVY};">${brl(data.totalAmount)}</td></tr>
          </table>
          <p style="margin:14px 0 0;font-size:12px;color:${MUTED};">A nota fiscal (NF-e) acompanha o seu pedido.</p>
        `)}

        ${card(`
          <div style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:${NAVY};opacity:0.7;">Endereço de entrega</div>
          <div style="margin-top:6px;font-size:14px;line-height:1.5;color:${NAVY};">${noAutoLink(data.address)}</div>
        `, SAND)}

        <tr><td align="center" style="padding:8px 0 4px;">
          <a href="${SITE_URL}/pedidos" style="display:inline-block;background:${NAVY};color:#FFFFFF;text-decoration:none;font-weight:800;font-size:15px;padding:15px 32px;border-radius:12px;">Acompanhar meu pedido</a>
        </td></tr>

        <tr><td style="height:20px;line-height:20px;font-size:0;">&nbsp;</td></tr>
        ${card(`
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="font-size:14px;line-height:1.5;color:${NAVY};"><b>Ficou com alguma dúvida?</b><br><span style="color:${MUTED};">Nossa equipe responde rápido pelo WhatsApp ou por este e-mail.</span></td>
            <td align="right" style="padding-left:12px;white-space:nowrap;"><a href="${WHATSAPP_URL}" style="display:inline-block;border:1.5px solid ${NAVY};color:${NAVY};text-decoration:none;font-weight:800;font-size:13px;padding:10px 16px;border-radius:10px;">WhatsApp</a></td>
          </tr></table>
        `)}

        <tr><td style="padding:12px 8px 0;font-size:12px;line-height:1.6;color:${MUTED};text-align:center;">
          FNZ Supply Embalagens · CNPJ 56.008.033/0001-32<br>
          Av. Antonio Ramos Alvim, 1084&#8205; · Joinville/SC · ${SUPPORT_EMAIL} · ${WHATSAPP}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    `${copy.title} - Pedido #${code}`,
    "",
    `Olá, ${data.customerName}! ${copy.intro}`,
    "",
    ...data.items.map((i) => `- ${i.productName}: ${i.quantity.toLocaleString("pt-BR")} × ${brl(i.unitPrice)} = ${brl(i.totalPrice)}`),
    `Frete: ${data.shippingAmount > 0 ? brl(data.shippingAmount) : "Grátis"}`,
    `Total pago: ${brl(data.totalAmount)} (${payment})`,
    "",
    `Próximo passo: ${copy.next}`,
    "",
    `Entrega: ${data.address}`,
    `Acompanhe: ${SITE_URL}/pedidos`,
    "",
    `Dúvidas: ${SUPPORT_EMAIL} · WhatsApp ${WHATSAPP} (${WHATSAPP_URL})`,
  ].join("\n");

  return { subject, html, text };
}
