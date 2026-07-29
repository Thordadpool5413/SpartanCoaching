import { and, eq, lte } from "drizzle-orm";
import {
  clinicalAuditEvents,
  clinicalEphemeralObjects,
  clinicalEphemeralSessions,
} from "@workspace/db";
import { db } from "../db";
import { deleteEphemeralClinicalObject } from "./storage";

// Sessions expire at 55 minutes so the dedicated five-minute sweep keeps the
// application-level orphan ceiling at 60 minutes.
export const EPHEMERAL_CLINICAL_TTL_MS = 55 * 60 * 1000;

export type EphemeralPurgeReason =
  "completed" | "cancelled" | "failed" | "expired";

export async function purgeEphemeralClinicalSession(
  organizationId: number,
  sessionId: string,
): Promise<number> {
  const objects = await db
    .select({
      id: clinicalEphemeralObjects.id,
      objectKey: clinicalEphemeralObjects.objectKey,
    })
    .from(clinicalEphemeralObjects)
    .where(
      and(
        eq(clinicalEphemeralObjects.organizationId, organizationId),
        eq(clinicalEphemeralObjects.sessionId, sessionId),
      ),
    );
  await Promise.all(
    objects.map((object) => deleteEphemeralClinicalObject(object.objectKey)),
  );
  await db
    .delete(clinicalEphemeralSessions)
    .where(
      and(
        eq(clinicalEphemeralSessions.id, sessionId),
        eq(clinicalEphemeralSessions.organizationId, organizationId),
      ),
    );
  return objects.length;
}

export async function runEphemeralClinicalSweep() {
  const now = new Date();
  const expired = await db
    .select()
    .from(clinicalEphemeralSessions)
    .where(lte(clinicalEphemeralSessions.expiresAt, now))
    .limit(100);
  let purged = 0;
  let failed = 0;
  for (const session of expired) {
    try {
      await db
        .update(clinicalEphemeralSessions)
        .set({ status: "purging", updatedAt: now })
        .where(eq(clinicalEphemeralSessions.id, session.id));
      const objectCount = await purgeEphemeralClinicalSession(
        session.organizationId,
        session.id,
      );
      await db.insert(clinicalAuditEvents).values({
        organizationId: session.organizationId,
        actorMemberId: session.createdByMemberId,
        action: "clinical.ephemeral.purged",
        targetType: "clinical_ephemeral_session",
        targetId: session.id,
        requestId: `ephemeral-expiry-${session.id}-${now.getTime()}`,
        metadata: {
          reason: "expired" satisfies EphemeralPurgeReason,
          objectCount,
          deletionVerified: true,
        },
      });
      purged += 1;
    } catch (error) {
      failed += 1;
      console.error("[clinical-ephemeral] expiry purge failed", {
        sessionId: session.id,
        error: error instanceof Error ? error.message : "unknown",
      });
    }
  }
  return { scanned: expired.length, purged, failed, ranAt: now.toISOString() };
}
