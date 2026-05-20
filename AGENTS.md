# Autonomous Media Pipeline

Single-product repo with a Next.js 16 control plane (`web/`) and a Postgres-backed job-queue worker. See the root `README.md` for architecture and quick-start instructions.

## Cursor Cloud specific instructions

### Services overview

| Service | How to run | Notes |
|---|---|---|
| **PostgreSQL 16** | `docker compose up -d` (repo root) | Local via Docker; credentials `media:media`, db `media_pipeline`, port 5432 |
| **Next.js dev server** | `cd web && npm run dev` | Serves UI + API on `http://localhost:3000` |
| **Pipeline worker** | `cd web && npm run worker` | Polls `pipeline_jobs` table; needs `DATABASE_URL` exported |

### Environment setup gotchas

- **`DATABASE_URL` must be exported for CLI tools** (`drizzle-kit`, `tsx scripts/seed.ts`, `tsx scripts/worker.ts`). Next.js reads `.env.local` automatically, but drizzle-kit and tsx scripts use `dotenv/config` or raw `process.env`, so for drizzle-kit commands (`db:push`, `db:migrate`, `db:generate`) you must export `DATABASE_URL` in the shell. The seed and worker scripts import `dotenv/config` and will read from `.env.local`.
- **Docker is required** for local Postgres. In Cloud Agent VMs, Docker needs `fuse-overlayfs` storage driver and `iptables-legacy` (see system prompt instructions). Start dockerd before `docker compose up -d`.
- **Schema apply before first run**: `npm run db:push` (or `npm run db:migrate`) must complete before the dev server or seed script can work.
- **Seed is idempotent**: `npm run db:seed` checks for existing rows and only inserts missing data (except `pipeline_jobs`, which always adds a new stub job).

### Standard commands (in `web/`)

Refer to `web/package.json` scripts:
- **Lint**: `npm run lint`
- **Build**: `npm run build` (requires `DATABASE_URL` at build time for server components)
- **Dev**: `npm run dev`
- **DB push**: `DATABASE_URL=... npm run db:push`
- **DB seed**: `npm run db:seed` (reads `.env.local` via `dotenv/config`)
- **Worker**: `npm run worker` (reads `.env.local` via `dotenv/config`)

### Key URL

- Review queue: `http://localhost:3000/review`
