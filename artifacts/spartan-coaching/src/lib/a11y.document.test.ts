import { describe, it, expect } from "vitest";
import {
  A11Y_VERSION,
  A11Y_SURFACES,
  A11Y_AUTOMATED_CHECKS,
  A11Y_MANUAL_VERIFICATION,
  validateDocumentStructure,
  preferStructuredSections,
  fieldErrorId,
  fieldErrorProps,
} from "./a11y";
import { markdownToSections } from "./downloadPdf";

describe("a11y document + form helpers (HSP-35)", () => {
  it("is versioned and covers all product surfaces", () => {
    expect(A11Y_VERSION).toMatch(/^a11y-contract-v\d+/);
    expect(A11Y_SURFACES).toEqual(
      expect.arrayContaining([
        "public_web",
        "paid_web_workspace",
        "ios_native",
        "generated_documents",
      ]),
    );
    expect(A11Y_AUTOMATED_CHECKS.length).toBeGreaterThanOrEqual(8);
    expect(A11Y_MANUAL_VERIFICATION.every((m) => m.steps.length > 0)).toBe(true);
  });

  it("validates structured PDF sections", () => {
    const ok = validateDocumentStructure("Weekly plan", [
      { heading: "Monday", body: "Visit St. Mary's — ask for referral path." },
      { heading: "Friday", body: "Review wins and set next week." },
    ]);
    expect(ok.ok).toBe(true);
    expect(ok.issues).toHaveLength(0);
  });

  it("flags empty or title-less documents", () => {
    expect(validateDocumentStructure("", [{ body: "x" }]).ok).toBe(false);
    expect(validateDocumentStructure("T", []).ok).toBe(false);
    expect(
      validateDocumentStructure("T", [{ heading: "Only heading", body: "" }]).ok,
    ).toBe(false);
  });

  it("markdownToSections yields structure that validates", () => {
    const md = `# Plan\n\n## Prep\n\nCall the DON.\n\n## Follow up\n\nSend thank-you email.`;
    const sections = preferStructuredSections(markdownToSections(md));
    const result = validateDocumentStructure("Plan", sections);
    expect(result.ok).toBe(true);
    expect(sections.some((s) => s.heading)).toBe(true);
  });

  it("field error association helpers", () => {
    expect(fieldErrorId("Email Address")).toBe("field-error-email-address");
    const props = fieldErrorProps("field-error-email", true);
    expect(props["aria-invalid"]).toBe(true);
    expect(props["aria-describedby"]).toBe("field-error-email");
    const clean = fieldErrorProps("field-error-email", false);
    expect(clean["aria-invalid"]).toBeUndefined();
  });
});
