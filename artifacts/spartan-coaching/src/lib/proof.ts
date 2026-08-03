/**
 * Curated proof pack for marketing trust surfaces.
 * Anonymized / role-based until named client permissions are available.
 * Nick should approve any public wording changes.
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
      "We finally had a shared language for hard conversations — not another binder no one opens.",
    role: "Director of Growth",
    context: "Multi-site hospice provider",
    outcome: "Team coaching language that stuck in the field",
  },
  {
    id: "liaison-tuesday",
    quote:
      "Tuesday stopped being chaos. I know who to call first and what to say when they push back.",
    role: "Hospice liaison",
    context: "Field sales · community territory",
    outcome: "Clear weekly plan and objection confidence",
  },
  {
    id: "vp-system",
    quote:
      "I needed a system my directors could coach from — not generic sales training dressed up for hospice.",
    role: "VP of Sales",
    context: "Regional hospice operator",
    outcome: "One playbook for reps and leaders",
  },
];

/** Process/tenure stats only — no ranking or headcount claims without Nick approval. */
export const PROOF_STATS: { label: string; value: string }[] = [
  { value: "12+", label: "Years hospice-specific" },
  { value: "Field", label: "Built for SNFs & MD offices" },
  { value: "Ethics", label: "No PHI in membership tools" },
];
