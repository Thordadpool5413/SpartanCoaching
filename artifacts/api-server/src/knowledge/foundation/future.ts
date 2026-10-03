import { commandSchema } from "./lifecycle";
import { z } from "zod";
import { hash, id, integer, operations, revision, stamp } from "./contracts";
import { canonicalDigest, parseContract, sha256 } from "./canonical";
export const futureTransactionOrder = Object.freeze([
  "AUTHENTICATE",
  "DERIVE_ACTOR_SCOPE",
  "PRELIMINARY_AUTHORIZE",
  "BEGIN",
  "SET_LOCAL_SECURITY_CONTEXT",
  "LOCK",
  "CLAIM_RECEIPT_CHECK_FINGERPRINT",
  "REAUTHORIZE_CURRENT_CONTEXT",
  "VERIFY_EXPECTED_REVISIONS",
  "APPLY_PURE_COMMAND",
  "WRITE_IMMUTABLE_AUDIT",
  "WRITE_OUTBOX",
  "WRITE_BOUNDED_RESPONSE_RECEIPT",
  "COMMIT",
] as const);
export const futureLockOrder = Object.freeze([
  "SCOPE_ORDINAL",
  "SESSION",
  "MEMBER_INTEGER_ASCENDING",
  "SOURCE_DOCUMENT_ORDINAL",
  "VERSION_ORDINAL",
  "GRANT_ORDINAL",
  "QUALIFICATION_ORDINAL",
  "RIGHTS_ORDINAL",
  "HEALTH_ORDINAL",
  "RECEIPT",
] as const);
export const futureProtocol = Object.freeze({
  role: "NON_OWNER",
  reauthorizationBeforeReplay: true,
  replayDoesNotRecheckOldMutationPreconditions: true,
  receiptWritesShareMutationTransaction: true,
  fingerprintConflictCode: "IDEMPOTENCY_CONFLICT",
  waitTimeoutCode: "COMMAND_IN_PROGRESS",
  scopeLock: "FOR_UPDATE",
  expectedAffectedRows: 1,
  waitSeconds: 5,
  externalNetworkInTransaction: false,
  independentlyCommittedPlaceholder: false,
  automaticReceiptTTL: false,
  delivery: "AT_LEAST_ONCE",
  leaseSeconds: 60,
  attemptCap: 10,
  successRequiresLeaseTokenCAS: true,
  consumerDeduplication: "EVENT_ID",
  revisionGaps: "CANONICAL_REREAD",
  invalidation: "LEVEL_TRIGGERED",
});
export const receiptSchema = z
  .object({
    scopeId: id,
    actorMemberId: integer,
    operation: z.enum(operations).exclude(["EVALUATE_EXPIRY", "RECORD_STAGE"]),
    keyHash: hash,
    fingerprint: hash,
    committedAt: stamp,
    response: z
      .object({
        scopeRevision: revision,
        versionIds: z.array(id).max(2000),
        assignmentIds: z.array(id).max(4000),
        eventIds: z.array(id).max(100),
      })
      .strict(),
  })
  .strict();
export const outboxSchema = z
  .object({
    eventId: id,
    scopeId: id,
    aggregateRevision: revision,
    availableAt: stamp,
    attempts: z.number().int().min(0).max(10),
    leaseToken: id.nullable(),
    leaseExpiresAt: stamp.nullable(),
    deliveredAt: stamp.nullable(),
    deadLetteredAt: stamp.nullable(),
    lastErrorCode: z
      .enum(["DELIVERY_UNAVAILABLE", "LEASE_LOST", "ATTEMPTS_EXHAUSTED"])
      .nullable(),
  })
  .strict()
  .refine(
    (o) =>
      (o.leaseToken === null) === (o.leaseExpiresAt === null) &&
      !(o.deliveredAt && o.deadLetteredAt),
  );
export const retryDelaySeconds = (attempt: number) => {
  if (!Number.isSafeInteger(attempt) || attempt < 1 || attempt > 10)
    throw new Error("KNOWLEDGE_CONTRACT_INVALID");
  return Math.min(300, 2 ** (attempt - 1));
};
export function receiptKey(
  scopeId: string,
  actorMemberId: number,
  operation: string,
  key: unknown,
) {
  const opaque = parseContract(
    z
      .string()
      .min(16)
      .max(128)
      .regex(/^[A-Za-z0-9._:-]+$/),
    key,
  );
  return {
    scopeId: parseContract(id, scopeId),
    actorMemberId: parseContract(integer, actorMemberId),
    operation: parseContract(
      z.enum(operations).exclude(["EVALUATE_EXPIRY", "RECORD_STAGE"]),
      operation,
    ),
    keyHash: sha256(opaque),
  };
}
/** Intent only. A caller must reauthorize before comparing/replaying a receipt. */
export const requestFingerprint = (canonicalCommand: unknown) =>
  canonicalDigest({
    schemaVersion: "knowledge-command-fingerprint-v2",
    command: parseContract(commandSchema, canonicalCommand),
  });
