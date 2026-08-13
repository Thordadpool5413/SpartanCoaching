import { describe, expect, it } from "vitest";
import {
  CLINICAL_VAULT,
  CONSENT_COPY,
  FIELD_KIT_PHI,
  PRICING_FACTS,
  PUBLIC_CLAIM_SAFE,
  TRUST_CENTER_SECTIONS,
  TRUST_CENTER_INTRO,
} from "./complianceCopy";

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

  it("pricing facts stay consistent and verifiable", () => {
    expect(PRICING_FACTS.individualWeeklyUsd).toBe(14.99);
    expect(PRICING_FACTS.individualWeeklyLabel).toContain("14.99");
    expect(PRICING_FACTS.individualWeeklyShort).toContain("14.99");
    expect(PRICING_FACTS.heroLine).toContain("14.99");
    expect(PRICING_FACTS.consultingSeparate.toLowerCase()).toMatch(/separate/);
    expect(PRICING_FACTS.teamNote.toLowerCase()).toMatch(/contract|team/);
    // Avoid unverifiable “guaranteed ROI” style claims in pricing pack
    const blob = Object.values(PRICING_FACTS).join(" ").toLowerCase();
    expect(blob).not.toMatch(/guarantee|guaranteed|#1|rank/);
  });

  it("consent copy separates resource delivery from marketing opt-in", () => {
    expect(CONSENT_COPY.resourceDeliveryBody.toLowerCase()).toMatch(/resource/);
    expect(CONSENT_COPY.marketingOptInLabel.toLowerCase()).toMatch(/optional/);
    expect(CONSENT_COPY.marketingOptInHint.toLowerCase()).toMatch(/unchecked|optional/);
    expect(CONSENT_COPY.newsletterExplicit.toLowerCase()).toMatch(/separate/);
  });

  it("trust center covers required topics without unverifiable security seals", () => {
    const ids = TRUST_CENTER_SECTIONS.map((s) => s.id);
    for (const id of [
      "data-handling",
      "ai-use",
      "storage",
      "professional-boundaries",
      "provider-isolation",
      "content-review",
      "billing",
      "security",
      "support",
    ]) {
      expect(ids).toContain(id);
    }
    const blob = `${TRUST_CENTER_INTRO} ${TRUST_CENTER_SECTIONS.map((s) => s.body).join(" ")}`.toLowerCase();
    expect(blob).toContain("14.99");
    expect(blob).not.toMatch(/soc 2|hipaa certified|iso 27001/);
    expect(blob).toMatch(/not claim third-party|do not claim/);
  });
});
