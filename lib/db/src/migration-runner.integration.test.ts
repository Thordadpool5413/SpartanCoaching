import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import pg from "pg";
import { describe, expect, it } from "vitest";
import { libDbPackageRoot, listMigrationEntries } from "./migrate-manifest";
import { prepareMigrations, runMigrations } from "./migration-runner";
import { catalogById } from "./migration-safety";
import { emptyPersonalizationPayload } from "./schema/memberPersonalization";
import { readCatalog, diffCatalog } from "./schema-catalog";

const enabled = process.env.RUN_MIGRATION_INTEGRATION === "true";
const base = process.env.MIGRATION_TEST_DATABASE_URL;
if (enabled) {
  if (!base || process.env.MIGRATION_ENVIRONMENT !== "synthetic")
    throw new Error("EXPLICIT_SYNTHETIC_MIGRATION_DATABASE_REQUIRED");
  const u = new URL(base);
  if (!["localhost", "127.0.0.1", "[::1]"].includes(u.hostname))
    throw new Error("MIGRATION_TEST_LOOPBACK_REQUIRED");
}
const suite = enabled ? describe : describe.skip;
const migrations = prepareMigrations(listMigrationEntries(libDbPackageRoot()));
async function isolated<T>(
  fn: (client: pg.PoolClient, pool: pg.Pool) => Promise<T>,
): Promise<T> {
  const admin = new pg.Pool({ connectionString: base });
  const name = `spartan_p02_${randomUUID().replaceAll("-", "")}`;
  const u = new URL(base!);
  u.pathname = `/${name}`;
  let pool: pg.Pool | undefined;
  try {
    await admin.query(`CREATE DATABASE "${name}"`);
    pool = new pg.Pool({ connectionString: u.toString() });
    const client = await pool.connect();
    try {
      return await fn(client, pool);
    } finally {
      client.release();
    }
  } finally {
    await pool?.end();
    await admin.query(`DROP DATABASE IF EXISTS "${name}"`);
    await admin.end();
  }
}
// Only generated, isolated databases are modified/dropped. Never public data.
suite("synthetic PostgreSQL migration runner", () => {
  it("replays empty, preserves unchanged catalog on rerun, and supports prefix upgrade", async () => {
    const fresh = await isolated(async (client) => {
      expect((await runMigrations(client, migrations)).applied).toBe(31);
      const before = await readCatalog(client);
      expect((await runMigrations(client, migrations)).skipped).toBe(31);
      expect(diffCatalog(before, await readCatalog(client))).toEqual([]);
      return before;
    });
    const upgrade = await isolated(async (client) => {
      await runMigrations(client, migrations.slice(0, 15));
      await runMigrations(client, migrations);
      return readCatalog(client);
    });
    expect(diffCatalog(fresh, upgrade)).toEqual([]);
  }, 60000);
  it("upgrades the personalization default without rewriting existing preferences", async () => {
    await isolated(async (client) => {
      const correction = migrations.find(
        (m) => m.id === "0030_personalization_jurisdiction_default.sql",
      )!;
      const historical = migrations.filter((m) => m !== correction);
      await runMigrations(client, historical);
      const prior = (
        await client.query(
          "INSERT INTO member_personalization(organization_id,member_id) VALUES (1,1) RETURNING payload",
        )
      ).rows[0].payload;
      expect(prior).not.toHaveProperty("jurisdiction");
      expect((await runMigrations(client, migrations)).applied).toBe(1);
      for (const sql of catalogById(
        "0030_personalization_jurisdiction_default",
      )!.validationQueries)
        expect((await client.query(sql)).rows).toEqual([{ ok: true }]);
      expect(
        (
          await client.query(
            "SELECT payload FROM member_personalization WHERE member_id = 1",
          )
        ).rows[0].payload,
      ).toEqual(prior);
      expect(
        (
          await client.query(
            "INSERT INTO member_personalization(organization_id,member_id) VALUES (1,2) RETURNING payload",
          )
        ).rows[0].payload,
      ).toEqual(emptyPersonalizationPayload());
      expect((await runMigrations(client, migrations)).applied).toBe(0);
    });
  }, 60000);
  it(
    "rejects changed history before later SQL and rolls back failed migration",
    async () =>
      isolated(async (client) => {
        await runMigrations(client, migrations.slice(0, 1));
        await expect(
          runMigrations(client, [
            { ...migrations[0]!, checksum: "0".repeat(64) },
            ...migrations.slice(1),
          ]),
        ).rejects.toThrow("MIGRATION_CHECKSUM_MISMATCH");
        await expect(
          runMigrations(client, [
            migrations[0]!,
            {
              id: "synthetic_failure",
              checksum: "1".repeat(64),
              sql: "CREATE TABLE synthetic_rollback(id int); SELECT * FROM nonexistent_synthetic_table;",
            },
          ]),
        ).rejects.toThrow("MIGRATION_APPLY_FAILED");
        expect(
          (
            await client.query(
              "SELECT to_regclass('public.synthetic_rollback') AS found",
            )
          ).rows[0].found,
        ).toBeNull();
        expect(
          (
            await client.query(
              "SELECT count(*)::int AS count FROM public.schema_migrations",
            )
          ).rows[0].count,
        ).toBe(1);
      }),
    60000,
  );
  it(
    "refuses legacy baseline and competing lock holder without losing the lock",
    async () =>
      isolated(async (client, pool) => {
        await client.query(
          "CREATE TABLE public.schema_migrations(id text PRIMARY KEY, applied_at timestamptz DEFAULT now())",
        );
        await client.query(
          "INSERT INTO public.schema_migrations(id) VALUES ($1)",
          [migrations[0]!.id],
        );
        await expect(runMigrations(client, migrations)).rejects.toThrow(
          "MIGRATION_BASELINE_EVIDENCE_REQUIRED",
        );
        const other = await pool.connect();
        try {
          await other.query("SELECT pg_advisory_lock(1936744802,1)");
          await expect(runMigrations(client, migrations)).rejects.toThrow(
            "MIGRATION_LOCK_BUSY",
          );
        } finally {
          await other.query("SELECT pg_advisory_unlock(1936744802,1)");
          other.release();
        }
      }),
    60000,
  );
  it(
    "refuses an untracked existing schema without altering its data",
    async () =>
      isolated(async (client) => {
        await client.query(
          "CREATE TABLE synthetic_existing(id int PRIMARY KEY)",
        );
        await client.query("INSERT INTO synthetic_existing VALUES (1)");
        await expect(runMigrations(client, migrations)).rejects.toThrow(
          "MIGRATION_UNTRACKED_SCHEMA_BASELINE_REQUIRED",
        );
        expect(
          (
            await client.query(
              "SELECT count(*)::int AS count FROM synthetic_existing",
            )
          ).rows[0].count,
        ).toBe(1);
        expect(
          (
            await client.query(
              "SELECT to_regclass('public.schema_migrations') AS found",
            )
          ).rows[0].found,
        ).toBeNull();
      }),
    60000,
  );
  it(
    "serializes two concurrent runners and allows the loser to retry",
    async () =>
      isolated(async (client, pool) => {
        const other = await pool.connect();
        try {
          const results = await Promise.allSettled([
            runMigrations(client, migrations),
            runMigrations(other, migrations),
          ]);
          expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(
            1,
          );
          const rejected = results.find(
            (r) => r.status === "rejected",
          ) as PromiseRejectedResult;
          expect(rejected.reason.code).toBe("MIGRATION_LOCK_BUSY");
          expect((await runMigrations(client, migrations)).skipped).toBe(31);
        } finally {
          other.release();
        }
      }),
    60000,
  );
  it(
    "enforces workflow tenant RLS for a non-owner role",
    async () =>
      isolated(async (client) => {
        await runMigrations(client, migrations);
        const role = `p02_reader_${randomUUID().replaceAll("-", "")}`;
        const tenantA = randomUUID(),
          tenantB = randomUUID();
        await client.query(
          `CREATE ROLE "${role}" NOLOGIN NOSUPERUSER NOBYPASSRLS`,
        );
        try {
          await client.query(`GRANT USAGE ON SCHEMA public TO "${role}"`);
          await client.query(
            `GRANT SELECT, INSERT ON public.sales_workflow_entities TO "${role}"`,
          );
          for (const tenant of [tenantA, tenantB])
            await client.query(
              "INSERT INTO sales_workflow_entities(id,organization_id,kind,data) VALUES ($1,$2,'synthetic','{}')",
              [randomUUID(), tenant],
            );
          await client.query(`SET ROLE "${role}"`);
          expect(
            (
              await client.query(
                "SELECT count(*)::int AS count FROM sales_workflow_entities",
              )
            ).rows[0].count,
          ).toBe(0);
          await client.query(
            "SELECT set_config('app.organization_id',$1,false)",
            [tenantA],
          );
          expect(
            (
              await client.query(
                "SELECT organization_id FROM sales_workflow_entities",
              )
            ).rows,
          ).toEqual([{ organization_id: tenantA }]);
          await expect(
            client.query(
              "INSERT INTO sales_workflow_entities(id,organization_id,kind,data) VALUES ($1,$2,'synthetic','{}')",
              [randomUUID(), tenantB],
            ),
          ).rejects.toMatchObject({ code: "42501" });
        } finally {
          await client.query("RESET ROLE");
          await client.query(`DROP OWNED BY "${role}"`);
          await client.query(`DROP ROLE "${role}"`);
        }
      }),
    60000,
  );
  it("compares full catalog to independent Drizzle export; unresolved differences block equivalence", async () => {
    const exported = spawnSync(
      "pnpm",
      [
        "exec",
        "drizzle-kit",
        "export",
        "--dialect",
        "postgresql",
        "--schema",
        "./src/schema/index.ts",
      ],
      { cwd: libDbPackageRoot(), encoding: "utf8", maxBuffer: 8 * 1024 * 1024 },
    );
    if (exported.status !== 0 || !exported.stdout.startsWith("CREATE TABLE"))
      throw new Error("SCHEMA_EXPORT_FAILED");
    const replay = await isolated(async (client) => {
      await runMigrations(client, migrations);
      return readCatalog(client);
    });
    const source = await isolated(async (client) => {
      await client.query("CREATE EXTENSION IF NOT EXISTS pgcrypto");
      await client.query(exported.stdout);
      return readCatalog(client);
    });
    const differences = diffCatalog(replay, source);
    // Only schema object names and discrepancy categories; never raw defaults,
    // comments, function bodies, connection details or synthetic row payloads.
    writeFileSync(
      `${libDbPackageRoot()}/migration-equivalence-report.json`,
      JSON.stringify(
        { syntheticOnly: true, productionVerified: false, differences },
        null,
        2,
      ) + "\n",
    );
    expect(
      differences.length,
      "CATALOG_EQUIVALENCE_BLOCKED: inspect content-free discrepancy report",
    ).toBe(0);
  }, 60000);
});
