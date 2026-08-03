/**
 * Browser helpers for Membership billing (Phase 2+ website).
 */

export type BillingStatusResponse = {
  configured: boolean;
  individualWeeklyPriceConfigured: boolean;
  canCheckoutIndividual: boolean;
  canOpenPortal: boolean;
  organization: {
    id: number;
    type: string;
    status: string;
    billingPlan: string | null;
    billingStatus: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    hasStripeCustomer: boolean;
    hasStripeSubscription: boolean;
    billableSeats: number | null;
    seatLimit: number;
    contractRef: string | null;
  };
};

export async function fetchBillingStatus(): Promise<BillingStatusResponse | null> {
  const res = await fetch("/api/billing/status", { credentials: "include" });
  if (!res.ok) return null;
  return res.json();
}

export async function startIndividualCheckout(): Promise<{ url: string }> {
  const res = await fetch("/api/billing/checkout", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Could not start checkout");
  if (!data.url) throw new Error("Checkout URL missing");
  return { url: data.url as string };
}

export async function openBillingPortal(): Promise<{ url: string }> {
  const res = await fetch("/api/billing/portal", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Could not open billing portal");
  if (!data.url) throw new Error("Portal URL missing");
  return { url: data.url as string };
}
