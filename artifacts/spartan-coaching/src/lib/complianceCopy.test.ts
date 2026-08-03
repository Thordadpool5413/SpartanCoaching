import { describe, expect, it } from "vitest";
import { CLINICAL_VAULT, FIELD_KIT_PHI, PUBLIC_CLAIM_SAFE } from "./complianceCopy";

describe("compliance copy contract", () => {
  it("membership PHI strings forbid PHI entry", () => {
    expect(FIELD_KIT_PHI.short.toLowerCase()).toContain("phi");
    expect(FIELD_KIT_PHI.banner.toLowerCase()).toContain("do not enter phi");
    expect(FIELD_KIT_PHI.banner.toLowerCase()).toMatch(/coaching aid|not clinical/);
  });

  it("clinical vault is educational decision support, not a determination", () => {
    const blob = `${CLINICAL_VAULT.banner} ${CLINICAL_VAULT.hubIntro} ${CLINICAL_VAULT.runWatermark}`.toLowerCase();
    expect(blob).toContain("educational decision support");
    expect(blob).toMatch(/not a diagnosis|not diagnosis/);
    expect(blob).toContain("coverage");
    expect(blob).toMatch(/authorized|authorization/);
  });

  it("public claim-safe pack avoids ranking language", () => {
    const blob = Object.values(PUBLIC_CLAIM_SAFE).join(" ").toLowerCase();
    expect(blob).not.toMatch(/rank at the top/);
    expect(blob).not.toMatch(/500\+/);
    expect(blob).toContain("no phi");
  });
});
