import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  aiToolOrganizationFlags,
  aiToolRuns,
  clinicalCases,
  clinicalDocuments,
  clinicalPermissions,
  clientMembers,
  clientOrganizations,
  clientSessions,
} from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import app from "../app";
import { hashToken } from "../auth/crypto";
import { db } from "../db";
import { encryptPhi } from "../security/phiEncryption";

const integrationEnabled =
  process.env.RUN_POSTGRES_INTEGRATION === "true" &&
  Boolean(process.env.DATABASE_URL);

describe.runIf(integrationEnabled)(
  "AI tool PostgreSQL tenant isolation",
  () => {
    const token = "ai-isolation-acceptance-token";
    let firstOrgId = 0;
    let secondOrgId = 0;
    let firstMemberId = 0;
    let secondMemberId = 0;
    let foreignRunId = "";
    let foreignCaseId = "";
    let foreignDocumentId = "";

    beforeAll(async () => {
      process.env.AI_TOOL_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString(
        "base64",
      );

      [firstOrgId, secondOrgId] = (
        await db
          .insert(clientOrganizations)
          .values([
            {
              name: "AI isolation tenant A",
              type: "company",
              status: "active",
              billingPlan: "comp",
            },
            {
              name: "AI isolation tenant B",
              type: "company",
              status: "active",
              billingPlan: "comp",
            },
          ])
          .returning({ id: clientOrganizations.id })
      ).map(({ id }) => id);

      [firstMemberId, secondMemberId] = (
        await db
          .insert(clientMembers)
          .values([
            {
              email: `ai-isolation-a-${Date.now()}@example.invalid`,
              name: "Tenant A reviewer",
              role: "org_admin",
              organizationId: firstOrgId,
              status: "active",
              passwordHash: "integration-test-only",
            },
            {
              email: `ai-isolation-b-${Date.now()}@example.invalid`,
              name: "Tenant B reviewer",
              role: "org_admin",
              organizationId: secondOrgId,
              status: "active",
              passwordHash: "integration-test-only",
            },
          ])
          .returning({ id: clientMembers.id })
      ).map(({ id }) => id);

      await db.insert(clientSessions).values({
        memberId: firstMemberId,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        mfaVerifiedAt: new Date(),
      });
      await db.insert(clinicalPermissions).values({
        organizationId: firstOrgId,
        memberId: firstMemberId,
        canUse: true,
        canReview: true,
        canAdmin: true,
        grantedByMemberId: firstMemberId,
      });
      [foreignRunId] = (
        await db
          .insert(aiToolRuns)
          .values({
            organizationId: secondOrgId,
            memberId: secondMemberId,
            toolId: "email-optimizer",
            toolVersion: "1.0.0",
            model: "integration-test",
            promptVersion: "integration-test",
            inputHash: "a".repeat(64),
            idempotencyKeyHash: "b".repeat(64),
            status: "completed",
            output: { mustRemainPrivate: true },
            reviewStatus: "not_required",
          })
          .returning({ id: aiToolRuns.id })
      ).map(({ id }) => id);

      [foreignCaseId] = (
        await db
          .insert(clinicalCases)
          .values({
            organizationId: secondOrgId,
            createdByMemberId: secondMemberId,
            encryptedLabel: encryptPhi(
              { label: "Tenant B private case" },
              "temporary",
            ),
            retentionUntil: new Date(Date.now() + 30 * 86_400_000),
          })
          .returning({ id: clinicalCases.id })
      ).map(({ id }) => id);
      // Re-encrypt with the same AAD production uses now that the generated ID exists.
      await db
        .update(clinicalCases)
        .set({
          encryptedLabel: encryptPhi(
            { label: "Tenant B private case" },
            `clinical-case:${secondOrgId}:${foreignCaseId}`,
          ),
        })
        .where(eq(clinicalCases.id, foreignCaseId));

      [foreignDocumentId] = (
        await db
          .insert(clinicalDocuments)
          .values({
            caseId: foreignCaseId,
            organizationId: secondOrgId,
            uploadedByMemberId: secondMemberId,
            objectKey: `clinical/${secondOrgId}/${foreignCaseId}/private`,
            encryptedMetadata: encryptPhi(
              { filename: "private.pdf" },
              "integration-test",
            ),
            contentType: "application/pdf",
            sizeBytes: 1024,
            scanStatus: "safe",
          })
          .returning({ id: clinicalDocuments.id })
      ).map(({ id }) => id);
    });

    afterAll(async () => {
      if (!firstOrgId || !secondOrgId) return;
      const orgIds = [firstOrgId, secondOrgId];
      await db
        .delete(clinicalDocuments)
        .where(inArray(clinicalDocuments.organizationId, orgIds));
      await db
        .delete(clinicalCases)
        .where(inArray(clinicalCases.organizationId, orgIds));
      await db
        .delete(aiToolRuns)
        .where(inArray(aiToolRuns.organizationId, orgIds));
      await db
        .delete(aiToolOrganizationFlags)
        .where(inArray(aiToolOrganizationFlags.organizationId, orgIds));
      await db
        .delete(clinicalPermissions)
        .where(inArray(clinicalPermissions.organizationId, orgIds));
      await db
        .delete(clientSessions)
        .where(
          inArray(clientSessions.memberId, [firstMemberId, secondMemberId]),
        );
      await db
        .delete(clientMembers)
        .where(inArray(clientMembers.organizationId, orgIds));
      await db
        .delete(clientOrganizations)
        .where(inArray(clientOrganizations.id, orgIds));
    });

    it("makes nonclinical tools available without manual feature-flag rows", async () => {
      const catalog = await request(app)
        .get("/api/ai-tools")
        .set("Authorization", `Bearer ${token}`);
      expect(catalog.status).toBe(200);
      expect(
        catalog.body.tools.find(
          (tool: { id: string }) => tool.id === "email-optimizer",
        )?.availability,
      ).toMatchObject({
        enabled: true,
        globalEnabled: true,
        organizationEnabled: true,
      });
    });

    it("never exposes another organization's run in history, detail, or export", async () => {
      const history = await request(app)
        .get("/api/ai-tools/email-optimizer/runs")
        .set("Authorization", `Bearer ${token}`);
      expect(history.status).toBe(200);
      expect(history.body.runs).toEqual([]);

      const detail = await request(app)
        .get(`/api/ai-tool-runs/${foreignRunId}`)
        .set("Authorization", `Bearer ${token}`);
      expect(detail.status).toBe(404);

      const exported = await request(app)
        .get(`/api/ai-tool-runs/${foreignRunId}/export`)
        .set("Authorization", `Bearer ${token}`);
      expect(exported.status).toBe(404);
    });

    it("retires persistent clinical history, cases, document access, and export", async () => {
      const clinicalHistory = await request(app)
        .get("/api/ai-tools/medicare-lcd-advisor/runs")
        .set("Authorization", `Bearer ${token}`);
      expect(clinicalHistory.status).toBe(410);
      expect(clinicalHistory.body.error.code).toBe(
        "CLINICAL_RESULT_NOT_RETAINED",
      );

      const cases = await request(app)
        .get("/api/clinical/cases")
        .set("Authorization", `Bearer ${token}`);
      expect(cases.status).toBe(410);

      const download = await request(app)
        .get(`/api/clinical/documents/${foreignDocumentId}/download-url`)
        .set("Authorization", `Bearer ${token}`);
      expect(download.status).toBe(410);

      const deletion = await request(app)
        .delete(`/api/clinical/cases/${foreignCaseId}`)
        .set("Authorization", `Bearer ${token}`);
      expect(deletion.status).toBe(404);
    });
  },
);
