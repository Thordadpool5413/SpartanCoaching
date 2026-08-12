import { describe, it, expect } from "vitest";
import {
  UNCERTAINTY_BOUNDARIES_VERSION,
  assessUncertainty,
  isHighRiskClinicalQuestion,
  isPatientEligibilityDeterminationRequest,
  postflightUncertainty,
  preflightUncertainty,
} from "./uncertaintyBoundaries";

describe("uncertaintyBoundaries version", () => {
  it("is versioned", () => {
    expect(UNCERTAINTY_BOUNDARIES_VERSION).toMatch(/^uncertainty-boundaries-v\d+/);
  });
});

describe("eligibility determination block (sales inputs)", () => {
  it("detects patient-specific eligibility requests", () => {
    expect(
      isPatientEligibilityDeterminationRequest(
        "Is this patient eligible for hospice?",
      ),
    ).toBe(true);
    expect(
      isPatientEligibilityDeterminationRequest(
        "Does the patient qualify based on decline?",
      ),
    ).toBe(true);
    expect(
      isPatientEligibilityDeterminationRequest(
        "How do I respond when a family says they are not ready?",
      ),
    ).toBe(false);
  });

  it("blocks model generation and never issues a determination", () => {
    const a = assessUncertainty({
      question: "Is this patient eligible for hospice?",
      workflow: "research",
    });
    expect(a.eligibilityDeterminationBlocked).toBe(true);
    expect(a.blockModelGeneration).toBe(true);
    expect(a.primaryState).toBe("clinical_judgment_required");
    expect(a.escalation.escalateTo).toBe("physician");
    expect(a.escalation.specificAction).toMatch(/medical director|physician/i);
    expect(a.safeResponse).toMatch(/can't determine eligibility|clinical decision/i);
    expect(a.safeResponse).not.toMatch(/this patient is (clearly )?eligible/i);
    expect(a.answerConfidence).toBeLessThan(0.3);
  });

  it("preflight returns assessment for eligibility asks", () => {
    const blocked = preflightUncertainty("Can you tell me if the patient is eligible?");
    expect(blocked).not.toBeNull();
    expect(blocked!.blockModelGeneration).toBe(true);

    const ok = preflightUncertainty(
      "A family says they are not ready for hospice. How should I respond?",
    );
    expect(ok).toBeNull();
  });
});

describe("high-risk clinical questions", () => {
  it("flags prognosis and treatment-stop questions", () => {
    expect(isHighRiskClinicalQuestion("How long will they live?")).toBe(true);
    expect(
      isHighRiskClinicalQuestion("Should we stop all treatment and meds?"),
    ).toBe(true);
    expect(
      isHighRiskClinicalQuestion("How do I open a first visit at a SNF?"),
    ).toBe(false);
  });

  it("escalates high-risk clinical to clinical judgment", () => {
    const a = assessUncertainty({
      question: "What is the prognosis for this patient?",
      workflow: "clinical_education",
    });
    expect(a.states).toContain("clinical_judgment_required");
    expect(a.blockModelGeneration).toBe(true);
    expect(a.escalation.userFacingMessage.length).toBeGreaterThan(20);
  });
});

describe("conflicting sources", () => {
  it("requires source verification and unknown when sources conflict", () => {
    const a = assessUncertainty({
      question: "Does commercial insurance always cover continuous care?",
      sources: [
        {
          id: "a",
          title: "Source A",
          claimSummary: "Yes covers continuous care",
          isPayerSpecific: true,
        },
        {
          id: "b",
          title: "Source B",
          claimSummary: "No does not cover continuous care",
          isPayerSpecific: true,
          conflictsWithIds: ["a"],
        },
      ],
      workflow: "research",
    });
    expect(a.signals).toContain("CONFLICTING_SOURCES");
    expect(a.states).toContain("current_source_verification_required");
    expect(a.states).toContain("unknown");
    expect(a.escalation.required).toBe(true);
    expect(a.safeResponse).toMatch(/don'?t|verify|confirm/i);
  });
});

describe("incomplete / ambiguous context", () => {
  it("marks insufficient information for thin questions", () => {
    const a = assessUncertainty({
      question: "help",
      workflow: "objection",
    });
    expect(a.primaryState).toBe("insufficient_information");
    expect(a.escalation.escalateTo).toBe("user_context");
    expect(a.escalation.specificAction).toMatch(/clarifying/i);
    expect(a.blockModelGeneration).toBe(false);
  });

  it("respects incompleteAccountContext flag", () => {
    const a = assessUncertainty({
      question: "Build a full account plan for my top target.",
      flags: { incompleteAccountContext: true },
      workflow: "account_guidance",
    });
    expect(a.states).toContain("insufficient_information");
  });
});

describe("payer and provider policy variation", () => {
  it("surfaces payer variation without claiming a plan answer", () => {
    const a = assessUncertainty({
      question: "Does their Medicare Advantage plan cover respite the same way?",
      workflow: "research",
    });
    expect(a.states).toContain("payer_variation");
    expect(a.escalation.userFacingMessage).toMatch(/vary|payer|plan/i);
  });

  it("surfaces provider policy variation", () => {
    const a = assessUncertainty({
      question: "Do we offer continuous care in that zip code per our agency policy?",
      workflow: "account_guidance",
    });
    expect(a.states).toContain("provider_policy_variation");
    expect(a.escalation.escalateTo).toBe("provider_admin");
  });
});

describe("outdated provider information", () => {
  it("requires verification when provider policy source is stale", () => {
    const now = new Date("2026-08-11T12:00:00.000Z");
    const a = assessUncertainty({
      question: "What is our current admission hours policy?",
      sources: [
        {
          id: "pol-1",
          title: "Admission hours",
          isProviderPolicy: true,
          asOf: "2024-01-01",
        },
      ],
      now,
      workflow: "account_guidance",
    });
    expect(a.signals).toContain("OUTDATED_PROVIDER_INFORMATION");
    expect(a.states).toContain("current_source_verification_required");
    expect(a.escalation.required).toBe(true);
  });

  it("honors providerInfoOutdated flag", () => {
    const a = assessUncertainty({
      question: "Confirm our service list for oncology.",
      flags: { providerInfoOutdated: true },
    });
    expect(a.states).toContain("current_source_verification_required");
  });
});

describe("compliance review", () => {
  it("blocks improvisation on inducement-style questions", () => {
    const a = assessUncertainty({
      question: "Can I pay for referrals with gift cards under anti-kickback?",
      workflow: "research",
    });
    expect(a.primaryState).toBe("compliance_review_required");
    expect(a.blockModelGeneration).toBe(true);
    expect(a.escalation.escalateTo).toBe("compliance");
  });
});

describe("unknown without sounding broken", () => {
  it("uses calm unknown messaging when forced unknown via conflict", () => {
    const a = assessUncertainty({
      question: "What is the official national rule for this rare commercial rider?",
      flags: { sourcesConflict: true },
    });
    expect(a.states).toContain("unknown");
    expect(a.escalation.userFacingMessage).not.toMatch(/error|crash|failed|500/i);
    expect(a.escalation.userFacingMessage).toMatch(/don'?t know|confidence|verify/i);
    expect(a.escalation.specificAction.length).toBeGreaterThan(30);
  });
});

describe("sufficient coaching path", () => {
  it("allows normal objection coaching without block", () => {
    const a = assessUncertainty({
      question:
        "A family says they are not ready for hospice. Help me with an empathetic response and a next step.",
      workflow: "objection",
    });
    expect(a.primaryState).toBe("sufficient");
    expect(a.blockModelGeneration).toBe(false);
    expect(a.eligibilityDeterminationBlocked).toBe(false);
    expect(a.escalation.required).toBe(false);
  });
});

describe("postflight overclaim detection", () => {
  it("flags model output that declares eligibility", () => {
    const a = postflightUncertainty(
      "Tell me about general hospice criteria.",
      "This patient is clearly eligible for hospice based on what you said.",
    );
    expect(a.signals).toContain("OUTPUT_ELIGIBILITY_OVERCLAIM");
    expect(a.states).toContain("clinical_judgment_required");
  });
});
