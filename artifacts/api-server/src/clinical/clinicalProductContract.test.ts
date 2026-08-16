import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const routes = fs.readFileSync(path.resolve(import.meta.dirname, "../routes/aiToolRoutes.ts"), "utf8");
const access = fs.readFileSync(path.resolve(import.meta.dirname, "access.ts"), "utf8");
const runtime = fs.readFileSync(
  path.resolve(import.meta.dirname, "../../../../lib/spartan-ai-tools/src/clinical-runtime.ts"),
  "utf8",
);
const native = fs.readFileSync(
  path.resolve(import.meta.dirname, "../../../spartan-coaching-mobile/components/ai-tool-screen.tsx"),
  "utf8",
);

describe("deidentified Elite clinical product contract", () => {
  it("cannot enable patient PHI through environment configuration", () => {
    expect(access).toContain('return "deidentified"');
    expect(access).toContain("return false");
    expect(runtime).toContain('return "deidentified"');
    expect(runtime).toContain("return false");
  });

  it("rejects legacy patient data APIs and retains cleanup", () => {
    expect(routes).toContain("PATIENT_DATA_NOT_ACCEPTED");
    expect(routes).toContain("rejectPatientData");
    expect(routes).toContain('app.delete(\n    "/api/clinical/ephemeral-sessions/:sessionId"');
    expect(routes).toContain('app.delete(\n    "/api/clinical/cases/:caseId"');
  });

  it("removes patient document capture from the iOS experience", () => {
    expect(native).not.toContain("expo-document-picker");
    expect(native).not.toContain("expo-image-picker");
    expect(native).not.toContain("/api/clinical/ephemeral-sessions");
    expect(native).toContain("contains no patient documents");
    expect(native).toContain("medical director, compliance, or both");
  });
});
