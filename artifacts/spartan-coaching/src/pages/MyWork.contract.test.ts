import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { MEMBER_NAV } from "@/lib/memberNav";
import { isWorkspacePath, workspaceNavForRole } from "@/lib/workspaceShell";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("authenticated web My Work parity", () => {
  it("is a first class paid workspace destination", () => {
    const nav = workspaceNavForRole("member").find((item) => item.id === "saved");
    expect(nav?.href).toBe("/my-work");
    expect(nav?.label).toBe("My Work");
    expect(nav?.match("/my-work/elite-outputs")).toBe(true);
    expect(isWorkspacePath("/my-work")).toBe(true);
    expect(MEMBER_NAV.some((item) => item.href === "/my-work")).toBe(true);
  });

  it("exposes every approved iPhone continuity collection on web", () => {
    const page = source("src/pages/MyWork.tsx");
    expect(page).toContain("/api/v1/member-continuity");
    expect(page).toContain("/api/v1/resource-work");
    expect(page).toContain("calculatorReports");
    expect(page).toContain("toolDrafts");
    expect(page).toContain("toolResults");
    expect(page).toContain("downloads");
    expect(page).toContain("continuity?.commitment?.value");
    expect(page).toContain("/my-work/elite-outputs");
  });

  it("keeps available saved work visible when one continuity service fails", () => {
    const page = source("src/pages/MyWork.tsx");
    expect(page).toContain("Promise.allSettled");
    expect(page).toContain('data-testid="my-work-partial-warning"');
    expect(page).toContain("Your resource work is still ready below");
    expect(page).toContain("Your other saved work is still ready below");
  });

  it("registers working My Work and Intelligence routes without merge debris", () => {
    const app = source("src/App.tsx");
    expect(app).toContain('<Route path="/my-work" component={GatedMyWork} />');
    expect(app).toContain('<Route path="/tools/intelligence" component={GatedSpartanIntelligence} />');
    expect(app).toContain('<Route path="/spartan-intelligence" component={GatedSpartanIntelligence} />');
    expect(app).not.toContain("/>\\n          <Route");
  });
});
