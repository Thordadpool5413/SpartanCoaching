import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (relative: string) =>
  readFileSync(new URL(relative, import.meta.url), "utf8");

describe("consulting and workspace coexistence", () => {
  it("keeps the complete consulting route set public", () => {
    const app = read("../App.tsx");
    for (const route of ["/services", "/programs", "/method", "/contact"]) {
      expect(app).toContain(`path=\"${route}\"`);
    }
  });

  it("keeps one restrained consulting exit in the authenticated workspace footer", () => {
    const shell = read("./AppShell.tsx");
    expect(shell).not.toContain("consultingWorkspaceLinks");
    expect(shell).not.toContain('data-testid="workspace-to-consulting"');
    expect(shell).toContain('<Link href="/services">Consulting</Link>');
  });

  it("preserves the current workspace navigation and product routes", () => {
    const shell = read("./AppShell.tsx");
    const workspace = read("../lib/workspaceShell.ts");
    for (const label of ["Command Center", "Explore", "Coach", "My Work"]) {
      expect(workspace).toContain(label);
    }
    expect(shell).toContain("primaryWorkspaceNav");
    expect(workspace).toContain("/tools/sales-workflow");
  });

  it("routes the homepage consulting exploration to services", () => {
    const home = read("../pages/Home.tsx");
    expect(home).toMatch(/href=\"\/services\"[\s\S]{0,300}Explore consulting/);
    expect(home).toContain("View consulting services");
  });
});
