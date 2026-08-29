import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
const coach = source("src/pages/Coach.tsx");
const app = source("src/App.tsx");
const memberNav = source("src/lib/memberNav.ts");
const openaiSource = source("../api-server/src/openai.ts");

describe("web and iPhone Coach parity", () => {
  it("uses the shared account conversation API", () => {
    expect(coach).toContain('"/api/v1/coach/conversations"');
    expect(coach).toContain("/api/v1/coach/conversations/${id}/messages");
    expect(coach).toContain("crypto.randomUUID()");
    expect(coach).toContain("Array.isArray(data.conversations)");
  });

  it("does not persist an empty model completion as coaching", () => {
    expect(openaiSource).toContain("OpenAI returned an empty completion");
    expect(openaiSource).toContain("returned an empty response after retry");
    expect(openaiSource).not.toContain("I could not finish that response. Try again without names or patient details.");
  });

  it("shows the retention and privacy contract", () => {
    expect(coach).toContain("90 days");
    expect(coach).toContain("Do not enter PHI");
    expect(coach).toContain("Private by default");
  });

  it("makes every coaching brief usable outside the chat window", () => {
    expect(coach).toContain("Your field coaching brief");
    expect(coach).toContain("copyResponse(message)");
    expect(coach).toContain("printResponse(message)");
    expect(openaiSource).toContain("## Best next move");
    expect(openaiSource).toContain("Put scripts in blockquotes");
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
