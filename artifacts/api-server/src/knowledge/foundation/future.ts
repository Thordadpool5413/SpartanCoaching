import { commandSchema } from "./lifecycle";
import { z } from "zod";
import { hash, id, integer, operations, revision, stamp } from "./contracts";
import { canonicalDigest, parseContract, sha256, ordinal } from "./canonical";
export const futureTransactionOrder = Object.freeze([
  "START_DEADLINE_BEFORE_AUTH_DB_OR_POOL",
  "AUTHENTICATE",
  "DERIVE_ACTOR_SCOPE",
  "PRELIMINARY_AUTHORIZE",
  "BEGIN",
  "SET_LOCAL_SECURITY_CONTEXT_AND_REMAINING_TIMEOUTS",
  "LOCK",
  "CLAIM_RECEIPT_CHECK_FINGERPRINT",
  "REAUTHORIZE_CURRENT_CONTEXT",
  "REPLAY_COMMITTED_RESULT_OR_VERIFY_EXPECTED_REVISIONS",
  "APPLY_PURE_COMMAND",
  "WRITE_IMMUTABLE_AUDIT",
  "WRITE_OUTBOX",
  "WRITE_BOUNDED_RESPONSE_RECEIPT",
  "RECHECK_DEADLINE_AND_TIME_SENSITIVE_ELIGIBILITY",
  "COMMIT_ATTEMPT",
] as const);
export const futureLockOrder = Object.freeze([
  "SINGLE_SCOPE",
  "ORGANIZATION_INTEGER_ASCENDING",
  "MEMBER_INTEGER_ASCENDING",
  "MEMBERSHIP_ORGANIZATION_MEMBER_ASCENDING",
  "SESSION_INTEGER_ASCENDING",
  "SOURCE_DOCUMENT_ORDINAL",
  "VERSION_ORDINAL",
  "GRANT_ORDINAL",
  "QUALIFICATION_ORDINAL",
  "RIGHTS_REVISION_ID_ORDINAL",
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
  commandBudgetMs: 5000,
  cleanupBudgetMs: 1000,
  minimumDispatchRemainingMs: 2,
  deadlineClock: "SERVER_MONOTONIC",
  eventClock: "FRESH_DATABASE_UTC_AFTER_LOCKS",
  deadlineBeforeGlobalLoadSession: true,
  timerResets: false,
  transactionIsolation: "READ_COMMITTED",
  requiredAuthorityLock: "FOR_UPDATE",
  idleTransactionTimeoutMs: 5000,
  singleMutationScope: true,
  identityWriterMayAcquireScopeAfterIdentity: false,
  outboxWriterMayAcquireAuthorityLocks: false,
  missingEarlierDependency: "ROLLBACK_AND_RETRY",
  cleanupAllowsCommitOrMutation: false,
  returnConnectionRequiresCleanProtocolAndTransaction: true,
  unknownCommitCode: "COMMAND_OUTCOME_UNKNOWN",
  unavailableCode: "COMMAND_UNAVAILABLE",
  retryAfterSeconds: 1,
  retryKeyAndPayload: "UNCHANGED",
  automaticTransactionRetry: false,
  expiryEventsPerTransaction: 1,
  expiryRequiresHumanReceipt: false,
  externalNetworkInTransaction: false,
  independentlyCommittedPlaceholder: false,
  automaticReceiptTTL: false,
  delivery: "AT_LEAST_ONCE",
  leaseSeconds: 60,
  attemptCap: 10,
  successRequiresLeaseTokenCAS: true,
  consumerDeduplication: "EVENT_ID",
  duplicateDifferentBody: "INTEGRITY_ERROR",
  unseenConditionAtSameRevision: "CANONICAL_REREAD",
  staleEventsCannotRollbackState: true,
  revisionGaps: "CANONICAL_REREAD",
  invalidation: "LEVEL_TRIGGERED",
});
const sortedUnique = (ids: string[]) =>
  ids.every((id, i) => i === 0 || ordinal(ids[i - 1], id) < 0);
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
        versionIds: z.array(id).max(2000).refine(sortedUnique),
        assignmentIds: z.array(id).max(4000).refine(sortedUnique),
        eventIds: z.array(id).max(1),
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
    schemaVersion: "knowledge-command-fingerprint-v3",
    command: parseContract(commandSchema, canonicalCommand),
  });

/** Pure duration math; not a PostgreSQL timeout implementation. The caller retains ONE start. */
export function remainingCommandBudget(
  startedMonotonicMs: number,
  currentMonotonicMs: number,
) {
  if (
    ![startedMonotonicMs, currentMonotonicMs].every(
      (n) =>
        Number.isFinite(n) && n >= 0 && n <= Number.MAX_SAFE_INTEGER - 5000,
    ) ||
    currentMonotonicMs < startedMonotonicMs
  )
    throw new Error("KNOWLEDGE_CONTRACT_INVALID");
  const remainingMs = Math.floor(
    startedMonotonicMs + futureProtocol.commandBudgetMs - currentMonotonicMs,
  );
  if (remainingMs < futureProtocol.minimumDispatchRemainingMs)
    throw new Error("COMMAND_IN_PROGRESS");
  return Object.freeze({
    remainingMs,
    statementTimeoutMs: remainingMs,
    lockTimeoutMs: Math.max(1, remainingMs - 1),
  });
}
export function validateMutationScopes(input: unknown): readonly string[] {
  const scopes = parseContract(z.array(id).min(1), input);
  if (scopes.length !== 1) throw new Error("KNOWLEDGE_SCOPE_DENIED");
  return Object.freeze(scopes);
}
const failureContextSchema = z
  .object({
    cause: z.enum([
      "CONTENTION",
      "DEADLINE",
      "DEADLOCK",
      "SERIALIZATION",
      "UNAVAILABLE",
    ]),
    commit: z.enum(["NOT_SENT", "ABORTED", "CONFIRMED", "UNKNOWN"]),
  })
  .strict();
/** Pure handoff semantics. An unacknowledged dispatched COMMIT is never an asserted rollback. */
export function commandFailureDisposition(input: unknown) {
  const failure = parseContract(failureContextSchema, input);
  if (failure.commit === "CONFIRMED")
    return Object.freeze({ outcome: "RETURN_COMMITTED_RECEIPT" as const });
  const unknown = failure.commit === "UNKNOWN";
  const unavailable = failure.cause === "UNAVAILABLE";
  return Object.freeze({
    outcome: "RETRY_ORIGINAL_REQUEST" as const,
    code: unknown
      ? "COMMAND_OUTCOME_UNKNOWN"
      : unavailable
        ? "COMMAND_UNAVAILABLE"
        : "COMMAND_IN_PROGRESS",
    httpStatus: unknown || unavailable ? 503 : 409,
    retryAfterSeconds: 1,
    sameKeyAndPayload: true,
    automaticRetry: false,
    rollbackRequired: !unknown,
    mutationMayHaveCommitted: unknown,
    releaseConnectionOnlyWhenClean: true,
    cleanupBudgetMs: 1000,
  });
}
export const futureWriterParticipation = Object.freeze({
  knowledge: "SCOPE_THEN_ORDERED_AUTHORITY_ROWS_AND_EXACT_CAS",
  identity:
    "ORDERED_ORGANIZATION_MEMBER_MEMBERSHIP_SESSION_SUBSET_NEVER_THEN_SCOPE",
  session: "ORDERED_IDENTITY_BEFORE_SESSION_OR_SESSION_ONLY_NEVER_BACKWARDS",
  expiry: "SINGLE_SCOPE_AGGREGATE_RECHECK_THEN_DEDUP_AUDIT_OUTBOX",
  delivery: "LEASE_TOKEN_CAS_ONLY_NO_AUTHORITY_MUTATION",
});
