import { describe, expect, it } from "vitest";
import { isCurrentCmsPolicy } from "./patientPolicy";

describe("patient review CMS policy selection", () => {
  const today = new Date("2026-09-29T00:00:00.000Z");
  it("allows current MCD only", () => {
    expect(isCurrentCmsPolicy({ source: "CMS_MCD", effectiveAt: new Date("2026-01-01"), retiredAt: null }, today)).toBe(true);
    expect(isCurrentCmsPolicy({ source: "EDUCATIONAL_BASELINE", effectiveAt: new Date("2024-01-01"), retiredAt: null }, today)).toBe(false);
    expect(isCurrentCmsPolicy({ source: "CMS_MCD", effectiveAt: new Date("2027-01-01"), retiredAt: null }, today)).toBe(false);
    expect(isCurrentCmsPolicy({ source: "CMS_MCD", effectiveAt: new Date("2026-01-01"), retiredAt: new Date("2026-09-01") }, today)).toBe(false);
    expect(isCurrentCmsPolicy({ source: "CMS_MCD", effectiveAt: null, retiredAt: null }, today)).toBe(false);
  });
});
