import { afterEach, describe, expect, it, vi } from "vitest";
import { decryptPhi, encryptPhi, sha256Value } from "./phiEncryption";

afterEach(() => vi.unstubAllEnvs());

describe("PHI envelope encryption", () => {
  it("round trips with bound associated data and a random per-record data key", () => {
    vi.stubEnv("AI_TOOL_ENCRYPTION_KEY", Buffer.alloc(32, 7).toString("base64"));
    const first = encryptPhi({ label: "case" }, "tenant:1");
    const second = encryptPhi({ label: "case" }, "tenant:1");
    expect(first.startsWith("v2.")).toBe(true);
    expect(first).not.toBe(second);
    expect(decryptPhi(first, "tenant:1")).toEqual({ label: "case" });
    expect(() => decryptPhi(first, "tenant:2")).toThrow();
  });

  it("canonicalizes object hashes for idempotency", () => {
    expect(sha256Value({ a: 1, b: 2 })).toBe(sha256Value({ b: 2, a: 1 }));
  });
});
