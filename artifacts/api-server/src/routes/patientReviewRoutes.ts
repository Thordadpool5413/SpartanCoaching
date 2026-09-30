import { randomUUID } from "node:crypto";
import express, { type Express, type Request, type Response } from "express";
import { and, eq, gt } from "drizzle-orm";
import { getSpartanAiTool } from "@workspace/spartan-ai-tools";
import { runSpartanAiTool, SpartanAiToolError } from "@workspace/spartan-ai-tools/server";
import { clinicalAuditEvents, clinicalEphemeralObjects, clinicalEphemeralSessions, clientSessions, coverageSnapshots } from "@workspace/db";
import { db } from "../db";
import { requireElite, type AuthedRequest } from "../auth/middleware";
import { clinicalOperationMode, requireClinicalReview, requireClinicalUse } from "../clinical/access";
import { clinicalRuntimeReadiness } from "../clinical/runtimeReadiness";
import { assertEphemeralBucketConfiguration, createEphemeralClinicalObjectKey, deleteEphemeralClinicalObject, downloadEphemeralClinicalObject, saveEphemeralClinicalObject, scanEphemeralClinicalObject, validateClinicalUpload } from "../clinical/storage";
import { assertClinicalFileSignature, extractPatientDocument } from "../clinical/patientExtraction";
import { isCurrentCmsPolicy } from "../clinical/patientPolicy";
import { EPHEMERAL_CLINICAL_TTL_MS, purgeEphemeralClinicalSession } from "../clinical/ephemeral";
import { findPotentialIdentifiers } from "../clinical/deidentification";
import { heavyAiLimit, standardAiLimit, globalDailyAiCap } from "../rateLimits";

const SESSION_PATH = "/api/clinical/patient-review/sessions";
const UUID = /^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i;
const MAX_RECORD_BYTES = 160_000;
const MAX_FILES = 5;

function noStore(response: Response) {
  response.setHeader("Cache-Control", "no-store, private, max-age=0");
  response.setHeader("Pragma", "no-cache");
}

function fail(response: Response, error: unknown) {
  const known = error instanceof SpartanAiToolError ? error : null;
  return response.status(known?.status ?? 500).json({
    error: { code: known?.code ?? "PATIENT_REVIEW_FAILED", message: known?.message ?? "Patient review could not be completed; any uploaded files are being removed." },
  });
}

async function coveredReviewer(request: Request, response: Response, next: (error?: unknown) => void) {
  noStore(response);
  try {
    const readiness = clinicalRuntimeReadiness();
    if (clinicalOperationMode() !== "phi" || !readiness.ready) {
      throw new SpartanAiToolError("PATIENT_REVIEW_UNAVAILABLE", 503, "Patient review is unavailable until the covered clinical services are configured.");
    }
    const authed = request as AuthedRequest;
    if (!authed.sessionId) throw new SpartanAiToolError("CLINICAL_MFA_REQUIRED", 403, "Sign in and verify a recent clinical security code.");
    const [session] = await db.select({ verified: clientSessions.mfaVerifiedAt }).from(clientSessions).where(eq(clientSessions.id, authed.sessionId)).limit(1);
    if (!session?.verified || Date.now() - session.verified.getTime() > 15 * 60_000) {
      throw new SpartanAiToolError("CLINICAL_MFA_REQUIRED", 403, "Verify a clinical security code before uploading records.");
    }
    next();
  } catch (error) { fail(response, error); }
}

function owner(request: AuthedRequest) {
  if (!request.fieldKit?.member || !request.clientMemberId) throw new SpartanAiToolError("UNAUTHENTICATED", 401, "Sign in again.");
  return { organizationId: request.fieldKit.member.organizationId, memberId: request.clientMemberId };
}

async function audit(request: AuthedRequest, action: string, targetId: string, metadata: Record<string, unknown> = {}) {
  const { organizationId, memberId } = owner(request);
  await db.insert(clinicalAuditEvents).values({ organizationId, actorMemberId: memberId, action, targetType: "patient_review_session", targetId, requestId: randomUUID(), metadata });
}

async function ownedSession(request: AuthedRequest, open = true) {
  const id = String(request.params.sessionId ?? "");
  if (!UUID.test(id)) throw new SpartanAiToolError("INVALID_SESSION", 400, "Patient review session is invalid.");
  const { organizationId, memberId } = owner(request);
  const [session] = await db.select().from(clinicalEphemeralSessions).where(and(
    eq(clinicalEphemeralSessions.id, id), eq(clinicalEphemeralSessions.organizationId, organizationId),
    eq(clinicalEphemeralSessions.createdByMemberId, memberId), gt(clinicalEphemeralSessions.expiresAt, new Date()),
  )).limit(1);
  if (!session || (open && session.status !== "open")) throw new SpartanAiToolError("SESSION_CLOSED", 410, "The patient review session expired or closed. Start a new review.");
  return session;
}

export function registerPatientReviewRoutes(app: Express) {
  const access = [requireElite, requireClinicalUse, requireClinicalReview, coveredReviewer];

  app.post(SESSION_PATH, ...access, standardAiLimit, async (request, response) => {
    try {
      await assertEphemeralBucketConfiguration();
      const authed = request as AuthedRequest;
      const { organizationId, memberId } = owner(authed);
      const snapshotId = String(request.body?.coverageSnapshotId ?? "");
      if (!UUID.test(snapshotId)) throw new SpartanAiToolError("COVERAGE_REQUIRED", 400, "Select a current CMS coverage policy before reviewing a record.");
      const [policy] = await db.select().from(coverageSnapshots).where(eq(coverageSnapshots.id, snapshotId)).limit(1);
      if (!isCurrentCmsPolicy(policy)) {
        throw new SpartanAiToolError("COVERAGE_REQUIRED", 400, "A current CMS MCD policy is required; the educational baseline cannot be used for patient review.");
      }
      const [session] = await db.insert(clinicalEphemeralSessions).values({ organizationId, createdByMemberId: memberId,
        coverageSnapshotId: policy.id, expiresAt: new Date(Date.now() + EPHEMERAL_CLINICAL_TTL_MS) }).returning();
      await audit(authed, "clinical.patient_review.created", session.id, { coverageSnapshotId: policy.id });
      response.status(201).json({ sessionId: session.id, expiresAt: session.expiresAt });
    } catch (error) { fail(response, error); }
  });

  app.post(`${SESSION_PATH}/:sessionId/documents`, ...access, standardAiLimit,
    express.raw({ type: () => true, limit: "25mb" }), async (request, response) => {
      let objectKey: string | undefined;
      try {
        const authed = request as AuthedRequest;
        const session = await ownedSession(authed);
        const bytes = request.body;
        const contentType = String(request.headers["content-type"] ?? "").split(";")[0].toLowerCase();
        if (!Buffer.isBuffer(bytes)) throw new SpartanAiToolError("INVALID_FILE", 400, "Choose a PDF, DOCX, PNG, JPEG, or TXT file.");
        validateClinicalUpload(contentType, bytes.length);
        assertClinicalFileSignature(contentType, bytes);
        const { organizationId, memberId } = owner(authed);
        objectKey = createEphemeralClinicalObjectKey(organizationId, session.id);
        const documentId = randomUUID();
        let uploadError: unknown;
        await db.transaction(async (tx) => {
          const [locked] = await tx.select().from(clinicalEphemeralSessions).where(and(
            eq(clinicalEphemeralSessions.id, session.id), eq(clinicalEphemeralSessions.organizationId, organizationId),
            eq(clinicalEphemeralSessions.createdByMemberId, memberId), gt(clinicalEphemeralSessions.expiresAt, new Date()),
          )).for("update");
          if (locked?.status !== "open") throw new SpartanAiToolError("SESSION_CLOSED", 410, "The review session is closed.");
          const docs = await tx.select({ id: clinicalEphemeralObjects.id }).from(clinicalEphemeralObjects)
            .where(eq(clinicalEphemeralObjects.sessionId, session.id));
          if (docs.length >= MAX_FILES) throw new SpartanAiToolError("SESSION_FILE_LIMIT", 400, "Use at most five files per review.");
          await tx.insert(clinicalEphemeralObjects).values({ id: documentId, sessionId: session.id, organizationId,
            objectKey: objectKey!, contentType, sizeBytes: bytes.length, expiresAt: session.expiresAt });
          try {
            await saveEphemeralClinicalObject(objectKey!, bytes, contentType);
            if (await scanEphemeralClinicalObject(objectKey!) !== "safe") throw new SpartanAiToolError("DOCUMENT_REJECTED", 400, "The document did not pass the safety scan.");
            await tx.update(clinicalEphemeralObjects).set({ scanStatus: "safe" }).where(eq(clinicalEphemeralObjects.id, documentId));
          } catch (caught) {
            uploadError = caught;
            try {
              await deleteEphemeralClinicalObject(objectKey!);
              await tx.delete(clinicalEphemeralObjects).where(eq(clinicalEphemeralObjects.id, documentId));
            } catch {
              // Keep the pending row and object key committed so the expiry
              // sweep can retry deletion. Never lose track of a failed purge.
              uploadError = new SpartanAiToolError("CLEANUP_PENDING", 503, "Upload stopped; secure file deletion is being retried.");
            }
          }
        });
        if (uploadError) throw uploadError;
        await audit(authed, "clinical.patient_review.document_ready", session.id, { documentId, contentType, sizeBytes: bytes.length }).catch(() => undefined);
        response.status(201).json({ documentId, scanStatus: "safe" });
      } catch (error) {
        // The transaction either removed the file or retained a pending row
        // for the sweeper. A second delete attempt is safe.
        if (objectKey) await deleteEphemeralClinicalObject(objectKey).catch(() => undefined);
        fail(response, error);
      }
    });

  app.post(`${SESSION_PATH}/:sessionId/finalize`, ...access, heavyAiLimit, globalDailyAiCap, async (request, response) => {
    const authed = request as AuthedRequest;
    let sessionId: string | undefined;
    try {
      if (request.body?.confirmedHumanReview !== true) throw new SpartanAiToolError("REVIEW_CONFIRMATION_REQUIRED", 400, "Confirm that a licensed clinician will review the result.");
      const session = await ownedSession(authed);
      sessionId = session.id;
      const { organizationId, memberId } = owner(authed);
      const docs = await db.transaction(async (tx) => {
        const [locked] = await tx.select().from(clinicalEphemeralSessions).where(and(eq(clinicalEphemeralSessions.id, session.id), eq(clinicalEphemeralSessions.organizationId, organizationId), eq(clinicalEphemeralSessions.createdByMemberId, memberId))).for("update");
        if (locked?.status !== "open") throw new SpartanAiToolError("SESSION_CLOSED", 410, "This session has already been processed.");
        const files = await tx.select().from(clinicalEphemeralObjects).where(and(eq(clinicalEphemeralObjects.sessionId, session.id), eq(clinicalEphemeralObjects.organizationId, organizationId)));
        if (!files.length || files.some((file) => file.scanStatus !== "safe")) throw new SpartanAiToolError("DOCUMENTS_NOT_READY", 409, "Upload and scan at least one document before review.");
        await tx.update(clinicalEphemeralSessions).set({ status: "processing", updatedAt: new Date() }).where(eq(clinicalEphemeralSessions.id, session.id));
        return files;
      });
      const [policy] = await db.select().from(coverageSnapshots).where(eq(coverageSnapshots.id, session.coverageSnapshotId!)).limit(1);
      if (!isCurrentCmsPolicy(policy)) throw new SpartanAiToolError("COVERAGE_REQUIRED", 409, "The selected CMS policy is no longer current.");
      if (Buffer.byteLength(JSON.stringify(policy.payload ?? {})) > 60_000) throw new SpartanAiToolError("POLICY_TOO_LARGE", 413, "Select a narrower CMS policy before reviewing this record.");
      const sections: string[] = [];
      for (const [index, document] of docs.entries()) {
        const bytes = await downloadEphemeralClinicalObject(document.objectKey);
        const text = await extractPatientDocument(document.contentType, bytes);
        sections.push(`Record ${index + 1}:\n${text}`);
      }
      const recordText = sections.join("\n\n");
      if (!recordText.trim() || Buffer.byteLength(recordText) > MAX_RECORD_BYTES) throw new SpartanAiToolError("RECORD_TOO_LARGE", 413, "The extracted text is empty or too long. Use fewer pages or split the review.");
      const tool = getSpartanAiTool("medical-record-lcd-verifier");
      if (!tool) throw new SpartanAiToolError("TOOL_UNAVAILABLE", 503, "The medical record review tool is unavailable.");
      const result = await runSpartanAiTool(tool.id, { recordText, lcdEvidence: [{ source: policy.source,
        documentId: policy.documentId, version: policy.version, contentHash: policy.contentHash,
        sourceUrl: policy.sourceUrl, effectiveAt: policy.effectiveAt!.toISOString(), payload: policy.payload }] });
      if (findPotentialIdentifiers(result.output).length) throw new SpartanAiToolError("OUTPUT_CONTAINS_IDENTIFIERS", 502, "The result contained possible identifiers and was discarded.");
      // A cancel request can arrive while the model is running. Discard that result.
      const [current] = await db.select({ status: clinicalEphemeralSessions.status }).from(clinicalEphemeralSessions).where(eq(clinicalEphemeralSessions.id, session.id)).limit(1);
      if (current?.status !== "processing") throw new SpartanAiToolError("SESSION_CLOSED", 410, "The review was cancelled.");
      const objectCount = await purgeEphemeralClinicalSession(organizationId, session.id);
      await audit(authed, "clinical.patient_review.completed", session.id, { objectCount, deletionVerified: true, coverageSnapshotId: policy.id, retainedClinicalContent: false }).catch(() => undefined);
      response.json({ result: { output: result.output, coveragePolicy: { documentId: policy.documentId, version: policy.version,
        sourceUrl: policy.sourceUrl, effectiveAt: policy.effectiveAt }, watermark: "Draft clinical evidence only. A hospice physician and compliance reviewer must verify the record, diagnoses, coverage, medications and plan of care. No autonomous eligibility, coding or prescribing decision.", retention: "one-time" } });
    } catch (error) {
      if (sessionId) {
        try { await purgeEphemeralClinicalSession(owner(authed).organizationId, sessionId); }
        catch { fail(response, new SpartanAiToolError("CLEANUP_PENDING", 503, "The review was discarded and file cleanup is being retried.")); return; }
      }
      fail(response, error);
    }
  });

  app.delete(`${SESSION_PATH}/:sessionId`, ...access, async (request, response) => {
    try {
      const authed = request as AuthedRequest;
      const session = await ownedSession(authed, false);
      const count = await purgeEphemeralClinicalSession(owner(authed).organizationId, session.id);
      await audit(authed, "clinical.patient_review.cancelled", session.id, { objectCount: count, deletionVerified: true }).catch(() => undefined);
      response.status(204).send();
    } catch (error) { fail(response, error); }
  });
}
