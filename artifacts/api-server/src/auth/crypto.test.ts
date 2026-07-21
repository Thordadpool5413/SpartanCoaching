import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword, hashToken, generateToken, safeEqualString } from "./crypto.ts";

describe("auth/crypto", () => {
  it("hashes and verifies passwords", async () => {
    const hash = await hashPassword("Spartan-Test-Pass-99");
    assert.ok(hash.includes(":"));
    assert.equal(await verifyPassword("Spartan-Test-Pass-99", hash), true);
    assert.equal(await verifyPassword("wrong-password", hash), false);
  });

  it("rejects malformed stored hashes", async () => {
    assert.equal(await verifyPassword("x", "not-a-hash"), false);
    assert.equal(await verifyPassword("x", ""), false);
  });

  it("generates unique tokens and stable token hashes", () => {
    const a = generateToken(16);
    const b = generateToken(16);
    assert.notEqual(a, b);
    assert.equal(hashToken(a), hashToken(a));
    assert.notEqual(hashToken(a), hashToken(b));
  });

  it("compares strings safely", () => {
    assert.equal(safeEqualString("admin-secret", "admin-secret"), true);
    assert.equal(safeEqualString("admin-secret", "admin-secreX"), false);
    assert.equal(safeEqualString("short", "longer-value"), false);
  });
});
