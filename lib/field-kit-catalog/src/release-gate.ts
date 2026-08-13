/**
 * Final trusted-workspace release gate (HSP-48).
 * Maps personas × domains to verification mode and evidence.
 * Does NOT claim production-ready while critical paths are only manual/unverified.
 */

export type PersonaId =
  | "individual_subscriber"
  | "evaluation_user"
  | "provider_rep"
  | "provider_leader"
  | "provider_admin"
  | "expired_user"
  | "unauthorized_user";

export type JourneyDomain =
  | "authentication"
  | "entitlement"
  | "organization_isolation"
  | "accounts_contacts"
  | "command_center"
  | "ai_context"
  | "knowledge"
  | "provider_knowledge"
  | "resources"
  | "saved_work"
  | "search"
  | "personalization"
  | "notifications"
  | "offline"
  | "billing"
  | "analytics"
  | "accessibility"
  | "iphone"
  | "ipad"
  | "web_responsive"
  | "app_store"
  | "migrations"
  | "backups"
  | "observability";

/** How the journey can be proven in this monorepo. */
export type VerificationMode =
  /** Unit/integration tests in CI */
  | "automated"
  /** Requires live SITE_URL (+ optional auth credentials) */
  | "live_env"
  /** Physical device / TestFlight */
  | "manual_device"
  /** App Store Connect / EAS / human ops */
  | "external";

export type JourneyCheck = {
  id: string;
  persona: PersonaId;
  domain: JourneyDomain;
  title: string;
  /** Blocks claiming production-ready until verified */
  critical: boolean;
  mode: VerificationMode;
  /** Package test id, script, or path used as evidence when automated */
  evidence: string;
};

export const RELEASE_PERSONAS: { id: PersonaId; label: string }[] = [
  { id: "individual_subscriber", label: "Individual subscriber ($14.99/wk)" },
  { id: "evaluation_user", label: "Evaluation / trial user" },
  { id: "provider_rep", label: "Provider organization rep" },
  { id: "provider_leader", label: "Provider leader" },
  { id: "provider_admin", label: "Provider org administrator" },
  { id: "expired_user", label: "Expired / ended access" },
  { id: "unauthorized_user", label: "Logged-out / unauthorized" },
];

/**
 * Integrated journey matrix. Automated rows map to CI-executable evidence.
 * Live/manual/external remain UNVERIFIED until operators prove them.
 */
export const RELEASE_JOURNEYS: JourneyCheck[] = [
  // ── Unauthorized ────────────────────────────────────────────────────
  {
    id: "unauth_health",
    persona: "unauthorized_user",
    domain: "observability",
    title: "Public health and ops readiness endpoints respond",
    critical: true,
    mode: "live_env",
    evidence: "scripts/smoke-health.mjs → /api/healthz, /api/healthz/ops-readiness, /api/client-config",
  },
  {
    id: "unauth_gates",
    persona: "unauthorized_user",
    domain: "entitlement",
    title: "Gated tools return 401/403 without session",
    critical: true,
    mode: "live_env",
    evidence: "scripts/smoke-parity.mjs (public gate checks)",
  },
  {
    id: "unauth_entitlement_unit",
    persona: "unauthorized_user",
    domain: "entitlement",
    title: "Entitlement engine denies expired/disabled/unauthorized roles",
    critical: true,
    mode: "automated",
    evidence: "api-server: src/auth/entitlement.test.ts, src/auth/middleware.test.ts",
  },

  // ── Individual / evaluation / expired ───────────────────────────────
  {
    id: "auth_login_unit",
    persona: "individual_subscriber",
    domain: "authentication",
    title: "Auth crypto, sessions, and middleware contracts",
    critical: true,
    mode: "automated",
    evidence: "api-server: src/auth/crypto.test.ts, src/auth/middleware.test.ts",
  },
  {
    id: "eval_access_unit",
    persona: "evaluation_user",
    domain: "entitlement",
    title: "Trial window allows; expired trial denies",
    critical: true,
    mode: "automated",
    evidence: "api-server: src/auth/entitlement.test.ts (trial remaining / expired)",
  },
  {
    id: "expired_denied",
    persona: "expired_user",
    domain: "entitlement",
    title: "Expired org cannot use field kit",
    critical: true,
    mode: "automated",
    evidence: "api-server: src/auth/entitlement.test.ts",
  },
  {
    id: "billing_entitlement",
    persona: "individual_subscriber",
    domain: "billing",
    title: "Billing entitlement map and notifications contracts",
    critical: true,
    mode: "automated",
    evidence: "api-server: src/billing/entitlementMap.test.ts, billingNotifications, billingEmailMetrics",
  },
  {
    id: "live_auth_seat",
    persona: "individual_subscriber",
    domain: "authentication",
    title: "Same seat login web ↔ API (parity-auth)",
    critical: true,
    mode: "live_env",
    evidence: "scripts/smoke-parity-auth.mjs with PARITY_EMAIL / PARITY_PASSWORD",
  },

  // ── Provider roles ──────────────────────────────────────────────────
  {
    id: "tenant_isolation",
    persona: "provider_rep",
    domain: "organization_isolation",
    title: "Tenant isolation on AI tools and roleplay",
    critical: true,
    mode: "automated",
    evidence: "api-server: src/routes/aiToolIsolation.integration.test.ts, tenantRoleplay, workflowTenantAuthz",
  },
  {
    id: "provider_resources",
    persona: "provider_admin",
    domain: "provider_knowledge",
    title: "Provider resource library tenancy",
    critical: true,
    mode: "automated",
    evidence: "api-server: src/resources/providerResourceLibrary.test.ts",
  },
  {
    id: "provider_admin_policy",
    persona: "provider_admin",
    domain: "accounts_contacts",
    title: "Org admin seat/role/structure/offboard policy contracts",
    critical: true,
    mode: "automated",
    evidence:
      "api-server: orgAdminPolicy, orgStructurePolicy, orgOffboardPolicy; web OrgAdmin.panels + workspaceShell org nav",
  },
  {
    id: "provider_admin_ui",
    persona: "provider_admin",
    domain: "accounts_contacts",
    title: "Org admin live seats/invites/structure/offboard on company org",
    critical: false,
    mode: "live_env",
    evidence: "Manual: company org_admin /org/admin + /api/org/* after pnpm db:migrate (0014/0015)",
  },
  {
    id: "provider_leader_usage",
    persona: "provider_leader",
    domain: "analytics",
    title: "Leader usage visibility (org usage aggregates)",
    critical: false,
    mode: "live_env",
    evidence: "Manual: org_admin GET /api/org/usage + OrgAdmin usage panel",
  },

  // ── Product surfaces ────────────────────────────────────────────────
  {
    id: "command_center",
    persona: "provider_rep",
    domain: "command_center",
    title: "Command Center / sales workflow contracts",
    critical: true,
    mode: "automated",
    evidence:
      "api-server workflowTenantAuthz + field-kit-catalog command-center/parity; mobile: command-center-next-actions, accounts, roleplay, integrations tests",
  },
  {
    id: "command_center_mobile_parity",
    persona: "provider_rep",
    domain: "command_center",
    title: "Command Center mobile capability matrix (supported paths)",
    critical: true,
    mode: "automated",
    evidence:
      "field-kit-catalog parity.test.ts COMMAND_CENTER_CAPABILITIES; mobile jest command-center-* helpers",
  },
  {
    id: "dual_schema",
    persona: "provider_admin",
    domain: "migrations",
    title: "Web schema re-export only (no dual Drizzle fork)",
    critical: true,
    mode: "automated",
    evidence: "spartan-coaching: src/shared/schema.dualSourceOfTruth.test.ts",
  },
  {
    id: "ai_context_uncertainty",
    persona: "provider_rep",
    domain: "ai_context",
    title: "AI uncertainty boundaries and security",
    critical: true,
    mode: "automated",
    evidence: "api-server: uncertaintyBoundaries, phiEncryption, requestSecurity, spartan-ai-tools tests",
  },
  {
    id: "knowledge_corpus",
    persona: "individual_subscriber",
    domain: "knowledge",
    title: "Spartan knowledge corpus unit coverage",
    critical: false,
    mode: "automated",
    evidence: "api-server: src/knowledge/spartanCorpus.test.ts",
  },
  {
    id: "resources_lifecycle",
    persona: "individual_subscriber",
    domain: "resources",
    title: "Resources architecture, work, lifecycle",
    critical: true,
    mode: "automated",
    evidence: "api-server: resourceArchitecture, executableResources, resourceLifecycle tests",
  },
  {
    id: "saved_work",
    persona: "individual_subscriber",
    domain: "saved_work",
    title: "Executable resource saved work",
    critical: true,
    mode: "automated",
    evidence: "api-server: executableResources.test.ts",
  },
  {
    id: "search",
    persona: "individual_subscriber",
    domain: "search",
    title: "Universal search engine",
    critical: true,
    mode: "automated",
    evidence: "api-server: src/search/universalSearch.test.ts",
  },
  {
    id: "personalization",
    persona: "individual_subscriber",
    domain: "personalization",
    title: "Favorites / recents / continue",
    critical: true,
    mode: "automated",
    evidence: "api-server: personalizationEngine.test.ts",
  },
  {
    id: "notifications",
    persona: "individual_subscriber",
    domain: "notifications",
    title: "Notification engine and prefs",
    critical: true,
    mode: "automated",
    evidence: "api-server: notificationEngine.test.ts",
  },
  {
    id: "offline",
    persona: "provider_rep",
    domain: "offline",
    title: "Offline queue / architecture (mobile)",
    critical: false,
    mode: "manual_device",
    evidence: "mobile offlineQueue / offlineArchitecture; physical device airplane mode",
  },
  {
    id: "analytics_privacy",
    persona: "individual_subscriber",
    domain: "analytics",
    title: "Product analytics privacy + pricing consent",
    critical: true,
    mode: "automated",
    evidence: "field-kit-catalog product-analytics; web complianceCopy tests",
  },
  {
    id: "a11y",
    persona: "individual_subscriber",
    domain: "accessibility",
    title: "Accessibility contracts",
    critical: true,
    mode: "automated",
    evidence: "spartan-coaching: src/lib/a11y.contract.test.ts, a11y.document.test.ts",
  },
  {
    id: "iphone",
    persona: "individual_subscriber",
    domain: "iphone",
    title: "iPhone product quality + account billing UI",
    critical: true,
    mode: "automated",
    evidence: "mobile jest: ios-product-quality, account-billing; TestFlight smoke external",
  },
  {
    id: "ipad",
    persona: "individual_subscriber",
    domain: "ipad",
    title: "iPad layout (phone-first app, tablet unsupported)",
    critical: false,
    mode: "manual_device",
    evidence: "app.config supportsTablet:false — verify no crash if opened on iPad",
  },
  {
    id: "web_responsive",
    persona: "individual_subscriber",
    domain: "web_responsive",
    title: "Web membership + shell contracts",
    critical: true,
    mode: "automated",
    evidence: "spartan-coaching FieldKitMembership.eliteCopy, workspaceShell, a11y tests",
  },
  {
    id: "app_store",
    persona: "individual_subscriber",
    domain: "app_store",
    title: "App Store privacy + deletion readiness",
    critical: true,
    mode: "automated",
    evidence: "mobile app-store-readiness.test.ts; ASC/TestFlight still external",
  },
  {
    id: "account_deletion",
    persona: "individual_subscriber",
    domain: "authentication",
    title: "Account self-deletion API contract",
    critical: true,
    mode: "automated",
    evidence: "api-server: deleteAccount.test.ts + live POST /api/me/delete-account on staging",
  },
  {
    id: "migrations",
    persona: "provider_admin",
    domain: "migrations",
    title: "Migration safety + migrate-primary inventory",
    critical: true,
    mode: "automated",
    evidence:
      "lib/db migration-safety + migrate-manifest tests; CI pnpm db:migrate (no prod push); live: ALLOW_PROD_MIGRATE after backup",
  },
  {
    id: "backups",
    persona: "provider_admin",
    domain: "backups",
    title: "Backup restore drill + ops readiness",
    critical: true,
    mode: "automated",
    evidence: "lib/db ops-readiness + backup-restore-drill (CI with Postgres)",
  },
  {
    id: "observability",
    persona: "unauthorized_user",
    domain: "observability",
    title: "Reliability targets, request metrics, safe logging",
    critical: true,
    mode: "automated",
    evidence: "api-server observability tests + /api/healthz/reliability",
  },
  {
    id: "delivery_flags",
    persona: "individual_subscriber",
    domain: "entitlement",
    title: "Client-config feature flags and min iOS gate",
    critical: true,
    mode: "automated",
    evidence: "api-server delivery/featureFlags + client-delivery catalog",
  },
];

/** Automated gate suites executed by scripts/release-gate.mjs */
export type AutomatedSuite = {
  id: string;
  label: string;
  critical: boolean;
  /** cwd relative to repo root */
  cwd: string;
  command: string;
  args: string[];
};

export const AUTOMATED_SUITES: AutomatedSuite[] = [
  {
    id: "db_ops",
    label: "DB ops readiness + migration safety + migrate-manifest",
    critical: true,
    cwd: "lib/db",
    command: "pnpm",
    args: [
      "exec",
      "vitest",
      "run",
      "src/ops-readiness.test.ts",
      "src/migration-safety.test.ts",
      "src/migrate-manifest.test.ts",
    ],
  },
  {
    id: "catalog",
    label: "Field-kit catalog (parity, analytics, delivery, release gate)",
    critical: true,
    cwd: "lib/field-kit-catalog",
    command: "pnpm",
    args: ["exec", "vitest", "run"],
  },
  {
    id: "api_security_entitlement",
    label: "API auth, entitlement, tenant isolation, security, org admin policy",
    critical: true,
    cwd: "artifacts/api-server",
    command: "pnpm",
    args: [
      "exec",
      "vitest",
      "run",
      "src/auth/crypto.test.ts",
      "src/auth/entitlement.test.ts",
      "src/auth/middleware.test.ts",
      "src/auth/workflowTenantAuthz.test.ts",
      "src/auth/orgAdminPolicy.test.ts",
      "src/auth/orgStructurePolicy.test.ts",
      "src/security/requestSecurity.test.ts",
      "src/security/tenantRoleplay.test.ts",
      "src/security/phiEncryption.test.ts",
      "src/routes/aiToolIsolation.integration.test.ts",
      "src/routes/deleteAccount.test.ts",
      "src/billing/entitlementMap.test.ts",
    ],
  },
  {
    id: "api_product",
    label: "API resources, search, personalization, notifications, health",
    critical: true,
    cwd: "artifacts/api-server",
    command: "pnpm",
    args: [
      "exec",
      "vitest",
      "run",
      "src/resources/resourceArchitecture.test.ts",
      "src/resources/executableResources.test.ts",
      "src/resources/resourceLifecycle.test.ts",
      "src/resources/providerResourceLibrary.test.ts",
      "src/search/universalSearch.test.ts",
      "src/personalization/personalizationEngine.test.ts",
      "src/notifications/notificationEngine.test.ts",
      "src/routes/health.test.ts",
      "src/delivery/featureFlags.test.ts",
      "src/observability/reliabilityTargets.test.ts",
      "src/ai/uncertaintyBoundaries.test.ts",
    ],
  },
  {
    id: "web_contracts",
    label: "Web a11y, membership, dual-schema, org admin panels",
    critical: true,
    cwd: "artifacts/spartan-coaching",
    command: "pnpm",
    args: [
      "exec",
      "vitest",
      "run",
      "src/lib/a11y.contract.test.ts",
      "src/lib/complianceCopy.test.ts",
      "src/lib/workspaceShell.test.ts",
      "src/pages/FieldKitMembership.eliteCopy.test.tsx",
      "src/shared/schema.dualSourceOfTruth.test.ts",
      "src/pages/OrgAdmin.panels.test.tsx",
    ],
  },
  {
    id: "mobile_contracts",
    label: "iOS product quality, App Store readiness, Command Center helpers",
    critical: true,
    cwd: "artifacts/spartan-coaching-mobile",
    command: "pnpm",
    args: [
      "exec",
      "jest",
      "--runInBand",
      "__tests__/ios-product-quality.test.ts",
      "__tests__/app-store-readiness.test.ts",
      "__tests__/account-billing.test.tsx",
      "__tests__/command-center-next-actions.test.ts",
      "__tests__/command-center-accounts.test.ts",
      "__tests__/command-center-roleplay.test.ts",
      "__tests__/command-center-integrations.test.ts",
    ],
  },
];

export type GateVerdict = {
  /** True only if all critical automated suites would need to pass AND no critical journey remains unverified-by-policy */
  productionReadyClaimAllowed: false;
  reason: string;
  criticalJourneyCount: number;
  automatedJourneyCount: number;
  liveEnvJourneyCount: number;
  manualDeviceJourneyCount: number;
  externalJourneyCount: number;
  criticalAutomatedSuiteCount: number;
};

/**
 * Hard rule: never claim production ready from this package alone.
 * Live seat journeys, TestFlight, ASC, and deploy smoke remain operator-proven.
 */
export function evaluateProductionReadyClaim(): GateVerdict {
  const critical = RELEASE_JOURNEYS.filter((j) => j.critical);
  return {
    productionReadyClaimAllowed: false,
    reason:
      "Critical paths require live_env (SITE_URL + entitled seat), manual_device (TestFlight), and external (ASC/EAS) evidence beyond unit suites. Automated suites are necessary but not sufficient.",
    criticalJourneyCount: critical.length,
    automatedJourneyCount: RELEASE_JOURNEYS.filter((j) => j.mode === "automated").length,
    liveEnvJourneyCount: RELEASE_JOURNEYS.filter((j) => j.mode === "live_env").length,
    manualDeviceJourneyCount: RELEASE_JOURNEYS.filter((j) => j.mode === "manual_device").length,
    externalJourneyCount: RELEASE_JOURNEYS.filter((j) => j.mode === "external").length,
    criticalAutomatedSuiteCount: AUTOMATED_SUITES.filter((s) => s.critical).length,
  };
}

export function journeysForPersona(persona: PersonaId): JourneyCheck[] {
  return RELEASE_JOURNEYS.filter((j) => j.persona === persona);
}

export function requiredDomainsCovered(): JourneyDomain[] {
  return [...new Set(RELEASE_JOURNEYS.map((j) => j.domain))];
}
