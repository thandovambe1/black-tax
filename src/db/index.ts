import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export type Database = NodePgDatabase<typeof schema>;

/**
 * Serverless-safe PostgreSQL connection.
 *
 * IMPORTANT: the pool is created lazily on first query — never at module
 * import time. Throwing during import would crash every route while Vercel
 * collects page data, which makes the whole deployment fail (and serves a 404).
 */
const globalForDb = globalThis as typeof globalThis & {
  __blackTaxPool?: Pool;
  __blackTaxDb?: Database;
};

function isLocal(url: string) {
  return /@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(url) || url.includes("host.docker.internal");
}

function createPool(): Pool {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Add it in Vercel → Project → Settings → Environment Variables.",
    );
  }

  // Hosted Postgres (Neon, Supabase, Vercel Postgres, RDS) requires TLS.
  // Local development databases generally do not.
  const useSsl = !isLocal(databaseUrl) && !/sslmode=disable/.test(databaseUrl);

  return new Pool({
    connectionString: databaseUrl,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    // Serverless functions are short-lived: keep pools small and recycle fast.
    max: process.env.VERCEL ? 1 : 10,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    allowExitOnIdle: true,
  });
}

export function getPool(): Pool {
  if (!globalForDb.__blackTaxPool) {
    const pool = createPool();
    // Never let an idle-client error take down the process.
    pool.on("error", (error) => {
      console.error("[db] idle client error:", error.message);
    });
    globalForDb.__blackTaxPool = pool;
  }
  return globalForDb.__blackTaxPool;
}

export function getDb(): Database {
  if (!globalForDb.__blackTaxDb) {
    globalForDb.__blackTaxDb = drizzle(getPool(), { schema });
  }
  return globalForDb.__blackTaxDb;
}

/**
 * `db` behaves exactly like a Drizzle client, but resolves the real
 * connection only when a query is actually executed.
 */
export const db = new Proxy({} as Database, {
  get(_target, property, receiver) {
    const client = getDb() as unknown as Record<string | symbol, unknown>;
    const value = Reflect.get(client, property, receiver);
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(client) : value;
  },
});

/** True when a database URL is configured (does not open a connection). */
export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}
