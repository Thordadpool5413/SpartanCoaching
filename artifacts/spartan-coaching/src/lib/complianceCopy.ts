/**
 * Canonical compliance and PHI language for membership tool surfaces.
 * Keep web + mobile wording aligned; change here first, then mirror mobile.
 *
 * Nick should approve material public claim changes (see docs/content-compliance.md).
 */

/** Consumer membership / no-PHI tools */
export const FIELD_KIT_PHI = {
  short: "Do not enter PHI",
  banner:
    "Do not enter PHI. Coaching aid only — not clinical, legal, or billing advice.",
  footer: "Do not enter PHI · Coaching aid only",
  result:
    "Educational coaching aid only. No PHI. Adapt to your voice and the relationship.",
} as const;

/** Clinical vault / PHI-capable tools */
export const CLINICAL_VAULT = {
  short: "Educational decision support only",
  banner:
    "PHI-capable clinical workspace. Use only with organization authorization and qualified clinical review. Results are educational decision support — not a diagnosis, prognosis, coverage determination, or autonomous admission decision.",
  runWatermark:
    "Educational decision support only. Qualified clinical review required. Not retained.",
  hubIntro:
    "These workflows may process clinical content under authorized access only. They are not consumer Hospice Sales Pro tools. Results are educational decision support — not diagnosis, coverage determination, or autonomous admission decisions. Runs are ephemeral when live; use only when your role and organization permit.",
  chips: [
    "Authorized roles only",
    "Ephemeral by design",
    "BAA-gated PHI mode",
    "No sales chrome inside tools",
  ] as const,
} as const;

/**
 * Public proof stats — avoid unverifiable headcount/ranking claims.
 * Prefer process and tenure over fabricated performance rankings.
 */
export const PUBLIC_CLAIM_SAFE = {
  yearsHospice: "12+ years hospice-specific",
  fieldBuilt: "Built for SNFs & MD offices",
  ethics: "No PHI in Hospice Sales Pro tools",
  /** Prefer this over “reps who rank at the top” */
  fieldCraft: "Field-tested coaching, not generic sales AI",
  prepareNotWing: "Prepared conversations — not winging Tuesday",
} as const;
