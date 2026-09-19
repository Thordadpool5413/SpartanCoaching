/**
 * Public operating standards for marketing trust surfaces.
 * These are not testimonials or measured claims. Approved client proof must
 * arrive through the explicit publicApproval boundary on the proof page.
 */
export type ProofItem = {
  id: string;
  quote: string;
  role: string;
  context: string;
  /** Short outcome line — not a fabricated metric */
  outcome: string;
};

export const PROOF_PACK: ProofItem[] = [
  {
    id: "director-shared-language",
    quote:
      "Give leaders and representatives one shared language for hard conversations—not another binder that stays closed.",
    role: "Team coaching standard",
    context: "Representative operating goal",
    outcome: "A consistent language leaders can coach in the field",
  },
  {
    id: "liaison-tuesday",
    quote:
      "Start the week knowing which account matters first and which response to practice before the next visit.",
    role: "Field execution standard",
    context: "Representative operating goal",
    outcome: "A clear weekly plan and prepared objection response",
  },
  {
    id: "vp-system",
    quote:
      "Use a hospice-specific system directors can coach from instead of adapting generic sales training after the fact.",
    role: "Leadership system standard",
    context: "Representative operating goal",
    outcome: "One practical system for representatives and leaders",
  },
];

/** Process/tenure stats only — no ranking or headcount claims without Nick approval. */
export const PROOF_STATS: { label: string; value: string }[] = [
  { value: "Field", label: "Built for SNFs & MD offices" },
  { value: "Ethics", label: "No PHI in Hospice Sales Pro tools" },
];
