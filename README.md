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
