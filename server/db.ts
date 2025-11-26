import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle, NeonDatabase } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Lazy initialization - database connection is created on first use, not at import time
// This allows the server to start and respond to health checks before connecting to DB
let _pool: Pool | null = null;
let _db: NeonDatabase<typeof schema> | null = null;

function getPool(): Pool {
  if (!_pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?",
      );
    }
    _pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return _pool;
}

function getDb(): NeonDatabase<typeof schema> {
  if (!_db) {
    _db = drizzle({ client: getPool(), schema });
  }
  return _db;
}

// Export getters that lazily initialize the connection
export const pool = new Proxy({} as Pool, {
  get(_, prop) {
    return (getPool() as any)[prop];
  }
});

export const db = new Proxy({} as NeonDatabase<typeof schema>, {
  get(_, prop) {
    const realDb = getDb();
    const value = (realDb as any)[prop];
    if (typeof value === 'function') {
      return value.bind(realDb);
    }
    return value;
  }
});
