import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

function sanitizeDatabaseUrl(url: string | undefined): string {
  if (!url) {
    return "postgresql://postgres:postgres@127.0.0.1:5432/placeholder_db";
  }

  let cleaned = url.trim().replace(/^["']|["']$/g, "");

  // If password contains raw unencoded '@' like :Hello@8960773070@
  if (cleaned.includes(":Hello@8960773070@")) {
    cleaned = cleaned.replace(":Hello@8960773070@", ":Hello%408960773070@");
  }

  // If pointing directly to Supabase direct IPv6 host db.lqiakhggjslyyohsnwbu.supabase.co,
  // redirect to the AWS session pooler host (which supports standard IPv4)
  if (cleaned.includes("@db.lqiakhggjslyyohsnwbu.supabase.co")) {
    cleaned = cleaned
      .replace("postgres:", "postgres.lqiakhggjslyyohsnwbu:")
      .replace("@db.lqiakhggjslyyohsnwbu.supabase.co", "@aws-0-ap-south-1.pooler.supabase.com");
  }

  return cleaned;
}

const databaseUrl = sanitizeDatabaseUrl(process.env.DATABASE_URL);

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
    connectionTimeoutMillis: 5000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
