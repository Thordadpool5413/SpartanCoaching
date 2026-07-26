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
});
