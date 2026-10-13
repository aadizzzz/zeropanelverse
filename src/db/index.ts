import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/placeholder_db";

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

const isCloudDb =
  databaseUrl.includes("supabase.co") ||
  databaseUrl.includes("pooler.supabase.com") ||
  databaseUrl.includes("sslmode=require");

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
    ssl: isCloudDb ? { rejectUnauthorized: false } : undefined,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
