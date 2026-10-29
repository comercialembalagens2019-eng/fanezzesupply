// Resend's Forge sending uses a single CNAME on send.<domain>. The older setup left an MX
// and an SPF TXT on the same name, which cannot coexist with a CNAME, so Resend reports
// "Action needed". Removes those two records only when the Forge CNAME is in place.
// Usage: CLOUDFLARE_API_TOKEN=... node scripts/cloudflare-resend-dns.mjs
const token = process.env.CLOUDFLARE_API_TOKEN;
const ZONE = "fanezzesupply.com.br";
const NAME = `send.${ZONE}`;
const FORGE = "send.forge.rmta.net";

if (!token) {
  console.error("CLOUDFLARE_API_TOKEN is required");
  process.exit(1);
}

async function cf(method, path) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(`${method} ${path}: ${JSON.stringify(json.errors)}`);
  return json.result;
}

const [zone] = await cf("GET", `/zones?name=${ZONE}`);
if (!zone) throw new Error(`Zone ${ZONE} not found`);

const records = await cf("GET", `/zones/${zone.id}/dns_records?name=${NAME}&per_page=100`);
for (const r of records) console.log(`found ${r.type} ${r.name} -> ${r.content}`);

if (!records.some((r) => r.type === "CNAME" && r.content === FORGE)) {
  console.log(`No CNAME ${NAME} -> ${FORGE}; leaving records untouched.`);
  process.exit(0);
}

const stale = records.filter(
  (r) =>
    (r.type === "MX" && /amazonses\.com$/.test(r.content)) ||
    (r.type === "TXT" && /^"?v=spf1 include:amazonses\.com/.test(r.content))
);
for (const r of stale) {
  await cf("DELETE", `/zones/${zone.id}/dns_records/${r.id}`);
  console.log(`removed ${r.type} ${r.content}`);
}
if (!stale.length) console.log("Nothing to remove.");
