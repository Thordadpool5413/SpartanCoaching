import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { primaryWorkspaceNav } from "@/lib/workspaceShell";
import { MEMBER_NAV } from "@/lib/memberNav";
import { US_STATES } from "@/lib/usStates";
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
  HospiceMarketPanel: ({ onCompare, onDecide }: { onCompare?: (ccn: string) => void; onDecide?: (ccn: string) => void }) => <div data-testid="market-panel">Market workspace<button onClick={() => onCompare?.("123456")}>Send to compare</button><button onClick={() => onDecide?.("123456")}>Send to decision</button></div>,
}));
vi.mock("@/components/MedicareDecisionPanel", () => ({
  MedicareDecisionPanel: ({ initialCcn }: { initialCcn?: string }) => <div data-testid="decision-panel">Decision workspace {initialCcn}</div>,
}));
vi.mock("@/components/MedicareCommandCenter", () => ({
  MedicareCommandCenter: () => <div data-testid="command-center">Command Center</div>,
}));
vi.mock("@/components/MedicareComparePanel", () => ({
  MedicareComparePanel: ({ initialCcn }: { initialCcn?: string }) => <div data-testid="compare-panel">Compare workspace {initialCcn}</div>,
}));

afterEach(cleanup);

describe("Spartan Intelligence workspace contract", () => {
  it("is a visible primary workspace destination", () => {
    const nav = primaryWorkspaceNav("member");
    const tools = nav.find((item) => item.href === "/tools" && item.label === "Tools");
    const hub = nav.find((item) => item.href === "/tools/intelligence");
    expect(hub?.label).toBe("Medicare Hub");
    expect(hub?.match("/tools/intelligence")).toBe(true);
    expect(tools?.match("/tools/intelligence")).toBe(false);
  });

  it("is a dedicated member destination instead of being hidden under Tools", () => {
    const intelligence = MEMBER_NAV.find((item) => item.href === "/tools/intelligence");
    const tools = MEMBER_NAV.find((item) => item.href === "/tools");
    expect(intelligence?.match("/tools/intelligence")).toBe(true);
    expect(tools?.match("/tools/intelligence")).toBe(false);
  });

  it("switches between every native intelligence mission", () => {
    render(<SpartanIntelligence />);

    expect(screen.getByTestId("command-center")).toBeTruthy();
    fireEvent.click(screen.getByTestId("intelligence-mission-referral"));
    expect(screen.getByTestId("referral-panel")).toBeTruthy();
    fireEvent.click(screen.getByTestId("intelligence-mission-policy"));
    expect(screen.getByTestId("policy-panel")).toBeTruthy();
    expect(screen.queryByTestId("referral-panel")).toBeNull();

    fireEvent.click(screen.getByTestId("intelligence-mission-market"));
    expect(screen.getByTestId("market-panel")).toBeTruthy();
    expect(screen.queryByTestId("policy-panel")).toBeNull();

    fireEvent.click(screen.getByTestId("intelligence-mission-decision"));
    expect(screen.getByTestId("decision-panel")).toBeTruthy();
    expect(screen.queryByTestId("market-panel")).toBeNull();

    fireEvent.click(screen.getByTestId("intelligence-mission-compare"));
    expect(screen.getByTestId("compare-panel")).toBeTruthy();
  });

  it("labels evidence and guidance so users can judge every answer", () => {
    render(<SpartanIntelligence />);

    expect(screen.getByText("Verified fact")).toBeTruthy();
    expect(screen.getByText("Calculated result")).toBeTruthy();
    expect(screen.getByText("Coach guidance")).toBeTruthy();
    expect(screen.getByText("Missing evidence")).toBeTruthy();
  });

  it("carries the selected provider from Market into Compare and Decision", () => {
    render(<SpartanIntelligence />);
    fireEvent.click(screen.getByTestId("intelligence-mission-market"));
    fireEvent.click(screen.getByRole("button", { name: "Send to compare" }));
    expect(screen.getByTestId("compare-panel").textContent).toContain("123456");
    fireEvent.click(screen.getByTestId("intelligence-mission-market"));
    fireEvent.click(screen.getByRole("button", { name: "Send to decision" }));
    expect(screen.getByTestId("decision-panel").textContent).toContain("123456");
  });

  it("keeps the CMS workflows native to the Spartan workspace", () => {
    render(<SpartanIntelligence />);

    expect(screen.getByText("Command Center")).toBeTruthy();
    expect(screen.getByTestId("intelligence-mission-compare")).toBeTruthy();
    expect(document.querySelector("iframe")).toBeNull();
  });

  it("offers the complete United States state selector", () => {
    expect(US_STATES).toHaveLength(51);
    expect(US_STATES).toContainEqual(["DC", "District of Columbia"]);
    expect(new Set(US_STATES.map(([code]) => code)).size).toBe(51);
  });
});
