// Prints which Asaas account the ASAAS_API_KEY secret belongs to (the account that
// receives the money), so it can be checked without opening the dashboard.
// Usage: ASAAS_API_KEY=... node scripts/asaas-account.mjs
const apiKey = process.env.ASAAS_API_KEY;
if (!apiKey) {
  console.error("ASAAS_API_KEY is required");
  process.exit(1);
}
const sandbox = apiKey.startsWith("$aact_hmlg_");
const base = sandbox ? "https://api-sandbox.asaas.com/v3" : "https://api.asaas.com/v3";

async function get(path) {
  const res = await fetch(`${base}${path}`, { headers: { access_token: apiKey, "User-Agent": "fnz-supply" } });
  return { ok: res.ok, status: res.status, body: await res.json().catch(() => ({})) };
}

const mask = (doc) => (doc ? `${doc.slice(0, 3)}…${doc.slice(-2)} (${doc.replace(/\D/g, "").length} dígitos)` : "—");
const info = await get("/myAccount/commercialInfo");
const account = await get("/myAccount");
const src = info.ok ? info.body : account.body;
console.log(`Ambiente: ${sandbox ? "sandbox" : "produção"}`);
console.log(`Tipo de pessoa: ${src.personType ?? "—"}`);
console.log(`Nome: ${src.name ?? "—"}`);
console.log(`Razão social: ${src.companyName ?? "—"}`);
console.log(`CPF/CNPJ: ${mask(src.cpfCnpj)}`);
if (!info.ok && !account.ok) console.log(`Consulta falhou: ${info.status} / ${account.status}`);
