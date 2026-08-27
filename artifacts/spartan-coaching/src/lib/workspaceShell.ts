/**
 * Paid Hospice Sales Pro web workspace shell (HSP-32).
 *
 * Separates authenticated product surfaces from public marketing chrome.
 * Navigation, search scope, and admin links are derived here — not hard-coded
 * differently per page.
 */

import type { LucideIcon } from "lucide-react";
import {
  Bell,
  BookOpen,
  Clock,
  Crosshair,
  FolderOpen,
  Home,
  MessageCircle,
  Search,
  Settings,
  Shield,
  UserCircle,
  Wrench,
} from "lucide-react";
import type { SpartanDestinationId } from "@workspace/field-kit-catalog";
import { getDestinationContract } from "@workspace/field-kit-catalog";

export const WORKSPACE_SHELL_VERSION = "workspace-shell-v1";

export type WorkspaceNavId =
  | "home"
  | "command"
  | "tools"
  | "resources"
  | "learn"
  | "coach"
  | "saved"
  | "recent"
  | "notifications"
  | "settings"
  | "org_admin"
  | "platform_admin";

export type WorkspaceNavItem = {
  id: WorkspaceNavId;
  href: string;
  label: string;
  short?: string;
  icon: LucideIcon;
  /** Sidebar primary rail */
  primary?: boolean;
  match: (location: string) => boolean;
  /** Role gate — omit = any authenticated member */
  roles?: Array<"org_admin" | "platform_admin" | "member" | "rep">;
  destinationId?: SpartanDestinationId;
};

/**
 * Paths that use the paid application shell (no marketing footer/chat CTA).
 * Public SEO pages stay on the marketing layout even when signed in.
 */
const WORKSPACE_PREFIXES = [
  "/portal",
  "/tools",
  "/resources",
  "/account",
  "/org/admin",
  "/admin",
  "/drills",
  "/quiz",
  "/learn/",
] as const;

/** Explicit workspace paths that are not prefix-matched cleanly */
const WORKSPACE_EXACT = new Set([
  "/portal",
  "/tools",
  "/resources",
  "/account",
  "/org/admin",
  "/admin",
  "/drills",
  "/quiz",
]);

/**
 * Marketing / public SEO surfaces — keep marketing header + footer.
 * Authenticated users still see marketing chrome here, with a workspace CTA.
 */
export function isMarketingPath(pathname: string): boolean {
  const p = normalizePath(pathname);
  if (p === "/" || p === "") return true;
  const marketingPrefixes = [
    "/about",
    "/services",
    "/programs",
    "/method",
    "/manifesto",
    "/contact",
    "/hospice-sales-pro",
    "/membership",
    "/field-kit",
    "/register",
    "/request-access",
    "/login",
    "/set-password",
    "/forgot-password",
    "/reset-password",
    "/magic-login",
    "/welcome",
    "/articles",
    "/podcasts",
    "/faq",
    "/privacy",
    "/terms",
    "/disclaimer",
    "/legal",
    "/compliance",
    "/testimonials",
    "/brand-video",
    "/assess/",
    "/assessment",
    "/sign/",
  ];
  return marketingPrefixes.some(
    (prefix) => p === prefix.replace(/\/$/, "") || p.startsWith(prefix),
  );
}

export function normalizePath(pathname: string): string {
  if (!pathname) return "/";
  const noQuery = pathname.split("?")[0]?.split("#")[0] ?? pathname;
  if (noQuery.length > 1 && noQuery.endsWith("/")) return noQuery.slice(0, -1);
  return noQuery || "/";
}

/** True when the paid application shell should wrap the route. */
export function isWorkspacePath(pathname: string): boolean {
  const p = normalizePath(pathname);
  if (isMarketingPath(p)) {
    // Learn product surface under portal only; public /articles stay marketing
    return false;
  }
  if (WORKSPACE_EXACT.has(p)) return true;
  return WORKSPACE_PREFIXES.some(
    (prefix) => p === prefix || p.startsWith(`${prefix}/`) || p.startsWith(prefix),
  );
}

export function isOrgAdminRole(role: string | undefined | null): boolean {
  return role === "org_admin" || role === "platform_admin";
}

export function isPlatformAdminRole(role: string | undefined | null): boolean {
  return role === "platform_admin";
}

/**
 * Build workspace nav for the current member role.
 * Order: primary rail first, then utility.
 */
export function workspaceNavForRole(
  role: string | undefined | null,
): WorkspaceNavItem[] {
  const items: WorkspaceNavItem[] = [
    {
      id: "home",
      destinationId: "home",
      href: "/portal",
      label: "Home",
      icon: Home,
      primary: true,
      match: (loc) => normalizePath(loc) === "/portal",
    },
    {
      id: "command",
      destinationId: "command",
      href: "/tools/sales-workflow",
      label: "Command Center",
      short: "Command",
      icon: Crosshair,
      primary: true,
      match: (loc) => normalizePath(loc).startsWith("/tools/sales-workflow"),
    },
    {
      id: "tools",
      destinationId: "explore",
      href: "/tools",
      label: "Tools",
      icon: Wrench,
      primary: true,
      match: (loc) => {
        const p = normalizePath(loc);
        return (
          (p === "/tools" || p.startsWith("/tools/")) &&
          !p.startsWith("/tools/sales-workflow")
        );
      },
    },
    {
      id: "resources",
      destinationId: "library",
      href: "/resources",
      label: "Resources",
      icon: FolderOpen,
      primary: true,
      match: (loc) => {
        const p = normalizePath(loc);
        return p === "/resources" || p.startsWith("/resources/");
      },
    },
    {
      id: "learn",
      destinationId: "library",
      href: "/portal/learn",
      label: "Learn",
      icon: BookOpen,
      primary: true,
      match: (loc) => {
        const p = normalizePath(loc);
        return (
          p === "/portal/learn" ||
          p === "/drills" ||
          p === "/quiz" ||
          p.startsWith("/learn/")
        );
      },
    },
    {
      id: "coach",
      href: "/portal/coach",
      label: "Coach",
      icon: MessageCircle,
      primary: true,
      match: (loc) => normalizePath(loc).startsWith("/portal/coach"),
    },
    {
      id: "saved",
      destinationId: "my-work",
      href: "/resources/weekly-plan",
      label: "Saved work",
      short: "Saved",
      icon: FolderOpen,
      primary: true,
      match: (loc) =>
        normalizePath(loc).startsWith("/resources/weekly-plan") ||
        normalizePath(loc).includes("resource-work"),
    },
    {
      id: "recent",
      href: "/portal?panel=recent",
      label: "Recent",
      icon: Clock,
      match: (loc) => normalizePath(loc).includes("panel=recent"),
    },
    {
      id: "notifications",
      href: "/portal?panel=notifications",
      label: "Notifications",
      short: "Alerts",
      icon: Bell,
      match: (loc) => normalizePath(loc).includes("panel=notifications"),
    },
    {
      id: "settings",
      href: "/account",
      label: "Account settings",
      short: "Account",
      icon: UserCircle,
      match: (loc) => {
        const p = normalizePath(loc);
        return p === "/account" || p.startsWith("/account/");
      },
    },
  ];

  if (isOrgAdminRole(role)) {
    items.push({
      id: "org_admin",
      href: "/org/admin",
      label: "Organization",
      short: "Org",
      icon: Settings,
      match: (loc) => {
        const p = normalizePath(loc);
        return p === "/org/admin" || p.startsWith("/org/admin/");
      },
      roles: ["org_admin", "platform_admin"],
    });
  }

  if (isPlatformAdminRole(role)) {
    items.push({
      id: "platform_admin",
      href: "/admin",
      label: "Platform admin",
      short: "Admin",
      icon: Shield,
      match: (loc) => normalizePath(loc).startsWith("/admin"),
      roles: ["platform_admin"],
    });
  }

  return items;
}

export function primaryWorkspaceNav(
  role: string | undefined | null,
): WorkspaceNavItem[] {
  const nav = workspaceNavForRole(role);
  return nav.filter(
    (item) =>
      item.primary &&
      item.id !== "recent" &&
      item.id !== "notifications",
  );
}

export function utilityWorkspaceNav(
  role: string | undefined | null,
): WorkspaceNavItem[] {
  const nav = workspaceNavForRole(role);
  return nav.filter(
    (item) =>
      !item.primary ||
      item.id === "recent" ||
      item.id === "notifications" ||
      item.id === "settings" ||
      item.id === "org_admin" ||
      item.id === "platform_admin",
  );
}

/** Contract check used by tests and future nav builders before rendering. */
export function workspaceNavContractErrors(
  nav: readonly WorkspaceNavItem[],
): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const hrefs = new Set<string>();
  for (const item of nav) {
    if (ids.has(item.id)) errors.push(`duplicate workspace nav id ${item.id}`);
    ids.add(item.id);
    if (hrefs.has(item.href)) errors.push(`duplicate workspace nav href ${item.href}`);
    hrefs.add(item.href);
    if (item.destinationId && !getDestinationContract(item.destinationId)) {
      errors.push(`${item.id} references an unknown destination`);
    }
  }
  return errors;
}

/** Login URL with return path for deep links after expired session. */
export function loginWithReturn(pathname: string): string {
  const p = normalizePath(pathname);
  if (!p || p === "/" || p.startsWith("/login")) return "/login";
  return `/login?next=${encodeURIComponent(p)}`;
}

/** Whether a role may open a nav item. */
export function canAccessNavItem(
  item: WorkspaceNavItem,
  role: string | undefined | null,
): boolean {
  if (!item.roles || item.roles.length === 0) return true;
  if (!role) return false;
  if (item.roles.includes(role as "org_admin")) return true;
  if (role === "platform_admin") return true;
  if (role === "org_admin" && item.roles.includes("org_admin")) return true;
  return item.roles.includes(role as "member" | "rep" | "org_admin" | "platform_admin");
}

/** Recent activity local storage key */
export const WORKSPACE_RECENT_KEY = "hsp-workspace-recent-v1";

export type WorkspaceRecentEntry = {
  path: string;
  label: string;
  at: number;
};

export function readWorkspaceRecent(limit = 8): WorkspaceRecentEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(WORKSPACE_RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WorkspaceRecentEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, limit);
  } catch {
    return [];
  }
}

export function pushWorkspaceRecent(entry: Omit<WorkspaceRecentEntry, "at">): void {
  if (typeof window === "undefined") return;
  try {
    const prev = readWorkspaceRecent(20).filter((e) => e.path !== entry.path);
    const next: WorkspaceRecentEntry[] = [
      { ...entry, at: Date.now() },
      ...prev,
    ].slice(0, 12);
    window.localStorage.setItem(WORKSPACE_RECENT_KEY, JSON.stringify(next));
  } catch {
    // ignore quota
  }
}

/** Search icon re-export convenience for shell */
export { Search as WorkspaceSearchIcon };
