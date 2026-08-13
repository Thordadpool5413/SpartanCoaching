/**
 * Canonical compliance, pricing, consent, and trust language (HSP-40).
 * Keep web + mobile wording aligned; change here first, then mirror mobile.
 *
 * Nick should approve material public claim changes (see docs/content-compliance.md).
 * Do not invent metrics, rankings, or security certifications not implemented.
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

/**
 * Single source of pricing facts for landers, paywalls, Account, Access Paths.
 * Currency USD. Change here only — then update Stripe product labels in ops.
 */
export const PRICING_FACTS = {
  productName: "Hospice Sales Pro",
  individualWeeklyUsd: 14.99,
  individualWeeklyLabel: "$14.99/week",
  individualWeeklyShort: "$14.99/wk",
  individualBillingNote: "Billed weekly in USD. Cancel anytime from Account.",
  previewNote: "Preview tool interfaces free. Live generation requires an active subscription or evaluation.",
  teamNote: "Team seats and multi-user access are arranged under contract — not the individual weekly plan.",
  evaluationNote:
    "Evaluations and company access are requested separately so individual self-serve pricing stays clear.",
  consultingSeparate:
    "Human consulting, workshops, and coaching engagements are a separate offer from Hospice Sales Pro.",
  heroLine:
    "Preview free. Live tools $14.99/week (cancel anytime). Teams under contract. Consulting is a separate offer.",
  paywallTitle: "$14.99/week · cancel anytime",
  paywallBody:
    "Unlock live generation, saves, and Command Center. Preview still works without a subscription.",
} as const;

/**
 * Consent language — resource delivery must not require marketing opt-in.
 */
export const CONSENT_COPY = {
  resourceDeliveryTitle: "Access this resource",
  resourceDeliveryBody:
    "We use your name and email to deliver or unlock the resource you requested — not as a requirement to join a marketing list.",
  marketingOptInLabel:
    "Also send occasional coaching tips and product updates by email (optional). You can unsubscribe anytime.",
  marketingOptInHint: "Optional. Leaving this unchecked still delivers the resource you asked for.",
  newsletterExplicit:
    "Subscribe only if you want coaching tips and product updates. This is separate from Hospice Sales Pro membership.",
  newsletterSuccess:
    "You're subscribed to optional updates. Resource downloads and membership access are managed separately.",
} as const;

export type TrustCenterSection = {
  id: string;
  title: string;
  body: string;
};

/**
 * Plain-language Trust Center — only claims that match product behavior.
 */
export const TRUST_CENTER_SECTIONS: TrustCenterSection[] = [
  {
    id: "data-handling",
    title: "Data handling",
    body:
      "Hospice Sales Pro membership tools are built for planning and messaging without patient identifiers. Do not enter PHI in consumer tools. Account data (email, name, organization, billing status) is stored to operate membership, sessions, and support.",
  },
  {
    id: "ai-use",
    title: "How AI is used",
    body:
      "AI generates drafts for objections, plans, emails, and related field aids when you run a tool. Outputs are educational coaching aids — not clinical, legal, or billing determinations. You remain responsible for adapting language to the relationship and your organization's policies.",
  },
  {
    id: "storage",
    title: "Storage and retention",
    body:
      "We store account, session, and product-usage data needed to run the service. Clinical vault workflows, when authorized, are designed for ephemeral runs where implemented. Provider-owned library files stay tenant-scoped to your organization.",
  },
  {
    id: "professional-boundaries",
    title: "Professional boundaries",
    body:
      "This product supports hospice growth work: conversations, territory rhythm, and preparation. It does not replace clinical judgment, eligibility determination, or compliance review. Sales chrome stays out of PHI-capable clinical tools.",
  },
  {
    id: "provider-isolation",
    title: "Provider isolation",
    body:
      "Organization-owned resources and member work are scoped to your tenant. Other organizations cannot see your provider library or personal saved work through normal product paths.",
  },
  {
    id: "content-review",
    title: "Content review",
    body:
      "Core field resources and methodology content are curated for hospice sales coaching. Organization libraries may add private materials under your team's ownership and review practices.",
  },
  {
    id: "billing",
    title: "Billing",
    body:
      "Individual access is $14.99 USD per week when self-serve subscribe is available, cancel anytime from Account. Team seats and evaluations use arranged access so pricing paths stay distinct. Consulting is billed separately when engaged.",
  },
  {
    id: "security",
    title: "Security practices we claim",
    body:
      "We use authenticated sessions, role checks, and tenant isolation for membership features. We do not claim third-party security certifications here unless they are formally in place. Report security concerns through published support channels.",
  },
  {
    id: "support",
    title: "Support",
    body:
      "For access, billing, or product questions, use Account and Contact. Debrief and evaluation conversations can be requested while an evaluation is open.",
  },
];

export const TRUST_CENTER_INTRO =
  "Plain language about how Hospice Sales Pro handles data, AI, billing, and professional boundaries. We state only what the product is designed to do — not aspirational rankings or unverified guarantees.";
