import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RequireFieldKit } from "./RequireFieldKit";

const auth = vi.hoisted(() => ({
  value: {
    isLoading: false,
    canUseFieldKit: true,
    member: { role: "member" },
    organization: { type: "individual", billingPlan: "field_kit_weekly" },
  },
}));

vi.mock("@/context/AuthContext", () => ({ useAuth: () => auth.value }));
vi.mock("wouter", () => ({
  useLocation: () => ["/tools/intelligence"],
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));
vi.mock("@workspace/field-kit-catalog", () => ({
  hasEliteMembership: ({ billingPlan, memberRole }: { billingPlan?: string; memberRole?: string }) =>
    memberRole === "platform_admin" || billingPlan === "field_kit_elite_weekly",
}));
vi.mock("@workspace/spartan-ai-tools", () => ({ getSpartanAiTool: () => null }));
vi.mock("@/components/FieldKitPreviewLock", () => ({ FieldKitPreviewLock: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/components/ToolDisclaimer", () => ({ ToolDisclaimer: () => <div>Disclaimer</div> }));
vi.mock("@/components/ClinicalToolDisclaimer", () => ({ ClinicalToolDisclaimer: () => null }));
vi.mock("@/components/RouteRecovery", () => ({ PageLoadingState: () => null }));

afterEach(() => {
  cleanup();
  auth.value.organization.billingPlan = "field_kit_weekly";
});

describe("RequireFieldKit Elite access", () => {
  it("stops a standard member before the Medicare API can reject every request", () => {
    render(<RequireFieldKit tier="elite"><div>Medicare runtime</div></RequireFieldKit>);

    expect(screen.getByTestId("elite-access-gate")).toBeTruthy();
    expect(screen.queryByText("Medicare runtime")).toBeNull();
    expect(screen.getByRole("link", { name: "Upgrade to Elite" }).getAttribute("href")).toContain("plan=elite_weekly");
  });

  it("renders the workspace for an Elite member", () => {
    auth.value.organization.billingPlan = "field_kit_elite_weekly";
    render(<RequireFieldKit tier="elite"><div>Medicare runtime</div></RequireFieldKit>);

    expect(screen.getByText("Medicare runtime")).toBeTruthy();
    expect(screen.queryByTestId("elite-access-gate")).toBeNull();
  });
});
