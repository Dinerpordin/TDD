<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

### Services overview

| Service | How to run | Notes |
|---|---|---|
| **PostgreSQL 16** | `docker compose up -d` (from repo root) | Credentials: `media/media`, db: `media_pipeline`, port 5432 |
| **Next.js dev server** | `cd web && npm run dev` | Port 3000. Requires `DATABASE_URL` in env or `.env.local` |
| **Pipeline worker** | `cd web && npm run worker` | Drains `pipeline_jobs` table. Optional for UI testing |

### Non-obvious caveats

- **`drizzle-kit` does not load `.env.local` automatically.** When running `npm run db:push`, `db:migrate`, or `db:seed`, you must either export `DATABASE_URL` or prefix the command: `DATABASE_URL=postgres://media:media@127.0.0.1:5432/media_pipeline npm run db:push`.
- **`npm run dev` does load `.env.local`** via Next.js, so the dev server picks up the database URL from the file.
- **Docker must be running** before `docker compose up -d`. In Cloud Agent VMs, Docker needs fuse-overlayfs and iptables-legacy workarounds (see system instructions).
- **The `/review` page uses `force-dynamic`**, so it requires a live Postgres connection at request time.

### Standard commands (see root `README.md` for full details)

- **Lint:** `cd web && npm run lint`
- **Build:** `cd web && npm run build` (requires `DATABASE_URL` for static page generation)
- **Schema push:** `DATABASE_URL=... npm run db:push`
- **Seed data:** `DATABASE_URL=... npm run db:seed`
- **Migrations:** `DATABASE_URL=... npm run db:migrate`
