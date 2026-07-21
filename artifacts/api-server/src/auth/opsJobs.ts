import { eq, gte, sql } from "drizzle-orm";
import {
  accessRequests,
  authEvents,
  clientOrganizations,
  usageEvents,
} from "@workspace/db";
import { db } from "../db";
import { sendOpsDigestEmail } from "../resend";
import { runTrialLifecycleSweep, type TrialSweepResult } from "./trialLifecycle";

export type OpsDigestResult = {
  sent: boolean;
  emailMessage: string;
  snapshot: {
    pendingRequests: number;
    followUpsDue: number;
    inTrial: number;
    trialsEndingSoon4h: number;
    expired: number;
    won: number;
    toolUsesLast7Days: number;
  };
  ranAt: string;
};

function dayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

async function digestAlreadySentToday(): Promise<boolean> {
  const key = `job_ops_digest:${dayKey()}`;
  const [row] = await db
    .select({ id: authEvents.id })
    .from(authEvents)
    .where(eq(authEvents.type, key))
    .limit(1);
  return !!row;
}

async function markDigestSent(meta: Record<string, unknown>) {
  await db.insert(authEvents).values({
    memberId: null,
    type: `job_ops_digest:${dayKey()}`,
    meta,
  });
}

export async function buildOpsSnapshot() {
  const allRequests = await db.select().from(accessRequests).limit(2000);
  const allOrgs = await db.select().from(clientOrganizations).limit(2000);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [usageWeek] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(usageEvents)
    .where(gte(usageEvents.createdAt, weekAgo));

  const pendingRequests = allRequests.filter((r) => r.status === "pending").length;
  const followUpsDue = allOrgs.filter(
    (o) =>
      o.nextFollowUpAt &&
      o.nextFollowUpAt.getTime() <= Date.now() &&
      o.pipelineStatus !== "won" &&
      o.pipelineStatus !== "lost" &&
      o.pipelineStatus !== "churned",
  ).length;
  const inTrial = allOrgs.filter((o) => o.status === "trial").length;
  const expired = allOrgs.filter((o) => o.status === "expired").length;
  const won = allOrgs.filter((o) => o.pipelineStatus === "won").length;
  const trialsEndingSoon4h = allOrgs.filter(
    (o) =>
      o.status === "trial" &&
      o.trialEndsAt &&
      o.trialEndsAt.getTime() > Date.now() &&
      o.trialEndsAt.getTime() <= Date.now() + 4 * 60 * 60 * 1000,
  ).length;

  return {
    pendingRequests,
    followUpsDue,
    inTrial,
    trialsEndingSoon4h,
    expired,
    won,
    toolUsesLast7Days: usageWeek?.count ?? 0,
  };
}

/**
 * Email Nick a daily ops snapshot. Idempotent once per calendar day unless force=true.
 */
export async function runOpsDigest(options?: {
  force?: boolean;
}): Promise<OpsDigestResult> {
  const ranAt = new Date().toISOString();
  const snapshot = await buildOpsSnapshot();

  if (!options?.force && (await digestAlreadySentToday())) {
    return {
      sent: false,
      emailMessage: "Ops digest already sent today (use force to resend).",
      snapshot,
      ranAt,
    };
  }

  const to =
    process.env.NOTIFICATION_EMAIL ||
    process.env.OPS_DIGEST_EMAIL ||
    "nick@spartanhospicecoaching.com";

  const ok = await sendOpsDigestEmail(to, snapshot);
  if (ok) {
    try {
      await markDigestSent({ snapshot, to });
    } catch {
      /* non-fatal */
    }
  }

  return {
    sent: ok,
    emailMessage: ok
      ? `Ops digest emailed to ${to}.`
      : `Failed to email ops digest to ${to}. Check Resend / NOTIFICATION_EMAIL.`,
    snapshot,
    ranAt,
  };
}

export async function runScheduledJobs(options?: {
  forceDigest?: boolean;
}): Promise<{
  trialSweep: TrialSweepResult;
  opsDigest: OpsDigestResult;
}> {
  const trialSweep = await runTrialLifecycleSweep();
  const opsDigest = await runOpsDigest({ force: options?.forceDigest });
  return { trialSweep, opsDigest };
}

/** Background interval for Replit / long-running servers. */
export function startBackgroundJobScheduler(): void {
  const enabled =
    process.env.ENABLE_BACKGROUND_JOBS === "1" ||
    process.env.ENABLE_BACKGROUND_JOBS === "true" ||
    process.env.NODE_ENV === "production" ||
    process.env.REPLIT_DEPLOYMENT === "1" ||
    process.env.REPLIT_DEPLOYMENT === "true";

  if (!enabled) {
    console.log(
      "[jobs] Background scheduler off (set ENABLE_BACKGROUND_JOBS=1 to enable in dev).",
    );
    return;
  }

  const intervalMs = Math.max(
    5 * 60 * 1000,
    Number(process.env.JOB_INTERVAL_MS || 15 * 60 * 1000) || 15 * 60 * 1000,
  );

  console.log(`[jobs] Starting background scheduler every ${Math.round(intervalMs / 60000)}m`);

  const tick = () => {
    void runTrialLifecycleSweep()
      .then((r) => {
        if (r.expired || r.errors.length) {
          console.log("[jobs] trial sweep", r);
        }
      })
      .catch((err) => console.error("[jobs] trial sweep failed", err));

    // Digest once per day around first tick after 13:00 UTC (≈ morning US)
    const hour = new Date().getUTCHours();
    if (hour >= 13 && hour <= 15) {
      void runOpsDigest()
        .then((r) => {
          if (r.sent) console.log("[jobs] ops digest sent", r.snapshot);
        })
        .catch((err) => console.error("[jobs] ops digest failed", err));
    }
  };

  // First run shortly after boot
  setTimeout(tick, 45_000);
  setInterval(tick, intervalMs);
}
