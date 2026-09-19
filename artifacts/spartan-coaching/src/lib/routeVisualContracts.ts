import { isWorkspacePath, requiresAuthenticationPath } from "./workspaceShell";

/**
 * Authoritative web route/surface matrix (task 427).
 *
 * This is deliberately data, rather than a second router. App.tsx remains the
 * behavior source of truth; the contract test below proves the two lists cannot
 * drift. Keep additions in both places and describe the intended visual states
 * before shipping a new surface.
 */
export type RouteFamily =
  | "public"
  | "auth"
  | "workspace"
  | "resources"
  | "tools"
  | "admin"
  | "assessment"
  | "legal"
  | "fallback";

export type RouteSurface = "public" | "workspace" | "auth" | "redirect";
export type RouteAuth = "anonymous" | "optional" | "required";
export type RouteTheme = "spartan-light" | "workspace-user" | "auth-light" | "print-light";
export type Breakpoint = "mobile" | "tablet" | "desktop";
export type RouteState = "loading" | "empty" | "error" | "ready";

export type RouteVisualContract = {
  path: string;
  family: RouteFamily;
  anonymousSurface: RouteSurface;
  authenticatedSurface: RouteSurface;
  auth: RouteAuth;
  anonymousTheme: RouteTheme;
  authenticatedTheme: RouteTheme;
  breakpoints: readonly Breakpoint[];
  states: readonly RouteState[];
};

const breakpoints = ["mobile", "tablet", "desktop"] as const;
const standardStates = ["loading", "empty", "error", "ready"] as const;
const authShellPaths = new Set([
  "/welcome",
  "/login",
  "/set-password",
  "/forgot-password",
  "/reset-password",
  "/magic-login",
]);
const printPaths = new Set([
  "/assessment/:id/print",
  "/assessment-results/:submissionId",
]);

function themeFor(path: string, surface: RouteSurface): RouteTheme {
  if (printPaths.has(path)) return "print-light";
  if (surface === "workspace") return "workspace-user";
  if (surface === "auth") return "auth-light";
  return "spartan-light";
}

function contract(path: string, family: RouteFamily): RouteVisualContract {
  const workspaceCapable = isWorkspacePath(path);
  const requiresAuth = requiresAuthenticationPath(path);
  const authShell = authShellPaths.has(path);
  const anonymousSurface: RouteSurface = requiresAuth
    ? "redirect"
    : authShell
      ? "auth"
      : "public";
  const authenticatedSurface: RouteSurface = workspaceCapable
    ? "workspace"
    : authShell
      ? "auth"
      : "public";
  const auth: RouteAuth = requiresAuth
    ? "required"
    : workspaceCapable
      ? "optional"
      : "anonymous";

  return {
    path,
    family,
    anonymousSurface,
    authenticatedSurface,
    auth,
    anonymousTheme: themeFor(path, anonymousSurface),
    authenticatedTheme: themeFor(path, authenticatedSurface),
    breakpoints,
    states: standardStates,
  };
}

/** Every explicit <Route> in App.tsx, including the not-found route. */
export const routeVisualContracts: readonly RouteVisualContract[] = [
  contract("/", "public"), contract("/welcome", "auth"),
  contract("/login", "auth"), contract("/register", "auth"),
  contract("/request-access", "auth"), contract("/set-password", "auth"),
  contract("/forgot-password", "auth"), contract("/reset-password", "auth"),
  contract("/portal", "workspace"), contract("/portal/learn", "workspace"),
  contract("/portal/coach", "workspace"), contract("/account", "workspace"),
  contract("/org/admin", "admin"), contract("/magic-login", "auth"),
  contract("/checkout-return", "auth"), contract("/hospice-sales-pro", "public"),
  contract("/app", "public"), contract("/membership", "public"), contract("/field-kit", "public"),
  contract("/field-kit-membership", "public"), contract("/pricing/field-kit", "public"),
  contract("/services", "public"), contract("/programs", "public"), contract("/method", "public"),
  contract("/tools", "tools"), contract("/tools/playbooks", "tools"),
  contract("/tools/objections", "tools"), contract("/tools/research", "tools"),
  contract("/tools/transcribe", "tools"), contract("/tools/email-templates", "tools"),
  contract("/tools/role-play", "tools"), contract("/tools/roi-calculator", "tools"),
  contract("/tools/activity-calculator", "tools"), contract("/tools/rep-cost-calculator", "tools"),
  contract("/tools/branch-profitability", "tools"), contract("/tools/cold-call-script", "tools"),
  contract("/tools/weekly-plan-builder", "tools"), contract("/tools/sales-workflow", "tools"),
  contract("/tools/intelligence", "tools"), contract("/spartan-intelligence", "tools"),
  contract("/tools/ai", "tools"), contract("/my-work/elite-outputs", "workspace"),
  contract("/my-work", "workspace"), contract("/tools/ai/:toolId", "tools"),
  contract("/drills", "resources"), contract("/resources", "resources"),
  contract("/admin/access-desk", "admin"), contract("/admin", "admin"),
  contract("/resources/weekly-plan", "resources"), contract("/resources/activity-tracker", "resources"),
  contract("/quiz", "resources"), contract("/resources/quick-start-guide", "resources"),
  contract("/resources/objection-cards", "resources"), contract("/resources/territory-template", "resources"),
  contract("/resources/metrics-dashboard", "resources"), contract("/testimonials", "public"),
  contract("/articles", "public"), contract("/podcasts", "public"), contract("/faq", "public"),
  contract("/trust", "public"), contract("/terms", "legal"), contract("/disclaimer", "legal"),
  contract("/privacy", "legal"), contract("/baa", "legal"), contract("/contract", "legal"),
  contract("/nda", "legal"), contract("/emr-access", "legal"), contract("/conflict-of-interest", "legal"),
  contract("/liability-waiver", "legal"), contract("/testimonial-release", "legal"),
  contract("/legal", "legal"), contract("/compliance", "legal"), contract("/learn/knowledge-base", "resources"),
  contract("/about", "public"), contract("/contact", "public"), contract("/manifesto", "public"),
  contract("/assess/:slug", "assessment"),
  contract("/assessment/:id/print", "assessment"),
  contract("/assessment/:id", "assessment"),
  contract("/assessment-results/:submissionId", "assessment"),
  contract("/sign/:token", "auth"), contract("/brand-video", "public"),
  contract("*", "fallback"),
];

export const routeVisualContractByPath = new Map(
  routeVisualContracts.map((route) => [route.path, route]),
);