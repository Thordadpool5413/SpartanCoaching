import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (relative: string) =>
  readFileSync(new URL(relative, import.meta.url), "utf8");

describe("web typography readability contracts", () => {
  it("keeps the approved homepage statement and hero media contract", () => {
    const home = read("../pages/Home.tsx");

    expect(home).toContain("Make the next<br/>");
    expect(home).toContain('hospice <span className="text-primary">conversation</span><br/>');
    expect(home).toContain("count.");
    expect(home).toContain('data-testid="hero-video"');
    expect(home).toContain('data-testid="hero-video-status"');
    expect(home).toContain('<source src="/hero-video-mobile.webm"');
    expect(home).toContain('<source src="/hero-video.webm"');
    expect(home).toContain('<source src="/hero-video-mobile.mp4"');
    expect(home).toContain('<source src="/hero-video.mp4"');
    expect(home).toContain('poster="/hero-poster.jpg"');
  });

  it("uses readable leading for the highest-risk public display text", () => {
    const home = read("../pages/Home.tsx");
    const manifesto = read("../pages/Manifesto.tsx");
    const css = read("../index.css");

    expect(home).toContain("leading-[1.08]");
    expect(home).toMatch(/section-founder-authority[\s\S]*?text-background[\s\S]*?text-background\/80[\s\S]*?link-founder-story/s);
    expect(manifesto).not.toContain("leading-[0.9]");
    expect(manifesto).toContain("leading-[1.1]");
    expect(manifesto).toContain("justify-center bg-foreground overflow-hidden");
    expect(manifesto).toContain("font-black text-background leading-[1.1]");
    expect(css).toMatch(/\.page-persuasion h1\.font-display\s*\{[^}]*line-height:\s*1\.08/s);
    expect(css).toMatch(/\.field-brief-artifact h5\s*\{[^}]*line-height:\s*1\.1/s);
  });

  it("keeps workspace headings, search, and onboarding readable on narrow screens", () => {
    const css = read("../styles/workspace.css");
    const globalCss = read("../index.css");
    const shell = read("../components/AppShell.tsx");

    expect(css).toMatch(/\.field-greeting\s*\{[^}]*line-height:\s*1\.04/s);
    expect(css).toMatch(/\.field-objective-heading\s*\{[^}]*line-height:\s*1\.08/s);
    expect(css).toMatch(/\.field-search-input\s*\{[^}]*font-size:\s*13px/s);
    expect(css).toMatch(/\.field-search-result-desc\s*\{[^}]*-webkit-line-clamp:\s*2/s);
    expect(globalCss).toMatch(/@media \(max-width: 768px\)\s*\{[\s\S]*?\.workspace-onboarding-strip\s*\{[^}]*grid-template-columns:\s*1fr/s);
    expect(globalCss).toMatch(/@media \(max-width: 768px\)\s*\{[\s\S]*?\.tools-search-dock,[\s\S]*?\.resources-library-dock\s*\{[^}]*top:\s*124px/s);
    expect(globalCss).not.toMatch(/@media \(max-width: 640px\)\s*\{[\s\S]*?\.tools-search-dock[^}]*top:\s*64px/s);
    expect(shell).not.toContain("text-[9px]");
  });
});