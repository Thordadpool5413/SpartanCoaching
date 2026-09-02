import { describe, expect, it } from "vitest";
import { PLATFORM_ACCOUNT_COPY } from "./accountAccessCopy";

describe("platform administrator account copy", () => {
  it("explains cross-device access without presenting a customer billing workflow", () => {
    const copy = Object.values(PLATFORM_ACCOUNT_COPY).join(" ");

    expect(copy).toMatch(/administrator account|administrator access/i);
    expect(copy).toMatch(/iPhone and web|web and iPhone/i);
    expect(copy).toMatch(/not billed/i);
    expect(copy).not.toMatch(/\$|app store purchase|manage billing|auto-renew|cancel anytime|stripe/i);
  });
});
