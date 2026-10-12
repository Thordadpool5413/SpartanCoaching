import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const routes = fs.readFileSync(path.resolve(import.meta.dirname, "coachRoutes.ts"), "utf8");
const persist = routes.slice(
  routes.indexOf("async function persistTurn("),
  routes.indexOf("export function registerCoachRoutes("),
);

describe("Coach completed-turn activity contract", () => {
  it("refreshes conversation activity on every successfully saved turn", () => {
    expect(persist).toContain("updatedAt: new Date()");
    expect(persist).toContain("eq(coachConversations.id, input.conversationId)");
    expect(persist).toContain("eq(coachConversations.organizationId, input.organizationId)");
    expect(persist).toContain("eq(coachConversations.memberId, input.memberId)");
    // The activity update must not be gated by the default title.
    const update = persist.slice(persist.indexOf("await tx.update(coachConversations)"));
    const whereClause = update.slice(update.indexOf(".where(and("));
    expect(whereClause).not.toContain('eq(coachConversations.title, "New conversation")');
  });

  it("preserves named conversation titles after additional turns", () => {
    expect(persist).toContain("CASE WHEN");
    expect(persist).toContain("THEN ${input.user.slice(0, 80)}");
    expect(persist).toContain("ELSE ${coachConversations.title} END");
  });

  it("does not change the idempotent retry path or write an activity-only turn", () => {
    const route = routes.slice(routes.indexOf('"/api/v1/coach/conversations/:id/messages"'));
    expect(route).toContain("if (existing) return res.json({ message: existing, idempotent: true });");
    expect(route.indexOf("if (existing) return")).toBeLessThan(route.indexOf("await persistTurn("));
    expect(persist).toContain("await db.transaction(async (tx) =>");
  });
});
