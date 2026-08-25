import { describe, it, expect } from "vitest";
import {
  WORKSPACE_SHELL_VERSION,
  isWorkspacePath,
  isMarketingPath,
  isOrgAdminRole,
  isPlatformAdminRole,
  workspaceNavForRole,
  primaryWorkspaceNav,
  canAccessNavItem,
  loginWithReturn,
  normalizePath,
  workspaceNavContractErrors,
} from "./workspaceShell";

describe("workspace shell (HSP-32)", () => {
  it("is versioned", () => {
    expect(WORKSPACE_SHELL_VERSION).toMatch(/^workspace-shell-v\d+/);
  });

  it("classifies product deep links as workspace", () => {
    expect(isWorkspacePath("/portal")).toBe(true);
    expect(isWorkspacePath("/tools/sales-workflow")).toBe(true);
    expect(isWorkspacePath("/tools/objections")).toBe(true);
    expect(isWorkspacePath("/resources/objection-cards")).toBe(true);
    expect(isWorkspacePath("/account")).toBe(true);
    expect(isWorkspacePath("/portal/learn")).toBe(true);
    expect(isWorkspacePath("/admin")).toBe(true);
    expect(isWorkspacePath("/drills")).toBe(true);
  });

  it("keeps public SEO and marketing out of workspace shell", () => {
    expect(isMarketingPath("/")).toBe(true);
    expect(isMarketingPath("/about")).toBe(true);
    expect(isMarketingPath("/hospice-sales-pro")).toBe(true);
    expect(isMarketingPath("/articles")).toBe(true);
    expect(isMarketingPath("/contact")).toBe(true);
    expect(isMarketingPath("/login")).toBe(true);
    expect(isWorkspacePath("/")).toBe(false);
    expect(isWorkspacePath("/about")).toBe(false);
    expect(isWorkspacePath("/articles")).toBe(false);
    expect(isWorkspacePath("/hospice-sales-pro")).toBe(false);
  });

  it("normalizes trailing slashes and query for classification", () => {
    expect(normalizePath("/portal/")).toBe("/portal");
    expect(isWorkspacePath("/tools/objections?x=1")).toBe(true);
  });

  it("gates org and platform admin nav by role", () => {
    const rep = workspaceNavForRole("member");
    expect(rep.some((i) => i.id === "platform_admin")).toBe(false);
    expect(rep.some((i) => i.id === "org_admin")).toBe(false);

    const org = workspaceNavForRole("org_admin");
    expect(org.some((i) => i.id === "org_admin")).toBe(true);
    expect(org.some((i) => i.id === "platform_admin")).toBe(false);

    const plat = workspaceNavForRole("platform_admin");
    expect(plat.some((i) => i.id === "platform_admin")).toBe(true);
    expect(plat.some((i) => i.id === "org_admin")).toBe(true);
  });

  it("primary rail always includes Command Center and tools", () => {
    const primary = primaryWorkspaceNav("member");
    const ids = primary.map((i) => i.id);
    expect(ids).toContain("command");
    expect(ids).toContain("tools");
    expect(ids).toContain("resources");
    expect(ids).toContain("home");
    // no duplicate accounts in primary
    expect(ids.filter((id) => id === "accounts").length).toBe(0);
  });

  it("canAccessNavItem respects roles", () => {
    const adminItem = workspaceNavForRole("platform_admin").find(
      (i) => i.id === "platform_admin",
    )!;
    expect(canAccessNavItem(adminItem, "member")).toBe(false);
    expect(canAccessNavItem(adminItem, "platform_admin")).toBe(true);
    const home = workspaceNavForRole("member").find((i) => i.id === "home")!;
    expect(canAccessNavItem(home, "member")).toBe(true);
  });

  it("builds login return URL for expired session deep links", () => {
    expect(loginWithReturn("/tools/objections")).toBe(
      "/login?next=%2Ftools%2Fobjections",
    );
    expect(loginWithReturn("/login")).toBe("/login");
  });

  it("role helpers", () => {
    expect(isOrgAdminRole("org_admin")).toBe(true);
    expect(isOrgAdminRole("member")).toBe(false);
    expect(isPlatformAdminRole("platform_admin")).toBe(true);
  });

  it("org admin nav points at /org/admin workspace", () => {
    const nav = workspaceNavForRole("org_admin");
    const org = nav.find((i) => i.id === "org_admin");
    expect(org?.href).toBe("/org/admin");
    expect(org?.match("/org/admin")).toBe(true);
    expect(org?.match("/account")).toBe(false);
  });

  it("keeps the primary workspace rail unique and destination-owned", () => {
    const nav = workspaceNavForRole("member");
    expect(workspaceNavContractErrors(nav)).toEqual([]);
    expect(new Set(primaryWorkspaceNav("member").map((item) => item.id)).size).toBe(
      primaryWorkspaceNav("member").length,
    );
  });
});
