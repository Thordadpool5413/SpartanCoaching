import { test, expect } from "vitest";
import {
  appendEphemeralRoleplayMessage,
  clearEphemeralRoleplaySessionsForTest,
  createEphemeralRoleplaySession,
  finishEphemeralRoleplaySession,
  getEphemeralRoleplaySession,
} from "../ephemeralRoleplay";

/**
 * Pure ownership helpers mirrored by the tenant-safe roleplay route layer.
 * Keeps the security contract unit-testable without a live DB.
 */

type OwnedSession = {
  id: number;
  memberId: number | null;
  organizationId: number | null;
  status: string;
};

function isTenantOwned(session: OwnedSession | undefined | null): session is OwnedSession & {
  memberId: number;
  organizationId: number;
} {
  return Boolean(session && session.memberId != null && session.organizationId != null);
}

function canMemberAccess(
  session: OwnedSession | undefined | null,
  memberId: number,
  isPlatformAdmin: boolean,
): boolean {
  if (!isTenantOwned(session)) return false;
  if (isPlatformAdmin) return true;
  return session.memberId === memberId;
}

function canMemberMutate(session: OwnedSession | undefined | null, memberId: number): boolean {
  if (!isTenantOwned(session)) return false;
  return session.memberId === memberId;
}

test("legacy unowned sessions are never readable", () => {
  const legacy: OwnedSession = {
    id: 1,
    memberId: null,
    organizationId: null,
    status: "completed",
  };
  expect(isTenantOwned(legacy)).toBe(false);
  expect(canMemberAccess(legacy, 42, false)).toBe(false);
  expect(canMemberAccess(legacy, 42, true)).toBe(false);
  expect(canMemberMutate(legacy, 42)).toBe(false);
});

test("member can only access own tenant-owned sessions", () => {
  const own: OwnedSession = {
    id: 2,
    memberId: 10,
    organizationId: 5,
    status: "active",
  };
  const other: OwnedSession = {
    id: 3,
    memberId: 99,
    organizationId: 5,
    status: "active",
  };
  expect(canMemberAccess(own, 10, false)).toBe(true);
  expect(canMemberAccess(other, 10, false)).toBe(false);
  expect(canMemberMutate(own, 10)).toBe(true);
  expect(canMemberMutate(other, 10)).toBe(false);
});

test("platform admin can read owned sessions but mutate only as owner", () => {
  const session: OwnedSession = {
    id: 4,
    memberId: 10,
    organizationId: 5,
    status: "completed",
  };
  expect(canMemberAccess(session, 1, true)).toBe(true);
  expect(canMemberMutate(session, 1)).toBe(false);
  expect(canMemberMutate(session, 10)).toBe(true);
});

test("missing session is denied", () => {
  expect(canMemberAccess(undefined, 1, true)).toBe(false);
  expect(canMemberMutate(null, 1)).toBe(false);
});

test("session-only role-play content is inaccessible after feedback", () => {
  clearEphemeralRoleplaySessionsForTest();
  const session = createEphemeralRoleplaySession({
    memberId: 10,
    organizationId: 5,
    scenarioId: "intake",
    scenarioTitle: "Intake conversation",
    scenarioDescription: "Private scenario detail",
    status: "active",
  });
  appendEphemeralRoleplayMessage(session, {
    role: "user",
    content: "Private member message",
  });

  expect(getEphemeralRoleplaySession(session.id, 10, 5)?.messages).toEqual([
    { role: "user", content: "Private member message" },
  ]);
  expect(getEphemeralRoleplaySession(session.id, 99, 5)).toBeUndefined();

  const completed = finishEphemeralRoleplaySession(session, "Private generated feedback", 4);
  expect(completed.feedback).toBe("Private generated feedback");
  expect(getEphemeralRoleplaySession(session.id, 10, 5)).toBeUndefined();
});
