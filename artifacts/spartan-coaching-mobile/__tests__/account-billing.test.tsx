import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const account = fs.readFileSync(path.join(root, "app/(tabs)/account.tsx"), "utf8");
const membership = fs.readFileSync(path.join(root, "app/membership.tsx"), "utf8");
const appleActions = fs.readFileSync(path.join(root, "components/AppleSubscriptionActions.tsx"), "utf8");

describe("Account membership contract", () => {
  it("uses Apple subscription controls for individual iOS membership", () => {
    expect(account).toContain("AppleSubscriptionActions");
    expect(account).toContain("Individual iOS membership is purchased and managed through Apple");
    expect(account).toContain('router.push("/membership" as any)');
  });

  it("does not launch Stripe or browser checkout from Account", () => {
    expect(account).not.toContain("startIndividualCheckout");
    expect(account).not.toContain("openBillingPortal");
    expect(account).not.toContain("checkout.stripe.com");
    expect(account).not.toContain("billing.stripe.com");
    expect(account).not.toContain("button-subscribe");
  });

  it("keeps company seats separate from Apple individual billing and gives renewal cleanup to the member", () => {
    expect(account).toContain('org?.type === "company"');
    expect(account).toContain("Provided through your organization contract and seat assignment");
    expect(account).toContain("Company access does not cancel an Apple subscription");
    expect(account).toContain("Your organization cannot see whether you have or cancel an individual Apple subscription");
    expect(account).toContain("showManage showRestore={false}");
    expect(appleActions).toContain("showRestore = true");
    expect(appleActions).toContain("{showRestore ? (");
    expect(membership).toContain("Company seats are governed by the provider agreement");
    expect(membership).toContain("separate from an individual Apple subscription");
  });

  it("keeps consulting commercially separate", () => {
    expect(account).toContain("Human consulting");
    expect(membership).toContain("Company seats and consulting are separate");
    expect(membership).toContain("Human consulting is separately scoped and contracted");
  });
});
