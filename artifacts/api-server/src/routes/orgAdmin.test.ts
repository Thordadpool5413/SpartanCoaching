/**
 * Org admin route contracts — pure policy is covered in orgAdminPolicy.test.ts.
 * This file keeps a thin smoke import so CI package filters that target
 * orgAdmin.test.ts still resolve.
 */
import { describe, expect, it } from "vitest";
import {
  isAssignableOrgRole,
  resolveSeatCap,
  seatLimitReached,
} from "../auth/orgAdminPolicy";

describe("org admin route policy surface", () => {
  it("exposes seat + role gates used by /api/org/* handlers", () => {
    expect(isAssignableOrgRole("org_admin")).toBe(true);
    expect(resolveSeatCap({ seatLimit: 10, billableSeats: 3 })).toBe(3);
    expect(seatLimitReached(3, 3)).toBe(true);
  });
});
