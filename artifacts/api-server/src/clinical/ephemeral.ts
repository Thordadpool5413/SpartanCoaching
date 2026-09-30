import { and, eq, lte, or } from "drizzle-orm";
import {
  clinicalAuditEvents,
  clinicalEphemeralObjects,
  clinicalEphemeralSessions,
} from "@workspace/db";
import { db } from "../db";
import { deleteEphemeralClinicalObject } from "./storage";

// Expire sessions after 55 minutes. The sweep is best effort: outages can
// delay deletion, so callers must not promise a hard 60-minute ceiling.
export const EPHEMERAL_CLINICAL_TTL_MS = 55 * 60 * 1000;

export type EphemeralPurgeReason =
  "completed" | "cancelled" | "failed" | "expired";

export async function purgeEphemeralClinicalSession(
  organizationId: number,
  sessionId: string,
): Promise<number> {
  return db.transaction(async (tx) => {
    // The same row lock is held for the full authenticated upload, so delete
    // cannot finish while an in-flight upload recreates the object.
    const [session] = await tx.select().from(clinicalEphemeralSessions).where(and(
      eq(clinicalEphemeralSessions.id, sessionId),
      eq(clinicalEphemeralSessions.organizationId, organizationId),
    )).for("update");
    if (!session) return 0;
    await tx.update(clinicalEphemeralSessions).set({ status: "purging", updatedAt: new Date() }).where(eq(clinicalEphemeralSessions.id, sessionId));
    const objects = await tx.select({ objectKey: clinicalEphemeralObjects.objectKey })
      .from(clinicalEphemeralObjects).where(and(
        eq(clinicalEphemeralObjects.organizationId, organizationId),
        eq(clinicalEphemeralObjects.sessionId, sessionId),
      ));
    for (const object of objects) await deleteEphemeralClinicalObject(object.objectKey);
    await tx.delete(clinicalEphemeralSessions).where(eq(clinicalEphemeralSessions.id, sessionId));
    return objects.length;
  });
}

export async function runEphemeralClinicalSweep() {
  const now = new Date();
  const expired = await db
    .select()
    .from(clinicalEphemeralSessions)
    .where(or(lte(clinicalEphemeralSessions.expiresAt, now), eq(clinicalEphemeralSessions.status, "purging")))
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
