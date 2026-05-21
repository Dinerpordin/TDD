import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/db";
import { drafts } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const inReview = await db
    .select({ id: drafts.id })
    .from(drafts)
    .where(eq(drafts.status, "in_review"));
  const raw = process.env.DATABASE_URL ?? "";
  let dbHost = "missing";
  try {
    dbHost = new URL(raw).hostname;
  } catch {
    dbHost = raw.startsWith("eyJ") ? "encrypted-reference" : "invalid-url";
  }

  return NextResponse.json({
    ok: true,
    inReviewCount: inReview.length,
    hasDatabaseUrl: Boolean(raw),
    dbHost,
  });
}
