/**
 * Clinical vault visual language — calm instrument, not Membership marketing.
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
  hubTitle: "Clinical access vault",
  hubBody:
    "Authorized roles only. Educational decision support — not diagnosis, coverage determination, or autonomous admission. Runs are ephemeral when live. Not consumer Membership tools.",
  chips: [
    "Authorized only",
    "Ephemeral",
    "BAA / PHI mode",
    "No sales chrome",
  ] as const,
  toolBannerTitle: "Clinical vault · authorized access only",
  toolBannerBody:
    "Educational decision support only. Qualified clinical review required. Not a diagnosis, coverage determination, or autonomous admission decision. Ephemeral when live.",
  workspaceTitle: "Ephemeral clinical workspace",
  emptyResult:
    "Complete the form and run for educational decision support output. Qualified clinical review remains required.",
  noHistory:
    "Clinical inputs and results are never added to history. Sharing uses the in-memory result only.",
  privacyTitle: "Clinical workspace protected",
  privacyBody: "Return to Spartan Coaching and reauthenticate to continue.",
  backLibrary: "Advanced library",
  badge: "Clinical vault",
} as const;
