import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "app/(tabs)/account.tsx"), "utf8");

describe("Account lifecycle contract", () => {
  it("refreshes membership and profile when Account receives focus", () => {
    expect(source).toContain("useFocusEffect");
    expect(source).toContain("void refresh()");
    expect(source).toContain("void loadProfile()");
  });

  it("does not maintain browser checkout return state", () => {
    expect(source).not.toContain("AppState");
    expect(source).not.toContain("stripeOpenedRef");
    expect(source).not.toContain("BILLING_STALE_MS");
    expect(source).not.toContain("startIndividualCheckout");
    expect(source).not.toContain("openBillingPortal");
  });

  it("keeps appearance, privacy, and access controls in the native Account screen", () => {
    expect(source).toContain("APPEARANCE");
    expect(source).toContain("PRIVACY & CONTROL");
    expect(source).toContain("YOUR ACCESS");
    expect(source).toContain('router.push("/access" as any)');
  });
});
