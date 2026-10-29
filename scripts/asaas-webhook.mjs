// Registers (or updates) the Asaas webhook that confirms payments, so nothing has to be
// set up by hand in the Asaas dashboard. Safe to re-run on every deploy.
// Usage: ASAAS_API_KEY=... ASAAS_WEBHOOK_TOKEN=... SUPABASE_PROJECT_REF=... node scripts/asaas-webhook.mjs
const apiKey = process.env.ASAAS_API_KEY;
const authToken = process.env.ASAAS_WEBHOOK_TOKEN;
const ref = process.env.SUPABASE_PROJECT_REF;

if (!apiKey) {
  console.log("ASAAS_API_KEY not set; skipping webhook setup.");
  process.exit(0);
}
if (!authToken || !ref) {
  console.error("ASAAS_WEBHOOK_TOKEN and SUPABASE_PROJECT_REF are required");
  process.exit(1);
}

const sandbox = apiKey.startsWith("$aact_hmlg_");
const base = sandbox ? "https://api-sandbox.asaas.com/v3" : "https://api.asaas.com/v3";
const url = `https://${ref}.supabase.co/functions/v1/asaas-webhook`;

async function call(method, path, body) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { access_token: apiKey, "User-Agent": "fnz-supply", "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} failed (${res.status}): ${text}`);
  return text ? JSON.parse(text) : {};
}

const config = {
  name: "FNZ Supply - pagamentos",
  url,
  email: "fanezzesupply@gmail.com",
  enabled: true,
  interrupted: false,
  apiVersion: 3,
  authToken,
  sendType: "SEQUENTIALLY",
  events: ["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"],
};

const list = await call("GET", "/webhooks?limit=100");
const existing = (list.data ?? []).find((w) => w.url === url);
if (existing) {
  await call("PUT", `/webhooks/${existing.id}`, config);
  console.log(`Asaas webhook updated (${sandbox ? "sandbox" : "produção"}): ${url}`);
} else {
  await call("POST", "/webhooks", config);
  console.log(`Asaas webhook created (${sandbox ? "sandbox" : "produção"}): ${url}`);
}
