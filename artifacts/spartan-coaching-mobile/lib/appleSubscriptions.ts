import { ELITE_WEEKLY_PLAN, STANDARD_WEEKLY_PLAN } from "@workspace/field-kit-catalog";

export const APPLE_SUBSCRIPTION_PRODUCT_IDS = [
  STANDARD_WEEKLY_PLAN.appleProductId,
  ELITE_WEEKLY_PLAN.appleProductId,
] as const;

export type AppleSubscriptionProductId = typeof APPLE_SUBSCRIPTION_PRODUCT_IDS[number];
export type AppleSubscriptionTier = "standard" | "elite";

export interface AppleSubscriptionProvider {
  loadProducts(ids: readonly AppleSubscriptionProductId[]): Promise<Array<{ id: string; displayPrice: string }>>;
  purchase(id: AppleSubscriptionProductId): Promise<{ transactionId: string }>;
  restore(): Promise<void>;
}

export function tierForAppleProduct(productId: string): AppleSubscriptionTier | null {
  if (productId === STANDARD_WEEKLY_PLAN.appleProductId) return "standard";
  if (productId === ELITE_WEEKLY_PLAN.appleProductId) return "elite";
  return null;
}

export function missingAppleProducts(products: Array<{ id: string }>): AppleSubscriptionProductId[] {
  const available = new Set(products.map((product) => product.id));
  return APPLE_SUBSCRIPTION_PRODUCT_IDS.filter((id) => !available.has(id));
}
