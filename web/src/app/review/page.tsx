import { desc, eq } from "drizzle-orm";
import { Noto_Sans_Bengali } from "next/font/google";
import Link from "next/link";

import { getDb } from "@/db";
import { drafts, reviews, tenants } from "@/db/schema";

const notoBn = Noto_Sans_Bengali({
  weight: ["400", "600"],
  subsets: ["bengali"],
  variable: "--font-bn",
});

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function ReviewQueuePage() {
  const db = getDb();
  const rows = await db
    .select({
      draft: drafts,
      tenant: tenants,
      review: reviews,
    })
    .from(drafts)
    .innerJoin(tenants, eq(drafts.tenantId, tenants.id))
    .leftJoin(reviews, eq(reviews.draftId, drafts.id))
    .where(eq(drafts.status, "in_review"))
    .orderBy(desc(drafts.updatedAt));

  return (
    <div
      className={`mx-auto max-w-3xl px-6 py-10 ${notoBn.variable} font-sans`}
    >
      <header className="mb-8 flex flex-col gap-2 border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Human review
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Queue · Bangladesh tech (EN + BN)
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Drafts stay here until an editor approves routing to tenant sites and
          categories.
        </p>
        <Link
          href="/"
          className="text-sm font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
        >
          ← Control plane home
        </Link>
      </header>

      {rows.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No drafts in review. Run{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-900">
            npm run db:seed
          </code>{" "}
          after migrations.
        </p>
      ) : (
        <ul className="flex flex-col gap-8">
          {rows.map(({ draft, tenant, review }) => (
            <li
              key={draft.id}
              className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-medium uppercase tracking-wide text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                  {draft.locale}
                </span>
                <span>{tenant.name}</span>
                <span>·</span>
                <span>Risk {draft.riskScore}</span>
                {review ? (
                  <>
                    <span>·</span>
                    <span>Review {review.decision}</span>
                  </>
                ) : null}
              </div>
              <h2
                className={
                  draft.locale === "bn"
                    ? `${notoBn.className} text-xl font-semibold text-zinc-900 dark:text-zinc-50`
                    : "text-xl font-semibold text-zinc-900 dark:text-zinc-50"
                }
              >
                {draft.title}
              </h2>
              {draft.dek ? (
                <p
                  className={
                    draft.locale === "bn"
                      ? `${notoBn.className} mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300`
                      : "mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300"
                  }
                >
                  {draft.dek}
                </p>
              ) : null}
              <article
                className={
                  draft.locale === "bn"
                    ? `${notoBn.className} mt-4 text-zinc-800 dark:text-zinc-200`
                    : "mt-4 text-zinc-800 dark:text-zinc-200"
                }
              >
                <pre className="whitespace-pre-wrap rounded-lg bg-zinc-50 p-3 text-sm dark:bg-zinc-900">
                  {draft.bodyMd}
                </pre>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
