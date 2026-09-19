import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { inArray, sql } from "drizzle-orm";
import {
  clientMembers,
  clientOrganizations,
  clientSessions,
  memberSyncRecords,
  memberWorkItems,
} from "@workspace/db";
import app from "../app";
import { hashToken } from "../auth/crypto";
import { db } from "../db";

const integrationRequested = process.env.RUN_POSTGRES_INTEGRATION === "true";
const databaseUrl = process.env.DATABASE_URL?.trim();

if (integrationRequested && !databaseUrl) {
  throw new Error(
    "[saved-work:migration-setup] RUN_POSTGRES_INTEGRATION=true requires an isolated DATABASE_URL",
  );
}

if (
  integrationRequested &&
  (
    process.env.NODE_ENV === "production" ||
    process.env.DEPLOY_ENV === "production" ||
    process.env.APP_ENV === "production" ||
    process.env.REPLIT_DEPLOYMENT === "1" ||
    (databaseUrl && /(prod|production|spartanhospicecoaching)/i.test(databaseUrl))
  )
) {
  throw new Error(
    "[saved-work:migration-setup] refusing to run saved-work integration data against a production-looking DATABASE_URL",
  );
}

const integrationEnabled = integrationRequested && Boolean(databaseUrl);

type Actor = {
  memberId: number;
  organizationId: number;
  token: string;
};

const migrationPaths = [
  resolve(
    import.meta.dirname,
    "../../../../lib/db/migrations/0023_member_sync_continuity.sql",
  ),
  resolve(
    import.meta.dirname,
    "../../../../lib/db/migrations/0024_member_sync_mutation_tenant_scope.sql",
  ),
  resolve(
    import.meta.dirname,
    "../../../../lib/db/migrations/0025_member_work_items.sql",
  ),
  resolve(
    import.meta.dirname,
    "../../../../lib/db/migrations/0026_member_work_idempotency.sql",
  ),
];

async function applyMigrations() {
  try {
    for (const migrationPath of migrationPaths) {
      await db.execute(sql.raw(readFileSync(migrationPath, "utf8")));
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`[saved-work:migration-setup] ${message}`, {
      cause: error,
    });
  }
}

describe.runIf(integrationEnabled)(
  "member work PostgreSQL integration",
  () => {
    const namespace = randomUUID();
    const organizationIds: number[] = [];
    const memberIds: number[] = [];
    let owner: Actor;
    let sameOrganizationMember: Actor;
    let otherOrganizationMember: Actor;

    async function createActors() {
      const organizations = await db
        .insert(clientOrganizations)
        .values([
          {
            name: `Member work integration A ${namespace}`,
            type: "company",
            status: "active",
            billingPlan: "comp",
          },
          {
            name: `Member work integration B ${namespace}`,
            type: "company",
            status: "active",
            billingPlan: "comp",
          },
        ])
        .returning({ id: clientOrganizations.id });

      organizationIds.push(...organizations.map(({ id }) => id));

      const members = await db
        .insert(clientMembers)
        .values([
          {
            email: `member-work-owner-${namespace}@example.invalid`,
            name: "Member work integration owner",
            role: "member",
            organizationId: organizationIds[0],
            status: "active",
            passwordHash: "integration-test-only",
          },
          {
            email: `member-work-same-org-${namespace}@example.invalid`,
            name: "Member work integration same org",
            role: "member",
            organizationId: organizationIds[0],
            status: "active",
            passwordHash: "integration-test-only",
          },
          {
            email: `member-work-other-org-${namespace}@example.invalid`,
            name: "Member work integration other org",
            role: "member",
            organizationId: organizationIds[1],
            status: "active",
            passwordHash: "integration-test-only",
          },
        ])
        .returning({
          id: clientMembers.id,
          organizationId: clientMembers.organizationId,
        });

      memberIds.push(...members.map(({ id }) => id));

      const tokens = [
        `member-work-owner-token-${namespace}`,
        `member-work-same-org-token-${namespace}`,
        `member-work-other-org-token-${namespace}`,
      ];
      await db.insert(clientSessions).values(
        members.map(({ id }, index) => ({
          memberId: id,
          tokenHash: hashToken(tokens[index]),
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          mfaVerifiedAt: new Date(),
        })),
      );

      return {
        owner: {
          memberId: members[0].id,
          organizationId: members[0].organizationId,
          token: tokens[0],
        },
        sameOrganizationMember: {
          memberId: members[1].id,
          organizationId: members[1].organizationId,
          token: tokens[1],
        },
        otherOrganizationMember: {
          memberId: members[2].id,
          organizationId: members[2].organizationId,
          token: tokens[2],
        },
      };
    }

    beforeAll(async () => {
      await applyMigrations();
      ({ owner, sameOrganizationMember, otherOrganizationMember } =
        await createActors());
    });

    afterAll(async () => {
      if (organizationIds.length === 0) return;

      await db
        .delete(memberSyncRecords)
        .where(inArray(memberSyncRecords.organizationId, organizationIds));
      await db
        .delete(memberWorkItems)
        .where(inArray(memberWorkItems.organizationId, organizationIds));
      await db
        .delete(clientSessions)
        .where(inArray(clientSessions.memberId, memberIds));
      await db
        .delete(clientMembers)
        .where(inArray(clientMembers.organizationId, organizationIds));
      await db
        .delete(clientOrganizations)
        .where(inArray(clientOrganizations.id, organizationIds));
    });

    it("[retry concurrency] serializes concurrent retries through the production partial unique index", async () => {
      const idempotencyKey = `member-work-retry-${namespace}`;
      const payload = {
        kind: "tool_result",
        toolId: "objection-handler",
        title: "Concurrent retry integration result",
        output: { recommendation: "Ask one clarifying question." },
        sourcePlatform: "ios",
      };

      const responses = await Promise.all(
        Array.from({ length: 12 }, () =>
          request(app)
            .post("/api/v1/member-work")
            .set("Authorization", `Bearer ${owner.token}`)
            .set("Idempotency-Key", idempotencyKey)
            .send(payload),
        ),
      );

      expect(responses.filter((response) => response.status === 201)).toHaveLength(
        1,
      );
      expect(responses.filter((response) => response.status === 200)).toHaveLength(
        11,
      );
      expect(responses.every((response) => response.body.item)).toBe(true);
      expect(new Set(responses.map((response) => response.body.item.id)).size).toBe(
        1,
      );
      expect(
        responses.filter((response) => response.body.idempotent === false),
      ).toHaveLength(1);
      expect(
        responses.filter((response) => response.body.idempotent === true),
      ).toHaveLength(11);

      const stored = await db.execute<{ count: string }>(sql`
        SELECT count(*)::text AS count
        FROM "member_work_items"
        WHERE "organization_id" = ${owner.organizationId}
          AND "member_id" = ${owner.memberId}
          AND "idempotency_key" = ${idempotencyKey}
      `);
      expect(stored.rows[0]?.count).toBe("1");

      const index = await db.execute<{ indexdef: string }>(sql`
        SELECT indexdef
        FROM pg_indexes
        WHERE schemaname = current_schema()
          AND tablename = 'member_work_items'
          AND indexname = 'member_work_idempotency_uidx'
      `);
      expect(index.rows).toHaveLength(1);
      expect(index.rows[0]?.indexdef).toMatch(
        /UNIQUE INDEX member_work_idempotency_uidx ON .*member_work_items .*organization_id, member_id, idempotency_key.*WHERE \(idempotency_key IS NOT NULL\)/,
      );

      const noKeyResponses = await Promise.all([
        request(app)
          .post("/api/v1/member-work")
          .set("Authorization", `Bearer ${owner.token}`)
          .send({ ...payload, title: "No key one" }),
        request(app)
          .post("/api/v1/member-work")
          .set("Authorization", `Bearer ${owner.token}`)
          .send({ ...payload, title: "No key two" }),
      ]);
      expect(noKeyResponses.every((response) => response.status === 201)).toBe(
        true,
      );
      expect(new Set(noKeyResponses.map((response) => response.body.item.id)).size).toBe(
        2,
      );
    });

    it("[tenant isolation] keeps saved work invisible and immutable across organizations and members", async () => {
      const created = await request(app)
        .post("/api/v1/member-work")
        .set("Authorization", `Bearer ${owner.token}`)
        .set("Idempotency-Key", `member-work-isolation-${namespace}`)
        .send({
          kind: "calculator_report",
          toolId: "activity-targets",
          title: "Private activity report",
          output: { target: 3 },
        });

      expect(created.status).toBe(201);
      const itemId = created.body.item.id as string;

      const [
        otherOrganizationList,
        otherOrganizationGet,
        otherOrganizationPatch,
        sameOrganizationList,
        sameOrganizationGet,
        sameOrganizationPatch,
      ] = await Promise.all([
        request(app)
          .get("/api/v1/member-work")
          .set("Authorization", `Bearer ${otherOrganizationMember.token}`),
        request(app)
          .get(`/api/v1/member-work/${itemId}`)
          .set("Authorization", `Bearer ${otherOrganizationMember.token}`),
        request(app)
          .patch(`/api/v1/member-work/${itemId}`)
          .set("Authorization", `Bearer ${otherOrganizationMember.token}`)
          .send({ status: "failed" }),
        request(app)
          .get("/api/v1/member-work")
          .set("Authorization", `Bearer ${sameOrganizationMember.token}`),
        request(app)
          .get(`/api/v1/member-work/${itemId}`)
          .set("Authorization", `Bearer ${sameOrganizationMember.token}`),
        request(app)
          .patch(`/api/v1/member-work/${itemId}`)
          .set("Authorization", `Bearer ${sameOrganizationMember.token}`)
          .send({ status: "failed" }),
      ]);

      expect(otherOrganizationList.status).toBe(200);
      expect(otherOrganizationList.body.items).toEqual([]);
      expect(otherOrganizationGet.status).toBe(404);
      expect(otherOrganizationPatch.status).toBe(404);
      expect(sameOrganizationList.status).toBe(200);
      expect(sameOrganizationList.body.items).toEqual([]);
      expect(sameOrganizationGet.status).toBe(404);
      expect(sameOrganizationPatch.status).toBe(404);

      const ownerGet = await request(app)
        .get(`/api/v1/member-work/${itemId}`)
        .set("Authorization", `Bearer ${owner.token}`);
      expect(ownerGet.status).toBe(200);
      expect(ownerGet.body.item.status).toBe("completed");

      const ownerPatch = await request(app)
        .patch(`/api/v1/member-work/${itemId}`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          status: "failed",
          nextAction: { title: "Review the failed report" },
        });
      expect(ownerPatch.status).toBe(200);
      expect(ownerPatch.body.item.status).toBe("failed");
      expect(ownerPatch.body.item.nextAction).toEqual({
        title: "Review the failed report",
      });
    });

    it("[web to iPhone continuity] restores web-created sync records only to their authenticated owner", async () => {
      const mutation = {
        mutationId: `web-result-${namespace}`,
        recordType: "tool_result",
        recordId: "objection",
        payload: { result: "Ask what would make the timing workable." },
        clientUpdatedAt: "2026-09-19T12:00:00.000Z",
        isDeleted: false,
      };

      const created = await request(app)
        .post("/api/v1/member-sync")
        .set("Authorization", `Bearer ${owner.token}`)
        .send({ mutations: [mutation] });

      expect(created.status).toBe(200);
      expect(created.body).toMatchObject({
        conflicts: 0,
        rejected: [],
        records: [{
          mutationId: mutation.mutationId,
          recordType: mutation.recordType,
          recordId: mutation.recordId,
          payload: mutation.payload,
          isDeleted: false,
        }],
      });

      const [ownerRestore, sameOrganizationRestore, otherOrganizationRestore] =
        await Promise.all([
          request(app)
            .get("/api/v1/member-sync")
            .set("Authorization", `Bearer ${owner.token}`),
          request(app)
            .get("/api/v1/member-sync")
            .set("Authorization", `Bearer ${sameOrganizationMember.token}`),
          request(app)
            .get("/api/v1/member-sync")
            .set("Authorization", `Bearer ${otherOrganizationMember.token}`),
        ]);

      expect(ownerRestore.status).toBe(200);
      expect(ownerRestore.body.records).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            mutationId: mutation.mutationId,
            payload: mutation.payload,
          }),
        ]),
      );
      expect(sameOrganizationRestore.status).toBe(200);
      expect(sameOrganizationRestore.body.records).toEqual([]);
      expect(otherOrganizationRestore.status).toBe(200);
      expect(otherOrganizationRestore.body.records).toEqual([]);
    });

    it("[iPhone to My Work continuity] exposes iPhone-created work through the web history endpoint", async () => {
      const idempotencyKey = `ios-my-work-${namespace}`;
      const payload = {
        kind: "tool_result",
        toolId: "objection-handler",
        title: "iPhone objection practice",
        output: { recommendation: "Confirm the concern before responding." },
        sourcePlatform: "ios",
      };

      const created = await request(app)
        .post("/api/v1/member-work")
        .set("Authorization", `Bearer ${owner.token}`)
        .set("Idempotency-Key", idempotencyKey)
        .send(payload);
      expect(created.status).toBe(201);
      expect(created.body.item).toMatchObject(payload);

      const myWork = await request(app)
        .get("/api/v1/member-work")
        .set("Authorization", `Bearer ${owner.token}`);
      expect(myWork.status).toBe(200);
      expect(myWork.body.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: created.body.item.id,
            sourcePlatform: "ios",
            title: payload.title,
          }),
        ]),
      );
    });

    it("[sync retries and conflicts] keeps duplicate mutations idempotent and returns the authoritative winner", async () => {
      const initial = {
        mutationId: `sync-retry-${namespace}`,
        recordType: "commitment",
        recordId: "current",
        payload: { value: "Make three focused calls." },
        clientUpdatedAt: "2026-09-19T13:00:00.000Z",
        isDeleted: false,
      };

      const first = await request(app)
        .post("/api/v1/member-sync")
        .set("Authorization", `Bearer ${owner.token}`)
        .send({ mutations: [initial] });
      const retry = await request(app)
        .post("/api/v1/member-sync")
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          mutations: [{
            ...initial,
            payload: { value: "A retry must not replace the original payload." },
          }],
        });

      expect(first.status).toBe(200);
      expect(retry.status).toBe(200);
      expect(retry.body).toMatchObject({
        conflicts: 0,
        rejected: [],
        records: [{
          mutationId: initial.mutationId,
          payload: initial.payload,
        }],
      });

      const older = await request(app)
        .post("/api/v1/member-sync")
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          mutations: [{
            ...initial,
            mutationId: `sync-older-${namespace}`,
            payload: { value: "An older device value." },
            clientUpdatedAt: "2026-09-19T12:59:59.000Z",
          }],
        });

      expect(older.status).toBe(200);
      expect(older.body).toMatchObject({
        conflicts: 1,
        rejected: [],
        records: [{
          mutationId: initial.mutationId,
          payload: initial.payload,
        }],
      });

      const stored = await db.execute<{ count: string }>(sql`
        SELECT count(*)::text AS count
        FROM "member_sync_records"
        WHERE "organization_id" = ${owner.organizationId}
          AND "member_id" = ${owner.memberId}
          AND "record_type" = 'commitment'
          AND "record_id" = 'current'
      `);
      expect(stored.rows[0]?.count).toBe("1");
    });

    it("[sync rejection envelope] rejects unsafe records without discarding valid mutations", async () => {
      const validMutationId = `sync-valid-${namespace}`;
      const rejectedMutationId = `sync-rejected-${namespace}`;
      const response = await request(app)
        .post("/api/v1/member-sync")
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          mutations: [
            {
              mutationId: validMutationId,
              recordType: "tool_draft",
              recordId: "weekly",
              payload: { draft: { goal: "Schedule two referral conversations." } },
              clientUpdatedAt: "2026-09-19T14:00:00.000Z",
              isDeleted: false,
            },
            {
              mutationId: rejectedMutationId,
              recordType: "tool_result",
              recordId: "objection",
              payload: { result: "Call patient Jane Doe at 555-123-4567." },
              clientUpdatedAt: "2026-09-19T14:00:01.000Z",
              isDeleted: false,
            },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        conflicts: 0,
        rejected: [{
          mutationId: rejectedMutationId,
          code: "INVALID_SYNC_MUTATION",
        }],
        records: [{
          mutationId: validMutationId,
          recordType: "tool_draft",
          recordId: "weekly",
        }],
      });
    });
  },
);
