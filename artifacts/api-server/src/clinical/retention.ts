import { and, eq, inArray, isNull } from "drizzle-orm";
import {
  aiToolRuns,
  clinicalAuditEvents,
  clinicalCases,
  clinicalDocuments,
  clinicalReviews,
} from "@workspace/db";
import { db } from "../db";
import { deleteClinicalObject } from "./storage";

export type ClinicalRetentionResult = {
  scanned: number;
  purged: number;
  failed: number;
  ranAt: string;
};

export async function runClinicalRetentionSweep(): Promise<ClinicalRetentionResult> {
  const now = new Date();
  const candidates = await db
    .select()
    .from(clinicalCases)
    .where(
      and(
        eq(clinicalCases.legalHold, false),
        isNull(clinicalCases.purgeCompletedAt),
      ),
    )
    .limit(100);
  const result: ClinicalRetentionResult = {
    scanned: candidates.length,
    purged: 0,
    failed: 0,
    ranAt: now.toISOString(),
  };

  for (const clinicalCase of candidates) {
    try {
      await db
        .update(clinicalCases)
        .set({
          status: "deleting",
          deletedAt: clinicalCase.deletedAt ?? now,
          updatedAt: now,
        })
        .where(eq(clinicalCases.id, clinicalCase.id));
      const documents = await db
        .select()
        .from(clinicalDocuments)
        .where(
          and(
            eq(clinicalDocuments.organizationId, clinicalCase.organizationId),
            eq(clinicalDocuments.caseId, clinicalCase.id),
          ),
        );
      await Promise.all(
        documents.map((document) => deleteClinicalObject(document.objectKey)),
      );
      const runIds = (
        await db
          .select({ id: aiToolRuns.id })
          .from(aiToolRuns)
          .where(
            and(
              eq(aiToolRuns.organizationId, clinicalCase.organizationId),
              eq(aiToolRuns.clinicalCaseId, clinicalCase.id),
            ),
          )
      ).map((run) => run.id);
      if (runIds.length) {
        await db
          .update(clinicalReviews)
          .set({ encryptedNotes: null })
          .where(
            and(
              eq(clinicalReviews.organizationId, clinicalCase.organizationId),
              inArray(clinicalReviews.runId, runIds),
            ),
          );
      }
      await db
        .update(clinicalDocuments)
        .set({
          encryptedMetadata: "purged",
          scanStatus: "deleted",
          deletedAt: now,
        })
        .where(
          and(
            eq(clinicalDocuments.organizationId, clinicalCase.organizationId),
            eq(clinicalDocuments.caseId, clinicalCase.id),
          ),
        );
      await db
        .update(aiToolRuns)
        .set({ status: "deleted", output: null, encryptedPayload: null })
        .where(
          and(
            eq(aiToolRuns.organizationId, clinicalCase.organizationId),
            eq(aiToolRuns.clinicalCaseId, clinicalCase.id),
          ),
        );
      await db
        .update(clinicalCases)
        .set({
          encryptedLabel: "purged",
          status: "deleted",
          purgeCompletedAt: now,
          updatedAt: now,
        })
        .where(eq(clinicalCases.id, clinicalCase.id));
      await db.insert(clinicalAuditEvents).values({
        organizationId: clinicalCase.organizationId,
        actorMemberId: clinicalCase.createdByMemberId,
        action: "clinical.case.retention_purged",
        targetType: "clinical_case",
        targetId: clinicalCase.id,
        requestId: `retention-${clinicalCase.id}-${now.getTime()}`,
        metadata: { documentCount: documents.length },
      });
      result.purged += 1;
    } catch (error) {
      result.failed += 1;
      console.error("[clinical-retention] case purge failed", {
        caseId: clinicalCase.id,
        error: error instanceof Error ? error.message : "unknown",
      });
    }
  }
  return result;
}
