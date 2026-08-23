/**
 * Member continuity API.
 *
 * GET  /api/v1/member-sync
 * POST /api/v1/member-sync
 *
 * Conflict policy: last clientUpdatedAt wins. Equal clocks are resolved by
 * mutationId lexical order, so duplicate/reordered offline deliveries converge.
 * Writes are tenant + member scoped and the client never supplies ownership.
 */
import type { Express } from "express";
import { and, eq, gt, sql } from "drizzle-orm";
import {
  memberSyncMutationSchema,
  memberSyncRecords,
  type MemberSyncMutation,
} from "@workspace/db";
import { z } from "zod/v4";
import { db } from "../db";
import { requireAuth, type AuthedRequest } from "../auth/middleware";
import { lightAiLimit } from "../rateLimits";
import { findPotentialIdentifiers } from "../clinical/deidentification";

const MAX_MUTATIONS = 100;
const MAX_PAYLOAD_BYTES = 32_000;

const syncBodySchema = z.object({
  mutations: z.array(z.unknown()).min(1).max(MAX_MUTATIONS),
}).strict();

const SAFE_TOOL_IDS = ["objection", "playbook", "weekly", "research", "email", "cold"] as const;
// Fail closed for identifiers, contact details, person names, and clinical
// language. Continuity only accepts non-clinical work artifacts; free-form
// content resembling protected health information must stay device-local.
const blockedContent = /\b(patient|mrn|medical\s*record|diagnosis|date\s*of\s*birth|dob|social\s*security|ssn|medicare\s*beneficiary|cancer|oncology|prognosis|medication|treatment|condition|illness|symptom|copd|heart\s+failure|hiv|diabetes|born)\b|\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b|\b\d{3}-\d{2}-\d{4}\b|\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\b\d{8,}\b|\b\d{1,5}\s+[A-Za-z0-9.'-]+\s+(?:street|st|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr|court|ct)\b/i;
const safeText = (max: number) => z.string().trim().max(max).refine(
  (value) => !blockedContent.test(value) && findPotentialIdentifiers(value).length === 0,
  "Clinical or identifying content is not allowed in saved work.",
);
const librarySourceSchema = z.string().max(2000).refine(
  (value) => /^https:\/\/.+/i.test(value) || /^spartan:\/\/article\/\d+$/i.test(value),
  "Library source must be a trusted HTTPS URL or a Spartan article reference.",
);

const payloadSchemas = {
  commitment: z.object({ value: safeText(240) }).strict(),
  tool_draft: z.union([
    z.object({ draft: z.object({ objection: safeText(700).optional() }).strict() }).strict(),
    z.object({ draft: z.object({ scenario: safeText(1200).optional(), desiredOutcomes: safeText(1200).optional() }).strict() }).strict(),
    z.object({ draft: z.object({ accounts: safeText(1600).optional(), goal: safeText(500).optional(), focus: safeText(500).optional(), challenges: safeText(800).optional() }).strict() }).strict(),
  ]),
  tool_result: z.object({ result: safeText(8_000) }).strict(),
  calculator_report: z.object({
    id: z.string().max(160).regex(/^[A-Za-z0-9:_-]+$/),
    kind: z.enum(["activity", "roi", "rep-cost", "branch"]),
    title: safeText(180),
    summary: safeText(1_000),
    report: safeText(12_000),
    createdAt: z.string().datetime({ offset: true }),
  }).strict(),
  library_download: z.object({
    sourceUrl: librarySourceSchema,
    title: safeText(300),
    kind: z.enum(["article", "audio", "resource"]),
    description: safeText(1_000),
    downloadedAt: z.string().datetime({ offset: true }),
  }).strict(),
} as const;

export function memberSyncMemberContext(req: AuthedRequest): { organizationId: number; memberId: number } | null {
  const memberId = req.clientMemberId ?? req.fieldKit?.member?.id;
  const organizationId = req.fieldKit?.member?.organizationId;
  if (!Number.isInteger(memberId) || !Number.isInteger(organizationId) || !memberId || !organizationId) {
    return null;
  }
  return { memberId, organizationId };
}

function validRecordId(mutation: MemberSyncMutation): boolean {
  if (mutation.recordType === "commitment") return mutation.recordId === "current";
  if (mutation.recordType === "tool_draft" || mutation.recordType === "tool_result") {
    return (SAFE_TOOL_IDS as readonly string[]).includes(mutation.recordId);
  }
  if (mutation.recordType === "calculator_report") return /^calc:[A-Za-z0-9:_-]+$/.test(mutation.recordId);
  return /^library:[a-f0-9]{8}$/i.test(mutation.recordId);
}

/** Reject unapproved record shapes before any data reaches the continuity table. */
export function validateMemberSyncMutation(raw: unknown): MemberSyncMutation | null {
  const parsed = memberSyncMutationSchema.safeParse(raw);
  if (!parsed.success || !validRecordId(parsed.data)) return null;
  if (parsed.data.isDeleted) return { ...parsed.data, payload: {} };
  const payload = payloadSchemas[parsed.data.recordType].safeParse(parsed.data.payload);
  if (!payload.success) return null;
  if (JSON.stringify(payload.data).length > MAX_PAYLOAD_BYTES) return null;
  return { ...parsed.data, payload: payload.data };
}

function publicRecord(row: typeof memberSyncRecords.$inferSelect) {
  return {
    recordType: row.recordType,
    recordId: row.recordId,
    mutationId: row.mutationId,
    payload: row.payload,
    clientUpdatedAt: row.clientUpdatedAt.toISOString(),
    isDeleted: row.isDeleted,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function registerMemberSyncRoutes(app: Express): void {
  app.get("/api/v1/member-sync", requireAuth, lightAiLimit, async (req, res) => {
    const ctx = memberSyncMemberContext(req as AuthedRequest);
    if (!ctx) {
      res.status(401).json({ error: { code: "UNAUTHENTICATED", message: "Membership session required." } });
      return;
    }

    const rawSince = typeof req.query.since === "string" ? Date.parse(req.query.since) : NaN;
    if (typeof req.query.since === "string" && Number.isNaN(rawSince)) {
      res.status(400).json({ error: { code: "INVALID_SINCE", message: "since must be an ISO timestamp." } });
      return;
    }

    try {
      const ownership = and(
        eq(memberSyncRecords.organizationId, ctx.organizationId),
        eq(memberSyncRecords.memberId, ctx.memberId),
      );
      const rows = await db
        .select()
        .from(memberSyncRecords)
        .where(Number.isNaN(rawSince) ? ownership : and(ownership, gt(memberSyncRecords.updatedAt, new Date(rawSince))))
        .orderBy(memberSyncRecords.updatedAt)
        .limit(500);
      res.json({ records: rows.map(publicRecord), serverTime: new Date().toISOString() });
    } catch (error) {
      console.error("member sync read failed:", error);
      res.status(500).json({ error: { code: "SYNC_READ_FAILED", message: "Could not restore saved work." } });
    }
  });

  app.post("/api/v1/member-sync", requireAuth, lightAiLimit, async (req, res) => {
    const ctx = memberSyncMemberContext(req as AuthedRequest);
    if (!ctx) {
      res.status(401).json({ error: { code: "UNAUTHENTICATED", message: "Membership session required." } });
      return;
    }
    const parsed = syncBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: { code: "INVALID_SYNC_MUTATION", message: "Saved work is invalid or unsupported." } });
      return;
    }
    const validated = parsed.data.mutations.map(validateMemberSyncMutation);
    const rejected = parsed.data.mutations.flatMap((raw, index) => {
      const mutationId = typeof raw === "object" && raw && typeof (raw as { mutationId?: unknown }).mutationId === "string"
        ? (raw as { mutationId: string }).mutationId
        : `invalid-${index}`;
      return validated[index] ? [] : [{ mutationId, code: "INVALID_SYNC_MUTATION" }];
    });
    const mutations = validated.filter((mutation): mutation is MemberSyncMutation => Boolean(mutation));

    try {
      const result = await db.transaction(async (tx) => {
        const records: Array<typeof memberSyncRecords.$inferSelect> = [];
        let conflicts = 0;
        for (const mutation of mutations as MemberSyncMutation[]) {
          const [duplicate] = await tx
            .select()
            .from(memberSyncRecords)
            .where(and(
              eq(memberSyncRecords.organizationId, ctx.organizationId),
              eq(memberSyncRecords.memberId, ctx.memberId),
              eq(memberSyncRecords.mutationId, mutation.mutationId),
            ))
            .limit(1);
          if (duplicate) {
            records.push(duplicate);
            continue;
          }

          // Atomic compare-and-swap. The conditional conflict update means
          // two devices cannot overwrite a newer LWW version by racing a
          // read-then-write transaction.
          const [applied] = await tx
            .insert(memberSyncRecords)
            .values({
              organizationId: ctx.organizationId,
              memberId: ctx.memberId,
              recordType: mutation.recordType,
              recordId: mutation.recordId,
              mutationId: mutation.mutationId,
              payload: mutation.payload,
              clientUpdatedAt: new Date(mutation.clientUpdatedAt),
              isDeleted: mutation.isDeleted,
            })
            .onConflictDoUpdate({
              target: [
                memberSyncRecords.organizationId,
                memberSyncRecords.memberId,
                memberSyncRecords.recordType,
                memberSyncRecords.recordId,
              ],
              set: {
                mutationId: mutation.mutationId,
                payload: mutation.payload,
                clientUpdatedAt: new Date(mutation.clientUpdatedAt),
                isDeleted: mutation.isDeleted,
                updatedAt: new Date(),
              },
              where: sql`(excluded.client_updated_at, excluded.mutation_id) > (${memberSyncRecords.clientUpdatedAt}, ${memberSyncRecords.mutationId})`,
            })
            .returning();
          if (applied) {
            records.push(applied);
            continue;
          }
          conflicts += 1;
          const [current] = await tx
            .select()
            .from(memberSyncRecords)
            .where(and(
              eq(memberSyncRecords.organizationId, ctx.organizationId),
              eq(memberSyncRecords.memberId, ctx.memberId),
              eq(memberSyncRecords.recordType, mutation.recordType),
              eq(memberSyncRecords.recordId, mutation.recordId),
            ))
            .limit(1);
          if (current) records.push(current);
        }
        return { records, conflicts };
      });
      res.json({
        records: result.records.map(publicRecord),
        conflicts: result.conflicts,
        rejected,
        serverTime: new Date().toISOString(),
      });
    } catch (error) {
      console.error("member sync write failed:", error);
      res.status(500).json({ error: { code: "SYNC_WRITE_FAILED", message: "Could not save work right now. It will retry." } });
    }
  });
}