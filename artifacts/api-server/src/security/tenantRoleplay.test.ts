import assert from "node:assert/strict";
import { test } from "node:test";

/**
 * Pure ownership helpers mirrored by the tenant-safe roleplay route layer.
 * Keeps the security contract unit-testable without a live DB.
 * Uses node:test so it runs under both `node --test` and vitest (when configured).
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
  assert.equal(isTenantOwned(legacy), false);
  assert.equal(canMemberAccess(legacy, 42, false), false);
  assert.equal(canMemberAccess(legacy, 42, true), false);
  assert.equal(canMemberMutate(legacy, 42), false);
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
  assert.equal(canMemberAccess(own, 10, false), true);
  assert.equal(canMemberAccess(other, 10, false), false);
  assert.equal(canMemberMutate(own, 10), true);
  assert.equal(canMemberMutate(other, 10), false);
});

test("platform admin can read owned sessions but mutate only as owner", () => {
  const session: OwnedSession = {
    id: 4,
    memberId: 10,
    organizationId: 5,
    status: "completed",
  };
  assert.equal(canMemberAccess(session, 1, true), true);
  // Mutations always require ownership — admin analytics are read-only here.
  assert.equal(canMemberMutate(session, 1), false);
  assert.equal(canMemberMutate(session, 10), true);
});

test("missing session is denied", () => {
  assert.equal(canMemberAccess(undefined, 1, true), false);
  assert.equal(canMemberMutate(null, 1), false);
});
