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
  return NextResponse.json({
    ok: true,
    inReviewCount: inReview.length,
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
  });
}
