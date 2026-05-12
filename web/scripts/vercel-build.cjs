/**
 * Vercel build: migrate Postgres then `next build`.
 * Fails fast if DATABASE_URL is missing so deploys do not silently skip schema.
 */
const { spawnSync } = require("child_process");
const path = require("path");

const root = path.join(__dirname, "..");

function run(cmd, args) {
  const r = spawnSync(cmd, args, {
    stdio: "inherit",
    cwd: root,
    env: process.env,
    shell: process.platform === "win32",
  });
  if (r.status !== 0 && r.status !== null) process.exit(r.status);
  if (r.error) throw r.error;
}

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error(
    "[vercel-build] DATABASE_URL is not set. Add it under Vercel → Project → Settings → Environment Variables (Production and Preview). Use the Supabase URI from Project Settings → Database (append ?sslmode=require if needed).",
  );
  process.exit(1);
}

console.info("[vercel-build] Running drizzle-kit migrate…");
run("npx", ["drizzle-kit", "migrate"]);

console.info("[vercel-build] Running next build…");
run("npx", ["next", "build"]);
