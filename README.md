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

## Deploy on Vercel (with Supabase Postgres)

There is **no Supabase MCP server** in this environment; database creation is done in the [Supabase dashboard](https://supabase.com/dashboard). The **Vercel MCP** can list teams and projects, but **project creation and Git linking** are done in the Vercel dashboard (or with the Vercel CLI using a token this sandbox does not have).

### 1. Create the Supabase database

1. In Supabase: **New project** (pick a region close to your audience, for example **Mumbai** for South Asia).
2. Open **Project Settings → Database** and copy the **URI** connection string (use the **pooler** / transaction mode host on port **6543** for serverless if Supabase recommends it for your driver).
3. Ensure the password is URL-encoded if it contains special characters.

### 2. Create the Vercel project

Using the Vercel dashboard (recommended for this repo layout):

1. **Add New… → Project** and import this Git repository.
2. Under **Root Directory**, set **`web`** (required: `vercel.json` and `package.json` live there; Vercel does not read `rootDirectory` from `vercel.json`).
3. **Framework Preset**: Next.js (auto-detected from `web/`).
4. **Environment variables** (Production and Preview):
   - `DATABASE_URL` — paste the Supabase Postgres URI.

`web/vercel.json` runs **`npm run vercel-build`**, which applies Drizzle SQL migrations (`drizzle-kit migrate`) then **`next build`**. The first successful deploy therefore creates tables in Supabase.

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
