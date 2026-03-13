import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type DB = ReturnType<typeof drizzle<typeof schema>>;

function createDb(): DB {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.DATABASE_PRIVATE_URL ||
    "";

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL environment variable is not set. " +
      "On Railway, ensure a PostgreSQL plugin is attached and DATABASE_URL is available."
    );
  }

  const isSSL = connectionString.includes("railway") || connectionString.includes("sslmode");

  const client = postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    ssl: isSSL ? { rejectUnauthorized: false } : false,
    prepare: false,
  });

  return drizzle(client, { schema });
}

// Lazy singleton: only connects when first accessed at runtime, not at build time
const globalForDb = globalThis as unknown as { db: DB };

export function getDb(): DB {
  if (!globalForDb.db) {
    globalForDb.db = createDb();
  }
  return globalForDb.db;
}

// Proxy so that imports of `db` work lazily — all property access is forwarded to the real DB
export const db: DB = new Proxy({} as DB, {
  get(_target, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
