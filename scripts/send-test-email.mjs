// Sends a sample order e-mail through Resend so the copy and layout can be reviewed.
// Usage: RESEND_API_KEY=... node --experimental-strip-types scripts/send-test-email.mjs <to> [paid|shipped|delivered|all] [--dry-run]
import { writeFile } from "node:fs/promises";
import { EMAIL_FROM, EMAIL_REPLY_TO, renderOrderEmail } from "../supabase/functions/_shared/emails.ts";

const [to, kindArg = "paid"] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const dryRun = process.argv.includes("--dry-run");
if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
  console.error("Usage: send-test-email.mjs <to> [paid|shipped|delivered|all]");
  process.exit(1);
}

const sample = {
  orderId: "a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
  customerName: "Loja Exemplo",
  items: [
    { productName: "Envelope COEX - 19x25", quantity: 1000, unit: "unidade", unitPrice: 0.24, totalPrice: 240 },
    { productName: "Envelope Cinza - 32x40", quantity: 500, unit: "unidade", unitPrice: 0.36, totalPrice: 180 },
    { productName: "Stretch 4kg", quantity: 500, unit: "kg", unitPrice: 26.9, totalPrice: 13450 },
  ],
  shippingAmount: 19.9,
  totalAmount: 13889.9,
  paymentMethod: "pix",
  address: "Rua das Flores, 123 · Centro · Curitiba/PR · 80010-000",
  createdAt: new Date().toISOString(),
};

const kinds = kindArg === "all" ? ["paid", "shipped", "delivered"] : [kindArg];
for (const kind of kinds) {
  const email = renderOrderEmail(kind, sample);
  const subject = `[TESTE] ${email.subject}`;
  if (dryRun) {
    await writeFile(`email-preview-${kind}.html`, email.html);
    console.log(`Rendered ${kind}: ${subject}`);
    continue;
  }
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error("RESEND_API_KEY is not set");
    process.exit(1);
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: EMAIL_FROM, reply_to: EMAIL_REPLY_TO, to: [to], subject, html: email.html, text: email.text }),
  });
  const body = await res.text();
  if (!res.ok) {
    console.error(`Resend error (${res.status}): ${body}`);
    process.exit(1);
  }
  console.log(`Sent ${kind} to ${to}: ${body}`);
}
