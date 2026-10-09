import { randomUUID } from "node:crypto";
import pg from "pg";
import { beforeAll, afterAll, describe } from "vitest";
import {
  libDbPackageRoot,
  listMigrationEntries,
} from "../../../../../lib/db/src/migrate-manifest";
import {
  prepareMigrations,
  runMigrations,
} from "../../../../../lib/db/src/migration-runner";
import { installKnowledgePrivileges } from "../../../../../lib/db/scripts/knowledge-privileges";
import {
  seedKnowledge,
  type SyntheticKnowledge,
} from "../../../../../lib/db/scripts/knowledge-synthetic";
export const integrationEnabled =
  process.env.RUN_POSTGRES_INTEGRATION === "true";
if (integrationEnabled) {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("K1B_POSTGRES_REQUIRED");
  const url = new URL(raw);
  if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))
    throw new Error("K1B_SYNTHETIC_LOOPBACK_REQUIRED");
}
export const databaseSuite = integrationEnabled ? describe : describe.skip;
export function databaseFixture() {
  const id = randomUUID().replaceAll("-", ""),
    database = `spartan_k1b_${id}`,
    role = `k1b_app_${id}`;
  const password = randomUUID().replaceAll("-", "");
  let admin: pg.Pool,
    owner: pg.Pool,
    application: pg.Pool,
    fixture: SyntheticKnowledge,
    second: SyntheticKnowledge,
    global: SyntheticKnowledge;
  beforeAll(async () => {
    admin = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    const url = new URL(process.env.DATABASE_URL!);
    url.pathname = `/${database}`;
    await admin.query(`CREATE DATABASE "${database}"`);
    await admin.query(
      `CREATE ROLE "${role}" LOGIN PASSWORD '${password}' NOSUPERUSER NOBYPASSRLS`,
    );
    owner = new pg.Pool({
      connectionString: url.toString(),
      connectionTimeoutMillis: 5000,
    });
    const client = await owner.connect();
    try {
      await runMigrations(
        client,
        prepareMigrations(listMigrationEntries(libDbPackageRoot())),
      );
      fixture = await seedKnowledge(client);
      second = await seedKnowledge(client, 7002);
      global = await seedKnowledge(client, 7001, true);
      await installKnowledgePrivileges(client, role);
    } finally {
      client.release();
    }
    url.username = role;
    url.password = password;
    application = new pg.Pool({
      connectionString: url.toString(),
      connectionTimeoutMillis: 5000,
    });
  }, 60000);
  afterAll(async () => {
    await application?.end();
    await owner?.end();
    if (admin) {
      await admin.query(`DROP DATABASE IF EXISTS "${database}"`);
      await admin.query(`DROP ROLE IF EXISTS "${role}"`);
      await admin.end();
    }
  }, 30000);
  return {
    get owner() {
      return owner;
    },
    get pool() {
      return application;
    },
    get fixture() {
      return fixture;
    },
    get second() {
      return second;
    },
    get global() {
      return global;
    },
    get role() {
      return role;
    },
  };
}
