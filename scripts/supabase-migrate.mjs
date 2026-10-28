// Applies pending files in supabase/migrations to the Supabase project through the
// Management API, so CI only needs SUPABASE_ACCESS_TOKEN (no database password).
// Usage: SUPABASE_ACCESS_TOKEN=... SUPABASE_PROJECT_REF=... node scripts/supabase-migrate.mjs [--dry-run]
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = process.env.SUPABASE_PROJECT_REF;
const dryRun = process.argv.includes("--dry-run");
const dir = path.resolve("supabase/migrations");

if (!token || !ref) {
  console.error("SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF are required");
  process.exit(1);
}

async function query(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`Query failed (${res.status}): ${body}`);
  return JSON.parse(body);
}

const quote = (s) => `'${s.replaceAll("'", "''")}'`;

const rows = await query("SELECT version FROM supabase_migrations.schema_migrations");
const applied = new Set(rows.map((r) => r.version));

const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
const pending = files.filter((f) => !applied.has(f.split("_")[0]));

if (pending.length === 0) {
  console.log("Database is up to date.");
  process.exit(0);
}

for (const file of pending) {
  const version = file.split("_")[0];
  const name = file.slice(version.length + 1, -".sql".length);
  console.log(`${dryRun ? "[dry-run] would apply" : "Applying"} ${file}`);
  if (dryRun) continue;
  const sql = await readFile(path.join(dir, file), "utf8");
  // One request per migration, recorded in the same transaction so a failure leaves nothing half-applied.
  await query(
    `BEGIN;\n${sql}\n;\nINSERT INTO supabase_migrations.schema_migrations (version, name) VALUES (${quote(version)}, ${quote(name)});\nCOMMIT;`
  );
}

console.log(`Applied ${dryRun ? 0 : pending.length} migration(s).`);
