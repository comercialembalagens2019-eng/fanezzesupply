// Points fanezzesupply.com.br and www at the Cloudflare Pages project. Only the site's
// A/AAAA/CNAME records on the apex and www are replaced; MX/TXT (Resend DKIM, SPF) stay.
// Usage: CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=... node scripts/cloudflare-domain.mjs
const token = process.env.CLOUDFLARE_API_TOKEN;
const account = process.env.CLOUDFLARE_ACCOUNT_ID;
const PROJECT = "fnzsupply";
const ZONE = "fanezzesupply.com.br";
const TARGET = `${PROJECT}.pages.dev`;
const HOSTS = [ZONE, `www.${ZONE}`];

if (!token || !account) {
  console.error("CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID are required");
  process.exit(1);
}

async function cf(method, path, body) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  return { ok: res.ok && json.success, json };
}

// 1. Attach both hostnames to the Pages project (already attached is fine).
for (const name of HOSTS) {
  const { ok, json } = await cf("POST", `/accounts/${account}/pages/projects/${PROJECT}/domains`, { name });
  const already = json.errors?.some((e) => /already/i.test(e.message));
  if (!ok && !already) throw new Error(`Pages domain ${name}: ${JSON.stringify(json.errors)}`);
  console.log(`Pages domain ${name}: ${ok ? "added" : "already attached"}`);
}

// 2. Replace the site records with proxied CNAMEs to the Pages project.
const zones = await cf("GET", `/zones?name=${ZONE}`);
const zoneId = zones.json.result?.[0]?.id;
if (!zoneId) throw new Error(`Zone ${ZONE} not found: ${JSON.stringify(zones.json.errors)}`);

for (const name of HOSTS) {
  const existing = await cf("GET", `/zones/${zoneId}/dns_records?name=${name}&per_page=100`);
  if (!existing.ok) throw new Error(`List ${name}: ${JSON.stringify(existing.json.errors)}`);
  const site = existing.json.result.filter((r) => ["A", "AAAA", "CNAME"].includes(r.type));
  if (site.length === 1 && site[0].type === "CNAME" && site[0].content === TARGET && site[0].proxied) {
    console.log(`${name}: already CNAME -> ${TARGET}`);
    continue;
  }
  for (const r of site) {
    const del = await cf("DELETE", `/zones/${zoneId}/dns_records/${r.id}`);
    if (!del.ok) throw new Error(`Delete ${r.type} ${name}: ${JSON.stringify(del.json.errors)}`);
    console.log(`${name}: removed ${r.type} ${r.content}`);
  }
  const add = await cf("POST", `/zones/${zoneId}/dns_records`, {
    type: "CNAME",
    name,
    content: TARGET,
    proxied: true,
    ttl: 1,
    comment: "Cloudflare Pages (fnzsupply)",
  });
  if (!add.ok) throw new Error(`Create CNAME ${name}: ${JSON.stringify(add.json.errors)}`);
  console.log(`${name}: CNAME -> ${TARGET} (proxied)`);
}
