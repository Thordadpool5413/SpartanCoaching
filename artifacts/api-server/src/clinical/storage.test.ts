import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createClinicalObjectKey,
  createEphemeralClinicalObjectKey,
  scanClinicalObject,
  scanEphemeralClinicalObject,
  validateClinicalUpload,
} from "./storage";

const gcs = vi.hoisted(() => ({
  metadata: {} as Record<string, unknown>,
  exists: vi.fn(async () => [false]),
  delete: vi.fn(async () => undefined),
  save: vi.fn(async () => undefined),
}));
vi.mock("@google-cloud/storage", () => ({
  Storage: class {
    bucket() {
      return {
        getMetadata: async () => [gcs.metadata],
        file: () => ({
          exists: gcs.exists,
          delete: gcs.delete,
          save: gcs.save,
        }),
      };
    }
  },
}));

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.CLINICAL_FILE_SCANNER_URL;
  delete process.env.CLINICAL_FILE_SCANNER_TOKEN;
  delete process.env.CLINICAL_GCS_BUCKET;
  delete process.env.CLINICAL_EPHEMERAL_GCS_BUCKET;
  delete process.env.HIPAA_PHI_ENABLED;
});

describe("clinical upload boundaries", () => {
  it.each([
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
    "text/plain",
  ])("accepts the supported content type %s", (contentType) => {
    expect(() => validateClinicalUpload(contentType, 1)).not.toThrow();
    expect(() =>
      validateClinicalUpload(contentType, 25 * 1024 * 1024),
    ).not.toThrow();
  });

  it.each([
    "application/octet-stream",
    "image/svg+xml",
    "text/html",
    "application/x-msdownload",
  ])("rejects the unsafe content type %s", (contentType) => {
    expect(() => validateClinicalUpload(contentType, 1024)).toThrow(
      /Only PDF, DOCX, JPEG, PNG, and plain-text/,
    );
  });

  it.each([0, -1, 1.5, 25 * 1024 * 1024 + 1])(
    "rejects an invalid byte size of %s",
    (sizeBytes) => {
      expect(() =>
        validateClinicalUpload("application/pdf", sizeBytes),
      ).toThrow(/between 1 byte and 25 MB/);
    },
  );

  it("creates an opaque object key inside the organization and case boundary", () => {
    const objectKey = createClinicalObjectKey(42, "case-id");
    expect(objectKey).toMatch(
      /^organizations\/42\/clinical-cases\/case-id\/[0-9a-f-]{36}$/,
    );
    expect(objectKey).not.toContain(".");
  });

  it("creates an opaque ephemeral key without a patient filename", () => {
    const objectKey = createEphemeralClinicalObjectKey(42, "session-id");
    expect(objectKey).toMatch(
      /^organizations\/42\/clinical-ephemeral\/session-id\/[0-9a-f-]{36}$/,
    );
    expect(objectKey).not.toContain("patient");
    expect(objectKey).not.toContain(".pdf");
  });
});

describe("clinical malware scanning", () => {
  it("fails closed when PHI is enabled without a configured scanner", async () => {
    process.env.HIPAA_PHI_ENABLED = "true";
    process.env.CLINICAL_GCS_BUCKET = "clinical-test-bucket";
    await expect(scanClinicalObject("opaque-key")).rejects.toThrow(
      /CLINICAL_FILE_SCANNER_URL is required/,
    );
  });

  it("fails closed for ephemeral files when PHI is enabled without a scanner", async () => {
    process.env.HIPAA_PHI_ENABLED = "true";
    process.env.CLINICAL_EPHEMERAL_GCS_BUCKET = "ephemeral-test-bucket";
    await expect(scanEphemeralClinicalObject("opaque-key")).rejects.toThrow(
      /CLINICAL_FILE_SCANNER_URL is required/,
    );
  });

  it("treats every scanner response except explicit safe=true as rejected", async () => {
    process.env.CLINICAL_GCS_BUCKET = "clinical-test-bucket";
    process.env.CLINICAL_FILE_SCANNER_URL =
      "https://scanner.example.invalid/scan";
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ safe: false }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
      ),
    );

    await expect(scanClinicalObject("opaque-key")).resolves.toBe("rejected");
  });

  it("does not expose scanner failures as a safe file", async () => {
    process.env.CLINICAL_GCS_BUCKET = "clinical-test-bucket";
    process.env.CLINICAL_FILE_SCANNER_URL =
      "https://scanner.example.invalid/scan";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("unavailable", { status: 503 })),
    );

    await expect(scanClinicalObject("opaque-key")).rejects.toThrow(
      /scanner was unavailable/,
    );
  });

  it("sends the dedicated ephemeral bucket to the scanner", async () => {
    process.env.CLINICAL_EPHEMERAL_GCS_BUCKET = "ephemeral-test-bucket";
    process.env.CLINICAL_FILE_SCANNER_URL =
      "https://scanner.example.invalid/scan";
    const scanner = vi.fn(
      async () =>
        new Response(JSON.stringify({ safe: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    );
    vi.stubGlobal("fetch", scanner);

    await expect(scanEphemeralClinicalObject("opaque-key")).resolves.toBe(
      "safe",
    );
    expect(scanner).toHaveBeenCalledWith(
      "https://scanner.example.invalid/scan",
      expect.objectContaining({
        body: JSON.stringify({
          bucket: "ephemeral-test-bucket",
          objectKey: "opaque-key",
        }),
      }),
    );
  });
});

describe("authenticated covered scanning", () => {
  it.each([undefined, "   "])(
    "fails closed before sending a PHI scan without an authenticated token",
    async (token) => {
      process.env.HIPAA_PHI_ENABLED = "true";
      process.env.CLINICAL_EPHEMERAL_GCS_BUCKET = "synthetic-ephemeral";
      process.env.CLINICAL_FILE_SCANNER_URL =
        "https://scanner.example.invalid/scan";
      if (token === undefined) delete process.env.CLINICAL_FILE_SCANNER_TOKEN;
      else process.env.CLINICAL_FILE_SCANNER_TOKEN = token;
      const fetch = vi.fn();
      vi.stubGlobal("fetch", fetch);
      await expect(scanEphemeralClinicalObject("opaque-key")).rejects.toThrow(
        /CLINICAL_FILE_SCANNER_TOKEN is required/,
      );
      expect(fetch).not.toHaveBeenCalled();
    },
  );
  it("sends authenticated scanner requests without document bytes or names", async () => {
    process.env.HIPAA_PHI_ENABLED = "true";
    process.env.CLINICAL_EPHEMERAL_GCS_BUCKET = "synthetic-ephemeral";
    process.env.CLINICAL_FILE_SCANNER_URL =
      "https://scanner.example.invalid/scan";
    process.env.CLINICAL_FILE_SCANNER_TOKEN = "synthetic-scan-token";
    const fetch = vi.fn(
      async () => new Response(JSON.stringify({ safe: true }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetch);
    expect(await scanEphemeralClinicalObject("opaque-key")).toBe("safe");
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer synthetic-scan-token",
        },
        body: JSON.stringify({
          bucket: "synthetic-ephemeral",
          objectKey: "opaque-key",
        }),
      }),
    );
  });
});

describe("ephemeral bucket and verified deletion", () => {
  const safe = {
    iamConfiguration: {
      publicAccessPrevention: "enforced",
      uniformBucketLevelAccess: { enabled: true },
    },
  };
  async function freshStorage(metadata: Record<string, unknown>) {
    vi.resetModules();
    process.env.HIPAA_PHI_ENABLED = "true";
    process.env.CLINICAL_EPHEMERAL_GCS_BUCKET = "synthetic-ephemeral";
    gcs.metadata = metadata;
    return import("./storage");
  }
  it.each([
    { ...safe, versioning: { enabled: true } },
    { ...safe, softDeletePolicy: { retentionDurationSeconds: "604800" } },
    { ...safe, retentionPolicy: { retentionPeriod: "1" } },
    { ...safe, retentionPolicy: { isLocked: true } },
    {
      iamConfiguration: {
        publicAccessPrevention: "inherited",
        uniformBucketLevelAccess: { enabled: true },
      },
    },
    {
      iamConfiguration: {
        publicAccessPrevention: "enforced",
        uniformBucketLevelAccess: { enabled: false },
      },
    },
    {},
  ])(
    "fails closed for incompatible ephemeral bucket policy %j",
    async (metadata) => {
      const storage = await freshStorage(metadata);
      await expect(
        storage.assertEphemeralBucketConfiguration(),
      ).rejects.toThrow(/Ephemeral clinical bucket/);
    },
  );
  it("permits only the compatible ephemeral policy and requires post-delete absence", async () => {
    const storage = await freshStorage(safe);
    await expect(
      storage.assertEphemeralBucketConfiguration(),
    ).resolves.toBeUndefined();
    gcs.exists.mockResolvedValue([true]);
    await expect(
      storage.deleteEphemeralClinicalObject("opaque-key"),
    ).rejects.toThrow(/deletion could not be verified/);
    gcs.exists.mockResolvedValue([false]);
    await expect(
      storage.deleteEphemeralClinicalObject("opaque-key"),
    ).resolves.toBeUndefined();
    expect(gcs.delete).toHaveBeenCalledWith({ ignoreNotFound: true });
  });
  it("stores uploads only through server GCS with no-store metadata", async () => {
    const storage = await freshStorage(safe);
    const bytes = Buffer.from("Synthetic fixture, no patient content");
    await storage.saveEphemeralClinicalObject(
      "opaque-key",
      bytes,
      "text/plain",
    );
    expect(gcs.save).toHaveBeenCalledWith(bytes, {
      resumable: false,
      contentType: "text/plain",
      metadata: { cacheControl: "no-store" },
    });
  });
});
