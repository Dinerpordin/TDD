import "dotenv/config";

import { and, eq, lte } from "drizzle-orm";

import { getDb } from "../src/db";
import { pipelineJobs } from "../src/db/schema";

async function claimNextJob() {
  const db = getDb();
  return db.transaction(async (tx) => {
    const pending = await tx
      .select()
      .from(pipelineJobs)
      .where(
        and(
          eq(pipelineJobs.status, "pending"),
          lte(pipelineJobs.runAfter, new Date()),
        ),
      )
      .limit(1);

    const job = pending[0];
    if (!job) return null;

    const updated = await tx
      .update(pipelineJobs)
      .set({
        status: "processing",
        lockedAt: new Date(),
        updatedAt: new Date(),
        attempts: job.attempts + 1,
      })
      .where(
        and(eq(pipelineJobs.id, job.id), eq(pipelineJobs.status, "pending")),
      )
      .returning();

    return updated[0] ?? null;
  });
}

async function handleJob(job: typeof pipelineJobs.$inferSelect) {
  switch (job.type) {
    case "synthesize.stub": {
      // Real implementation would call agents, retrieval, and writers.
      console.log("[worker] synthesize.stub ok", job.id);
      return;
    }
    case "ingest.rss": {
      console.log("[worker] ingest.rss placeholder", job.id);
      return;
    }
    default:
      throw new Error(`unknown job type: ${job.type}`);
  }
}

async function completeJob(id: string) {
  const db = getDb();
  await db
    .update(pipelineJobs)
    .set({
      status: "completed",
      lockedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(pipelineJobs.id, id));
}

async function failJob(id: string, err: unknown, attempts: number, max: number) {
  const db = getDb();
  const message = err instanceof Error ? err.message : String(err);
  const terminal = attempts >= max;
  await db
    .update(pipelineJobs)
    .set({
      status: terminal ? "failed" : "pending",
      lockedAt: null,
      lastError: message,
      ...(terminal ? {} : { runAfter: new Date(Date.now() + 30_000) }),
      updatedAt: new Date(),
    })
    .where(eq(pipelineJobs.id, id));
}

async function loopOnce() {
  const job = await claimNextJob();
  if (!job) return false;
  try {
    await handleJob(job);
    await completeJob(job.id);
  } catch (e) {
    await failJob(job.id, e, job.attempts, job.maxAttempts);
  }
  return true;
}

async function main() {
  const maxTicks = Number(process.env.WORKER_MAX_TICKS ?? "50");
  let ticks = 0;
  console.log("Pipeline worker started (Postgres-backed jobs).");
  while (ticks < maxTicks) {
    const worked = await loopOnce();
    if (!worked) {
      await new Promise((r) => setTimeout(r, 750));
    }
    ticks += 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
