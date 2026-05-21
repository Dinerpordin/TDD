# Autonomous media pipeline (scaffold)

Control plane for a multi-tenant news pipeline: **Next.js (App Router)**, **Postgres** via **Drizzle ORM**, and a **Postgres-backed job queue** for durable ingestion and synthesis jobs (Temporal not required for this baseline).

The first vertical is **Bangladesh technology** with **English (`en`) and Bengali (`bn`)** demo drafts, a human **review queue**, and **routing rules** targeting sites and categories.

## Repository layout

- `docker-compose.yml` — local Postgres 16 (optional if you use managed Postgres instead).
- `web/` — Next.js application, Drizzle schema, SQL migrations, scripts.

## Quick start

1. Start Postgres (or point `DATABASE_URL` at any Postgres 16+ instance).

   ```bash
   docker compose up -d
   ```

2. Configure the app:

   ```bash
   cp web/.env.example web/.env.local
   ```

3. Apply schema and seed demo data:

   ```bash
   cd web
   npm install
   npm run db:push
   npm run db:seed
   ```

4. Run the app and worker:

   ```bash
   npm run dev
   ```

   In another shell:

   ```bash
   cd web
   npm run worker
   ```

5. Open [http://localhost:3000/review](http://localhost:3000/review) for the review queue.

## Production (live)

| | |
| --- | --- |
| **Vercel project** | [tdd](https://vercel.com/dinerpordins-projects/tdd) (`rootDirectory`: `web`) |
| **Production URL** | https://tdd-omega.vercel.app |
| **Review queue** | https://tdd-omega.vercel.app/review |
| **Git** | Connected to `Dinerpordin/TDD` |

**Postgres:** Vercel **Neon** integration (`neon-amber-jacket`) provisions `DATABASE_URL` on the `tdd` project. After deploy, seed once:

```bash
cd web
npx vercel env pull .env.production.local --environment=production --yes
DOTENV_CONFIG_PATH=.env.production.local npx tsx scripts/seed.ts
```

## Deploy on Vercel (Supabase Postgres — optional)

Use the **TDD** Supabase project in org **Arionyx** (Cursor MCP + schema):

| | |
| --- | --- |
| **Project ref** | `cwsycyrrhbxoddvghkah` |
| **API URL** | `https://cwsycyrrhbxoddvghkah.supabase.co` |
| **Postgres host** (direct URI) | `db.cwsycyrrhbxoddvghkah.supabase.co` |

**Cursor MCP** is configured in **`.cursor/mcp.json`** with `project_ref=cwsycyrrhbxoddvghkah`. The older ref `mpvcoxeqmjbhjdhbxkqi` is not on the linked Supabase account.

To use Supabase instead of Neon on Vercel: finish **`vercel integration add supabase`** in the dashboard (browser step), set `DATABASE_URL` to the Supabase URI, remove or override Neon vars, redeploy, then seed as above.

### 1. Apply schema and connect the app

1. Open **Project Settings → Database** for **`cwsycyrrhbxoddvghkah`** and copy the **URI** connection string (direct or **pooler** on port **6543** for serverless).
2. Append **`?sslmode=require`** if it is not already in the query string (required for Supabase over the public internet).
3. URL-encode the password if it contains special characters.
4. Set **`DATABASE_URL`** in **`web/.env.local`** (local) and in **Vercel → Settings → Environment Variables** for **Production** and **Preview** ( redeploy after saving ).
5. Apply migrations (pick one):

   **Recommended (CLI)** — creates `public` tables and records them under **`drizzle.__drizzle_migrations`**:

   ```bash
   cd web
   npm install
   npm run db:migrate
   ```

   **Deploy path** — `npm run vercel-build` runs migrations **before** `next build`. If **`DATABASE_URL` is missing**, the build **fails on purpose** so you do not ship an app without a database.

   **Emergency (SQL Editor only)** — open **`web/drizzle/manual_apply_public_schema.sql`**, paste into **Supabase → SQL → New query → Run**. Then run **`web/drizzle/manual_stamp_drizzle_journal.sql`** so future **`db:migrate`** / deploys do not try to apply migration `0000` twice.

**Note:** Do not use Supabase project `mpvcoxeqmjbhjdhbxkqi` (not on the linked account). Use **`cwsycyrrhbxoddvghkah`** or Neon via Vercel.

### Why the `public` schema can stay empty (audit)

| Cause | What to do |
| --- | --- |
| **`DATABASE_URL` not set on Vercel** | Migrations never ran during deploy. Add the URI (Neon or Supabase), redeploy, or run **`npm run db:migrate`** locally. |
| **URI without TLS** | Add **`?sslmode=require`** (see `.env.example`). |
| **Only used default `npm run build` locally** | That skips migrations. Use **`npm run db:migrate`** or deploy with **`vercel-build`**. |
| **Pasted wrong connection string** | Use **Database → Connection string → URI**, not the anon REST URL. |

### 2. Create the Vercel project

Using the Vercel dashboard (recommended for this repo layout):

1. **Add New… → Project** and import this Git repository.
2. Under **Root Directory**, set **`web`** (required: `vercel.json` and `package.json` live there; Vercel does not read `rootDirectory` from `vercel.json`).
3. **Framework Preset**: Next.js (auto-detected from `web/`).
4. **Environment variables** (Production and Preview):
   - `DATABASE_URL` — paste the Supabase Postgres URI.

`web/vercel.json` runs **`npm run vercel-build`**, which runs **`drizzle-kit migrate`** (via **`scripts/vercel-build.cjs`**) then **`next build`**. The deploy fails fast if **`DATABASE_URL`** is unset so tables are not silently skipped.

5. After the first deployment, **seed demo data once** from your machine (so you do not re-seed on every build):

   ```bash
   cd web
   export DATABASE_URL="postgresql://..."   # same value as in Vercel
   npm run db:seed
   ```

6. Open **`/review`** on your `*.vercel.app` URL to confirm the queue.

### 3. Vercel MCP (team context)

From **Vercel MCP** `list_teams`, the linked hobby team is **Dinerpordin's projects** (`team_vfAlDsdpZf23UbNBAiIdfIGJ`). Use that team when creating the project in the dashboard if you are prompted to choose a scope.

The MCP `deploy_to_vercel` tool does **not** deploy from this agent shell; it instructs using **`vercel deploy`** with a **`.vercel`** link or Git integration. For CI, add a `VERCEL_TOKEN` and use `vercel deploy --prebuilt` or the official Git integration.

### 4. Workers

The Postgres-backed worker (`npm run worker`) is a **long-running process** and is **not** a fit for Vercel Serverless alone. For production, run workers on a small always-on host, a queue consumer platform, or migrate jobs to **Vercel Workflow** / **Temporal** as you harden the pipeline.

## Stack choices

| Layer | Choice |
| --- | --- |
| UI + API | Next.js 16 App Router |
| Database | PostgreSQL |
| ORM / migrations | Drizzle + `drizzle-kit` |
| Workers | Node `tsx` script polling `pipeline_jobs` (upgrade later to dedicated workers, Temporal, or Vercel Workflow) |

## Next implementation steps

- Replace `synthesize.stub` with a real agent graph and retrieval with source licensing.
- Add authentication for reviewers and audit trails on approvals.
- Implement CMS connectors using `sites.cms_config` and `publications` as the outbound contract.
