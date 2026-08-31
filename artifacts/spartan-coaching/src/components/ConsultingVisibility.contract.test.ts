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

  it("keeps consulting visible inside the authenticated workspace", () => {
    const shell = read("./AppShell.tsx");
    expect(shell).toContain("Consulting services");
    expect(shell).toContain("Programs & workshops");
    expect(shell).toContain("Book a strategy call");
    expect(shell).toContain("workspace-to-consulting");
  });

  it("preserves the current workspace navigation and product routes", () => {
    const shell = read("./AppShell.tsx");
    const workspace = read("../lib/workspaceShell.ts");
    for (const label of ["Command Center", "Intelligence", "Tools", "Resources", "Learn", "Coach", "My Work"]) {
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
