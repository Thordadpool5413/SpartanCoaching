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

  it("opens with the full field film before the editorial statement", () => {
    const home = read("../pages/Home.tsx");
    const indexCss = read("../index.css");
    const css = read("../styles/field-intelligence.css");

    expect(home).toContain('className="w-full aspect-video bg-black');
    expect(home.indexOf("<HeroSystemPanel />")).toBeLessThan(
      home.indexOf('data-testid="section-home-intro"'),
    );
    expect(home).toContain('className="relative w-full h-full overflow-hidden bg-black"');
    expect(indexCss).toContain('@import "./styles/field-intelligence.css";');
    expect(indexCss).toContain("family=Instrument+Serif");
    expect(indexCss).toContain("family=Plus+Jakarta+Sans");
    expect(css).toMatch(/\.home-photo-one\s*\{[^}]*--font-display:\s*'Plus Jakarta Sans'/s);
    expect(home).toContain("aspect-video");
    expect(home).toContain('className="flex flex-col sm:flex-row gap-4"');
  });
});
