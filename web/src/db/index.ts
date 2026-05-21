import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  // Fresh client per request — avoids stale pooled connections on Vercel serverless.
  const sql = postgres(url, { prepare: false, max: 1 });
  return drizzle(sql, { schema });
}
