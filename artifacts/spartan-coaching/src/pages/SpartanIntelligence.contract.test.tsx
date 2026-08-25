import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { primaryWorkspaceNav } from "@/lib/workspaceShell";
import { MEMBER_NAV } from "@/lib/memberNav";
import SpartanIntelligence from "./SpartanIntelligence";

vi.mock("@/components/FieldKitToolLayout", () => ({
  FieldKitToolLayout: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));
vi.mock("@/components/SEO", () => ({ SEO: () => null }));
vi.mock("@/components/NpiLookupPanel", () => ({
  NpiLookupPanel: () => <div data-testid="referral-panel">Referral workspace</div>,
}));
vi.mock("@/components/PolicyNavigatorPanel", () => ({
  PolicyNavigatorPanel: () => <div data-testid="policy-panel">Policy workspace</div>,
}));
vi.mock("@/components/HospiceMarketPanel", () => ({
  HospiceMarketPanel: () => <div data-testid="market-panel">Market workspace</div>,
}));

afterEach(cleanup);

describe("Spartan Intelligence workspace contract", () => {
  it("is a first class destination in the paid workspace", () => {
    const nav = primaryWorkspaceNav("member");
    expect(nav.some((item) => item.href === "/tools/intelligence" && item.label === "Intelligence")).toBe(true);
  });

  it("is a dedicated member destination instead of being hidden under Tools", () => {
    const intelligence = MEMBER_NAV.find((item) => item.href === "/tools/intelligence");
    const tools = MEMBER_NAV.find((item) => item.href === "/tools");
    expect(intelligence?.match("/tools/intelligence")).toBe(true);
    expect(tools?.match("/tools/intelligence")).toBe(false);
  });

  it("switches between the three working intelligence missions", () => {
    render(<SpartanIntelligence />);

    expect(screen.getByTestId("referral-panel")).toBeTruthy();
    fireEvent.click(screen.getByTestId("intelligence-mission-policy"));
    expect(screen.getByTestId("policy-panel")).toBeTruthy();
    expect(screen.queryByTestId("referral-panel")).toBeNull();

    fireEvent.click(screen.getByTestId("intelligence-mission-market"));
    expect(screen.getByTestId("market-panel")).toBeTruthy();
    expect(screen.queryByTestId("policy-panel")).toBeNull();
  });
});
