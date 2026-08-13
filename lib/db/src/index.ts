import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

type Db = NodePgDatabase<typeof schema>;

/**
 * Schema/table exports are always available without a live database so unit
 * and contract tests can import Zod models without provisioning Postgres.
 * Pool/db are created lazily on first use and require DATABASE_URL.
 */
export * from "./schema";
export * from "./migration-safety";
export * from "./ops-readiness";

let poolInstance: pg.Pool | undefined;
let dbInstance: Db | undefined;

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }
  return url;
}

function getPool(): pg.Pool {
  if (!poolInstance) {
    poolInstance = new Pool({ connectionString: requireDatabaseUrl() });
  }
  return poolInstance;
}

function getDb(): Db {
  if (!dbInstance) {
    dbInstance = drizzle(getPool(), { schema });
  }
  return dbInstance;
}

/** Lazy pool — first access requires DATABASE_URL. */
export const pool: pg.Pool = new Proxy({} as pg.Pool, {
  get(_target, property, receiver) {
    const value = Reflect.get(getPool(), property, receiver);
    return typeof value === "function" ? value.bind(getPool()) : value;
  },
});

/** Lazy drizzle client — first access requires DATABASE_URL. */
export const db: Db = new Proxy({} as Db, {
  get(_target, property, receiver) {
    const value = Reflect.get(getDb(), property, receiver);
    return typeof value === "function" ? value.bind(getDb()) : value;
  },
});
