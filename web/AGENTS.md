<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

Repo-wide setup (Docker, `DATABASE_URL`, worker, review URL) is in the root **`AGENTS.md`**. Web-specific notes:

- **`drizzle-kit` does not load `.env.local`.** Prefix or export `DATABASE_URL` for `db:push`, `db:migrate`, and `db:generate`.
- **`npm run dev` loads `.env.local`** via Next.js; seed and worker scripts use `dotenv/config` and read `.env.local` when present.
- **`/review` uses `force-dynamic`** — requires a live Postgres connection at request time.

### Commands (from `web/`)

- **Lint:** `npm run lint`
- **Build:** `npm run build` (needs `DATABASE_URL` for server components)
- **Schema:** `DATABASE_URL=... npm run db:push` or `npm run db:migrate`
- **Seed:** `npm run db:seed`
- **Worker:** `npm run worker`
