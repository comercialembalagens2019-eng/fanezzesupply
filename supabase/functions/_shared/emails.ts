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
  /** Delivery city, shown in the timeline ("Entrega em breve (Joinville)"). */
  city?: string;
  createdAt: string;
}

export const SITE_URL = "https://fanezzesupply.com.br";
export const EMAIL_FROM = "FNZ Supply <noreply@fanezzesupply.com.br>";
const SUPPORT_EMAIL = "vendas@fnzsupply.com.br";
// Replies to the no-reply sender reach the sales inbox.
export const EMAIL_REPLY_TO = SUPPORT_EMAIL;
const WHATSAPP = "(47) 99149-0027";

const NAVY = "#1B2845";
const CANVAS = "#F4F5F8";
const MUTED = "#5B6478";
const LINE = "#E8EAF0";
const GREEN = "#15803D";
const GREEN_SOFT = "#DCFCE7";
const AMBER_SOFT = "#FEF3C7";
const AMBER_TEXT = "#92400E";
const ASSETS = `${SITE_URL}/email`;
const WHATSAPP_URL = "https://wa.me/5547991490027";
const FONT = "Manrope,'Segoe UI',Helvetica,Arial,sans-serif";

interface Copy {
  subject: string;
  lead: string;
  highlight: string;
  intro: string;
  after: string;
  status: string;
  /** Timeline: the step that is happening now (0-based). */
  current: number;
}

const COPY: Record<OrderEmailKind, Copy> = {
  paid: {
    subject: "Pedido confirmado",
    lead: "Seu pedido está",
    highlight: "confirmado!",
    intro: "Recebemos o seu pedido e já estamos cuidando de tudo para que ele chegue até você o mais rápido possível.",
    after: "Em breve, você receberá mais informações sobre a entrega.",
    status: "Confirmado",
    current: 1,
  },
  shipped: {
    subject: "Pedido a caminho",
    lead: "Seu pedido está",
    highlight: "a caminho!",
    intro: "Os produtos foram separados, conferidos com cuidado e já seguiram para o endereço de entrega.",
    after: "Quando a entrega for concluída, você recebe uma confirmação por aqui.",
    status: "Enviado",
    current: 2,
  },
  delivered: {
    subject: "Pedido entregue",
    lead: "Seu pedido foi",
    highlight: "entregue!",
    intro: "Esperamos que as embalagens ajudem o seu negócio a crescer.",
    after: "Precisa repor o estoque? Os preços por faixa de quantidade estão sempre no site.",
    status: "Entregue",
    current: 3,
  },
};

const PAYMENT_LABEL: Record<string, string> = { pix: "Pix", card: "Cartão de crédito", boleto: "Boleto" };

const brl = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const unitLabel = (unit: string, quantity: number) => (unit === "unidade" && quantity !== 1 ? "unidades" : unit);

const img = (file: string, width: number, height: number, alt = "", style = "") =>
  `<img src="${ASSETS}/${file}" width="${width}" height="${height}" alt="${alt}" style="display:block;border:0;width:${width}px;height:${height}px;${style}">`;

export const shortOrderId = (orderId: string) => orderId.slice(0, 8).toUpperCase();

export function renderOrderEmail(kind: OrderEmailKind, data: OrderEmailData) {
  const copy = COPY[kind];
  const code = shortOrderId(data.orderId);
  const subject = `${copy.subject} #${code} - FNZ Supply`;
  const tz = { timeZone: "America/Sao_Paulo" } as const;
  const orderDate = new Date(data.createdAt).toLocaleDateString("pt-BR", tz);
  const today = new Date().toLocaleDateString("pt-BR", tz);
  const payment = PAYMENT_LABEL[data.paymentMethod ?? ""] ?? "—";
  const count = data.items.length;
  // B2B customers are companies, so greet by the full trade name.
  const greeting = escapeHtml(data.customerName);
  const city = data.city ? ` (${escapeHtml(data.city)})` : "";

  const timeline = [
    { icon: "icon-confirmed.png", label: "Pedido confirmado", detail: orderDate },
    { icon: "icon-package.png", label: kind === "paid" ? "Em separação" : "Separado", detail: kind === "paid" ? today : "Conferido" },
    { icon: "icon-truck.png", label: kind === "shipped" ? "Saiu para entrega" : kind === "delivered" ? "Enviado" : "Envio", detail: kind === "paid" ? "Em breve" : today },
    { icon: "icon-headset.png", label: kind === "delivered" ? "Entregue" : "Entrega em breve", detail: kind === "delivered" ? today : city.trim() || "Endereço cadastrado" },
  ]
    .map((step, i) => {
      const active = i <= copy.current;
      return `<td class="tl" width="25%" valign="top" style="padding:0 6px;${i > 0 ? `border-left:1px solid ${LINE};` : ""}">
        ${img(step.icon, 28, 28, "", active ? "" : "opacity:0.35;")}
        <div style="margin-top:8px;font-size:12px;font-weight:800;color:${active ? NAVY : MUTED};">${step.label}</div>
        <div style="font-size:12px;color:${MUTED};">${step.detail}</div>
      </td>`;
    })
    .join("");

  const rows = data.items
    .map(
      (item) => `<tr>
      <td style="padding:6px 0;font-size:14px;color:${NAVY};">${escapeHtml(item.productName)} <span style="color:${MUTED};">× ${item.quantity.toLocaleString("pt-BR")}</span><br>
        <span style="color:${MUTED};font-size:12px;">${escapeHtml(unitLabel(item.unit, item.quantity))} a ${brl(item.unitPrice)}</span></td>
      <td align="right" valign="top" style="padding:6px 0;font-size:14px;font-weight:700;color:${NAVY};white-space:nowrap;">${brl(item.totalPrice)}</td>
    </tr>`,
    )
    .join("");

  const gap = (h = 14) => `<tr><td style="height:${h}px;line-height:${h}px;font-size:0;">&nbsp;</td></tr>`;
  const card = (inner: string, pad = "26px") =>
    `<tr><td style="background:#FFFFFF;border-radius:22px;padding:${pad};">${inner}</td></tr>${gap()}`;

  const freeShipping =
    data.shippingAmount > 0
      ? ""
      : `<tr><td style="background:${AMBER_SOFT};border-radius:16px;padding:14px 18px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td valign="middle" style="padding-right:12px;">${img("icon-truck-amber.png", 36, 36)}</td>
            <td valign="middle" style="font-size:14px;color:${AMBER_TEXT};"><b>Frete grátis${city ? ` para ${escapeHtml(data.city!)}` : ""}</b><br><span style="font-size:12px;">Entrega sem custo adicional neste pedido.</span></td>
          </tr></table>
        </td></tr>${gap()}`;

  const feature = (icon: string, label: string) =>
    `<td class="feat" width="33%" valign="middle" style="padding:0 6px;"><table role="presentation" cellpadding="0" cellspacing="0"><tr>
      <td valign="middle" style="padding-right:8px;">${img(icon, 28, 28)}</td>
      <td valign="middle" style="font-size:12px;line-height:1.35;color:${NAVY};">${label}</td></tr></table></td>`;

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light">
<title>${escapeHtml(subject)}</title>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;700;800&display=swap" rel="stylesheet">
<style>
  @media (max-width:600px) {
    .hide-sm { display:none !important; }
    .stack { display:block !important; width:100% !important; }
    .feat { display:block !important; width:100% !important; padding:6px 0 !important; }
    .tl { padding:0 3px !important; font-size:11px !important; }
    .pad { padding:20px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${CANVAS};font-family:${FONT};-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;">${copy.lead} ${copy.highlight} Pedido #${code}, total ${brl(data.totalAmount)}.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CANVAS};padding:24px 10px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

        <tr><td class="pad" style="background:#FFFFFF;border-radius:22px;padding:28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td valign="top"><a href="${SITE_URL}" style="text-decoration:none;">${img("fnz-logo.png", 104, 44, "FNZ Supply", "height:44px;width:auto;")}</a></td>
            <td align="right" valign="top" class="hide-sm" style="font-size:13px;line-height:1.4;color:${MUTED};">Qualidade em<br>cada embalagem.</td>
          </tr></table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;"><tr>
            <td class="stack" valign="top" style="padding-right:12px;">
              ${img("icon-check-badge.png", 40, 40, "Confirmado")}
              <h1 style="margin:14px 0 14px;font-size:30px;line-height:1.15;font-weight:800;color:${NAVY};">${copy.lead} <span style="color:${GREEN};">${copy.highlight}</span></h1>
              <p style="margin:0 0 10px;font-size:15px;font-weight:800;color:${NAVY};">Olá, ${greeting}!</p>
              <p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:${MUTED};">${copy.intro}</p>
              <p style="margin:0;font-size:14px;line-height:1.6;color:${MUTED};">${copy.after}</p>
            </td>
            <td class="hide-sm" width="200" valign="top" align="right">${img("hero.png", 200, 236, "Obrigado por confiar na FNZ Supply!")}</td>
          </tr></table>
        </td></tr>
        ${gap()}

        ${card(`
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td width="52" valign="middle">${img("icon-order.png", 40, 40)}</td>
            <td valign="middle" style="font-size:14px;color:${NAVY};"><b>Pedido #${code}</b><br><span style="font-size:12px;color:${MUTED};">${orderDate} · ${count} ${count === 1 ? "produto" : "produtos"} · ${payment}</span></td>
            <td align="right" valign="middle"><table role="presentation" cellpadding="0" cellspacing="0" style="background:${GREEN_SOFT};border-radius:999px;"><tr>
              <td style="padding:6px 4px 6px 8px;">${img("icon-check-small.png", 18, 18)}</td>
              <td style="padding:6px 12px 6px 2px;font-size:13px;font-weight:800;color:${GREEN};">${copy.status}</td></tr></table></td>
          </tr></table>
          <div style="height:1px;background:${LINE};margin:18px 0;"></div>
          <div style="font-size:16px;font-weight:800;color:${NAVY};margin-bottom:8px;">Resumo do pedido</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${rows}
            <tr><td style="padding:6px 0;font-size:14px;color:${NAVY};">Frete</td><td align="right" style="padding:6px 0;font-size:14px;font-weight:700;color:${data.shippingAmount > 0 ? NAVY : GREEN};">${data.shippingAmount > 0 ? brl(data.shippingAmount) : "Grátis"}</td></tr>
          </table>
          <div style="height:1px;background:${LINE};margin:14px 0;"></div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="font-size:17px;font-weight:800;color:${NAVY};">Total pago</td>
            <td align="right" style="font-size:22px;font-weight:800;color:${NAVY};">${brl(data.totalAmount)}</td>
          </tr></table>
          <p style="margin:10px 0 0;font-size:12px;line-height:1.5;color:${MUTED};">Entrega em: ${escapeHtml(data.address).replace(/(\d+)/g, "$1&#8205;")}<br>A nota fiscal (NF-e) acompanha o seu pedido.</p>
        `)}

        ${card(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${timeline}</tr></table>`, "20px 18px")}

        ${freeShipping}

        <tr><td align="center" style="padding:6px 0 4px;">
          <a href="${SITE_URL}/pedidos" style="display:inline-block;background:${NAVY};color:#FFFFFF;text-decoration:none;font-weight:800;font-size:15px;padding:15px 36px;border-radius:999px;">Acompanhar meu pedido &nbsp;&rarr;</a>
        </td></tr>
        ${gap(20)}

        <tr><td class="pad" style="background:#FFFFFF;border-radius:22px 22px 0 0;padding:26px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td width="56" valign="top">${img("icon-quality.png", 44, 44)}</td>
            <td valign="top" style="font-size:15px;line-height:1.4;color:${NAVY};"><b>Qualidade, agilidade e segurança em cada entrega.</b><br><span style="font-size:13px;color:${MUTED};">Seguimos trabalhando para que seus produtos cheguem com a qualidade que você merece.</span></td>
            <td class="hide-sm" width="170" valign="top" align="right">${img("note-signoff.png", 170, 64, "Conte sempre com a FNZ Supply!")}</td>
          </tr></table>
          <div style="height:1px;background:${LINE};margin:20px 0 16px;"></div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            ${feature("icon-package.png", "Embalagens de<br>alta qualidade")}
            ${feature("icon-truck.png", "Entrega rápida<br>e segura")}
            ${feature("icon-headset.png", `<a href="${WHATSAPP_URL}" style="color:${NAVY};text-decoration:none;">Atendimento<br>especializado</a>`)}
          </tr></table>
        </td></tr>
        <tr><td style="background:${NAVY};border-radius:0 0 22px 22px;padding:20px 26px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td valign="middle">${img("fnz-logo-white.png", 85, 36, "FNZ Supply", "height:36px;width:auto;")}</td>
            <td align="right" valign="middle">
              <a href="${WHATSAPP_URL}" style="display:inline-block;margin-left:14px;">${img("icon-whatsapp-white.png", 22, 22, "WhatsApp")}</a>
              <a href="${SITE_URL}" style="display:inline-block;margin-left:14px;">${img("icon-globe-white.png", 22, 22, "Site")}</a>
            </td>
          </tr></table>
        </td></tr>

        <tr><td style="padding:16px 8px 0;font-size:11px;line-height:1.6;color:${MUTED};text-align:center;">
          Dúvidas? Responda este e-mail ou fale no WhatsApp ${WHATSAPP}.<br>
          FNZ Supply Embalagens · CNPJ 56.008.033/0001-32 · Av. Antonio Ramos Alvim, 1084&#8205; · Joinville/SC
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    `${copy.lead} ${copy.highlight} Pedido #${code}`,
    "",
    `Olá, ${data.customerName}! ${copy.intro}`,
    "",
    ...data.items.map((i) => `- ${i.productName}: ${i.quantity.toLocaleString("pt-BR")} × ${brl(i.unitPrice)} = ${brl(i.totalPrice)}`),
    `Frete: ${data.shippingAmount > 0 ? brl(data.shippingAmount) : "Grátis"}`,
    `Total pago: ${brl(data.totalAmount)} (${payment})`,
    "",
    copy.after,
    "",
    `Entrega: ${data.address}`,
    `Acompanhe: ${SITE_URL}/pedidos`,
    "",
    `Dúvidas: ${SUPPORT_EMAIL} · WhatsApp ${WHATSAPP} (${WHATSAPP_URL})`,
  ].join("\n");

  return { subject, html, text };
}
