/**
 * Cross-surface accessibility contract (HSP-35) — web application + shared PDF rules.
 *
 * iOS-specific runtime lives under spartan-coaching-mobile (`iosProductQuality`).
 * This module is the web + document source of truth for automated contracts and
 * form/live-region helpers.
 */

export const A11Y_VERSION = "a11y-contract-v1";

/** Surfaces covered by this category. */
export const A11Y_SURFACES = [
  "public_web",
  "paid_web_workspace",
  "ios_native",
  "generated_documents",
] as const;

export type A11ySurface = (typeof A11Y_SURFACES)[number];

/**
 * Automated contract ids — each must be guarded by tests or runtime helpers.
 */
export const A11Y_AUTOMATED_CHECKS = [
  "skip_link_and_main",
  "focus_visible_css",
  "reduced_motion_css",
  "heading_hierarchy_chrome",
  "keyboard_nav_menus",
  "form_label_association",
  "live_region_results",
  "contrast_theme_contract",
  "pdf_structured_sections",
  "workspace_shell_landmarks",
] as const;

export type A11yAutomatedCheck = (typeof A11Y_AUTOMATED_CHECKS)[number];

/**
 * Manual verification checklist (device/browser) — not automated here.
 * Keep short; run per release when a11y-sensitive UI ships.
 */
export const A11Y_MANUAL_VERIFICATION = [
  {
    surface: "public_web" as const,
    steps: [
      "Keyboard-only: Tab through Home header, open a nav dropdown, Escape closes, Enter activates links.",
      "Zoom browser to 200% — primary CTAs remain usable without horizontal trap.",
      "Toggle prefers-reduced-motion — hero/marketing motion short-circuits.",
    ],
  },
  {
    surface: "paid_web_workspace" as const,
    steps: [
      "Sign in → skip link focuses #main-content; sidebar links show focus ring.",
      "Workspace search: type, arrow/click result, dialog closes.",
      "Generate a tool result — screen reader announces result region (aria-live).",
    ],
  },
  {
    surface: "ios_native" as const,
    steps: [
      "VoiceOver: swipe Tools list rows, EmptyState, primary Generate CTA.",
      "Dynamic Type largest accessibility sizes — ToolShell title wraps, CTA remains tappable ≥44pt.",
      "Reduce Motion on — button press scale and haptics suppressed.",
    ],
  },
  {
    surface: "generated_documents" as const,
    steps: [
      "Export Weekly Plan / tool PDF — title in document properties, section headings readable in order.",
      "Open in Preview/Acrobat: logical reading order matches on-screen sections.",
    ],
  },
] as const;

/** Associate a control with its error message id. */
export function fieldErrorProps(errorId: string, hasError: boolean) {
  return {
    "aria-invalid": hasError || undefined,
    "aria-describedby": hasError ? errorId : undefined,
  } as const;
}

export function fieldErrorId(fieldName: string): string {
  return `field-error-${fieldName.replace(/[^a-z0-9_-]/gi, "-").toLowerCase()}`;
}

/** PDF / document section structure used by export clients. */
export type AccessibleDocSection = {
  heading?: string;
  body: string;
};

export type DocStructureIssue = {
  code: "empty_document" | "empty_section" | "missing_title" | "heading_without_body";
  message: string;
  index?: number;
};

/**
 * Validate generated document sections for readable structure.
 * Does not tag PDFs as PDF/UA; ensures content model is structured.
 */
export function validateDocumentStructure(
  title: string,
  sections: AccessibleDocSection[],
): { ok: boolean; issues: DocStructureIssue[] } {
  const issues: DocStructureIssue[] = [];
  if (!title.trim()) {
    issues.push({ code: "missing_title", message: "Document title is required." });
  }
  if (!sections.length) {
    issues.push({ code: "empty_document", message: "Document has no sections." });
    return { ok: false, issues };
  }
  let hasReadableBody = false;
  sections.forEach((section, index) => {
    const body = (section.body || "").trim();
    const heading = (section.heading || "").trim();
    if (!body && !heading) {
      issues.push({
        code: "empty_section",
        message: `Section ${index + 1} is empty.`,
        index,
      });
    } else if (heading && !body) {
      issues.push({
        code: "heading_without_body",
        message: `Section “${heading}” has a heading but no body.`,
        index,
      });
    }
    if (body) hasReadableBody = true;
  });
  if (!hasReadableBody) {
    issues.push({
      code: "empty_document",
      message: "Document has no readable body text.",
    });
  }
  return { ok: issues.length === 0, issues };
}

/**
 * Normalize markdown export into heading/body sections for accessible PDFs.
 * Prefer ## headings so readers get a structured outline.
 */
export function preferStructuredSections(
  sections: AccessibleDocSection[],
): AccessibleDocSection[] {
  return sections
    .map((s) => ({
      heading: s.heading?.trim() || undefined,
      body: (s.body || "").trim(),
    }))
    .filter((s) => s.heading || s.body);
}
