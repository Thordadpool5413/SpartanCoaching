import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { primaryWorkspaceNav } from "@/lib/workspaceShell";
import { MEMBER_NAV } from "@/lib/memberNav";
import { US_STATES } from "@/lib/usStates";
import SpartanIntelligence from "./SpartanIntelligence";

vi.mock("@/components/FieldKitToolLayout", () => ({ FieldKitToolLayout: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
vi.mock("@/components/SEO", () => ({ SEO: () => null }));
vi.mock("@/components/medicare-platform/TrustedMedicarePlatform", () => ({ default: () => <div data-testid="trusted-medicare-platform">Full Medicare decision platform</div> }));

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

  it("renders the full trusted platform natively inside Spartan", () => {
    render(<SpartanIntelligence />);
    expect(screen.getByTestId("trusted-medicare-platform")).toBeTruthy();
    expect(document.querySelector("iframe")).toBeNull();
  });

  it("offers every United States market", () => {
    expect(US_STATES).toHaveLength(51);
    expect(US_STATES).toContainEqual(["DC", "District of Columbia"]);
  });
});
