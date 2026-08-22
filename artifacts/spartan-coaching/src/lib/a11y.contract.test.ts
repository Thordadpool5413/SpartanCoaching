/**
 * Wave 4b — static a11y contracts for elite surfaces.
 * Guards against regressions that remove skip targets or landmarks.
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const srcRoot = path.resolve(import.meta.dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(srcRoot, rel), "utf8");
}

describe("a11y contracts (source-level)", () => {
  it("App provides skip link and main landmark id", () => {
    const app = read("App.tsx");
    expect(app).toMatch(/skip-link/);
    expect(app).toMatch(/id="main-content"/);
    expect(app).toMatch(/Skip to main content/);
  });

  it("CSS defines skip-link and focus-visible styles", () => {
    const css = read("index.css");
    expect(css).toMatch(/\.skip-link/);
    expect(css).toMatch(/:focus-visible/);
    expect(css).toMatch(/prefers-reduced-motion/);
  });

  it("header brand mark is not a document h1 (page owns h1)", () => {
    const layout = read("components/Layout.tsx");
    // Logo should not steal the page heading level
    expect(layout).not.toMatch(/data-testid="link-home"[\s\S]{0,200}<h1/);
    expect(layout).toMatch(/SPARTAN COACHING/);
  });

  it("Portal mission control exposes a region label id", () => {
    const portal = read("pages/Portal.tsx");
    expect(portal).toMatch(/section-mission-next/);
    expect(portal).toMatch(/portal-next-action-heading/);
    expect(portal).toMatch(/aria-live/);
  });

  it("Account Day Zero is a labeled region", () => {
    const day = read("components/AccountDayZero.tsx");
    expect(day).toMatch(/day-zero-heading/);
    expect(day).toMatch(/role="region"/);
  });

  it("nav dropdowns are keyboard-operable (aria-expanded + menu)", () => {
    const layout = read("components/Layout.tsx");
    expect(layout).toMatch(/aria-expanded/);
    expect(layout).toMatch(/aria-haspopup="menu"/);
    expect(layout).toMatch(/role="menu"/);
    expect(layout).toMatch(/role="menuitem"/);
    expect(layout).toMatch(/Escape/);
  });

  it("Home hero uses semantic copy without a decorative stock portrait", () => {
    const home = read("pages/Home.tsx");
    expect(home).toMatch(/<h1/);
    expect(home).toMatch(/Book a strategy call/);
    expect(home).toMatch(/aria-label="Spartan Coaching point of view"/);
    expect(home).not.toMatch(/nickPhoto|founder photo|stock photo/i);
  });

  it("animation primitives honor prefers-reduced-motion", () => {
    const anim = read("components/animations.tsx");
    expect(anim).toMatch(/prefersReducedMotion/);
    // All major motion wrappers short-circuit when reduce is true
    expect(anim).toMatch(/if \(reduce\)/);
    expect((anim.match(/if \(reduce\)/g) || []).length).toBeGreaterThanOrEqual(
      4,
    );
  });

  it("AI tool clinical pages hide marketing chrome when PHI", () => {
    const tool = read("pages/AiTool.tsx");
    expect(tool).toMatch(/showChrome=\{!tool\.containsPhi\}/);
  });

  // —— HSP-35 extensions ——
  it("paid AppShell exposes navigation landmark and search label", () => {
    const shell = read("components/AppShell.tsx");
    expect(shell).toMatch(/aria-label="Workspace navigation"/);
    expect(shell).toMatch(/aria-label="Universal workspace search"/);
    expect(shell).toMatch(/data-testid="app-shell"/);
  });

  it("login associates labels with inputs", () => {
    const login = read("pages/Login.tsx");
    expect(login).toMatch(/htmlFor="email"/);
    expect(login).toMatch(/id="email"/);
    expect(login).toMatch(/htmlFor="password"/);
    expect(login).toMatch(/id="password"/);
    expect(login).toMatch(/role="tablist"/);
  });

  it("ToolResultPanel announces loading and result to assistive tech", () => {
    const panel = read("components/ToolResultPanel.tsx");
    expect(panel).toMatch(/aria-busy/);
    expect(panel).toMatch(/aria-live/);
    expect(panel).toMatch(/role="region"/);
  });

  it("StateBlock uses alert/status for system feedback", () => {
    const block = read("components/StateBlock.tsx");
    expect(block).toMatch(/"alert"/);
    expect(block).toMatch(/"status"/);
    expect(block).toMatch(/aria-live/);
    expect(block).toMatch(/assertive/);
  });

  it("a11y module documents manual verification for all surfaces", () => {
    const mod = read("lib/a11y.ts");
    expect(mod).toMatch(/A11Y_MANUAL_VERIFICATION/);
    expect(mod).toMatch(/ios_native/);
    expect(mod).toMatch(/generated_documents/);
    expect(mod).toMatch(/validateDocumentStructure/);
  });
});
