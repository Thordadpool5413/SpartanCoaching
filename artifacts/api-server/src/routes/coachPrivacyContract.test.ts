import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const routes = fs.readFileSync(path.resolve(import.meta.dirname, "coachRoutes.ts"), "utf8");
const openai = fs.readFileSync(path.resolve(import.meta.dirname, "../openai.ts"), "utf8");

describe("Spartan Coach privacy contract", () => {
  it("scopes conversation reads to organization and member ownership", () => {
    expect(routes).toContain("eq(coachConversations.organizationId, context.organizationId)");
    expect(routes).toContain("eq(coachConversations.memberId, context.memberId)");
  });

  it("shares only an explicit summary and commitments after identifier screening", () => {
    const shareRoute = routes.slice(routes.indexOf('app.post("/api/v1/coach/conversations/:id/share"'), routes.indexOf('app.get("/api/v1/coach/shared-summaries"'));
    expect(shareRoute).toContain("rejectIdentifiers");
    expect(shareRoute).toContain("summary: parsed.data.summary");
    expect(shareRoute).toContain("commitments: parsed.data.commitments");
    expect(shareRoute).not.toContain("coachMessages");
  });

  it("keeps memory opt in and separate from shared summaries", () => {
    expect(routes).toContain("memoryEnabled: z.boolean()");
    expect(routes).toContain("preference?.memoryEnabled");
    expect(routes).toContain("coachSharedSummaries");
  });

  it("requires Elite and removes raw conversations after 90 days", () => {
    expect(routes).toContain('app.use("/api/v1/coach", requireElite');
    expect(routes).toContain("90 * 24 * 60 * 60 * 1000");
    expect(routes).toContain("lt(coachConversations.updatedAt");
    expect(routes).toContain("runCoachRetentionSweep");
  });

  it("uses an honest identity with clinical and privacy boundaries", () => {
    const prompt = openai.slice(openai.indexOf("const SPARTAN_COACH_SYSTEM_INSTRUCTION"), openai.indexOf("export async function generateSpartanCoachResponse"));
    expect(prompt).toContain("private AI sales coaching assistant");
    expect(prompt).toContain("Managers receive only summaries and commitments");
    expect(prompt).toContain("Do not make patient eligibility");
    expect(prompt).not.toMatch(/world's leading|20\+ years/i);
  });
});
