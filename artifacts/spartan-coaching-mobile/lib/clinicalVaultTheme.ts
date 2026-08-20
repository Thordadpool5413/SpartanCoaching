/**
 * Clinical vault visual language — calm instrument, not Hospice Sales Pro marketing.
 * Distinct from Spartan red primary used on consumer tools.
 */
export const VAULT = {
  /** Restrained amber (instrument, not CTA red) */
  accent: "#B45309",
  accentSoft: "#D97706",
  border: "rgba(180, 83, 9, 0.32)",
  borderSubtle: "rgba(180, 83, 9, 0.18)",
  surface: "rgba(180, 83, 9, 0.07)",
  surfaceStrong: "rgba(180, 83, 9, 0.12)",
  text: "#92400E",
  /** Deep slate overlay for privacy lock */
  privacyBg: "#0c1018",
  privacyFg: "#e8edf5",
  privacyMuted: "rgba(232, 237, 245, 0.72)",
} as const;

export const VAULT_COPY = {
  hubTitle: "Elite clinical guidance",
  hubBody:
    "Deidentified information only. Suggested educational guidance is never a diagnosis, coverage determination, eligibility decision, or admission decision. Medical director, compliance, or both must approve every output.",
  chips: [
    "Elite access",
    "Deidentified only",
    "One time results",
    "Approval required",
  ] as const,
  toolBannerTitle: "Clinical guidance · deidentified only",
  toolBannerBody:
    "Suggested education only. Do not enter patient information or upload patient documents. Medical director, compliance, or both must approve every output before use.",
  workspaceTitle: "Deidentified guidance workspace",
  emptyResult:
    "Complete the form and run for educational decision support output. Qualified clinical review remains required.",
  noHistory:
    "Clinical inputs and results are never added to history. Sharing uses the in-memory result only.",
  privacyTitle: "Clinical workspace protected",
  privacyBody: "Return to Spartan Coaching and reauthenticate to continue.",
  backLibrary: "Advanced library",
  badge: "Elite clinical",
} as const;
