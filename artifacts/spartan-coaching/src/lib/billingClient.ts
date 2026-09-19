/**
 * Browser helpers for Membership billing (Phase 2+ website).
 */

import {
  createBillingCheckout,
  createBillingPortal,
  getBillingStatus,
  type BillingStatus,
} from "@workspace/api-client-react";

export type BillingStatusResponse = BillingStatus;

export async function fetchBillingStatus(): Promise<BillingStatusResponse | null> {
  try {
    return await getBillingStatus({ credentials: "include" });
  } catch {
    return null;
  }
}

export async function startIndividualCheckout(
  plan: "standard_weekly" | "elite_weekly" = "standard_weekly",
): Promise<{ url: string }> {
  const data = await createBillingCheckout({ plan }, { credentials: "include" });
  if (!data.url) throw new Error("Checkout URL missing");
  return { url: data.url };
}

export async function openBillingPortal(): Promise<{ url: string }> {
  const data = await createBillingPortal({}, { credentials: "include" });
  if (!data.url) throw new Error("Portal URL missing");
  return { url: data.url };
}
