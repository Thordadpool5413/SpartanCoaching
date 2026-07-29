import { Storage } from "@google-cloud/storage";
import { randomUUID } from "node:crypto";

const allowedContentTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "text/plain",
]);

function bucketName(): string {
  const value = process.env.CLINICAL_GCS_BUCKET?.trim();
  if (!value) throw new Error("CLINICAL_GCS_BUCKET is required");
  return value;
}

function ephemeralBucketName(): string {
  const configured = process.env.CLINICAL_EPHEMERAL_GCS_BUCKET?.trim();
  if (configured) return configured;
  if (process.env.HIPAA_PHI_ENABLED === "true") {
    throw new Error(
      "CLINICAL_EPHEMERAL_GCS_BUCKET is required when PHI processing is enabled",
    );
  }
  const fallback = process.env.CLINICAL_GCS_BUCKET?.trim();
  if (!fallback) throw new Error("CLINICAL_EPHEMERAL_GCS_BUCKET is required");
  return fallback;
}

const storage = new Storage();

export function validateClinicalUpload(
  contentType: string,
  sizeBytes: number,
): void {
  if (!allowedContentTypes.has(contentType)) {
    throw new Error("Only PDF, JPEG, PNG, and plain-text files are supported");
  }
  if (
    !Number.isInteger(sizeBytes) ||
    sizeBytes < 1 ||
    sizeBytes > 25 * 1024 * 1024
  ) {
    throw new Error("Each clinical document must be between 1 byte and 25 MB");
  }
}

export function createClinicalObjectKey(
  organizationId: number,
  caseId: string,
): string {
  return `organizations/${organizationId}/clinical-cases/${caseId}/${randomUUID()}`;
}

export function createEphemeralClinicalObjectKey(
  organizationId: number,
  sessionId: string,
): string {
  return `organizations/${organizationId}/clinical-ephemeral/${sessionId}/${randomUUID()}`;
}

export async function createClinicalUploadUrl(
  objectKey: string,
  contentType: string,
): Promise<string> {
  const [url] = await storage
    .bucket(bucketName())
    .file(objectKey)
    .getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 5 * 60 * 1000,
      contentType,
    });
  return url;
}

export async function createEphemeralClinicalUploadUrl(
  objectKey: string,
  contentType: string,
): Promise<string> {
  const [url] = await storage
    .bucket(ephemeralBucketName())
    .file(objectKey)
    .getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 5 * 60 * 1000,
      contentType,
    });
  return url;
}

export async function createClinicalDownloadUrl(
  objectKey: string,
): Promise<string> {
  const [url] = await storage
    .bucket(bucketName())
    .file(objectKey)
    .getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + 5 * 60 * 1000,
      responseDisposition: "attachment",
      responseType: "application/octet-stream",
    });
  return url;
}

export async function inspectClinicalObject(objectKey: string) {
  const file = storage.bucket(bucketName()).file(objectKey);
  const [exists] = await file.exists();
  if (!exists) throw new Error("Uploaded clinical document was not found");
  const [metadata] = await file.getMetadata();
  const sizeBytes = Number(metadata.size ?? 0);
  const contentType = String(
    metadata.contentType ?? "application/octet-stream",
  );
  validateClinicalUpload(contentType, sizeBytes);
  return { file, sizeBytes, contentType };
}

export async function deleteClinicalObject(objectKey: string): Promise<void> {
  await storage
    .bucket(bucketName())
    .file(objectKey)
    .delete({ ignoreNotFound: true });
}

export async function deleteEphemeralClinicalObject(
  objectKey: string,
): Promise<void> {
  const file = storage.bucket(ephemeralBucketName()).file(objectKey);
  await file.delete({ ignoreNotFound: true });
  const [exists] = await file.exists();
  if (exists) {
    throw new Error("Ephemeral clinical object deletion could not be verified");
  }
}

export async function downloadClinicalObject(
  objectKey: string,
): Promise<Buffer> {
  const [buffer] = await storage
    .bucket(bucketName())
    .file(objectKey)
    .download();
  return buffer;
}

export async function inspectEphemeralClinicalObject(objectKey: string) {
  const file = storage.bucket(ephemeralBucketName()).file(objectKey);
  const [exists] = await file.exists();
  if (!exists) throw new Error("Uploaded ephemeral document was not found");
  const [metadata] = await file.getMetadata();
  const sizeBytes = Number(metadata.size ?? 0);
  const contentType = String(
    metadata.contentType ?? "application/octet-stream",
  );
  validateClinicalUpload(contentType, sizeBytes);
  return { sizeBytes, contentType };
}

export async function downloadEphemeralClinicalObject(
  objectKey: string,
): Promise<Buffer> {
  const [buffer] = await storage
    .bucket(ephemeralBucketName())
    .file(objectKey)
    .download();
  return buffer;
}

export async function scanClinicalObject(
  objectKey: string,
): Promise<"safe" | "rejected"> {
  return scanObject(bucketName(), objectKey);
}

export async function scanEphemeralClinicalObject(
  objectKey: string,
): Promise<"safe" | "rejected"> {
  return scanObject(ephemeralBucketName(), objectKey);
}

async function scanObject(
  selectedBucket: string,
  objectKey: string,
): Promise<"safe" | "rejected"> {
  const scannerUrl = process.env.CLINICAL_FILE_SCANNER_URL?.trim();
  if (!scannerUrl) {
    if (process.env.HIPAA_PHI_ENABLED === "true") {
      throw new Error(
        "CLINICAL_FILE_SCANNER_URL is required when PHI processing is enabled",
      );
    }
    return "safe";
  }
  const response = await fetch(scannerUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.CLINICAL_FILE_SCANNER_TOKEN
        ? { Authorization: `Bearer ${process.env.CLINICAL_FILE_SCANNER_TOKEN}` }
        : {}),
    },
    body: JSON.stringify({ bucket: selectedBucket, objectKey }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) throw new Error("Clinical file scanner was unavailable");
  const result = (await response.json()) as { safe?: boolean };
  return result.safe === true ? "safe" : "rejected";
}

let bucketPolicyCheckedAt = 0;

export async function assertEphemeralBucketConfiguration(): Promise<void> {
  if (process.env.HIPAA_PHI_ENABLED !== "true") return;
  if (Date.now() - bucketPolicyCheckedAt < 5 * 60 * 1000) return;
  const [metadata] = await storage.bucket(ephemeralBucketName()).getMetadata();
  if (metadata.versioning?.enabled === true) {
    throw new Error("Ephemeral clinical bucket must have versioning disabled");
  }
  if (
    metadata.retentionPolicy?.isLocked ||
    Number(metadata.retentionPolicy?.retentionPeriod ?? 0) > 0
  ) {
    throw new Error(
      "Ephemeral clinical bucket must not have a retention policy",
    );
  }
  if (
    metadata.iamConfiguration?.publicAccessPrevention !== "enforced" ||
    metadata.iamConfiguration?.uniformBucketLevelAccess?.enabled !== true
  ) {
    throw new Error(
      "Ephemeral clinical bucket must enforce public-access prevention and uniform bucket-level access",
    );
  }
  bucketPolicyCheckedAt = Date.now();
}
