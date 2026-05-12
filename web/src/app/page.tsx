import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto flex min-h-full max-w-3xl flex-col gap-8 px-6 py-16">
      <div>
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Media pipeline control plane
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Bangladesh tech · Bengali + English
        </h1>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          Next.js App Router, Postgres (Drizzle), and a Postgres-backed job queue
          for ingestion, synthesis stubs, human review, and per-tenant routing.
        </p>
      </div>
      <nav className="flex flex-col gap-3 text-sm font-medium">
        <Link
          className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-zinc-900 shadow-sm transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:border-zinc-700"
          href="/review"
        >
          Open review queue →
        </Link>
      </nav>
      <section className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-300">
        <p className="font-medium text-zinc-900 dark:text-zinc-100">
          Local setup
        </p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>
            From repo root:{" "}
            <code className="rounded bg-white px-1 py-0.5 text-xs dark:bg-zinc-950">
              docker compose up -d
            </code>
          </li>
          <li>
            Copy{" "}
            <code className="rounded bg-white px-1 py-0.5 text-xs dark:bg-zinc-950">
              web/.env.example
            </code>{" "}
            to{" "}
            <code className="rounded bg-white px-1 py-0.5 text-xs dark:bg-zinc-950">
              web/.env.local
            </code>
          </li>
          <li>
            <code className="rounded bg-white px-1 py-0.5 text-xs dark:bg-zinc-950">
              cd web && npm run db:push && npm run db:seed
            </code>
          </li>
          <li>
            <code className="rounded bg-white px-1 py-0.5 text-xs dark:bg-zinc-950">
              npm run worker
            </code>{" "}
            in another terminal to drain jobs.
          </li>
        </ol>
      </section>
    </div>
  );
}
