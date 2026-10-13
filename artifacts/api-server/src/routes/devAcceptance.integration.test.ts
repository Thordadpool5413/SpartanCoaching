import { randomUUID } from "node:crypto";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { and, eq, inArray } from "drizzle-orm";
import {
  authEvents, clientMembers, clientOrganizations, clientSessions,
  coachConversations, coachMessages, coachPreferences, coachMemoryItems, coachSharedSummaries,
} from "@workspace/db";
import app from "../app";
import { hashPassword, hashToken } from "../auth/crypto";
import { db } from "../db";
import { persistTurn } from "./coachRoutes";

// This suite mutates synthetic fixtures only. A Cloud SQL or production URL MUST fail closed.
const requested = process.env.RUN_POSTGRES_INTEGRATION === "true";
if (requested) {
  const raw = process.env.DATABASE_URL;
  if (!raw || process.env.MIGRATION_ENVIRONMENT !== "synthetic") {
    throw new Error("DEV acceptance fixtures require a synthetic migration environment and DATABASE_URL");
  }
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error("Invalid acceptance DATABASE_URL"); }
  if (
    !["localhost", "127.0.0.1", "::1"].includes(url.hostname) ||
    !["ci", "test", "spartan_test"].includes(url.pathname.slice(1)) ||
    ["NODE_ENV", "DEPLOY_ENV", "APP_ENV"].some((key) => process.env[key] === "production")
  ) throw new Error("STOP: acceptance fixtures must use an allowlisted local synthetic database");
}

type Actor = { memberId: number; organizationId: number; email: string; token: string };
const auth = (token: string) => "Bearer " + token;

describe.runIf(requested)("DEV acceptance: real HTTP identity, access and Coach persistence", () => {
  const namespace = randomUUID();
  const orgIds: number[] = [];
  const memberIds: number[] = [];
  const actors: Record<string, Actor> = {};
  const password = "SyntheticOnly-" + randomUUID();

  beforeAll(async () => {
    const orgs = await db.insert(clientOrganizations).values([
      { name: "Acceptance Elite A " + namespace, type: "company", status: "active", billingPlan: "corporate_contract_elite", seatLimit: 2 },
      { name: "Acceptance Elite B " + namespace, type: "personal", status: "active", billingPlan: "individual_weekly_elite" },
      { name: "Acceptance Standard " + namespace, type: "personal", status: "active", billingPlan: "individual_weekly" },
      { name: "Acceptance Expired " + namespace, type: "personal", status: "expired", billingPlan: "individual_weekly_elite" },
    ]).returning({ id: clientOrganizations.id });
    orgIds.push(...orgs.map((row) => row.id));

    const labels = ["owner", "teammate", "foreign", "standard", "expired"] as const;
    const orgIndices = [0, 0, 1, 2, 3];
    const hashed = await hashPassword(password);
    const members = await db.insert(clientMembers).values(labels.map((label, i) => ({
      email: "acceptance-" + label + "-" + namespace + "@example.invalid",
      name: "Acceptance " + label,
      role: "member",
      organizationId: orgIds[orgIndices[i]],
      status: "active",
      passwordHash: hashed,
    }))).returning({ id: clientMembers.id, email: clientMembers.email, organizationId: clientMembers.organizationId });
    memberIds.push(...members.map((row) => row.id));

    await db.insert(clientSessions).values(members.map((member, index) => ({
      memberId: member.id,
      tokenHash: hashToken("acceptance-" + labels[index] + "-" + namespace),
      expiresAt: new Date(Date.now() + 3_600_000),
    })));
    members.forEach((member, index) => {
      actors[labels[index]] = {
        memberId: member.id, organizationId: member.organizationId, email: member.email,
        token: "acceptance-" + labels[index] + "-" + namespace,
      };
    });
  });

  afterAll(async () => {
    if (!orgIds.length) return;
    await db.delete(coachSharedSummaries).where(inArray(coachSharedSummaries.organizationId, orgIds));
    await db.delete(coachMessages).where(inArray(coachMessages.organizationId, orgIds));
    await db.delete(coachConversations).where(inArray(coachConversations.organizationId, orgIds));
    await db.delete(coachPreferences).where(inArray(coachPreferences.organizationId, orgIds));
    await db.delete(coachMemoryItems).where(inArray(coachMemoryItems.organizationId, orgIds));
    if (memberIds.length) {
      await db.delete(authEvents).where(inArray(authEvents.memberId, memberIds));
      await db.delete(clientSessions).where(inArray(clientSessions.memberId, memberIds));
    }
    await db.delete(clientMembers).where(inArray(clientMembers.organizationId, orgIds));
    await db.delete(clientOrganizations).where(inArray(clientOrganizations.id, orgIds));
  });

  it("fails closed for anonymous and invalid sessions on private API routes", async () => {
    for (const path of [
      "/api/auth/me", "/api/billing/status", "/api/me/onboarding",
      "/api/v1/coach/conversations", "/api/v1/coach/preferences",
    ]) {
      expect((await request(app).get(path)).status, path).toBe(401);
      expect((await request(app).get(path).set("Authorization", auth("invalid-synthetic"))).status, path).toBe(401);
    }
    expect((await request(app).post("/api/v1/coach/conversations").send({})).status).toBe(401);
  });

  it("verifies mobile Bearer and web cookie auth, onboarding, logout and session revocation", async () => {
    const owner = actors.owner;
    const login = await request(app).post("/api/auth/login").send({ email: owner.email, password });
    expect(login.status).toBe(200);
    expect(login.body.member.id).toBe(owner.memberId);
    expect(login.body.fieldKit.allowed).toBe(true);
    expect(login.body.token).toBeTypeOf("string");
    const cookie = (login.headers["set-cookie"] as string[] | undefined)?.[0]?.split(";")[0];
    expect(cookie).toMatch(/^spartan_session=/);
    const mobile = await request(app).get("/api/auth/me").set("Authorization", auth(login.body.token));
    const web = await request(app).get("/api/auth/me").set("Cookie", cookie!);
    expect(mobile.status).toBe(200);
    expect(web.status).toBe(200);
    expect(mobile.body.member.id).toBe(owner.memberId);
    expect(web.body.member.id).toBe(owner.memberId);
    expect(mobile.body.fieldKit).toEqual(web.body.fieldKit);
    expect((await request(app).get("/api/me/onboarding").set("Authorization", auth(login.body.token))).status).toBe(200);
    const logout = await request(app).post("/api/auth/logout").set("Authorization", auth(login.body.token));
    expect(logout.status).toBe(200);
    expect(logout.body.ok).toBe(true);
    expect((await request(app).get("/api/auth/me").set("Authorization", auth(login.body.token))).status).toBe(401);
    expect((await request(app).get("/api/auth/me").set("Cookie", cookie!)).status).toBe(401);
  });

  it("rejects expired tokens and protects Standard, Elite and expired billing tiers", async () => {
    const expiredToken = "expired-session-" + namespace;
    await db.insert(clientSessions).values({
      memberId: actors.owner.memberId,
      tokenHash: hashToken(expiredToken),
      expiresAt: new Date(Date.now() - 60_000),
    });
    expect((await request(app).get("/api/auth/me").set("Authorization", auth(expiredToken))).status).toBe(401);

    for (const label of ["owner", "standard", "expired"] as const) {
      const actor = actors[label];
      const me = await request(app).get("/api/auth/me").set("Authorization", auth(actor.token));
      const billing = await request(app).get("/api/billing/status").set("Authorization", auth(actor.token));
      const coach = await request(app).get("/api/v1/coach/conversations").set("Authorization", auth(actor.token));
      expect(me.status, label).toBe(200);
      expect(billing.status, label).toBe(200);
      expect(me.body.member.id).toBe(actor.memberId);
      expect(billing.body.organization.id).toBe(actor.organizationId);
      expect(JSON.stringify(billing.body)).not.toMatch(/passwordHash|stripeSecretKey|clientSecret/i);
      if (label === "owner") {
        expect(me.body.fieldKit.allowed).toBe(true);
        expect(coach.status).toBe(200);
      } else if (label === "standard") {
        expect(me.body.fieldKit.allowed).toBe(true);
        expect(coach.status).toBe(403);
        expect(coach.body.code).toBe("ELITE_REQUIRED");
      } else {
        expect(me.body.fieldKit.allowed).toBe(false);
        expect(coach.status).toBe(403);
        expect(coach.body.code).toBe("FIELD_KIT_DENIED");
      }
    }
  });

  it("prevents cross-tenant and same-tenant Coach access to another member's data", async () => {
    const owner = actors.owner;
    const created = await request(app).post("/api/v1/coach/conversations")
      .set("Authorization", auth(owner.token)).send({ title: "Private synthetic planning" });
    expect(created.status).toBe(201);
    const id = created.body.conversation.id as string;
    const pref = await request(app).put("/api/v1/coach/preferences")
      .set("Authorization", auth(owner.token))
      .send({ memoryEnabled: false, responseStyle: "concise" });
    expect(pref.status).toBe(200);

    for (const label of ["teammate", "foreign"] as const) {
      const actor = actors[label];
      const list = await request(app).get("/api/v1/coach/conversations").set("Authorization", auth(actor.token));
      const detail = await request(app).get("/api/v1/coach/conversations/" + id).set("Authorization", auth(actor.token));
      const deletion = await request(app).delete("/api/v1/coach/conversations/" + id).set("Authorization", auth(actor.token));
      const prefs = await request(app).get("/api/v1/coach/preferences").set("Authorization", auth(actor.token));
      expect(list.status).toBe(200);
      expect(list.body.conversations).toEqual([]);
      expect(detail.status).toBe(404);
      expect(deletion.status).toBe(404);
      expect(prefs.status).toBe(200);
      expect(prefs.body.preference.responseStyle).toBe("balanced");
    }
    expect((await request(app).get("/api/v1/coach/conversations/" + id)
      .set("Authorization", auth(owner.token))).status).toBe(200);
  });

  it("stores completed turns, avoids duplicate messages, retains titles and refreshes history order", async () => {
    const owner = actors.owner;
    const older = await request(app).post("/api/v1/coach/conversations")
      .set("Authorization", auth(owner.token)).send({ title: "Existing custom title" });
    const newer = await request(app).post("/api/v1/coach/conversations")
      .set("Authorization", auth(owner.token)).send({ title: "Another conversation" });
    expect(older.status).toBe(201);
    expect(newer.status).toBe(201);
    const id = older.body.conversation.id as string;
    const otherId = newer.body.conversation.id as string;
    const secondTimestamp = new Date(Date.now() - 60_000);
    await db.update(coachConversations).set({ updatedAt: new Date(Date.now() - 86_400_000) }).where(eq(coachConversations.id, id));
    await db.update(coachConversations).set({ updatedAt: secondTimestamp }).where(eq(coachConversations.id, otherId));
    const requestId = randomUUID();
    const input = {
      conversationId: id, requestId, organizationId: owner.organizationId, memberId: owner.memberId,
      user: "Synthetic question", assistant: "Synthetic answer",
    };
    await persistTurn(input);
    await persistTurn(input);
    await persistTurn({ ...input, requestId: randomUUID(), user: "Synthetic follow-up", assistant: "Synthetic second answer" });
    const history = await request(app).get("/api/v1/coach/conversations").set("Authorization", auth(owner.token));
    expect(history.status).toBe(200);
    expect(history.body.conversations[0].id).toBe(id);
    expect(history.body.conversations[0].title).toBe("Existing custom title");
    expect(new Date(history.body.conversations[0].updatedAt).getTime()).toBeGreaterThan(secondTimestamp.getTime());
    const reopened = await request(app).get("/api/v1/coach/conversations/" + id).set("Authorization", auth(owner.token));
    expect(reopened.status).toBe(200);
    expect(reopened.body.messages).toHaveLength(4);
    expect(reopened.body.messages.map((m: { content: string }) => m.content)).toEqual(
      expect.arrayContaining(["Synthetic question", "Synthetic answer", "Synthetic follow-up", "Synthetic second answer"]),
    );
    const dbRows = await db.select().from(coachMessages).where(and(
      eq(coachMessages.conversationId, id),
      eq(coachMessages.organizationId, owner.organizationId),
      eq(coachMessages.memberId, owner.memberId),
    ));
    expect(dbRows).toHaveLength(4);
  });
});
