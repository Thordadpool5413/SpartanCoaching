import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
const coach = source("src/pages/Coach.tsx");
const app = source("src/App.tsx");
const memberNav = source("src/lib/memberNav.ts");

describe("web and iPhone Coach parity", () => {
  it("uses the shared account conversation API", () => {
    expect(coach).toContain('"/api/v1/coach/conversations"');
    expect(coach).toContain("/api/v1/coach/conversations/${id}/messages");
    expect(coach).toContain("crypto.randomUUID()");
  });

  it("shows the retention and privacy contract", () => {
    expect(coach).toContain("90 days");
    expect(coach).toContain("Do not enter PHI");
    expect(coach).toContain("Private by default");
  });

  it("routes workspace Coach navigation to the private product", () => {
    expect(app).toContain('<Route path="/portal/coach" component={Coach} />');
    expect(memberNav).toContain('href: "/portal/coach"');
    expect(memberNav).not.toContain('href: "/contact?service=Hospice+Sales+Pro+Debrief"');
  });

  it("does not force first time homepage visitors through welcome", () => {
    expect(app).not.toContain("function IntroGate");
    expect(app).not.toContain('setLocation("/welcome")');
  });
});
