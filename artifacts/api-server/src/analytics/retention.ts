import { lt } from "drizzle-orm";
import { eventTracking, visitors } from "@workspace/db";
import { db } from "../db";

const RETENTION_DAYS = 400;

export function analyticsRetentionCutoff(now = Date.now()): number {
  return now - RETENTION_DAYS * 24 * 60 * 60 * 1000;
}

/**
 * Public analytics is aggregate product telemetry, not a permanent activity
 * archive. Keep enough history for the one-year dashboard while bounding rows.
 */
export async function runAnalyticsRetentionSweep(now = Date.now()): Promise<void> {
  const cutoff = analyticsRetentionCutoff(now);
  await Promise.all([
    db.delete(visitors).where(lt(visitors.visitedAt, cutoff)),
    db.delete(eventTracking).where(lt(eventTracking.createdAt, cutoff)),
  ]);
}