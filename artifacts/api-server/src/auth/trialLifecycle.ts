import { and, eq } from "drizzle-orm";
import {
  authEvents,
  clientMembers,
  clientOrganizations,
  orgTimelineEvents,
  type ClientOrganization,
} from "@workspace/db";
import { db } from "../db";
import { sendTrialExpiredEmail, sendTrialMidpointEmail } from "../resend";

/** Hours remaining at/below which we send the midpoint nudge (once). */
const MIDPOINT_HOURS = 4;

function eventKey(type: string, orgId: number) {
  return `${type}:org:${orgId}`;
}

async function alreadySent(orgId: number, type: string): Promise<boolean> {
  const [row] = await db
    .select({ id: authEvents.id })
    .from(authEvents)
    .where(eq(authEvents.type, eventKey(type, orgId)))
    .limit(1);
  return !!row;
}

async function markSent(orgId: number, type: string, memberId?: number | null) {
  await db.insert(authEvents).values({
    memberId: memberId ?? null,
    type: eventKey(type, orgId),
    meta: { orgId, baseType: type },
  });
}

async function activeMembersForOrg(orgId: number) {
  return db
    .select()
    .from(clientMembers)
    .where(
      and(
        eq(clientMembers.organizationId, orgId),
        eq(clientMembers.status, "active"),
      ),
    );
}

/** Call when an org flips trial → expired. */
export async function notifyTrialExpired(org: ClientOrganization): Promise<void> {
  try {
    if (await alreadySent(org.id, "trial_expired_email")) return;
    const members = await activeMembersForOrg(org.id);
    for (const m of members) {
      await sendTrialExpiredEmail(m.email, m.name);
    }
    await markSent(org.id, "trial_expired_email", members[0]?.id ?? null);
  } catch (err) {
    console.error("notifyTrialExpired failed:", err);
  }
}

/** Call while org is still in trial — sends once when ≤ MIDPOINT_HOURS remain. */
export async function maybeNotifyTrialMidpoint(org: ClientOrganization): Promise<void> {
  try {
    if (org.status !== "trial" || !org.trialEndsAt) return;
    const hoursLeft = (org.trialEndsAt.getTime() - Date.now()) / 3_600_000;
    if (hoursLeft <= 0 || hoursLeft > MIDPOINT_HOURS) return;
    if (await alreadySent(org.id, "trial_midpoint_email")) return;

    const members = await activeMembersForOrg(org.id);
    for (const m of members) {
      await sendTrialMidpointEmail(m.email, m.name, hoursLeft);
    }
    await markSent(org.id, "trial_midpoint_email", members[0]?.id ?? null);
  } catch (err) {
    console.error("maybeNotifyTrialMidpoint failed:", err);
  }
}

/**
 * Refresh trial status and fire lifecycle emails (non-blocking side effects).
 */
export async function refreshOrgStatusWithLifecycle(
  org: ClientOrganization,
): Promise<ClientOrganization> {
  if (org.status === "trial" && org.trialEndsAt && org.trialEndsAt.getTime() <= Date.now()) {
    const [updated] = await db
      .update(clientOrganizations)
      .set({
        status: "expired",
        pipelineStatus: "follow_up",
      })
      .where(eq(clientOrganizations.id, org.id))
      .returning();
    const fresh = updated ?? { ...org, status: "expired" as const, pipelineStatus: "follow_up" as const };
    // fire-and-forget
    void notifyTrialExpired(fresh);
    try {
      await db.insert(orgTimelineEvents).values({
        organizationId: org.id,
        type: "status",
        body: "Trial ended automatically — pipeline set to follow_up",
        createdBy: "system",
        meta: { status: "expired" },
      });
    } catch {
      /* non-fatal */
    }
    return fresh;
  }

  if (org.status === "trial") {
    void maybeNotifyTrialMidpoint(org);
  }

  return org;
}
