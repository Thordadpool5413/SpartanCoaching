import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BrandBackdrop } from "./BrandBackdrop";

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
});
