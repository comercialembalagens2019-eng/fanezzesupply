// Registers the AbacatePay webhook that confirms payments, so nothing is set up by hand
// in the dashboard. AbacatePay never returns a webhook's secret and has no update route,
// so an existing webhook for our endpoint is replaced. Safe to re-run on every deploy.
// Usage: ABACATEPAY_API_KEY=... ABACATEPAY_WEBHOOK_SECRET=... SUPABASE_PROJECT_REF=... node scripts/abacatepay-webhook.mjs
const apiKey = process.env.ABACATEPAY_API_KEY;
const secret = process.env.ABACATEPAY_WEBHOOK_SECRET;
const ref = process.env.SUPABASE_PROJECT_REF;

if (!apiKey) {
  console.log("ABACATEPAY_API_KEY not set; skipping webhook setup.");
  process.exit(0);
}
if (!secret || !ref) {
  console.error("ABACATEPAY_WEBHOOK_SECRET and SUPABASE_PROJECT_REF are required");
  process.exit(1);
}

const endpoint = `https://${ref}.supabase.co/functions/v1/abacate-webhook`;

async function call(method, path, body) {
  const res = await fetch(`https://api.abacatepay.com/v2${path}`, {
    method,
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new Error(`${method} ${path} failed (${res.status}): ${json.error ?? "sem detalhes"}`);
  }
  return json.data;
}

const store = await call("GET", "/stores/get").catch((e) => ({ name: `(não foi possível ler: ${e.message})` }));
console.log(`Loja AbacatePay: ${store.name}`);

const existing = ((await call("GET", "/webhooks/list")) ?? []).filter((w) => w.endpoint === endpoint);
for (const w of existing) {
  await call("POST", `/webhooks/delete?id=${encodeURIComponent(w.id)}`);
  console.log(`Removed old webhook ${w.id}`);
}

const created = await call("POST", "/webhooks/create", {
  name: "FNZ Supply - pagamentos",
  endpoint,
  secret,
  events: ["transparent.completed"],
});
console.log(`AbacatePay webhook ${created.devMode ? "(dev mode)" : "(produção)"} registered: ${endpoint}`);
