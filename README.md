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

Use the **TDD** Supabase project for this app (separate from other personal projects):

| | |
| --- | --- |
| **Project ref** | `mpvcoxeqmjbhjdhbxkqi` |
| **API URL** | `https://mpvcoxeqmjbhjdhbxkqi.supabase.co` |
| **Postgres host** (direct URI) | `db.mpvcoxeqmjbhjdhbxkqi.supabase.co` |

Create the database in the [Supabase dashboard](https://supabase.com/dashboard) if it does not exist yet. **Cursor MCP** for Supabase is configured in **`.cursor/mcp.json`** with `project_ref=mpvcoxeqmjbhjdhbxkqi`. You must complete **OAuth in Cursor** using the **same Supabase account** that owns this project; otherwise MCP tools return permission errors.

### 1. Apply schema and connect the app

1. Open **Project Settings → Database** for **`mpvcoxeqmjbhjdhbxkqi`** and copy the **URI** connection string (use the **pooler** / transaction mode host on port **6543** for serverless when recommended for your stack).
2. URL-encode the password if it contains special characters.
3. Set **`DATABASE_URL`** in **`web/.env.local`** (local) and in **Vercel** env vars (Production / Preview).
4. Apply migrations: either rely on **`npm run vercel-build`** on Vercel (`drizzle-kit migrate` then `next build`), or run locally:

   ```bash
   cd web
   npm run db:migrate
   ```

   Alternatively paste or run the SQL under **`web/drizzle/`** in the Supabase SQL editor.

**Note:** An earlier agent session mistakenly documented another Supabase project. **Do not use that project for TDD.** This README targets **`mpvcoxeqmjbhjdhbxkqi`** only.

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
