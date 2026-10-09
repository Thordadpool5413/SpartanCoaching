/** Disposable synthetic fixture shared by K1B real-PostgreSQL tests and P03. Never production provisioning. */
import type { PoolClient } from "pg";
import {
  partitionSchema,
  sourceSchema,
  versionSchema,
  grantSchema,
  capabilities,
  purposes,
  rightsRevisionIdentity,
  type Partition,
  type Actor,
} from "../../../artifacts/api-server/src/knowledge/foundation/contracts";
import {
  parseContract,
  sortedSet,
} from "../../../artifacts/api-server/src/knowledge/foundation/canonical";
import { transitionKnowledge } from "../../../artifacts/api-server/src/knowledge/foundation/lifecycle";
import {
  CommandConnection,
  CommandDeadline,
} from "../../../artifacts/api-server/src/knowledge/persistence/deadline";
import { persistDelta } from "../../../artifacts/api-server/src/knowledge/persistence/writes";
import { hashToken } from "../../../artifacts/api-server/src/auth/crypto";

export const syntheticStart = "2020-01-03T00:00:00.000Z",
  syntheticEnd = "2099-01-01T00:00:00.000Z";
export async function seedKnowledge(
  client: PoolClient,
  organizationId = 7001,
  global = false,
) {
  const base = organizationId * 100,
    subjects = [1, 2, 3, 4, 90, 98, 99].map((n) => base + n),
    scope = {
      id: global ? "global" : `tenant:${organizationId}`,
      kind: global ? ("GLOBAL" as const) : ("TENANT" as const),
      organizationId: global ? null : organizationId,
    };
  await client.query(
    "INSERT INTO client_organizations(id,name,type,status) VALUES($1,'Synthetic knowledge tenant','company','active') ON CONFLICT DO NOTHING",
    [organizationId],
  );
  for (const memberId of subjects)
    await client.query(
      "INSERT INTO client_members(id,organization_id,email,name,password_hash,status,role) VALUES($1,$2,$3,'Synthetic authority member','synthetic-password-verifier','active','member') ON CONFLICT DO NOTHING",
      [memberId, organizationId, `synthetic-${memberId}@example.invalid`],
    );
  const tokens = new Map<number, string>();
  for (const memberId of subjects.slice(0, 4)) {
    const token = `synthetic-session-${memberId}`;
    tokens.set(memberId, token);
    await client.query(
      "INSERT INTO client_sessions(member_id,token_hash,expires_at) VALUES($1,$2,$3) ON CONFLICT DO NOTHING",
      [memberId, hashToken(token), syntheticEnd],
    );
  }
  const put = async (table: string, value: unknown) => {
    if (!/^knowledge_[a-z_]+$/.test(table))
      throw new Error("SYNTHETIC_TABLE_INVALID");
    await client.query(
      `INSERT INTO ${table} SELECT (jsonb_populate_record(NULL::${table},$1::jsonb)).*`,
      [JSON.stringify(value)],
    );
  };
  await client.query("BEGIN");
  try {
    await put("knowledge_scopes", {
      scope_id: scope.id,
      scope_kind: scope.kind,
      organization_id: scope.organizationId,
      revision: 0,
      supported_payers: ["TRADITIONAL_MEDICARE"],
      supported_jurisdictions: ["US-FL"],
      created_at: syntheticStart,
    });
    for (const memberId of subjects)
      await put("knowledge_scope_members", {
        scope_id: scope.id,
        member_id: memberId,
        recorded_at: syntheticStart,
      });
    const grants = subjects
      .slice(0, 4)
      .map((subjectMemberId) =>
        parseContract(grantSchema, {
          id: `synthetic-grant-${subjectMemberId}`,
          scopeId: scope.id,
          subjectMemberId,
          createdAt: syntheticStart,
          issuance: {
            kind: "SYNTHETIC_SEED",
            reference: "synthetic-provisioning",
          },
          domains: ["MAC_COVERAGE"],
          capabilities: sortedSet(capabilities),
          effectiveFrom: syntheticStart,
          expiresAt: syntheticEnd,
          grantedByMemberId: base + 98,
          verifiedByMemberId: base + 99,
          verificationRef: "synthetic-verification",
          verifiedAt: syntheticStart,
          revision: 1,
          revokedAt: null,
        }),
      );
    grants.push(
      parseContract(grantSchema, {
        ...grants[2],
        id: "synthetic-delegated-grant",
        subjectMemberId: base + 90,
        grantedByMemberId: base + 3,
        verifiedByMemberId: base + 3,
        issuance: {
          kind: "DELEGATED",
          parentGrantId: grants[2].id,
          parentGrantRevision: 1,
          requestId: "synthetic-delegation-request",
        },
      }),
    );
    for (const g of grants)
      await put("knowledge_grants", {
        scope_id: g.scopeId,
        grant_id: g.id,
        subject_member_id: g.subjectMemberId,
        created_at: g.createdAt,
        issuance_kind: g.issuance.kind,
        parent_grant_id:
          g.issuance.kind === "DELEGATED" ? g.issuance.parentGrantId : null,
        parent_grant_revision:
          g.issuance.kind === "DELEGATED"
            ? g.issuance.parentGrantRevision
            : null,
        issuance_request_id:
          g.issuance.kind === "DELEGATED" ? g.issuance.requestId : null,
        issuance_reference:
          g.issuance.kind === "DELEGATED" ? null : g.issuance.reference,
        domains: g.domains,
        capabilities: g.capabilities,
        effective_from: g.effectiveFrom,
        expires_at: g.expiresAt,
        granted_by_member_id: g.grantedByMemberId,
        verified_by_member_id: g.verifiedByMemberId,
        verification_ref: g.verificationRef,
        verified_at: g.verifiedAt,
        revision: 1,
        revoked_at: null,
      });
    const qualifications = subjects
      .slice(0, 4)
      .map((subjectMemberId) => ({
        id: `synthetic-qualification-${subjectMemberId}`,
        scopeId: scope.id,
        subjectMemberId,
        class: "COMPLIANCE_REVIEWER",
        domains: ["MAC_COVERAGE"],
        jurisdictions: ["US-FL"],
        verifiedByMemberId: base + 99,
        verificationMethod: "SYNTHETIC_TEST",
        verificationRef: "synthetic-verification",
        verifiedAt: syntheticStart,
        effectiveFrom: syntheticStart,
        expiresAt: syntheticEnd,
        reviewDueAt: syntheticEnd,
        revision: 1,
        revokedAt: null,
      }));
    for (const q of qualifications)
      await put("knowledge_qualifications", {
        scope_id: q.scopeId,
        qualification_id: q.id,
        subject_member_id: q.subjectMemberId,
        qualification_class: q.class,
        domains: q.domains,
        jurisdictions: q.jurisdictions,
        verified_by_member_id: q.verifiedByMemberId,
        verification_method: q.verificationMethod,
        verification_ref: q.verificationRef,
        verified_at: q.verifiedAt,
        effective_from: q.effectiveFrom,
        expires_at: q.expiresAt,
        review_due_at: q.reviewDueAt,
        revision: 1,
        revoked_at: null,
      });
    const rights = {
      id: "synthetic-rights",
      revision: 1,
      owner: "synthetic-owner",
      reference: "synthetic-permission",
      status: "APPROVED",
      effectiveFrom: syntheticStart,
      expiresAt: null,
      commercialUse: true,
      permittedUses: sortedSet(purposes),
      verifiedByMemberId: base + 4,
      verificationGrantId: `synthetic-grant-${base + 4}`,
      verificationQualificationId: `synthetic-qualification-${base + 4}`,
      verificationRef: "synthetic-rights-verification",
      verifiedAt: syntheticStart,
    };
    const rightsId = rightsRevisionIdentity(scope.id, rights.id, 1);
    await put("knowledge_rights_terms", {
      scope_id: scope.id,
      rights_revision_id: rightsId,
      logical_rights_id: rights.id,
      terms_revision: 1,
      owner_ref: rights.owner,
      reference_ref: rights.reference,
      status: rights.status,
      effective_from: rights.effectiveFrom,
      expires_at: null,
      commercial_use: true,
      permitted_uses: rights.permittedUses,
      verified_by_member_id: rights.verifiedByMemberId,
      verification_grant_id: rights.verificationGrantId,
      verification_qualification_id: rights.verificationQualificationId,
      verification_ref: rights.verificationRef,
      verified_at: rights.verifiedAt,
      recorded_at: syntheticStart,
    });
    await put("knowledge_rights_state", {
      scope_id: scope.id,
      rights_revision_id: rightsId,
      revision: 1,
      revoked_at: null,
    });
    await client.query("COMMIT");
    const source = parseContract(sourceSchema, {
      id: "synthetic-source",
      metadataRevision: 1,
      publisher: "Synthetic publisher",
      title: "Synthetic fixture; no clinical content",
      domain: "MAC_COVERAGE",
      claimTypes: ["MEDICARE_COVERAGE_REQUIREMENT"],
      officialUrl: "https://synthetic.example.invalid/metadata",
      educationalOnly: false,
      scope,
    });
    const version = parseContract(versionSchema, {
      id: "synthetic-version-1",
      sourceId: source.id,
      sourceMetadataRevision: 1,
      scopeId: scope.id,
      documentId: "synthetic-document",
      upstreamEdition: "edition-1",
      artifactRevision: 1,
      rawHash: "a".repeat(64),
      normalizedHash: "b".repeat(64),
      parserId: "synthetic-parser",
      parserVersion: "1",
      sourceUrl: source.officialUrl,
      publishedAt: syntheticStart,
      retrievedAt: syntheticStart,
      effectiveFrom: "2020-01-01",
      effectiveTo: "2099-01-01",
      applicability: {
        payers: ["TRADITIONAL_MEDICARE"],
        jurisdictions: ["US-FL"],
        macs: ["SYNTHETIC-MAC"],
        providerTypes: null,
        settings: null,
        benefitPeriods: null,
        codeEditions: null,
        products: null,
        populations: null,
      },
      rights,
      legacyCoverageSnapshotId: null,
      registeredByMemberId: base + 1,
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
        rightsRevision: 1,
        rightsRevisionId: rightsId,
        revision: 1,
        revokedAt: null,
      },
      conflictsWith: [],
    });
    let state = parseContract(partitionSchema, {
      scope,
      revision: 0,
      sources: [],
      versions: [],
      assignments: [],
      grants,
      qualifications,
      members: subjects.map((memberId) => ({
        memberId,
        organizationId,
        membershipActive: true,
        organizationActive: true,
      })),
      configuration: {
        supportedPayers: ["TRADITIONAL_MEDICARE"],
        supportedJurisdictions: ["US-FL"],
      },
    });
    let sequence = 0;
    const apply = async (
      command: Record<string, unknown>,
      memberId = base + 1,
      pipeline = false,
    ) => {
      const actor: Actor = {
        kind: "HUMAN",
        memberId,
        organizationId,
        membershipActive: true,
        organizationActive: true,
        sessionVerified: true,
        synthetic: true,
      };
      const server = {
        kind: pipeline ? "PIPELINE" : "HUMAN_SERVER",
        synthetic: true,
        now: syntheticStart,
        eventId: `synthetic:${scope.id}:event:${++sequence}`,
        requestId: `synthetic:${scope.id}:request:${sequence}`,
        receiptRef: null,
      };
      const expectedVersionRevisions =
        "versionId" in command
          ? {
              [String(command.versionId)]: state.versions.find(
                (v) => v.id === command.versionId,
              )!.revision,
            }
          : {};
      const result = transitionKnowledge(
        state,
        pipeline ? null : actor,
        {
          ...command,
          expectedScopeRevision: state.revision,
          expectedVersionRevisions,
        },
        server,
      );
      const c = new CommandConnection(client, new CommandDeadline());
      await c.begin();
      try {
        await persistDelta(
          c,
          state,
          result.state,
          result.eventIntents[0],
          syntheticStart,
        );
        await c.commit();
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      }
      state = result.state;
    };
    await apply({ operation: "REGISTER", source, version });
    for (const stage of [
      "FETCHED",
      "QUARANTINED",
      "PARSED",
      "DIFFED",
      "VALIDATED",
    ])
      await apply(
        {
          operation: "RECORD_STAGE",
          versionId: version.id,
          stage,
          evidenceRef: "synthetic-stage",
        },
        base + 1,
        true,
      );
    await apply({ operation: "SUBMIT", versionId: version.id });
    await apply(
      {
        operation: "APPROVE",
        versionId: version.id,
        reviewDueAt: syntheticEnd,
      },
      base + 2,
    );
    await apply({
      operation: "RECORD_HEALTH",
      versionId: version.id,
      health: {
        state: "CURRENT",
        checkedAt: syntheticStart,
        lastValidatedAt: syntheticStart,
        warningAt: "2090-01-01T00:00:00.000Z",
        hardExpiresAt: syntheticEnd,
        lkg: null,
      },
    });
    await apply(
      {
        operation: "ACTIVATE",
        versionId: version.id,
        approvalId: state.versions[0].approvals[0].id,
        serviceFrom: version.effectiveFrom,
        serviceTo: version.effectiveTo,
        applicability: version.applicability,
        enabledUses: sortedSet(purposes),
      },
      base + 3,
    );
    await apply(
      {
        operation: "APPROVE_LKG",
        versionId: version.id,
        until: "2089-01-01T00:00:00.000Z",
      },
      base + 4,
    );
    return {
      state,
      scopeId: scope.id,
      organizationId,
      subjects,
      tokens,
      versionId: version.id,
      rightsId,
    };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  }
}
export type SyntheticKnowledge = Awaited<ReturnType<typeof seedKnowledge>>;
