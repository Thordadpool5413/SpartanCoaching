import { describe, expect, it } from "vitest";
import { platformAccountCopy } from "./accountAccessCopy";

describe("platform administrator account copy", () => {
  it.each([
    [true, /administrator account|administrator access/i],
    [false, /workspace account|member access/i],
  ])("explains cross-device access for admin=%s without presenting customer billing", (isAdmin, roleCopy) => {
    const copy = Object.values(platformAccountCopy(isAdmin)).join(" ");

    expect(copy).toMatch(roleCopy);
    expect(copy).toMatch(/iPhone and web|web and iPhone/i);
    expect(copy).toMatch(/not billed/i);
    expect(copy).not.toMatch(/\$|app store purchase|manage billing|auto-renew|cancel anytime|stripe/i);
  });
});
