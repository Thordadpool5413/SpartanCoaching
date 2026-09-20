import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (relative: string) =>
  readFileSync(new URL(relative, import.meta.url), "utf8");

describe("Photo 1 homepage release contract", () => {
  it("keeps the public homepage consulting-first", () => {
    const home = read("../pages/Home.tsx");

    expect(home).toContain('className="home-photo-one');
    expect(home).toContain("Hospice growth consulting");
    expect(home).toContain("The problems we");
    expect(home).toContain("Diagnose. Install. Sustain.");
    expect(home).toContain("Consulting engagement");
    expect(home).toContain("Built by someone who has carried the number.");
    expect(home).toContain("Stop winging it.");
    expect(home).not.toContain("The gap is not clinical.");
    expect(home).not.toContain("Two ways to put it to work.");
    expect(home).not.toContain("Explore Hospice Sales Pro");
    expect(home).not.toContain("FieldBriefExperience");
  });

  it("preserves the large editorial hero and responsive mobile guardrails", () => {
    const home = read("../pages/Home.tsx");
    const css = read("../styles/field-intelligence.css");

    expect(home).toContain('className="home-photo-frame home-photo-hero-grid"');
    expect(home).toContain('className="home-photo-video');
    expect(css).toMatch(/\.home-photo-hero-grid\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1\.04fr\)\s+minmax\(480px,\s*0\.96fr\)/s);
    expect(css).toMatch(/@media \(max-width:\s*767px\)[\s\S]*?\.home-photo-hero-title\s*\{[^}]*max-width:\s*100%/s);
    expect(css).toMatch(/@media \(max-width:\s*767px\)[\s\S]*?\.home-photo-actions \.home-photo-button\s*\{[^}]*width:\s*100%/s);
  });
});
