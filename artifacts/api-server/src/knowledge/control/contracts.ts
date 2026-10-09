import { z } from "zod";
import {
  id,
  revision,
  hash,
  integer,
  stamp,
  day,
  url,
  applicabilitySchema,
  sourceSchema,
  type Scope,
} from "../foundation/contracts";
import { commandSchema } from "../foundation/lifecycle";
import { parseContract } from "../foundation/canonical";
import { rightsFromRow, number, type Row } from "../persistence/codec";
import type { CommandConnection } from "../persistence/deadline";

// Client fields are immutable metadata, never actor/provisioning authority or operational state.
const sourceMetadata = sourceSchema.innerType().omit({ scope: true });
const artifactMetadata = z
  .object({
    id,
    sourceId: id,
    sourceMetadataRevision: integer,
    documentId: id,
    upstreamEdition: id,
    artifactRevision: integer,
    rawHash: hash,
    normalizedHash: hash,
    parserId: id,
    parserVersion: id,
    sourceUrl: url,
    publishedAt: stamp,
    retrievedAt: stamp,
    effectiveFrom: day,
    effectiveTo: day.nullable(),
    applicability: applicabilitySchema,
    legacyCoverageSnapshotId: z.string().uuid().nullable(),
    rightsRevisionId: id,
  })
  .strict();
const register = z
  .object({
    operation: z.literal("REGISTER"),
    expectedScopeRevision: revision,
    expectedVersionRevisions: z
      .record(id, revision)
      .refine((v) => Object.keys(v).length <= 2000),
    source: sourceMetadata,
    version: artifactMetadata,
  })
  .strict();
const humanCommands = commandSchema.options.filter(
  (o) => !["REGISTER", "RECORD_STAGE"].includes(o.shape.operation.value),
);
export const wireCommandSchema = z.union([register, ...humanCommands] as [
  typeof register,
  (typeof humanCommands)[number],
  ...typeof humanCommands,
]);
export async function hydrateCommand(
  c: CommandConnection,
  wire: unknown,
  scope: Scope,
  memberId: number,
) {
  const parsed = parseContract(wireCommandSchema, wire);
  if (parsed.operation !== "REGISTER")
    return parseContract(commandSchema, parsed);
  const registration = parseContract(register, wire);
  const terms = (
    await c.query<Row>(
      "SELECT * FROM knowledge_rights_terms WHERE scope_id=$1 AND rights_revision_id=$2",
      [scope.id, registration.version.rightsRevisionId],
    )
  ).rows[0];
  if (!terms) throw new Error("KNOWLEDGE_REFERENCE_INVALID");
  const rights = rightsFromRow(terms);
  const { rightsRevisionId, ...artifact } = registration.version;
  return parseContract(commandSchema, {
    ...registration,
    source: { ...registration.source, scope },
    version: {
      ...artifact,
      scopeId: scope.id,
      rights,
      registeredByMemberId: memberId,
      submittedByMemberId: null,
      state: "DETECTED",
      revision: 1,
      approvals: [],
      activatedAt: null,
      revokedAt: null,
      revocationReason: null,
      health: {
        state: "NOT_CHECKED",
        checkedAt: null,
        lastValidatedAt: null,
        warningAt: null,
        hardExpiresAt: null,
        lkg: null,
      },
      rightsOverlay: {
        rightsId: rights.id,
        rightsRevision: number(terms.terms_revision),
        rightsRevisionId,
        revision: 1,
        revokedAt: null,
      },
      conflictsWith: [],
    },
  });
}

/** Parses one bounded JSON document, rejecting duplicate keys before JSON.parse can discard them. */
export function strictJson(raw: string): unknown {
  if (Buffer.byteLength(raw, "utf8") > 1048576)
    throw new Error("KNOWLEDGE_CONTRACT_INVALID");
  let at = 0;
  const whitespace = () => {
    while (/\s/.test(raw[at] ?? "") && at < raw.length) at++;
  };
  const quoted = () => {
    const start = at++;
    while (at < raw.length) {
      if (raw[at] === "\\") {
        at += 2;
        continue;
      }
      if (raw[at++] === '"') return JSON.parse(raw.slice(start, at)) as string;
    }
    throw new Error("KNOWLEDGE_CONTRACT_INVALID");
  };
  const scan = (depth: number): void => {
    if (depth > 64) throw new Error("KNOWLEDGE_CONTRACT_INVALID");
    whitespace();
    if (raw[at] === "{") {
      at++;
      whitespace();
      const keys = new Set<string>();
      if (raw[at] === "}") {
        at++;
        return;
      }
      while (at < raw.length) {
        whitespace();
        if (raw[at] !== '"') throw new Error("KNOWLEDGE_CONTRACT_INVALID");
        const key = quoted();
        if (keys.has(key)) throw new Error("KNOWLEDGE_CONTRACT_INVALID");
        keys.add(key);
        whitespace();
        if (raw[at++] !== ":") throw new Error("KNOWLEDGE_CONTRACT_INVALID");
        scan(depth + 1);
        whitespace();
        const end = raw[at++];
        if (end === "}") return;
        if (end !== ",") throw new Error("KNOWLEDGE_CONTRACT_INVALID");
      }
    } else if (raw[at] === "[") {
      at++;
      whitespace();
      if (raw[at] === "]") {
        at++;
        return;
      }
      while (at < raw.length) {
        scan(depth + 1);
        whitespace();
        const end = raw[at++];
        if (end === "]") return;
        if (end !== ",") throw new Error("KNOWLEDGE_CONTRACT_INVALID");
      }
    } else if (raw[at] === '"') {
      quoted();
      return;
    } else {
      const found =
        /^(?:true|false|null|-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?)/.exec(
          raw.slice(at),
        );
      if (found) {
        at += found[0].length;
        return;
      }
    }
    throw new Error("KNOWLEDGE_CONTRACT_INVALID");
  };
  try {
    scan(0);
    whitespace();
    if (at !== raw.length) throw new Error("KNOWLEDGE_CONTRACT_INVALID");
    return JSON.parse(raw);
  } catch {
    throw new Error("KNOWLEDGE_CONTRACT_INVALID");
  }
}
