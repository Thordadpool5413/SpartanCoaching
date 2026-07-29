import { randomInt, randomUUID } from "node:crypto";
import type { Express, Request, Response } from "express";
import { and, desc, eq, gt, inArray, isNull } from "drizzle-orm";
import {
  SPARTAN_AI_TOOLS,
  getSpartanAiTool,
  isClinicalTool,
  publicToolManifest,
} from "@workspace/spartan-ai-tools";
import {
  isToolFeatureEnabled,
  runSpartanAiTool,
  SpartanAiToolError,
} from "@workspace/spartan-ai-tools/server";
import { hydrateTerritoryFacilities } from "../providers/territoryPlaces";
import {
  aiToolOrganizationFlags,
  aiToolRuns,
  clinicalAuditEvents,
  clinicalCases,
  clinicalDocuments,
  clinicalEphemeralObjects,
  clinicalEphemeralSessions,
  clinicalMfaChallenges,
  clinicalPermissions,
  clinicalReviews,
  clientMembers,
  clientSessions,
  coverageSnapshots,
} from "@workspace/db";
import { db } from "../db";
import {
  requireFieldKit,
  requireOrgAdmin,
  type AuthedRequest,
} from "../auth/middleware";
import { generateToken, hashToken, safeEqualString } from "../auth/crypto";
import {
  requireClinicalReview,
  requireClinicalUse,
  resolveClinicalAccess,
} from "../clinical/access";
import {
  createClinicalDownloadUrl,
  createClinicalObjectKey,
  createClinicalUploadUrl,
  createEphemeralClinicalObjectKey,
  createEphemeralClinicalUploadUrl,
  deleteClinicalObject,
  deleteEphemeralClinicalObject,
  downloadEphemeralClinicalObject,
  downloadClinicalObject,
  inspectEphemeralClinicalObject,
  inspectClinicalObject,
  assertEphemeralBucketConfiguration,
  scanEphemeralClinicalObject,
  scanClinicalObject,
  validateClinicalUpload,
} from "../clinical/storage";
import {
  EPHEMERAL_CLINICAL_TTL_MS,
  purgeEphemeralClinicalSession,
  type EphemeralPurgeReason,
} from "../clinical/ephemeral";
import {
  decryptPhi,
  encryptPhi,
  sha256Text,
  sha256Value,
} from "../security/phiEncryption";
import { globalDailyAiCap, heavyAiLimit, standardAiLimit } from "../rateLimits";
import { sendClinicalMfaCode } from "../resend";
import OpenAI from "openai";

const IDEMPOTENCY_PATTERN = /^[\x21-\x7e]{8,200}$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ToolRunEnvelope = {
  input?: unknown;
  clinicalCaseId?: string;
  coverageSnapshotId?: string;
};

type EphemeralToolRunEnvelope = {
  input?: unknown;
  coverageSnapshotId?: string;
};

const CLINICAL_WATERMARK =
  "Educational decision support only. Not a diagnosis, coverage determination, or autonomous eligibility or admission decision.";

function setNoStore(response: Response): Response {
  return response
    .setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private")
    .setHeader("Pragma", "no-cache")
    .setHeader("Expires", "0");
}

function clinicalResultNotRetained(): never {
  throw new SpartanAiToolError(
    "CLINICAL_RESULT_NOT_RETAINED",
    410,
    "Clinical results are one-time only and are not retained. Run the tool again from its ephemeral workspace.",
  );
}

function requirePhiRuntimeReady(): void {
  const requiredGates = [
    "HIPAA_PHI_ENABLED",
    "OPENAI_BAA_CONFIRMED",
    "OPENAI_MODIFIED_RETENTION_CONFIRMED",
    "GOOGLE_CLOUD_BAA_CONFIRMED",
    "PHI_STORAGE_BAA_CONFIRMED",
  ] as const;
  if (requiredGates.some((gate) => process.env[gate] !== "true")) {
    throw new SpartanAiToolError(
      "PHI_PROCESSING_DISABLED",
      503,
      "Clinical AI processing is disabled until all required BAA, retention, and HIPAA runtime controls are confirmed.",
    );
  }
}

async function toolAvailability(
  organizationId: number,
  tool: NonNullable<ReturnType<typeof getSpartanAiTool>>,
) {
  const [organizationFlag] = await db
    .select({
      enabled: aiToolOrganizationFlags.enabled,
      updatedAt: aiToolOrganizationFlags.updatedAt,
    })
    .from(aiToolOrganizationFlags)
    .where(
      and(
        eq(aiToolOrganizationFlags.organizationId, organizationId),
        eq(aiToolOrganizationFlags.toolId, tool.id),
      ),
    )
    .limit(1);
  const globalEnabled = isToolFeatureEnabled(tool);
  // Nonclinical tools are available to entitled organizations unless an
  // administrator explicitly disables them. Clinical tools remain opt-in.
  const organizationEnabled = organizationFlag
    ? organizationFlag.enabled === true
    : !isClinicalTool(tool);
  return {
    enabled: globalEnabled && organizationEnabled,
    globalEnabled,
    organizationEnabled,
    updatedAt: organizationFlag?.updatedAt ?? null,
  };
}

async function requireToolEnabled(
  organizationId: number,
  tool: NonNullable<ReturnType<typeof getSpartanAiTool>>,
): Promise<void> {
  const availability = await toolAvailability(organizationId, tool);
  if (!availability.enabled) {
    throw new SpartanAiToolError(
      "TOOL_DISABLED",
      503,
      "This AI tool is not enabled for the organization.",
    );
  }
}

function memberContext(request: AuthedRequest) {
  const member = request.fieldKit?.member;
  if (!member || !request.clientMemberId) {
    throw new SpartanAiToolError(
      "UNAUTHENTICATED",
      401,
      "Authentication required.",
    );
  }
  return {
    member,
    memberId: request.clientMemberId,
    organizationId: member.organizationId,
  };
}

function requestId(request: Request): string {
  const supplied = request.header("X-Request-Id")?.trim();
  return supplied && supplied.length <= 128 ? supplied : randomUUID();
}

function safeError(response: Response, error: unknown, id: string) {
  const safe =
    error instanceof SpartanAiToolError
      ? error
      : new SpartanAiToolError(
          "INTERNAL_ERROR",
          500,
          "The request could not be completed.",
        );
  return response
    .status(safe.status)
    .setHeader("X-Request-Id", id)
    .json({
      error: {
        code: safe.code,
        message: safe.message,
        retryable: safe.retryable,
        requestId: id,
      },
    });
}

async function audit(
  request: AuthedRequest,
  action: string,
  targetType: string,
  targetId: string | null,
  metadata: Record<string, unknown> = {},
) {
  const context = memberContext(request);
  await db.insert(clinicalAuditEvents).values({
    organizationId: context.organizationId,
    actorMemberId: context.memberId,
    action,
    targetType,
    targetId,
    requestId: requestId(request),
    metadata,
  });
}

async function purgeEphemeralAfterFailure(
  request: AuthedRequest,
  sessionId: string,
  error: unknown,
): Promise<void> {
  if (
    !UUID_PATTERN.test(sessionId) ||
    !request.fieldKit?.member ||
    !request.clientMemberId
  ) {
    return;
  }
  const context = memberContext(request);
  const [ownedSession] = await db
    .select({ id: clinicalEphemeralSessions.id })
    .from(clinicalEphemeralSessions)
    .where(
      and(
        eq(clinicalEphemeralSessions.id, sessionId),
        eq(clinicalEphemeralSessions.organizationId, context.organizationId),
        eq(clinicalEphemeralSessions.createdByMemberId, context.memberId),
      ),
    )
    .limit(1);
  if (!ownedSession) return;
  let deletionVerified = false;
  let objectCount = 0;
  try {
    objectCount = await purgeEphemeralClinicalSession(
      context.organizationId,
      sessionId,
    );
    deletionVerified = true;
  } finally {
    await audit(
      request,
      "clinical.ephemeral.purged",
      "clinical_ephemeral_session",
      sessionId,
      {
        reason: "failed" satisfies EphemeralPurgeReason,
        outcome: "failed",
        errorCode:
          error instanceof SpartanAiToolError ? error.code : "INTERNAL_ERROR",
        objectCount,
        deletionVerified,
        retainedClinicalContent: false,
      },
    ).catch(() => undefined);
  }
}

async function requireDynamicClinicalAccess(
  request: AuthedRequest,
): Promise<void> {
  const access = await resolveClinicalAccess(request);
  if (!access?.canUse) {
    throw new SpartanAiToolError(
      "CLINICAL_ACCESS_REQUIRED",
      403,
      "Clinical tool access has not been granted.",
    );
  }
  if (!request.sessionId) {
    throw new SpartanAiToolError(
      "UNAUTHENTICATED",
      401,
      "Authentication required.",
    );
  }
  const [session] = await db
    .select({ mfaVerifiedAt: clientSessions.mfaVerifiedAt })
    .from(clientSessions)
    .where(eq(clientSessions.id, request.sessionId))
    .limit(1);
  if (
    !session?.mfaVerifiedAt ||
    Date.now() - session.mfaVerifiedAt.getTime() > 15 * 60 * 1000
  ) {
    throw new SpartanAiToolError(
      "CLINICAL_MFA_REQUIRED",
      403,
      "Clinical access requires a recent email verification code.",
    );
  }
}

async function loadCoverage(
  organizationId: number,
  snapshotId?: string,
): Promise<typeof coverageSnapshots.$inferSelect | null> {
  if (!snapshotId) return null;
  if (!UUID_PATTERN.test(snapshotId)) {
    throw new SpartanAiToolError(
      "INVALID_COVERAGE_SNAPSHOT",
      400,
      "Coverage snapshot ID is invalid.",
    );
  }
  const [snapshot] = await db
    .select()
    .from(coverageSnapshots)
    .where(eq(coverageSnapshots.id, snapshotId))
    .limit(1);
  if (!snapshot) {
    throw new SpartanAiToolError(
      "COVERAGE_SNAPSHOT_NOT_FOUND",
      404,
      "Coverage snapshot was not found.",
    );
  }
  void organizationId;
  return snapshot;
}

async function loadEphemeralSession(
  organizationId: number,
  memberId: number,
  sessionId: string,
) {
  if (!UUID_PATTERN.test(sessionId)) {
    throw new SpartanAiToolError(
      "INVALID_EPHEMERAL_SESSION",
      400,
      "Ephemeral session ID is invalid.",
    );
  }
  const [session] = await db
    .select()
    .from(clinicalEphemeralSessions)
    .where(
      and(
        eq(clinicalEphemeralSessions.id, sessionId),
        eq(clinicalEphemeralSessions.organizationId, organizationId),
        eq(clinicalEphemeralSessions.createdByMemberId, memberId),
        gt(clinicalEphemeralSessions.expiresAt, new Date()),
      ),
    )
    .limit(1);
  if (!session) {
    throw new SpartanAiToolError(
      "EPHEMERAL_SESSION_EXPIRED",
      410,
      "The ephemeral clinical workspace is unavailable or has expired.",
    );
  }
  return session;
}

async function extractClinicalDocument(
  contentType: string,
  file: Buffer,
): Promise<string> {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 60_000,
    maxRetries: 1,
  });
  const content =
    contentType === "application/pdf"
      ? [
          {
            type: "input_file",
            filename: "clinical-record.pdf",
            file_data: `data:application/pdf;base64,${file.toString("base64")}`,
          },
          {
            type: "input_text",
            text: "Extract the document text faithfully. Do not summarize, diagnose, or infer missing text. Mark unreadable sections as [UNREADABLE].",
          },
        ]
      : contentType.startsWith("image/")
        ? [
            {
              type: "input_image",
              image_url: `data:${contentType};base64,${file.toString("base64")}`,
              detail: "high",
            },
            {
              type: "input_text",
              text: "Transcribe the visible document text faithfully. Do not summarize, diagnose, or infer missing text. Mark unreadable sections as [UNREADABLE].",
            },
          ]
        : [
            {
              type: "input_text",
              text: `Transcribe this clinical document faithfully without adding or inferring content:\n\n${file.toString("utf8")}`,
            },
          ];
  const extraction = await client.responses.create({
    model: process.env.OPENAI_MODEL ?? "gpt-5",
    store: false,
    input: [
      {
        role: "system",
        content:
          "You are a high-fidelity medical document transcription system. Return source text only and preserve section structure.",
      },
      { role: "user", content: content as never },
    ],
  });
  return extraction.output_text;
}

function addCoverageEvidence(
  toolId: string,
  input: unknown,
  snapshot: typeof coverageSnapshots.$inferSelect | null,
): unknown {
  if (!snapshot || !input || typeof input !== "object") return input;
  const record = { ...(input as Record<string, unknown>) };
  const evidence = {
    source: snapshot.source,
    documentType: snapshot.documentType,
    documentId: snapshot.documentId,
    version: snapshot.version,
    jurisdiction: snapshot.jurisdiction,
    title: snapshot.title,
    sourceUrl: snapshot.sourceUrl,
    contentHash: snapshot.contentHash,
    effectiveAt: snapshot.effectiveAt?.toISOString(),
    payload: snapshot.payload,
  };
  if (toolId === "admission-eligibility") record.criteria = [evidence];
  if (toolId === "documentation-gap-analyzer") record.criteria = [evidence];
  if (toolId === "lcd-policy-sales-playbook") record.evidence = [evidence];
  if (toolId === "medicare-lcd-advisor") record.evidence = [evidence];
  if (toolId === "medical-record-lcd-verifier") record.lcdEvidence = [evidence];
  return record;
}

function exposeEphemeralResult(
  result: Awaited<ReturnType<typeof runSpartanAiTool>>,
  snapshot: typeof coverageSnapshots.$inferSelect,
) {
  const output =
    result.output && typeof result.output === "object"
      ? (result.output as Record<string, unknown>)
      : null;
  const outputCitations = Array.isArray(output?.citations)
    ? output.citations
    : [];
  const policyCitation = {
    source: snapshot.source,
    snapshotId: snapshot.id,
    documentId: snapshot.documentId,
    version: snapshot.version,
    contentHash: snapshot.contentHash,
    sourceUrl: snapshot.sourceUrl,
  };
  return {
    toolId: result.metadata.toolId,
    toolVersion: result.metadata.toolVersion,
    model: result.metadata.model,
    promptVersion: result.metadata.promptVersion,
    modelConfigurationVersion: `${result.metadata.model}:${result.metadata.promptVersion}`,
    output: result.output,
    warnings: result.metadata.safetyWarnings,
    evidenceCitations: [...outputCitations, policyCitation],
    coveragePolicy: {
      snapshotId: snapshot.id,
      documentId: snapshot.documentId,
      version: snapshot.version,
      contentHash: snapshot.contentHash,
      sourceUrl: snapshot.sourceUrl,
    },
    durationMs: result.metadata.durationMs,
    createdAt: new Date().toISOString(),
    retention: "ephemeral" as const,
    recoverable: false,
    watermark: CLINICAL_WATERMARK,
  };
}

function exposeRun(run: typeof aiToolRuns.$inferSelect) {
  const payload =
    run.containsPhi && run.encryptedPayload
      ? decryptPhi<{ output: unknown }>(
          run.encryptedPayload,
          `ai-tool-run:${run.organizationId}:${run.id}`,
        )
      : { output: run.output };
  const tool = getSpartanAiTool(run.toolId);
  const output =
    payload.output && typeof payload.output === "object"
      ? (payload.output as Record<string, unknown>)
      : null;
  const outputCitations = Array.isArray(output?.citations)
    ? output.citations
    : [];
  const policyCitation = run.coverageSnapshotId
    ? [
        {
          source: "CMS_MCD",
          snapshotId: run.coverageSnapshotId,
          documentId: run.coverageDocumentId,
          version: run.coverageVersion,
          contentHash: run.coverageContentHash,
        },
      ]
    : [];
  return {
    id: run.id,
    toolId: run.toolId,
    toolVersion: run.toolVersion,
    model: run.model,
    promptVersion: run.promptVersion,
    status: run.status,
    output: payload.output,
    warnings: tool?.safetyWarnings ?? [],
    evidenceCitations: [...outputCitations, ...policyCitation],
    modelConfigurationVersion: `${run.model}:${run.promptVersion}`,
    reviewStatus: run.reviewStatus,
    clinicalCaseId: run.clinicalCaseId,
    coverageSnapshotId: run.coverageSnapshotId,
    coveragePolicy: run.coverageSnapshotId
      ? {
          snapshotId: run.coverageSnapshotId,
          documentId: run.coverageDocumentId,
          version: run.coverageVersion,
          contentHash: run.coverageContentHash,
        }
      : null,
    durationMs: run.durationMs,
    createdAt: run.createdAt,
    completedAt: run.completedAt,
    errorCode: run.errorCode,
    safeErrorCode: run.errorCode,
  };
}

export function registerAiToolRoutes(app: Express): void {
  app.get("/api/ai-tools", requireFieldKit, async (request, response, next) => {
    try {
      const authed = request as AuthedRequest;
      const context = memberContext(authed);
      const access = await resolveClinicalAccess(authed);
      const authorizedTools = SPARTAN_AI_TOOLS.filter(
        (tool) => !isClinicalTool(tool) || access?.canUse,
      );
      const tools = await Promise.all(
        authorizedTools.map(async (tool) => ({
          ...publicToolManifest(tool),
          availability: await toolAvailability(context.organizationId, tool),
        })),
      );
      response.json({
        tools,
        clinical: access ?? {
          canUse: false,
          canReview: false,
          canAdmin: false,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  app.get(
    "/api/ai-tools/organization-flags",
    requireFieldKit,
    requireOrgAdmin,
    async (request, response) => {
      const id = requestId(request);
      try {
        const context = memberContext(request as AuthedRequest);
        const flags = await Promise.all(
          SPARTAN_AI_TOOLS.map(async (tool) => ({
            toolId: tool.id,
            name: tool.name,
            containsPhi: tool.containsPhi,
            ...(await toolAvailability(context.organizationId, tool)),
          })),
        );
        response.setHeader("X-Request-Id", id).json({ flags });
      } catch (error) {
        safeError(response, error, id);
      }
    },
  );

  app.put(
    "/api/ai-tools/organization-flags/:toolId",
    requireFieldKit,
    requireOrgAdmin,
    async (request, response) => {
      const id = requestId(request);
      try {
        const authed = request as AuthedRequest;
        const context = memberContext(authed);
        const tool = getSpartanAiTool(String(request.params.toolId));
        if (!tool) {
          throw new SpartanAiToolError(
            "TOOL_NOT_FOUND",
            404,
            "AI tool was not found.",
          );
        }
        if (typeof request.body?.enabled !== "boolean") {
          throw new SpartanAiToolError(
            "INVALID_FEATURE_FLAG",
            400,
            "The enabled field must be a boolean.",
          );
        }
        if (isClinicalTool(tool)) {
          const access = await resolveClinicalAccess(authed);
          if (!access?.canAdmin) {
            throw new SpartanAiToolError(
              "CLINICAL_ADMIN_REQUIRED",
              403,
              "Clinical administrator access is required.",
            );
          }
        }
        const [flag] = await db
          .insert(aiToolOrganizationFlags)
          .values({
            organizationId: context.organizationId,
            toolId: tool.id,
            enabled: request.body.enabled,
            updatedByMemberId: context.memberId,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [
              aiToolOrganizationFlags.organizationId,
              aiToolOrganizationFlags.toolId,
            ],
            set: {
              enabled: request.body.enabled,
              updatedByMemberId: context.memberId,
              updatedAt: new Date(),
            },
          })
          .returning();
        await audit(authed, "ai_tool.feature_flag.updated", "ai_tool", null, {
          toolId: tool.id,
          enabled: flag.enabled,
        });
        response.setHeader("X-Request-Id", id).json({
          toolId: tool.id,
          ...(await toolAvailability(context.organizationId, tool)),
        });
      } catch (error) {
        safeError(response, error, id);
      }
    },
  );

  app.post(
    "/api/ai-tools/:toolId/ephemeral-runs",
    requireFieldKit,
    standardAiLimit,
    globalDailyAiCap,
    async (request, response) => {
      const id = requestId(request);
      setNoStore(response);
      try {
        const authed = request as AuthedRequest;
        const context = memberContext(authed);
        const tool = getSpartanAiTool(String(request.params.toolId));
        if (!tool) {
          throw new SpartanAiToolError(
            "TOOL_NOT_FOUND",
            404,
            "AI tool was not found.",
          );
        }
        if (!isClinicalTool(tool)) {
          throw new SpartanAiToolError(
            "EPHEMERAL_CLINICAL_ONLY",
            400,
            "The ephemeral execution endpoint is reserved for clinical tools.",
          );
        }
        if (tool.id === "medical-record-lcd-verifier") {
          throw new SpartanAiToolError(
            "EPHEMERAL_SESSION_REQUIRED",
            400,
            "Medical-record verification must be finalized from an ephemeral clinical session.",
          );
        }
        await requireDynamicClinicalAccess(authed);
        requirePhiRuntimeReady();
        await requireToolEnabled(context.organizationId, tool);
        const envelope = request.body as EphemeralToolRunEnvelope;
        const snapshot = await loadCoverage(
          context.organizationId,
          envelope?.coverageSnapshotId,
        );
        if (!snapshot) {
          throw new SpartanAiToolError(
            "COVERAGE_SNAPSHOT_REQUIRED",
            400,
            "Clinical tools require a versioned CMS coverage snapshot.",
          );
        }
        const input = addCoverageEvidence(tool.id, envelope?.input, snapshot);
        const result = await runSpartanAiTool(tool.id, input, {
          requestId: id,
        });
        await audit(authed, "clinical.ephemeral.completed", "ai_tool", null, {
          toolId: tool.id,
          model: result.metadata.model,
          toolVersion: result.metadata.toolVersion,
          promptVersion: result.metadata.promptVersion,
          coverageSnapshotId: snapshot.id,
          outcome: "completed",
          durationMs: result.metadata.durationMs,
          retainedClinicalContent: false,
        });
        response
          .setHeader("X-Request-Id", id)
          .status(200)
          .json({ result: exposeEphemeralResult(result, snapshot) });
      } catch (error) {
        const authed = request as AuthedRequest;
        if (authed.fieldKit?.member && authed.clientMemberId) {
          await audit(authed, "clinical.ephemeral.failed", "ai_tool", null, {
            toolId: String(request.params.toolId),
            outcome: "failed",
            errorCode:
              error instanceof SpartanAiToolError
                ? error.code
                : "INTERNAL_ERROR",
            retainedClinicalContent: false,
          }).catch(() => undefined);
        }
        safeError(response, error, id);
      }
    },
  );

  app.post(
    "/api/ai-tools/:toolId/runs",
    requireFieldKit,
    standardAiLimit,
    globalDailyAiCap,
    async (request, response) => {
      const id = requestId(request);
      try {
        const authed = request as AuthedRequest;
        const context = memberContext(authed);
        const tool = getSpartanAiTool(String(request.params.toolId));
        if (!tool) {
          throw new SpartanAiToolError(
            "TOOL_NOT_FOUND",
            404,
            "AI tool was not found.",
          );
        }
        if (isClinicalTool(tool)) {
          clinicalResultNotRetained();
        }
        await requireToolEnabled(context.organizationId, tool);

        const idempotencyKey = request.header("Idempotency-Key") ?? "";
        if (!IDEMPOTENCY_PATTERN.test(idempotencyKey)) {
          throw new SpartanAiToolError(
            "IDEMPOTENCY_KEY_REQUIRED",
            400,
            "Idempotency-Key must contain 8 to 200 printable characters.",
          );
        }
        const envelope = request.body as ToolRunEnvelope;
        const rawInput =
          envelope &&
          typeof envelope === "object" &&
          Object.prototype.hasOwnProperty.call(envelope, "input")
            ? envelope.input
            : request.body;
        const clinicalCaseId = envelope.clinicalCaseId;
        if (
          tool.id === "medical-record-lcd-verifier" &&
          (!clinicalCaseId || !UUID_PATTERN.test(clinicalCaseId))
        ) {
          throw new SpartanAiToolError(
            "CLINICAL_CASE_REQUIRED",
            400,
            "Medical-record verification requires a clinical case.",
          );
        }
        if (clinicalCaseId) {
          const [clinicalCase] = await db
            .select({ id: clinicalCases.id })
            .from(clinicalCases)
            .where(
              and(
                eq(clinicalCases.id, clinicalCaseId),
                eq(clinicalCases.organizationId, context.organizationId),
                isNull(clinicalCases.deletedAt),
              ),
            )
            .limit(1);
          if (!clinicalCase) {
            throw new SpartanAiToolError(
              "CLINICAL_CASE_NOT_FOUND",
              404,
              "Clinical case was not found.",
            );
          }
        }

        const snapshot = await loadCoverage(
          context.organizationId,
          envelope.coverageSnapshotId,
        );
        if (isClinicalTool(tool) && !snapshot) {
          throw new SpartanAiToolError(
            "COVERAGE_SNAPSHOT_REQUIRED",
            400,
            "Clinical tools require a versioned CMS coverage snapshot.",
          );
        }
        const coveredInput = addCoverageEvidence(tool.id, rawInput, snapshot);
        const input =
          tool.id === "territory-account-discovery"
            ? await hydrateTerritoryFacilities(coveredInput)
            : coveredInput;
        const inputHash = sha256Value(input);
        const idempotencyKeyHash = sha256Text(idempotencyKey);

        const [created] = await db
          .insert(aiToolRuns)
          .values({
            organizationId: context.organizationId,
            memberId: context.memberId,
            toolId: tool.id,
            toolVersion: tool.version,
            model: tool.deterministic
              ? "deterministic-v1"
              : (process.env.OPENAI_MODEL ?? "gpt-5"),
            promptVersion: `${tool.id}-v1`,
            inputHash,
            idempotencyKeyHash,
            containsPhi: tool.containsPhi,
            reviewStatus: tool.containsPhi ? "pending" : "not_required",
            clinicalCaseId: clinicalCaseId ?? null,
            coverageSnapshotId: snapshot?.id ?? null,
            coverageDocumentId: snapshot?.documentId ?? null,
            coverageVersion: snapshot?.version ?? null,
            coverageContentHash: snapshot?.contentHash ?? null,
          })
          .onConflictDoNothing()
          .returning();

        if (!created) {
          const [existing] = await db
            .select()
            .from(aiToolRuns)
            .where(
              and(
                eq(aiToolRuns.organizationId, context.organizationId),
                eq(aiToolRuns.memberId, context.memberId),
                eq(aiToolRuns.toolId, tool.id),
                eq(aiToolRuns.idempotencyKeyHash, idempotencyKeyHash),
              ),
            )
            .limit(1);
          if (!existing) {
            throw new SpartanAiToolError(
              "IDEMPOTENCY_CONFLICT",
              409,
              "The idempotent request could not be resolved.",
              true,
            );
          }
          if (existing.inputHash !== inputHash) {
            throw new SpartanAiToolError(
              "IDEMPOTENCY_KEY_REUSED",
              409,
              "Idempotency-Key was reused with different input.",
            );
          }
          response
            .setHeader("X-Idempotent-Replay", "true")
            .setHeader("X-Request-Id", id)
            .status(existing.status === "processing" ? 202 : 200)
            .json({ run: exposeRun(existing) });
          return;
        }

        try {
          const result = await runSpartanAiTool(tool.id, input, {
            requestId: id,
          });
          const encryptedPayload = tool.containsPhi
            ? encryptPhi(
                { output: result.output },
                `ai-tool-run:${context.organizationId}:${created.id}`,
              )
            : null;
          const [completed] = await db
            .update(aiToolRuns)
            .set({
              status: "completed",
              output: tool.containsPhi ? null : result.output,
              encryptedPayload,
              model: result.metadata.model,
              promptVersion: result.metadata.promptVersion,
              durationMs: result.metadata.durationMs,
              completedAt: new Date(),
            })
            .where(
              and(
                eq(aiToolRuns.id, created.id),
                eq(aiToolRuns.organizationId, context.organizationId),
              ),
            )
            .returning();
          if (tool.containsPhi) {
            await audit(
              authed,
              "ai_tool.run.completed",
              "ai_tool_run",
              created.id,
              {
                toolId: tool.id,
                coverageSnapshotId: snapshot?.id,
              },
            );
          }
          response
            .setHeader("X-Request-Id", id)
            .status(201)
            .json({ run: exposeRun(completed) });
        } catch (error) {
          const code =
            error instanceof SpartanAiToolError ? error.code : "RUN_FAILED";
          await db
            .update(aiToolRuns)
            .set({ status: "failed", errorCode: code, completedAt: new Date() })
            .where(eq(aiToolRuns.id, created.id));
          throw error;
        }
      } catch (error) {
        safeError(response, error, id);
      }
    },
  );

  app.get(
    "/api/ai-tools/:toolId/runs",
    requireFieldKit,
    async (request, response) => {
      const id = requestId(request);
      try {
        const authed = request as AuthedRequest;
        const context = memberContext(authed);
        const tool = getSpartanAiTool(String(request.params.toolId));
        if (!tool) {
          throw new SpartanAiToolError(
            "TOOL_NOT_FOUND",
            404,
            "AI tool was not found.",
          );
        }
        if (isClinicalTool(tool)) clinicalResultNotRetained();
        const runs = await db
          .select()
          .from(aiToolRuns)
          .where(
            and(
              eq(aiToolRuns.organizationId, context.organizationId),
              eq(aiToolRuns.memberId, context.memberId),
              eq(aiToolRuns.toolId, tool.id),
            ),
          )
          .orderBy(desc(aiToolRuns.createdAt))
          .limit(50);
        if (isClinicalTool(tool)) {
          await audit(
            authed,
            "clinical.run.history_viewed",
            "ai_tool_run",
            null,
            {
              toolId: tool.id,
              resultCount: runs.length,
            },
          );
        }
        response.setHeader("X-Request-Id", id).json({
          runs: runs.map(exposeRun),
        });
      } catch (error) {
        safeError(response, error, id);
      }
    },
  );

  app.get(
    "/api/clinical/coverage/snapshots",
    requireFieldKit,
    requireClinicalUse,
    async (request, response) => {
      const id = requestId(request);
      try {
        const snapshots = await db
          .select({
            id: coverageSnapshots.id,
            source: coverageSnapshots.source,
            documentType: coverageSnapshots.documentType,
            documentId: coverageSnapshots.documentId,
            version: coverageSnapshots.version,
            jurisdiction: coverageSnapshots.jurisdiction,
            title: coverageSnapshots.title,
            sourceUrl: coverageSnapshots.sourceUrl,
            contentHash: coverageSnapshots.contentHash,
            effectiveAt: coverageSnapshots.effectiveAt,
            retiredAt: coverageSnapshots.retiredAt,
            fetchedAt: coverageSnapshots.fetchedAt,
          })
          .from(coverageSnapshots)
          .orderBy(desc(coverageSnapshots.fetchedAt))
          .limit(200);
        response.setHeader("X-Request-Id", id).json({ snapshots });
      } catch (error) {
        safeError(response, error, id);
      }
    },
  );

  app.post(
    "/api/clinical/ephemeral-sessions",
    requireFieldKit,
    requireClinicalUse,
    standardAiLimit,
    async (request, response) => {
      const id = requestId(request);
      setNoStore(response);
      try {
        requirePhiRuntimeReady();
        await assertEphemeralBucketConfiguration();
        const authed = request as AuthedRequest;
        const context = memberContext(authed);
        const tool = getSpartanAiTool("medical-record-lcd-verifier");
        if (!tool) {
          throw new SpartanAiToolError(
            "TOOL_NOT_FOUND",
            404,
            "Medical-record verification tool was not found.",
          );
        }
        await requireToolEnabled(context.organizationId, tool);
        const snapshot = await loadCoverage(
          context.organizationId,
          String(request.body?.coverageSnapshotId ?? ""),
        );
        if (!snapshot) {
          throw new SpartanAiToolError(
            "COVERAGE_SNAPSHOT_REQUIRED",
            400,
            "A versioned CMS coverage snapshot is required.",
          );
        }
        const now = new Date();
        const [session] = await db
          .insert(clinicalEphemeralSessions)
          .values({
            organizationId: context.organizationId,
            createdByMemberId: context.memberId,
            coverageSnapshotId: snapshot.id,
            expiresAt: new Date(now.getTime() + EPHEMERAL_CLINICAL_TTL_MS),
          })
          .returning();
        await audit(
          authed,
          "clinical.ephemeral.session_created",
          "clinical_ephemeral_session",
          session.id,
          {
            toolId: tool.id,
            coverageSnapshotId: snapshot.id,
            outcome: "created",
            expiresAt: session.expiresAt.toISOString(),
            retainedClinicalContent: false,
          },
        );
        response
          .setHeader("X-Request-Id", id)
          .status(201)
          .json({
            session: {
              id: session.id,
              coverageSnapshotId: session.coverageSnapshotId,
              expiresAt: session.expiresAt,
              retention: "ephemeral",
            },
          });
      } catch (error) {
        safeError(response, error, id);
      }
    },
  );

  app.post(
    "/api/clinical/ephemeral-sessions/:sessionId/documents/upload-url",
    requireFieldKit,
    requireClinicalUse,
    standardAiLimit,
    async (request, response) => {
      const id = requestId(request);
      setNoStore(response);
      try {
        requirePhiRuntimeReady();
        await assertEphemeralBucketConfiguration();
        const authed = request as AuthedRequest;
        const context = memberContext(authed);
        const session = await loadEphemeralSession(
          context.organizationId,
          context.memberId,
          String(request.params.sessionId),
        );
        if (session.status !== "open") {
          throw new SpartanAiToolError(
            "EPHEMERAL_SESSION_CLOSED",
            409,
            "The ephemeral clinical workspace is no longer accepting uploads.",
          );
        }
        if (
          Object.prototype.hasOwnProperty.call(request.body ?? {}, "filename")
        ) {
          throw new SpartanAiToolError(
            "FILENAME_NOT_ACCEPTED",
            400,
            "Original filenames must remain on the device and cannot be transmitted.",
          );
        }
        const contentType = String(request.body?.contentType ?? "");
        const sizeBytes = Number(request.body?.sizeBytes ?? 0);
        validateClinicalUpload(contentType, sizeBytes);
        const objects = await db
          .select({
            id: clinicalEphemeralObjects.id,
            sizeBytes: clinicalEphemeralObjects.sizeBytes,
          })
          .from(clinicalEphemeralObjects)
          .where(
            and(
              eq(
                clinicalEphemeralObjects.organizationId,
                context.organizationId,
              ),
              eq(clinicalEphemeralObjects.sessionId, session.id),
            ),
          );
        if (objects.length >= 25) {
          throw new SpartanAiToolError(
            "SESSION_FILE_LIMIT",
            400,
            "An ephemeral session supports at most 25 documents.",
          );
        }
        if (
          objects.reduce((total, object) => total + object.sizeBytes, 0) +
            sizeBytes >
          250 * 1024 * 1024
        ) {
          throw new SpartanAiToolError(
            "SESSION_SIZE_LIMIT",
            400,
            "An ephemeral session supports at most 250 MB of documents.",
          );
        }
        const documentToken = randomUUID();
        const objectKey = createEphemeralClinicalObjectKey(
          context.organizationId,
          session.id,
        );
        const uploadUrl = await createEphemeralClinicalUploadUrl(
          objectKey,
          contentType,
        );
        await db.insert(clinicalEphemeralObjects).values({
          id: documentToken,
          sessionId: session.id,
          organizationId: context.organizationId,
          objectKey,
          contentType,
          sizeBytes,
          expiresAt: session.expiresAt,
        });
        await audit(
          authed,
          "clinical.ephemeral.upload_authorized",
          "clinical_ephemeral_session",
          session.id,
          {
            documentToken,
            contentType,
            sizeBytes,
            outcome: "authorized",
            retainedClinicalContent: false,
          },
        );
        response
          .setHeader("X-Request-Id", id)
          .status(201)
          .json({
            documentToken,
            uploadUrl,
            expiresInSeconds: 300,
            requiredHeaders: { "Content-Type": contentType },
          });
      } catch (error) {
        await purgeEphemeralAfterFailure(
          request as AuthedRequest,
          String(request.params.sessionId),
          error,
        ).catch(() => undefined);
        safeError(response, error, id);
      }
    },
  );

  app.post(
    "/api/clinical/ephemeral-sessions/:sessionId/documents/:documentToken/complete",
    requireFieldKit,
    requireClinicalUse,
    heavyAiLimit,
    async (request, response) => {
      const id = requestId(request);
      setNoStore(response);
      try {
        requirePhiRuntimeReady();
        const authed = request as AuthedRequest;
        const context = memberContext(authed);
        const session = await loadEphemeralSession(
          context.organizationId,
          context.memberId,
          String(request.params.sessionId),
        );
        const documentToken = String(request.params.documentToken);
        if (!UUID_PATTERN.test(documentToken)) {
          throw new SpartanAiToolError(
            "INVALID_DOCUMENT_TOKEN",
            400,
            "Document token is invalid.",
          );
        }
        const [document] = await db
          .select()
          .from(clinicalEphemeralObjects)
          .where(
            and(
              eq(clinicalEphemeralObjects.id, documentToken),
              eq(clinicalEphemeralObjects.sessionId, session.id),
              eq(
                clinicalEphemeralObjects.organizationId,
                context.organizationId,
              ),
            ),
          )
          .limit(1);
        if (!document) {
          throw new SpartanAiToolError(
            "DOCUMENT_NOT_FOUND",
            404,
            "Ephemeral clinical document was not found.",
          );
        }
        const inspected = await inspectEphemeralClinicalObject(
          document.objectKey,
        );
        if (
          inspected.sizeBytes !== document.sizeBytes ||
          inspected.contentType !== document.contentType
        ) {
          await deleteEphemeralClinicalObject(document.objectKey);
          await db
            .delete(clinicalEphemeralObjects)
            .where(eq(clinicalEphemeralObjects.id, document.id));
          throw new SpartanAiToolError(
            "UPLOAD_METADATA_MISMATCH",
            400,
            "Uploaded document did not match the authorized metadata.",
          );
        }
        await db
          .update(clinicalEphemeralObjects)
          .set({ scanStatus: "scanning" })
          .where(eq(clinicalEphemeralObjects.id, document.id));
        const scanStatus = await scanEphemeralClinicalObject(
          document.objectKey,
        );
        if (scanStatus !== "safe") {
          await deleteEphemeralClinicalObject(document.objectKey);
          await db
            .delete(clinicalEphemeralObjects)
            .where(eq(clinicalEphemeralObjects.id, document.id));
          await audit(
            authed,
            "clinical.ephemeral.malware_rejected",
            "clinical_ephemeral_session",
            session.id,
            {
              documentToken,
              outcome: "rejected",
              deletionVerified: true,
              retainedClinicalContent: false,
            },
          );
          throw new SpartanAiToolError(
            "DOCUMENT_REJECTED",
            400,
            "The uploaded document did not pass the security scan.",
          );
        }
        await db
          .update(clinicalEphemeralObjects)
          .set({ scanStatus: "safe" })
          .where(eq(clinicalEphemeralObjects.id, document.id));
        await audit(
          authed,
          "clinical.ephemeral.document_ready",
          "clinical_ephemeral_session",
          session.id,
          {
            documentToken,
            outcome: "safe",
            retainedClinicalContent: false,
          },
        );
        response
          .setHeader("X-Request-Id", id)
          .json({ documentToken, scanStatus: "safe" });
      } catch (error) {
        await purgeEphemeralAfterFailure(
          request as AuthedRequest,
          String(request.params.sessionId),
          error,
        ).catch(() => undefined);
        safeError(response, error, id);
      }
    },
  );

  app.post(
    "/api/clinical/ephemeral-sessions/:sessionId/documents/:documentToken/extract",
    requireFieldKit,
    requireClinicalUse,
    heavyAiLimit,
    globalDailyAiCap,
    async (request, response) => {
      const id = requestId(request);
      setNoStore(response);
      try {
        requirePhiRuntimeReady();
        const authed = request as AuthedRequest;
        const context = memberContext(authed);
        const session = await loadEphemeralSession(
          context.organizationId,
          context.memberId,
          String(request.params.sessionId),
        );
        const documentToken = String(request.params.documentToken);
        const [document] = await db
          .select()
          .from(clinicalEphemeralObjects)
          .where(
            and(
              eq(clinicalEphemeralObjects.id, documentToken),
              eq(clinicalEphemeralObjects.sessionId, session.id),
              eq(
                clinicalEphemeralObjects.organizationId,
                context.organizationId,
              ),
              eq(clinicalEphemeralObjects.scanStatus, "safe"),
            ),
          )
          .limit(1);
        if (!document) {
          throw new SpartanAiToolError(
            "DOCUMENT_NOT_FOUND",
            404,
            "A scanned ephemeral clinical document was not found.",
          );
        }
        const file = await downloadEphemeralClinicalObject(document.objectKey);
        const text = await extractClinicalDocument(document.contentType, file);
        await audit(
          authed,
          "clinical.ephemeral.document_extracted",
          "clinical_ephemeral_session",
          session.id,
          {
            documentToken,
            model: process.env.OPENAI_MODEL ?? "gpt-5",
            outcome: "completed",
            retainedClinicalContent: false,
          },
        );
        response.setHeader("X-Request-Id", id).json({
          documentToken,
          text,
          warning:
            "Review extracted text against the source. It exists only in this app session.",
        });
      } catch (error) {
        await purgeEphemeralAfterFailure(
          request as AuthedRequest,
          String(request.params.sessionId),
          error,
        ).catch(() => undefined);
        safeError(response, error, id);
      }
    },
  );

  app.post(
    "/api/clinical/ephemeral-sessions/:sessionId/finalize",
    requireFieldKit,
    requireClinicalUse,
    heavyAiLimit,
    globalDailyAiCap,
    async (request, response) => {
      const id = requestId(request);
      setNoStore(response);
      const authed = request as AuthedRequest;
      let session: typeof clinicalEphemeralSessions.$inferSelect | undefined;
      try {
        requirePhiRuntimeReady();
        const context = memberContext(authed);
        session = await loadEphemeralSession(
          context.organizationId,
          context.memberId,
          String(request.params.sessionId),
        );
        const tool = getSpartanAiTool("medical-record-lcd-verifier");
        if (!tool) {
          throw new SpartanAiToolError(
            "TOOL_NOT_FOUND",
            404,
            "Medical-record verification tool was not found.",
          );
        }
        await requireToolEnabled(context.organizationId, tool);
        const snapshot = await loadCoverage(
          context.organizationId,
          session.coverageSnapshotId ?? undefined,
        );
        if (!snapshot) {
          throw new SpartanAiToolError(
            "COVERAGE_SNAPSHOT_REQUIRED",
            400,
            "A versioned CMS coverage snapshot is required.",
          );
        }
        await db
          .update(clinicalEphemeralSessions)
          .set({ status: "processing", updatedAt: new Date() })
          .where(eq(clinicalEphemeralSessions.id, session.id));
        const input = addCoverageEvidence(
          tool.id,
          request.body?.input,
          snapshot,
        );
        const result = await runSpartanAiTool(tool.id, input, {
          requestId: id,
        });
        const objectCount = await purgeEphemeralClinicalSession(
          context.organizationId,
          session.id,
        );
        await audit(
          authed,
          "clinical.ephemeral.purged",
          "clinical_ephemeral_session",
          session.id,
          {
            toolId: tool.id,
            model: result.metadata.model,
            toolVersion: result.metadata.toolVersion,
            promptVersion: result.metadata.promptVersion,
            coverageSnapshotId: snapshot.id,
            reason: "completed" satisfies EphemeralPurgeReason,
            outcome: "completed",
            durationMs: result.metadata.durationMs,
            objectCount,
            deletionVerified: true,
            retainedClinicalContent: false,
          },
        );
        response.setHeader("X-Request-Id", id).json({
          result: exposeEphemeralResult(result, snapshot),
        });
      } catch (error) {
        if (session && authed.fieldKit?.member && authed.clientMemberId) {
          const context = memberContext(authed);
          let deletionVerified = false;
          let objectCount = 0;
          try {
            objectCount = await purgeEphemeralClinicalSession(
              context.organizationId,
              session.id,
            );
            deletionVerified = true;
          } catch {
            // The expiry sweeper will retry an incomplete purge.
          }
          await audit(
            authed,
            "clinical.ephemeral.purged",
            "clinical_ephemeral_session",
            session.id,
            {
              toolId: "medical-record-lcd-verifier",
              reason: "failed" satisfies EphemeralPurgeReason,
              outcome: "failed",
              errorCode:
                error instanceof SpartanAiToolError
                  ? error.code
                  : "INTERNAL_ERROR",
              objectCount,
              deletionVerified,
              retainedClinicalContent: false,
            },
          ).catch(() => undefined);
          if (!deletionVerified) {
            safeError(
              response,
              new SpartanAiToolError(
                "EPHEMERAL_PURGE_PENDING",
                503,
                "The result was discarded and secure cleanup is being retried.",
                true,
              ),
              id,
            );
            return;
          }
        }
        safeError(response, error, id);
      }
    },
  );

  app.delete(
    "/api/clinical/ephemeral-sessions/:sessionId",
    requireFieldKit,
    requireClinicalUse,
    async (request, response) => {
      const id = requestId(request);
      setNoStore(response);
      try {
        const authed = request as AuthedRequest;
        const context = memberContext(authed);
        const session = await loadEphemeralSession(
          context.organizationId,
          context.memberId,
          String(request.params.sessionId),
        );
        const objectCount = await purgeEphemeralClinicalSession(
          context.organizationId,
          session.id,
        );
        await audit(
          authed,
          "clinical.ephemeral.purged",
          "clinical_ephemeral_session",
          session.id,
          {
            reason: "cancelled" satisfies EphemeralPurgeReason,
            outcome: "cancelled",
            objectCount,
            deletionVerified: true,
            retainedClinicalContent: false,
          },
        );
        response.setHeader("X-Request-Id", id).status(204).send();
      } catch (error) {
        safeError(response, error, id);
      }
    },
  );

  app.get(
    "/api/ai-tool-runs/:runId",
    requireFieldKit,
    async (request, response) => {
      const id = requestId(request);
      try {
        const authed = request as AuthedRequest;
        const context = memberContext(authed);
        const runId = String(request.params.runId);
        if (!UUID_PATTERN.test(runId)) {
          throw new SpartanAiToolError(
            "INVALID_RUN_ID",
            400,
            "Run ID is invalid.",
          );
        }
        const [run] = await db
          .select()
          .from(aiToolRuns)
          .where(
            and(
              eq(aiToolRuns.id, runId),
              eq(aiToolRuns.organizationId, context.organizationId),
            ),
          )
          .limit(1);
        if (!run) {
          throw new SpartanAiToolError(
            "RUN_NOT_FOUND",
            404,
            "Run was not found.",
          );
        }
        if (run.containsPhi) clinicalResultNotRetained();
        const role = context.member.role;
        if (
          run.memberId !== context.memberId &&
          role !== "org_admin" &&
          role !== "platform_admin"
        ) {
          throw new SpartanAiToolError(
            "FORBIDDEN",
            403,
            "Run access was denied.",
          );
        }
        if (run.containsPhi) {
          await audit(authed, "clinical.run.viewed", "ai_tool_run", run.id, {
            toolId: run.toolId,
          });
        }
        response.setHeader("X-Request-Id", id).json({ run: exposeRun(run) });
      } catch (error) {
        safeError(response, error, id);
      }
    },
  );

  app.get(
    "/api/ai-tool-runs/:runId/export",
    requireFieldKit,
    async (request, response) => {
      const id = requestId(request);
      try {
        const authed = request as AuthedRequest;
        const context = memberContext(authed);
        const runId = String(request.params.runId);
        if (!UUID_PATTERN.test(runId)) {
          throw new SpartanAiToolError(
            "INVALID_RUN_ID",
            400,
            "Run ID is invalid.",
          );
        }
        const [run] = await db
          .select()
          .from(aiToolRuns)
          .where(
            and(
              eq(aiToolRuns.id, runId),
              eq(aiToolRuns.organizationId, context.organizationId),
            ),
          )
          .limit(1);
        if (!run) {
          throw new SpartanAiToolError(
            "RUN_NOT_FOUND",
            404,
            "Run was not found.",
          );
        }
        if (run.containsPhi) {
          clinicalResultNotRetained();
        } else if (
          run.memberId !== context.memberId &&
          context.member.role !== "org_admin" &&
          context.member.role !== "platform_admin"
        ) {
          throw new SpartanAiToolError(
            "FORBIDDEN",
            403,
            "Run export access was denied.",
          );
        }
        response
          .setHeader("X-Request-Id", id)
          .setHeader("Cache-Control", "no-store")
          .setHeader(
            "Content-Disposition",
            `attachment; filename="${run.toolId}-${run.id}.json"`,
          )
          .json({ run: exposeRun(run) });
      } catch (error) {
        safeError(response, error, id);
      }
    },
  );

  app.post(
    "/api/clinical/documents/:documentId/extract",
    requireFieldKit,
    requireClinicalUse,
    heavyAiLimit,
    globalDailyAiCap,
    async (request, response) => {
      const id = requestId(request);
      try {
        clinicalResultNotRetained();
        requirePhiRuntimeReady();
        const authed = request as AuthedRequest;
        const context = memberContext(authed);
        const documentId = String(request.params.documentId);
        const [document] = await db
          .select()
          .from(clinicalDocuments)
          .where(
            and(
              eq(clinicalDocuments.id, documentId),
              eq(clinicalDocuments.organizationId, context.organizationId),
              eq(clinicalDocuments.scanStatus, "safe"),
              isNull(clinicalDocuments.deletedAt),
            ),
          )
          .limit(1);
        if (!document) {
          throw new SpartanAiToolError(
            "DOCUMENT_NOT_FOUND",
            404,
            "Safe clinical document was not found.",
          );
        }
        const file = await downloadClinicalObject(document.objectKey);
        const client = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
          timeout: 60_000,
          maxRetries: 1,
        });
        const content =
          document.contentType === "application/pdf"
            ? [
                {
                  type: "input_file",
                  filename: "clinical-record.pdf",
                  file_data: `data:application/pdf;base64,${file.toString("base64")}`,
                },
                {
                  type: "input_text",
                  text: "Extract the document text faithfully. Do not summarize, diagnose, or infer missing text. Mark unreadable sections as [UNREADABLE].",
                },
              ]
            : document.contentType.startsWith("image/")
              ? [
                  {
                    type: "input_image",
                    image_url: `data:${document.contentType};base64,${file.toString("base64")}`,
                    detail: "high",
                  },
                  {
                    type: "input_text",
                    text: "Transcribe the visible document text faithfully. Do not summarize, diagnose, or infer missing text. Mark unreadable sections as [UNREADABLE].",
                  },
                ]
              : [
                  {
                    type: "input_text",
                    text: `Transcribe this clinical document faithfully without adding or inferring content:\n\n${file.toString("utf8")}`,
                  },
                ];
        const extraction = await client.responses.create({
          model: process.env.OPENAI_MODEL ?? "gpt-5",
          store: false,
          input: [
            {
              role: "system",
              content:
                "You are a high-fidelity medical document transcription system. Return source text only and preserve section structure.",
            },
            { role: "user", content: content as never },
          ],
        });
        await audit(
          authed,
          "clinical.document.extracted",
          "clinical_document",
          document.id,
          { caseId: document.caseId },
        );
        response.setHeader("Cache-Control", "no-store");
        response.setHeader("X-Request-Id", id).json({
          documentId: document.id,
          text: extraction.output_text,
          warning:
            "Review extracted text against the source document before running clinical analysis.",
        });
      } catch (error) {
        safeError(response, error, id);
      }
    },
  );

  app.post(
    "/api/clinical/mfa/request",
    requireFieldKit,
    heavyAiLimit,
    async (request, response) => {
      const id = requestId(request);
      try {
        const authed = request as AuthedRequest;
        const context = memberContext(authed);
        const access = await resolveClinicalAccess(authed);
        if (!access?.canUse) {
          throw new SpartanAiToolError(
            "CLINICAL_ACCESS_REQUIRED",
            403,
            "Clinical tool access has not been granted.",
          );
        }
        const code = randomInt(100000, 1000000).toString();
        const challengeToken = generateToken();
        const [challenge] = await db
          .insert(clinicalMfaChallenges)
          .values({
            organizationId: context.organizationId,
            memberId: context.memberId,
            challengeHash: hashToken(`${challengeToken}:${code}`),
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
          })
          .returning({ id: clinicalMfaChallenges.id });
        const delivered = await sendClinicalMfaCode(
          context.member.email,
          context.member.name,
          code,
        );
        if (!delivered) {
          throw new SpartanAiToolError(
            "MFA_DELIVERY_FAILED",
            503,
            "Verification code could not be delivered.",
            true,
          );
        }
        await audit(authed, "clinical.mfa.requested", "session", null);
        response.setHeader("X-Request-Id", id).status(201).json({
          challengeId: challenge.id,
          challengeToken,
          expiresInSeconds: 600,
        });
      } catch (error) {
        safeError(response, error, id);
      }
    },
  );

  app.post(
    "/api/clinical/mfa/verify",
    requireFieldKit,
    heavyAiLimit,
    async (request, response) => {
      const id = requestId(request);
      try {
        const authed = request as AuthedRequest;
        const context = memberContext(authed);
        const challengeId = String(request.body?.challengeId ?? "");
        const challengeToken = String(request.body?.challengeToken ?? "");
        const code = String(request.body?.code ?? "");
        if (
          !UUID_PATTERN.test(challengeId) ||
          challengeToken.length < 20 ||
          !/^\d{6}$/.test(code)
        ) {
          throw new SpartanAiToolError(
            "INVALID_MFA_CODE",
            400,
            "Verification request is invalid.",
          );
        }
        const [challenge] = await db
          .select()
          .from(clinicalMfaChallenges)
          .where(
            and(
              eq(clinicalMfaChallenges.id, challengeId),
              eq(clinicalMfaChallenges.organizationId, context.organizationId),
              eq(clinicalMfaChallenges.memberId, context.memberId),
              gt(clinicalMfaChallenges.expiresAt, new Date()),
              isNull(clinicalMfaChallenges.usedAt),
            ),
          )
          .limit(1);
        if (!challenge || challenge.attempts >= 5) {
          throw new SpartanAiToolError(
            "MFA_CHALLENGE_EXPIRED",
            400,
            "Verification challenge is expired.",
          );
        }
        const valid = safeEqualString(
          hashToken(`${challengeToken}:${code}`),
          challenge.challengeHash,
        );
        await db
          .update(clinicalMfaChallenges)
          .set({
            attempts: challenge.attempts + 1,
            usedAt: valid ? new Date() : null,
          })
          .where(eq(clinicalMfaChallenges.id, challenge.id));
        if (!valid) {
          throw new SpartanAiToolError(
            "INVALID_MFA_CODE",
            400,
            "Verification code is incorrect.",
          );
        }
        if (!authed.sessionId) {
          throw new SpartanAiToolError(
            "UNAUTHENTICATED",
            401,
            "Authentication required.",
          );
        }
        await db
          .update(clientSessions)
          .set({ mfaVerifiedAt: new Date() })
          .where(eq(clientSessions.id, authed.sessionId));
        await audit(authed, "clinical.mfa.verified", "session", null);
        response.setHeader("X-Request-Id", id).json({
          verified: true,
          validForSeconds: 900,
        });
      } catch (error) {
        safeError(response, error, id);
      }
    },
  );

  app.put(
    "/api/clinical/permissions/:memberId",
    requireFieldKit,
    requireOrgAdmin,
    async (request, response) => {
      const id = requestId(request);
      try {
        const authed = request as AuthedRequest;
        const context = memberContext(authed);
        const targetMemberId = Number(request.params.memberId);
        if (!Number.isInteger(targetMemberId) || targetMemberId < 1) {
          throw new SpartanAiToolError(
            "INVALID_MEMBER_ID",
            400,
            "Member ID is invalid.",
          );
        }
        const [target] = await db
          .select({ id: clientMembers.id })
          .from(clientMembers)
          .where(
            and(
              eq(clientMembers.id, targetMemberId),
              eq(clientMembers.organizationId, context.organizationId),
            ),
          )
          .limit(1);
        if (!target) {
          throw new SpartanAiToolError(
            "MEMBER_NOT_FOUND",
            404,
            "Member was not found.",
          );
        }
        const canUse = request.body?.canUse === true;
        const canReview = request.body?.canReview === true;
        const requestedAdmin = request.body?.canAdmin === true;
        const canAdmin =
          context.member.role === "platform_admin" ? requestedAdmin : false;
        const [permission] = await db
          .insert(clinicalPermissions)
          .values({
            organizationId: context.organizationId,
            memberId: targetMemberId,
            canUse,
            canReview,
            canAdmin,
            grantedByMemberId: context.memberId,
            revokedAt: canUse || canReview || canAdmin ? null : new Date(),
          })
          .onConflictDoUpdate({
            target: [
              clinicalPermissions.organizationId,
              clinicalPermissions.memberId,
            ],
            set: {
              canUse,
              canReview,
              canAdmin,
              grantedByMemberId: context.memberId,
              grantedAt: new Date(),
              revokedAt: canUse || canReview || canAdmin ? null : new Date(),
            },
          })
          .returning();
        await audit(authed, "clinical.permission.updated", "member", null, {
          targetMemberId,
          canUse,
          canReview,
          canAdmin,
        });
        response.setHeader("X-Request-Id", id).json({ permission });
      } catch (error) {
        safeError(response, error, id);
      }
    },
  );

  app.post(
    "/api/clinical/cases",
    requireFieldKit,
    requireClinicalUse,
    async (request, response) => {
      const id = requestId(request);
      try {
        clinicalResultNotRetained();
        const authed = request as AuthedRequest;
        const context = memberContext(authed);
        const label = String(request.body?.label ?? "").trim();
        const retentionDays = Number(request.body?.retentionDays ?? 30);
        if (!label || label.length > 200) {
          throw new SpartanAiToolError(
            "INVALID_CASE_LABEL",
            400,
            "Case label is required and must be 200 characters or fewer.",
          );
        }
        if (
          !Number.isInteger(retentionDays) ||
          retentionDays < 1 ||
          retentionDays > 365
        ) {
          throw new SpartanAiToolError(
            "INVALID_RETENTION",
            400,
            "Retention must be between 1 and 365 days.",
          );
        }
        const caseId = randomUUID();
        const [created] = await db
          .insert(clinicalCases)
          .values({
            id: caseId,
            organizationId: context.organizationId,
            createdByMemberId: context.memberId,
            encryptedLabel: encryptPhi(
              { label },
              `clinical-case:${context.organizationId}:${caseId}`,
            ),
            retentionDays,
            retentionUntil: new Date(
              Date.now() + retentionDays * 24 * 60 * 60 * 1000,
            ),
          })
          .returning();
        await audit(
          authed,
          "clinical.case.created",
          "clinical_case",
          created.id,
          {
            retentionDays,
          },
        );
        response
          .setHeader("X-Request-Id", id)
          .status(201)
          .json({
            case: {
              ...created,
              encryptedLabel: undefined,
              label,
            },
          });
      } catch (error) {
        safeError(response, error, id);
      }
    },
  );

  app.get(
    "/api/clinical/cases",
    requireFieldKit,
    requireClinicalUse,
    async (request, response) => {
      const id = requestId(request);
      try {
        clinicalResultNotRetained();
        const context = memberContext(request as AuthedRequest);
        const cases = await db
          .select()
          .from(clinicalCases)
          .where(
            and(
              eq(clinicalCases.organizationId, context.organizationId),
              isNull(clinicalCases.deletedAt),
            ),
          )
          .orderBy(desc(clinicalCases.updatedAt))
          .limit(100);
        response.setHeader("X-Request-Id", id).json({
          cases: cases.map((clinicalCase) => ({
            ...clinicalCase,
            encryptedLabel: undefined,
            label: decryptPhi<{ label: string }>(
              clinicalCase.encryptedLabel,
              `clinical-case:${context.organizationId}:${clinicalCase.id}`,
            ).label,
          })),
        });
      } catch (error) {
        safeError(response, error, id);
      }
    },
  );

  app.post(
    "/api/clinical/cases/:caseId/documents/upload-url",
    requireFieldKit,
    requireClinicalUse,
    async (request, response) => {
      const id = requestId(request);
      try {
        clinicalResultNotRetained();
        const authed = request as AuthedRequest;
        const context = memberContext(authed);
        const caseId = String(request.params.caseId);
        const contentType = String(request.body?.contentType ?? "");
        const sizeBytes = Number(request.body?.sizeBytes ?? 0);
        const filename = String(request.body?.filename ?? "document").slice(
          0,
          255,
        );
        if (!UUID_PATTERN.test(caseId)) {
          throw new SpartanAiToolError(
            "INVALID_CASE_ID",
            400,
            "Case ID is invalid.",
          );
        }
        validateClinicalUpload(contentType, sizeBytes);
        const [clinicalCase] = await db
          .select({ id: clinicalCases.id })
          .from(clinicalCases)
          .where(
            and(
              eq(clinicalCases.id, caseId),
              eq(clinicalCases.organizationId, context.organizationId),
              isNull(clinicalCases.deletedAt),
            ),
          )
          .limit(1);
        if (!clinicalCase) {
          throw new SpartanAiToolError(
            "CLINICAL_CASE_NOT_FOUND",
            404,
            "Clinical case was not found.",
          );
        }
        const documents = await db
          .select({
            id: clinicalDocuments.id,
            sizeBytes: clinicalDocuments.sizeBytes,
          })
          .from(clinicalDocuments)
          .where(
            and(
              eq(clinicalDocuments.caseId, caseId),
              eq(clinicalDocuments.organizationId, context.organizationId),
              isNull(clinicalDocuments.deletedAt),
            ),
          );
        if (documents.length >= 25) {
          throw new SpartanAiToolError(
            "CASE_FILE_LIMIT",
            400,
            "A clinical case supports at most 25 documents.",
          );
        }
        if (
          documents.reduce((sum, document) => sum + document.sizeBytes, 0) +
            sizeBytes >
          250 * 1024 * 1024
        ) {
          throw new SpartanAiToolError(
            "CASE_SIZE_LIMIT",
            400,
            "A clinical case supports at most 250 MB of documents.",
          );
        }
        const objectKey = createClinicalObjectKey(
          context.organizationId,
          caseId,
        );
        const uploadUrl = await createClinicalUploadUrl(objectKey, contentType);
        const documentId = randomUUID();
        const [document] = await db
          .insert(clinicalDocuments)
          .values({
            id: documentId,
            caseId,
            organizationId: context.organizationId,
            uploadedByMemberId: context.memberId,
            objectKey,
            encryptedMetadata: encryptPhi(
              { filename },
              `clinical-document:${context.organizationId}:${documentId}`,
            ),
            contentType,
            sizeBytes,
          })
          .returning();
        await audit(
          authed,
          "clinical.document.upload_authorized",
          "clinical_document",
          document.id,
          { caseId, contentType, sizeBytes },
        );
        response
          .setHeader("X-Request-Id", id)
          .status(201)
          .json({
            documentId: document.id,
            uploadUrl,
            expiresInSeconds: 300,
            requiredHeaders: { "Content-Type": contentType },
          });
      } catch (error) {
        safeError(response, error, id);
      }
    },
  );

  app.post(
    "/api/clinical/documents/:documentId/finalize",
    requireFieldKit,
    requireClinicalUse,
    async (request, response) => {
      const id = requestId(request);
      try {
        clinicalResultNotRetained();
        const authed = request as AuthedRequest;
        const context = memberContext(authed);
        const documentId = String(request.params.documentId);
        const sha256 = String(request.body?.sha256 ?? "").toLowerCase();
        if (!UUID_PATTERN.test(documentId) || !/^[0-9a-f]{64}$/.test(sha256)) {
          throw new SpartanAiToolError(
            "INVALID_DOCUMENT_FINALIZE",
            400,
            "Document ID and SHA-256 digest are required.",
          );
        }
        const [document] = await db
          .select()
          .from(clinicalDocuments)
          .where(
            and(
              eq(clinicalDocuments.id, documentId),
              eq(clinicalDocuments.organizationId, context.organizationId),
              isNull(clinicalDocuments.deletedAt),
            ),
          )
          .limit(1);
        if (!document) {
          throw new SpartanAiToolError(
            "DOCUMENT_NOT_FOUND",
            404,
            "Clinical document was not found.",
          );
        }
        const inspected = await inspectClinicalObject(document.objectKey);
        if (
          inspected.sizeBytes !== document.sizeBytes ||
          inspected.contentType !== document.contentType
        ) {
          await deleteClinicalObject(document.objectKey);
          await db
            .update(clinicalDocuments)
            .set({ scanStatus: "rejected", deletedAt: new Date() })
            .where(eq(clinicalDocuments.id, document.id));
          throw new SpartanAiToolError(
            "UPLOAD_METADATA_MISMATCH",
            400,
            "Uploaded document did not match the authorized metadata.",
          );
        }
        await db
          .update(clinicalDocuments)
          .set({ scanStatus: "scanning", sha256 })
          .where(eq(clinicalDocuments.id, document.id));
        const scanStatus = await scanClinicalObject(document.objectKey);
        if (scanStatus === "rejected")
          await deleteClinicalObject(document.objectKey);
        await db
          .update(clinicalDocuments)
          .set({
            scanStatus,
            deletedAt: scanStatus === "rejected" ? new Date() : null,
          })
          .where(eq(clinicalDocuments.id, document.id));
        await audit(
          authed,
          `clinical.document.${scanStatus}`,
          "clinical_document",
          document.id,
          { caseId: document.caseId },
        );
        response.setHeader("X-Request-Id", id).json({ scanStatus });
      } catch (error) {
        safeError(response, error, id);
      }
    },
  );

  app.get(
    "/api/clinical/documents/:documentId/download-url",
    requireFieldKit,
    requireClinicalUse,
    async (request, response) => {
      const id = requestId(request);
      try {
        clinicalResultNotRetained();
        const authed = request as AuthedRequest;
        const context = memberContext(authed);
        const documentId = String(request.params.documentId);
        const [document] = await db
          .select()
          .from(clinicalDocuments)
          .where(
            and(
              eq(clinicalDocuments.id, documentId),
              eq(clinicalDocuments.organizationId, context.organizationId),
              eq(clinicalDocuments.scanStatus, "safe"),
              isNull(clinicalDocuments.deletedAt),
            ),
          )
          .limit(1);
        if (!document) {
          throw new SpartanAiToolError(
            "DOCUMENT_NOT_FOUND",
            404,
            "Safe clinical document was not found.",
          );
        }
        const downloadUrl = await createClinicalDownloadUrl(document.objectKey);
        await audit(
          authed,
          "clinical.document.download_authorized",
          "clinical_document",
          document.id,
          { caseId: document.caseId },
        );
        response.setHeader("X-Request-Id", id).json({
          downloadUrl,
          expiresInSeconds: 300,
        });
      } catch (error) {
        safeError(response, error, id);
      }
    },
  );

  app.delete(
    "/api/clinical/cases/:caseId",
    requireFieldKit,
    requireClinicalUse,
    async (request, response) => {
      const id = requestId(request);
      try {
        const authed = request as AuthedRequest;
        const context = memberContext(authed);
        const caseId = String(request.params.caseId);
        const [clinicalCase] = await db
          .select()
          .from(clinicalCases)
          .where(
            and(
              eq(clinicalCases.id, caseId),
              eq(clinicalCases.organizationId, context.organizationId),
              isNull(clinicalCases.deletedAt),
            ),
          )
          .limit(1);
        if (!clinicalCase) {
          throw new SpartanAiToolError(
            "CLINICAL_CASE_NOT_FOUND",
            404,
            "Clinical case was not found.",
          );
        }
        if (clinicalCase.legalHold) {
          throw new SpartanAiToolError(
            "LEGAL_HOLD",
            409,
            "Clinical case cannot be deleted while legal hold is active.",
          );
        }
        await db
          .update(clinicalCases)
          .set({
            status: "deleting",
            deletedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(clinicalCases.id, caseId));
        const documents = await db
          .select()
          .from(clinicalDocuments)
          .where(
            and(
              eq(clinicalDocuments.caseId, caseId),
              eq(clinicalDocuments.organizationId, context.organizationId),
            ),
          );
        await Promise.all(
          documents.map((document) => deleteClinicalObject(document.objectKey)),
        );
        await db
          .update(clinicalDocuments)
          .set({
            encryptedMetadata: "purged",
            scanStatus: "deleted",
            deletedAt: new Date(),
          })
          .where(
            and(
              eq(clinicalDocuments.caseId, caseId),
              eq(clinicalDocuments.organizationId, context.organizationId),
            ),
          );
        const caseRuns = await db
          .select({ id: aiToolRuns.id })
          .from(aiToolRuns)
          .where(
            and(
              eq(aiToolRuns.organizationId, context.organizationId),
              eq(aiToolRuns.clinicalCaseId, caseId),
            ),
          );
        if (caseRuns.length) {
          await db
            .update(clinicalReviews)
            .set({ encryptedNotes: null })
            .where(
              and(
                eq(clinicalReviews.organizationId, context.organizationId),
                inArray(
                  clinicalReviews.runId,
                  caseRuns.map((run) => run.id),
                ),
              ),
            );
        }
        await db
          .update(aiToolRuns)
          .set({
            status: "deleted",
            output: null,
            encryptedPayload: null,
          })
          .where(
            and(
              eq(aiToolRuns.organizationId, context.organizationId),
              eq(aiToolRuns.clinicalCaseId, caseId),
            ),
          );
        await db
          .update(clinicalCases)
          .set({
            encryptedLabel: "purged",
            status: "deleted",
            purgeCompletedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(clinicalCases.id, caseId));
        await audit(authed, "clinical.case.purged", "clinical_case", caseId, {
          documentCount: documents.length,
        });
        response.setHeader("X-Request-Id", id).status(204).send();
      } catch (error) {
        safeError(response, error, id);
      }
    },
  );

  app.post(
    "/api/clinical/runs/:runId/review",
    requireFieldKit,
    requireClinicalUse,
    requireClinicalReview,
    async (request, response) => {
      const id = requestId(request);
      try {
        clinicalResultNotRetained();
        const authed = request as AuthedRequest;
        const context = memberContext(authed);
        const runId = String(request.params.runId);
        const decision = String(request.body?.decision ?? "");
        const notes = String(request.body?.notes ?? "").trim();
        if (
          !UUID_PATTERN.test(runId) ||
          !["approved", "changes_requested"].includes(decision)
        ) {
          throw new SpartanAiToolError(
            "INVALID_REVIEW",
            400,
            "Run ID and review decision are required.",
          );
        }
        const [run] = await db
          .select()
          .from(aiToolRuns)
          .where(
            and(
              eq(aiToolRuns.id, runId),
              eq(aiToolRuns.organizationId, context.organizationId),
              eq(aiToolRuns.containsPhi, true),
            ),
          )
          .limit(1);
        if (!run) {
          throw new SpartanAiToolError(
            "RUN_NOT_FOUND",
            404,
            "Clinical run was not found.",
          );
        }
        const reviewId = randomUUID();
        const [review] = await db
          .insert(clinicalReviews)
          .values({
            id: reviewId,
            organizationId: context.organizationId,
            runId,
            reviewerMemberId: context.memberId,
            decision,
            encryptedNotes: notes
              ? encryptPhi(
                  { notes },
                  `clinical-review:${context.organizationId}:${reviewId}`,
                )
              : null,
          })
          .returning();
        await db
          .update(aiToolRuns)
          .set({ reviewStatus: decision })
          .where(eq(aiToolRuns.id, runId));
        await audit(authed, "clinical.run.reviewed", "ai_tool_run", runId, {
          decision,
        });
        response
          .setHeader("X-Request-Id", id)
          .status(201)
          .json({
            review: { ...review, encryptedNotes: undefined, notes },
          });
      } catch (error) {
        safeError(response, error, id);
      }
    },
  );

  app.post(
    "/api/clinical/coverage/sync",
    requireFieldKit,
    requireClinicalUse,
    async (request, response) => {
      const id = requestId(request);
      try {
        const authed = request as AuthedRequest;
        if (!authed.clinicalAccess?.canAdmin) {
          throw new SpartanAiToolError(
            "CLINICAL_ADMIN_REQUIRED",
            403,
            "Clinical administrator access is required.",
          );
        }
        const sourceUrl = new URL(String(request.body?.sourceUrl ?? ""));
        if (
          sourceUrl.protocol !== "https:" ||
          sourceUrl.hostname !== "api.coverage.cms.gov"
        ) {
          throw new SpartanAiToolError(
            "CMS_SOURCE_REQUIRED",
            400,
            "Coverage snapshots must be fetched from api.coverage.cms.gov.",
          );
        }
        const documentType = String(
          request.body?.documentType ?? "",
        ).toLowerCase();
        const documentId = String(request.body?.documentId ?? "").trim();
        const version = String(request.body?.version ?? "").trim();
        if (
          !["lcd", "article", "ncd"].includes(documentType) ||
          !documentId ||
          !version
        ) {
          throw new SpartanAiToolError(
            "INVALID_COVERAGE_REQUEST",
            400,
            "Document type, ID, and version are required.",
          );
        }
        const cmsToken = process.env.CMS_COVERAGE_API_TOKEN?.trim();
        const cmsResponse = await fetch(sourceUrl, {
          headers: cmsToken
            ? { Authorization: `Bearer ${cmsToken}` }
            : undefined,
          signal: AbortSignal.timeout(30_000),
        });
        if (!cmsResponse.ok) {
          throw new SpartanAiToolError(
            "CMS_COVERAGE_UNAVAILABLE",
            502,
            "CMS coverage data could not be fetched.",
            true,
          );
        }
        const payload = await cmsResponse.json();
        const contentHash = sha256Value(payload);
        const [snapshot] = await db
          .insert(coverageSnapshots)
          .values({
            source: "CMS_MCD",
            documentType,
            documentId,
            version,
            jurisdiction: request.body?.jurisdiction
              ? String(request.body.jurisdiction).slice(0, 128)
              : null,
            title: String(
              request.body?.title ??
                `${documentType.toUpperCase()} ${documentId}`,
            ).slice(0, 500),
            sourceUrl: sourceUrl.toString(),
            contentHash,
            effectiveAt: request.body?.effectiveAt
              ? new Date(String(request.body.effectiveAt))
              : null,
            retiredAt: request.body?.retiredAt
              ? new Date(String(request.body.retiredAt))
              : null,
            payload,
          })
          .onConflictDoUpdate({
            target: [
              coverageSnapshots.source,
              coverageSnapshots.documentType,
              coverageSnapshots.documentId,
              coverageSnapshots.version,
            ],
            set: {
              sourceUrl: sourceUrl.toString(),
              contentHash,
              payload,
              fetchedAt: new Date(),
            },
          })
          .returning();
        await audit(
          authed,
          "coverage.snapshot.synced",
          "coverage_snapshot",
          snapshot.id,
          {
            documentType,
            documentId,
            version,
            contentHash,
          },
        );
        response
          .setHeader("X-Request-Id", id)
          .status(201)
          .json({
            snapshot: {
              id: snapshot.id,
              source: snapshot.source,
              documentType: snapshot.documentType,
              documentId: snapshot.documentId,
              version: snapshot.version,
              jurisdiction: snapshot.jurisdiction,
              title: snapshot.title,
              sourceUrl: snapshot.sourceUrl,
              contentHash: snapshot.contentHash,
              effectiveAt: snapshot.effectiveAt,
              retiredAt: snapshot.retiredAt,
              fetchedAt: snapshot.fetchedAt,
            },
          });
      } catch (error) {
        safeError(response, error, id);
      }
    },
  );
}
