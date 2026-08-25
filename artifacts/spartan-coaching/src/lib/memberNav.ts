import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Crosshair,
  FolderOpen,
  Home,
  LayoutDashboard,
  MessageCircle,
  UserCircle,
  Wrench,
} from "lucide-react";

export type MemberNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Short label for dense chrome (optional) */
  short?: string;
  match: (location: string) => boolean;
};

/**
 * Compact member strip (FieldKitChrome / mobile sheet).
 * Full application navigation lives in workspaceShell + AppShell (HSP-32).
 */
export const MEMBER_NAV: MemberNavItem[] = [
  {
    href: "/portal",
    label: "Home",
    short: "Home",
    icon: Home,
    match: (loc) => loc === "/portal",
  },
  {
    href: "/tools/sales-workflow",
    label: "Command",
    icon: Crosshair,
    match: (loc) => loc.startsWith("/tools/sales-workflow"),
  },
  {
    href: "/tools",
    label: "Tools",
    icon: Wrench,
    match: (loc) =>
      (loc === "/tools" || loc.startsWith("/tools/")) &&
      !loc.startsWith("/tools/sales-workflow") &&
      !loc.startsWith("/tools/intelligence"),
  },
  {
    href: "/tools/intelligence",
    label: "Intelligence",
    short: "Intel",
    icon: Sparkles,
    match: (loc) =>
      loc.startsWith("/tools/intelligence") ||
      loc.startsWith("/spartan-intelligence"),
  },
  {
    href: "/resources",
    label: "Resources",
    icon: FolderOpen,
    match: (loc) => loc === "/resources" || loc.startsWith("/resources/"),
  },
  {
    href: "/portal/learn",
    label: "Learn",
    icon: BookOpen,
    match: (loc) =>
      loc === "/portal/learn" ||
      loc === "/drills" ||
      loc === "/quiz" ||
      loc.startsWith("/learn/"),
  },
  {
    href: "/resources/weekly-plan",
    label: "Saved work",
    short: "Saved",
    icon: FolderOpen,
    match: (loc) => loc.startsWith("/resources/weekly-plan"),
  },
  {
    href: "/account",
    label: "Account",
    icon: UserCircle,
    match: (loc) => loc === "/account" || loc.startsWith("/account/"),
  },
  {
    href: "/portal/coach",
    label: "Coach",
    short: "Coach",
    icon: MessageCircle,
    match: (loc) => loc.startsWith("/portal/coach"),
  },
];

/** Header portal strip (includes Portal label for marketing shell). */
export const PORTAL_HEADER_NAV: MemberNavItem[] = [
  {
    href: "/portal",
    label: "Portal",
    icon: LayoutDashboard,
    match: (loc) => loc === "/portal",
  },
  ...MEMBER_NAV.filter((item) => item.href !== "/portal"),
];

export const PREVIEW_NAV: MemberNavItem[] = [
  {
    href: "/hospice-sales-pro",
    label: "Hospice Sales Pro",
    icon: Home,
    match: (loc) =>
      loc === "/hospice-sales-pro" ||
      loc === "/membership" ||
      loc === "/field-kit" ||
      loc === "/field-kit-membership" ||
      loc.startsWith("/pricing/field-kit"),
  },
  {
    href: "/tools",
    label: "Tools",
    icon: Wrench,
    match: (loc) => loc === "/tools" || loc.startsWith("/tools/"),
  },
  {
    href: "/resources",
    label: "Resources",
    icon: FolderOpen,
    match: (loc) => loc === "/resources" || loc.startsWith("/resources/"),
  },
  {
    href: "/register",
    label: "Join",
    icon: MessageCircle,
    match: (loc) => loc === "/register" || loc === "/login",
  },
];
