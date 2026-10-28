// Exports every table in the public schema plus auth accounts to JSON files, through the
// Management API (only SUPABASE_ACCESS_TOKEN needed). The schema itself lives in
// supabase/migrations, so these files plus the migrations are enough to rebuild the database.
// Usage: SUPABASE_ACCESS_TOKEN=... SUPABASE_PROJECT_REF=... node scripts/supabase-backup.mjs <out-dir>
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = process.env.SUPABASE_PROJECT_REF;
const outDir = path.resolve(process.argv[2] ?? "backup");

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

await mkdir(outDir, { recursive: true });

const tables = await query(
  "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
);

const summary = {};
for (const { tablename } of tables) {
  const [{ rows }] = await query(
    `SELECT coalesce(json_agg(t), '[]'::json) AS rows FROM public."${tablename.replaceAll('"', '""')}" t`
  );
  await writeFile(path.join(outDir, `${tablename}.json`), JSON.stringify(rows, null, 2));
  summary[tablename] = rows.length;
}

// Password hashes are kept so accounts can be restored with their current logins.
const [{ rows: users }] = await query(
  `SELECT coalesce(json_agg(u), '[]'::json) AS rows FROM (
     SELECT id, email, encrypted_password, email_confirmed_at, created_at, updated_at,
            last_sign_in_at, raw_app_meta_data, raw_user_meta_data
     FROM auth.users ORDER BY created_at
   ) u`
);
await writeFile(path.join(outDir, "auth_users.json"), JSON.stringify(users, null, 2));
summary.auth_users = users.length;

await writeFile(
  path.join(outDir, "manifest.json"),
  JSON.stringify({ project: ref, created_at: new Date().toISOString(), rows: summary }, null, 2)
);
console.log("Backup rows:", summary);
