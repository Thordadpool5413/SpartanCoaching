import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BrandBackdrop } from "./BrandBackdrop";
import { WorkspaceGuide } from "./WorkspaceGuide";
import { ExpandableText } from "./ui/ExpandableText";

const source = (relative: string) =>
  readFileSync(new URL(relative, import.meta.url), "utf8");

describe("REQ-UX-001 core workspace actions", () => {
  it("renders the decorative backdrop without exposing duplicate brand text", () => {
    render(<BrandBackdrop />);
    const backdrop = screen.getByTestId("brand-backdrop");
    expect(backdrop.getAttribute("aria-hidden")).toBe("true");
    expect(backdrop.querySelector("img")?.getAttribute("alt")).toBe("");
  });

  it.each([
    ["Home", "../components/elite/ElitePortalHome.tsx", /href=\{?['\"]\/(tools|portal)/],
    ["Command Center", "../pages/SalesWorkflow.tsx", /Open Tools/],
    ["Tools", "../pages/Tools.tsx", /button-tool-|Open Intelligence/],
    ["Resources", "../pages/Resources.tsx", /button-download-|Open My Work/],
    ["Coach", "../pages/Coach.tsx", /New conversation/],
  ])("%s exposes a forward action", (_name, file, actionPattern) => {
    expect(source(file)).toMatch(actionPattern as RegExp);
  });

  it("protects resource copy at small widths", () => {
    const css = source("../index.css");
    expect(css).toContain("overflow-wrap: anywhere");
    expect(css).toContain("hyphens: auto");
    expect(css).toContain("text-overflow: ellipsis");
  });

  it("gives first-time users three forward actions and a dismiss control", () => {
    render(<WorkspaceGuide />);
    expect(screen.getAllByRole("link")).toHaveLength(3);
    expect(screen.getByRole("button", { name: /dismiss workspace guide/i })).toBeTruthy();
  });

  it("makes long resource copy explicitly expandable", () => {
    render(<ExpandableText>{"Long resource guidance. ".repeat(20)}</ExpandableText>);
    const control = screen.getByRole("button", { name: /show more/i });
    expect(control.getAttribute("aria-expanded")).toBe("false");
  });

  it("keeps workspace improvements off unless the environment opts in", () => {
    expect(source("../lib/workspaceUxFlag.ts")).toContain('?? ""');
    expect(source("../lib/workspaceUxFlag.ts")).toMatch(/===\s*"true"/);
  });
});
