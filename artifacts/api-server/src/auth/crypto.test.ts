import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, hashToken, generateToken, safeEqualString } from "./crypto.ts";

describe("auth/crypto", () => {
  it("hashes and verifies passwords", async () => {
    const hash = await hashPassword("Spartan-Test-Pass-99");
    expect(hash.includes(":")).toBe(true);
    expect(await verifyPassword("Spartan-Test-Pass-99", hash)).toBe(true);
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("rejects malformed stored hashes", async () => {
    expect(await verifyPassword("x", "not-a-hash")).toBe(false);
    expect(await verifyPassword("x", "")).toBe(false);
  });

  it("generates unique tokens and stable token hashes", () => {
    const a = generateToken(16);
    const b = generateToken(16);
    expect(a).not.toBe(b);
    expect(hashToken(a)).toBe(hashToken(a));
    expect(hashToken(a)).not.toBe(hashToken(b));
  });

  it("compares strings safely", () => {
    expect(safeEqualString("admin-secret", "admin-secret")).toBe(true);
    expect(safeEqualString("admin-secret", "admin-secreX")).toBe(false);
    expect(safeEqualString("short", "longer-value")).toBe(false);
  });
});
