/** P03: disposable synthetic databases only. Never consumes an existing database dump. */
import { randomBytes, randomUUID, createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  readFileSync,
  mkdtempSync,
  chmodSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import pg from "pg";
import {
  libDbPackageRoot,
  listMigrationEntries,
} from "../src/migrate-manifest";
import { prepareMigrations, runMigrations } from "../src/migration-runner";
import { readCatalog, diffCatalog } from "../src/schema-catalog";
import { seedKnowledge } from "./knowledge-synthetic";
import { installKnowledgePrivileges } from "./knowledge-privileges";
import { executeCommand } from "../../../artifacts/api-server/src/knowledge/persistence/commands";
import { claimOutbox, completeOutbox, consumeEvent } from "../../../artifacts/api-server/src/knowledge/persistence/outbox";
import { readKnowledge } from "../../../artifacts/api-server/src/knowledge/control/reads";
import {
  encryptPhi,
  decryptPhi,
} from "../../../artifacts/api-server/src/security/phiEncryption";

class RecoveryError extends Error {}

function check(ok: unknown, code: string): asserts ok {
  if (!ok) throw new RecoveryError(code);
}
const reportPath = path.join(
  libDbPackageRoot(),
  "synthetic-recovery-report.json",
);
const quote = (name: string) => `"${name.replaceAll('"', '""')}"`;
const hash = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");

async function contents(client: pg.PoolClient) {
  const result: Record<string, string> = {};
  const tables = await client.query(
    "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename",
  );
  for (const { tablename } of tables.rows) {
    const rows = await client.query(
      `SELECT row_to_json(t)::text AS value FROM public.${quote(tablename)} t ORDER BY row_to_json(t)::text`,
    );
    result[tablename] = hash(rows.rows);
  }
  const sequences = await client.query(
    "SELECT sequencename FROM pg_sequences WHERE schemaname='public' ORDER BY sequencename",
  );
  for (const { sequencename } of sequences.rows)
    result[`sequence:${sequencename}`] = hash(
      (
        await client.query(
          `SELECT last_value::text,is_called FROM public.${quote(sequencename)}`,
        )
      ).rows,
    );
  return result;
}

async function main() {
  // DATABASE_URL is deliberately not read. Explicit synthetic loopback admin only.
  check(
    process.env.RECOVERY_ENVIRONMENT === "synthetic",
    "SYNTHETIC_RECOVERY_REQUIRED",
  );
  const raw = process.env.RECOVERY_TEST_DATABASE_URL;
  check(raw, "RECOVERY_TEST_DATABASE_REQUIRED");
  const url = new URL(raw);
  check(
    ["postgres:", "postgresql:"].includes(url.protocol) &&
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) &&
      !url.search &&
      !url.hash,
    "RECOVERY_LOOPBACK_REQUIRED",
  );
  const admin = new pg.Pool({
    connectionString: raw,
    connectionTimeoutMillis: 5000,
  });
  const id = randomUUID().replaceAll("-", "");
  const role = `p03_reader_${id}`;
  const knowledgeRolePassword = randomBytes(24).toString("hex");
  const databases: string[] = [];
  const pools: pg.Pool[] = [];
  const clients: pg.PoolClient[] = [];
  const directory = mkdtempSync(path.join(tmpdir(), "spartan-p03-"));
  chmodSync(directory, 0o700);
  const dump = path.join(directory, "synthetic.dump");
  const originalKey = process.env.AI_TOOL_ENCRYPTION_KEY;
  const syntheticKey = randomBytes(32).toString("base64");
  let roleCreated = false;
  let cleanupFailed = false;
  const started = performance.now();
  let stage = "setup";
  let report: Record<string, unknown> = {
    syntheticOnly: true,
    productionVerified: false,
    cloudPitrVerified: false,
    ok: false,
  };
  function command(
    binary: "pg_dump" | "pg_restore",
    args: string[],
    database: string,
  ) {
    // No credentials in arguments or emitted subprocess diagnostics. Avoid inherited libpq routing.
    const env = Object.fromEntries(
      Object.entries(process.env).filter(
        ([key]) =>
          !key.startsWith("PG") &&
          key !== "DATABASE_URL" &&
          key !== "RECOVERY_TEST_DATABASE_URL" &&
          key !== "AI_TOOL_ENCRYPTION_KEY",
      ),
    );
    const r = spawnSync(binary, args, {
      encoding: "utf8",
      timeout: 60000,
      maxBuffer: 1024 * 1024,
      env: {
        ...env,
        PGHOST: url.hostname.replace(/^\[|\]$/g, ""),
        PGPORT: url.port || "5432",
        PGUSER: decodeURIComponent(url.username),
        PGPASSWORD: decodeURIComponent(url.password),
        PGDATABASE: database,
        PGCONNECT_TIMEOUT: "5",
        PGSSLMODE: "disable",
      },
    });
    check(
      !r.error && r.status === 0 && !r.stderr.trim(),
      "RECOVERY_SUBPROCESS_FAILED",
    );
  }
  async function database(suffix: string) {
    const name = `spartan_p03_${id}_${suffix}`;
    await admin.query(`CREATE DATABASE ${quote(name)} TEMPLATE template0`);
    databases.push(name);
    const connection = new URL(raw!);
    connection.pathname = `/${name}`;
    const pool = new pg.Pool({
      connectionString: connection.toString(),
      connectionTimeoutMillis: 5000,
    });
    pools.push(pool);
    const client = await pool.connect();
    clients.push(client);
    return { name, client };
  }
  try {
    const source = await database("source");
    const target = await database("restore");
    await admin.query(
      `CREATE ROLE ${quote(role)} LOGIN PASSWORD '${knowledgeRolePassword}' NOSUPERUSER NOBYPASSRLS`,
    );
    roleCreated = true;
    const migrations = prepareMigrations(
      listMigrationEntries(libDbPackageRoot()),
    );
    await runMigrations(source.client, migrations);
    await source.client.query(`GRANT USAGE ON SCHEMA public TO ${quote(role)}`);
    await source.client.query(
      `GRANT SELECT,INSERT,UPDATE ON sales_workflow_entities TO ${quote(role)}`,
    );
    const tenantA = randomUUID(),
      tenantB = randomUUID();
    const recordA = randomUUID(),
      recordB = randomUUID(),
      deletedRecord = randomUUID();
    const payload = { synthetic: "P03_SYNTHETIC_RECOVERY_SENTINEL" };
    process.env.AI_TOOL_ENCRYPTION_KEY = syntheticKey;
    const encrypted = encryptPhi(payload, `tenant:${tenantA}`);
    for (const [record, tenant] of [
      [recordA, tenantA],
      [recordB, tenantB],
      [deletedRecord, tenantA],
    ])
      await source.client.query(
        "INSERT INTO sales_workflow_entities(id,organization_id,kind,data) VALUES ($1,$2,'synthetic_recovery',$3)",
        [record, tenant, JSON.stringify({ encrypted })],
      );
    await source.client.query(
      "INSERT INTO member_personalization(organization_id,member_id) VALUES (1,1)",
    );
    const knowledgeA = await seedKnowledge(source.client, 7001);
    await seedKnowledge(source.client, 7002);
    await seedKnowledge(source.client, 7001, true);
    await installKnowledgePrivileges(source.client, role);
    async function knowledgePool(name: string) {
      const connection = new URL(raw!); connection.pathname = `/${name}`; connection.username=role; connection.password=knowledgeRolePassword;
      const pool = new pg.Pool({ connectionString: connection.toString(), connectionTimeoutMillis: 5000 });
      pools.push(pool); return pool;
    }
    const sourceKnowledgePool = await knowledgePool(source.name);
    const publication = knowledgeA.state.assignments[0];
    await executeCommand(sourceKnowledgePool, knowledgeA.tokens.get(knowledgeA.subjects[2])!, "tenant", {
      operation: "REFRESH_APPROVAL", versionId: knowledgeA.versionId, assignmentId: publication.id,
      approvalId: knowledgeA.state.versions[0].approvals.at(-1)!.id, expectedScopeRevision: knowledgeA.state.revision,
      expectedVersionRevisions: { [knowledgeA.versionId]: knowledgeA.state.versions[0].revision },
    }, "synthetic-p03-publication", { synthetic: true });
    const knowledgeCommand = { operation: "REVOKE_GRANT", credentialId: `synthetic-grant-${knowledgeA.subjects[0]}`,
      expectedScopeRevision: knowledgeA.state.revision + 1, expectedVersionRevisions: {}, expectedCredentialRevision: 1 };
    const knowledgeReceipt = await executeCommand(sourceKnowledgePool, knowledgeA.tokens.get(knowledgeA.subjects[1])!, "tenant", knowledgeCommand, "synthetic-p03-replay", { synthetic: true });
    const knowledgeDeliveries = await claimOutbox(sourceKnowledgePool, 3);
    check(knowledgeDeliveries.length === 3, "KNOWLEDGE_RECOVERY_FIXTURE_INCOMPLETE");
    await completeOutbox(sourceKnowledgePool, knowledgeDeliveries[0], true);
    for (let attempt = 2; attempt <= 10; attempt++) await source.client.query("UPDATE knowledge_outbox SET attempts=$2 WHERE event_id=$1", [knowledgeDeliveries[2].eventId, attempt]);
    await source.client.query("UPDATE knowledge_outbox SET lease_expires_at=clock_timestamp()-interval '1 second' WHERE event_id=$1", [knowledgeDeliveries[2].eventId]);
    await claimOutbox(sourceKnowledgePool, 1);
    await source.client.query("UPDATE knowledge_outbox SET lease_expires_at=clock_timestamp()-interval '1 second' WHERE event_id=$1",[knowledgeDeliveries[1].eventId]);
    await consumeEvent(sourceKnowledgePool, "synthetic-p03-consumer", knowledgeDeliveries[0].body, async (connection, event) => {
      check((await connection.query("SELECT scope_id FROM knowledge_scopes WHERE scope_id=$1", [event.scopeId])).rowCount === 1, "KNOWLEDGE_RECONCILE_SCOPE_MISSING");
    });
    const catalog = await readCatalog(source.client),
      data = await contents(source.client);
    stage = "dump";
    const dumpStart = performance.now();
    command("pg_dump", ["--format=custom", "--file", dump], source.name);
    chmodSync(dump, 0o600);
    const dumpMs = performance.now() - dumpStart;
    // Independent post-backup deletion evidence; synthetic drill fixture, not a production tombstone service.
    const tombstones = [{ id: deletedRecord, tenant: tenantA }];
    writeFileSync(
      path.join(directory, "synthetic-tombstones.json"),
      JSON.stringify(tombstones),
      { mode: 0o600 },
    );
    await source.client.query(
      "DELETE FROM sales_workflow_entities WHERE id=$1 AND organization_id=$2",
      [deletedRecord, tenantA],
    );
    await source.client.query(
      "INSERT INTO member_personalization(organization_id,member_id) VALUES (1,2)",
    );
    const incident = performance.now();
    await source.client.query("UPDATE sales_workflow_entities SET data='{}'");
    await source.client.query("DROP TABLE member_personalization");
    check(
      diffCatalog(catalog, await readCatalog(source.client)).length > 0,
      "CORRUPTION_NOT_DETECTED",
    );
    check(
      hash(data) !== hash(await contents(source.client)),
      "ROW_CORRUPTION_NOT_DETECTED",
    );
    stage = "restore";
    const restoreStart = performance.now();
    command(
      "pg_restore",
      [
        "--exit-on-error",
        "--single-transaction",
        "--dbname",
        target.name,
        dump,
      ],
      target.name,
    );
    const restoreMs = performance.now() - restoreStart;
    const catalogDifferences = diffCatalog(
      catalog,
      await readCatalog(target.client),
    );
    report = { ...report, catalogDifferences };
    check(catalogDifferences.length === 0, "RESTORED_CATALOG_DIFFERS");
    check(
      hash(data) === hash(await contents(target.client)),
      "RESTORED_ROWS_OR_SEQUENCES_DIFFER",
    );
    const targetKnowledgePool = await knowledgePool(target.name);
    check(JSON.stringify(await executeCommand(targetKnowledgePool, knowledgeA.tokens.get(knowledgeA.subjects[1])!, "tenant", knowledgeCommand, "synthetic-p03-replay", { synthetic: true })) === JSON.stringify(knowledgeReceipt), "KNOWLEDGE_RECOVERY_RECEIPT_REPLAY_FAILED");
    check((await consumeEvent(targetKnowledgePool, "synthetic-p03-consumer", knowledgeDeliveries[0].body, async () => { throw new RecoveryError("KNOWLEDGE_DUPLICATE_RECONCILED"); })).duplicate, "KNOWLEDGE_RECOVERY_CONSUMER_DEDUP_FAILED");
    check(!(await completeOutbox(targetKnowledgePool, { ...knowledgeDeliveries[1], leaseToken: "synthetic-stale-lease" }, true)), "KNOWLEDGE_RECOVERY_STALE_LEASE_ACCEPTED");
    const reclaimed=(await claimOutbox(targetKnowledgePool,100)).find(d=>d.eventId===knowledgeDeliveries[1].eventId);
    check(!!reclaimed&&reclaimed.attempt===2&&reclaimed.leaseToken!==knowledgeDeliveries[1].leaseToken,"KNOWLEDGE_RECOVERY_EXPIRED_LEASE_NOT_RECLAIMED");
    check(!(await completeOutbox(targetKnowledgePool,knowledgeDeliveries[1],true)),"KNOWLEDGE_RECOVERY_OLD_LEASE_ACCEPTED");
    const knowledgeScope=await readKnowledge(targetKnowledgePool,knowledgeA.tokens.get(knowledgeA.subjects[1])!,"tenant",null,{synthetic:true});
    check('scope' in knowledgeScope&&knowledgeScope.scope.id===knowledgeA.scopeId,"KNOWLEDGE_RECOVERY_SCOPE_ISOLATION_FAILED");
    stage = "tenant_isolation";
    await target.client.query(`SET ROLE ${quote(role)}`);
    check(
      (await target.client.query("SELECT * FROM sales_workflow_entities"))
        .rowCount === 0,
      "RESTORE_DEFAULT_TENANT_DENIAL_FAILED",
    );
    await target.client.query(
      "SELECT set_config('app.organization_id',$1,false)",
      [tenantA],
    );
    const visible = await target.client.query(
      "SELECT organization_id FROM sales_workflow_entities",
    );
    check(
      visible.rowCount === 2 &&
        visible.rows.every((r) => r.organization_id === tenantA),
      "RESTORE_TENANT_LEAK",
    );
    let denied = false;
    try {
      await target.client.query(
        "INSERT INTO sales_workflow_entities(id,organization_id,kind,data) VALUES ($1,$2,'synthetic_recovery','{}')",
        [randomUUID(), tenantB],
      );
    } catch (error) {
      denied = (error as { code?: string }).code === "42501";
    }
    check(denied, "RESTORE_CROSS_TENANT_WRITE_ALLOWED");
    await target.client.query("RESET ROLE");
    stage = "key_recovery";
    const restoredCiphertext = (
      await target.client.query(
        "SELECT data FROM sales_workflow_entities WHERE id=$1",
        [recordA],
      )
    ).rows[0].data.encrypted;
    delete process.env.AI_TOOL_ENCRYPTION_KEY;
    let missingKeyDenied = false;
    try {
      decryptPhi(restoredCiphertext, `tenant:${tenantA}`);
    } catch {
      missingKeyDenied = true;
    }
    check(missingKeyDenied, "MISSING_KEY_NOT_DENIED");
    process.env.AI_TOOL_ENCRYPTION_KEY = randomBytes(32).toString("base64");
    let wrongKeyDenied = false;
    try {
      decryptPhi(restoredCiphertext, `tenant:${tenantA}`);
    } catch {
      wrongKeyDenied = true;
    }
    check(wrongKeyDenied, "WRONG_KEY_NOT_DENIED");
    process.env.AI_TOOL_ENCRYPTION_KEY = syntheticKey;
    check(
      hash(decryptPhi(restoredCiphertext, `tenant:${tenantA}`)) ===
        hash(payload),
      "KEY_RECOVERY_FAILED",
    );
    stage = "deletion_reconciliation";
    check(
      (
        await target.client.query(
          "SELECT id FROM sales_workflow_entities WHERE id=$1",
          [deletedRecord],
        )
      ).rowCount === 1,
      "STALE_BACKUP_FIXTURE_MISSING",
    );
    for (const tombstone of JSON.parse(
      readFileSync(path.join(directory, "synthetic-tombstones.json"), "utf8"),
    ) as typeof tombstones)
      await target.client.query(
        "DELETE FROM sales_workflow_entities WHERE id=$1 AND organization_id=$2",
        [tombstone.id, tombstone.tenant],
      );
    check(
      (
        await target.client.query(
          "SELECT id FROM sales_workflow_entities WHERE id=$1",
          [deletedRecord],
        )
      ).rowCount === 0,
      "DELETED_RECORD_RESURRECTED",
    );
    check(
      (
        await target.client.query(
          "SELECT id FROM sales_workflow_entities WHERE id=$1 AND organization_id=$2",
          [recordB, tenantB],
        )
      ).rowCount === 1,
      "TOMBSTONE_CROSSED_TENANT",
    );
    check(
      (
        await target.client.query(
          "SELECT id FROM member_personalization WHERE member_id=2",
        )
      ).rowCount === 0,
      "POST_BACKUP_LOSS_FIXTURE_INVALID",
    );
    stage = "application_transaction";
    await target.client.query("BEGIN");
    const inserted = await target.client.query(
      "INSERT INTO member_personalization(organization_id,member_id) VALUES (1,3) RETURNING id,payload",
    );
    check(
      inserted.rows[0].id === 2 &&
        inserted.rows[0].payload.jurisdiction.state === null,
      "RESTORED_INSERT_DEFAULT_OR_SEQUENCE_FAILED",
    );
    await target.client.query(
      "UPDATE member_personalization SET payload=jsonb_set(payload,'{pinnedTools}','[\"synthetic\"]') WHERE member_id=3 AND organization_id=1",
    );
    await target.client.query("COMMIT");
    check(
      (
        await target.client.query(
          "SELECT payload FROM member_personalization WHERE member_id=3 AND organization_id=1",
        )
      ).rows[0].payload.pinnedTools[0] === "synthetic",
      "RESTORED_APP_WRITE_FAILED",
    );
    let duplicateDenied = false;
    try {
      await target.client.query(
        "INSERT INTO member_personalization(organization_id,member_id) VALUES (1,3)",
      );
    } catch (error) {
      duplicateDenied = (error as { code?: string }).code === "23505";
    }
    check(duplicateDenied, "RESTORED_UNIQUE_CONSTRAINT_FAILED");
    report = {
      ...report,
      ok: true,
      migrationCount: migrations.length,
      catalogCategories: Object.keys(catalog).length,
      dumpMs: Math.ceil(dumpMs),
      restoreMs: Math.ceil(restoreMs),
      verifiedRecoveryMs: Math.ceil(performance.now() - incident),
      snapshotAgeAtIncidentMs: Math.ceil(incident - dumpStart),
      syntheticCommittedRowsLost: 1,
      checks: [
        "catalog",
        "all_rows",
        "sequence_state",
        "lost_table",
        "corruption",
        "rls_no_tenant",
        "rls_cross_tenant",
        "grants",
        "missing_key",
        "wrong_key",
        "recovered_key",
        "stale_backup_tombstone_fixture",
        "app_transaction",
        "unique_constraint",
        "knowledge_all_18_tables",
        "knowledge_receipt_replay",
        "knowledge_consumer_dedup",
        "knowledge_lease_recovery_cas",
        "knowledge_trusted_scope",
      ],
      limits: [
        "same_cluster_isolated_databases",
        "synthetic_scale",
        "roles_precreated_not_recovered",
        "tombstone_fixture_not_production_service",
        "no_cloud_pitr_or_cross_store_recovery",
      ],
    };
  } catch (error) {
    report = {
      ...report,
      ok: false,
      failedStage: stage,
      error:
        error instanceof RecoveryError
          ? error.message
          : "SYNTHETIC_RECOVERY_FAILED",
    };
  } finally {
    if (originalKey === undefined) delete process.env.AI_TOOL_ENCRYPTION_KEY;
    else process.env.AI_TOOL_ENCRYPTION_KEY = originalKey;
    for (const client of clients) client.release();
    for (const pool of pools) await pool.end();
    for (const name of databases.reverse()) {
      try {
        await admin.query(`DROP DATABASE ${quote(name)}`);
      } catch {
        cleanupFailed = true;
      }
    }
    if (roleCreated) {
      try {
        await admin.query(`DROP ROLE ${quote(role)}`);
      } catch {
        cleanupFailed = true;
      }
    }
    await admin.end();
    try {
      rmSync(directory, { recursive: true, force: true });
    } catch {
      cleanupFailed = true;
    }
  }
  report = {
    ...report,
    cleanupVerified: !cleanupFailed,
    totalMs: Math.ceil(performance.now() - started),
    ok: report.ok === true && !cleanupFailed,
  };
  writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n", {
    mode: 0o600,
  });
  console.log(JSON.stringify(report));
  if (!report.ok) process.exitCode = 1;
}
try {
  await main();
} catch {
  console.error("SYNTHETIC_RECOVERY_CONFIGURATION_FAILED");
  process.exitCode = 2;
}
