import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import { getAvailablePurchases, type Purchase, type PurchaseIOS } from "react-native-iap";
import { APPLE_SUBSCRIPTION_PRODUCT_IDS } from "@/lib/appleSubscriptions";
import { claimAppleTransaction } from "@/lib/api";

const APP_ACCOUNT_TOKEN_KEY = "spartan_apple_purchase_session";

export async function getApplePurchaseSessionToken(): Promise<string> {
  const existing = await SecureStore.getItemAsync(APP_ACCOUNT_TOKEN_KEY).catch(() => null);
  if (existing) return existing;
  const token = Crypto.randomUUID();
  await SecureStore.setItemAsync(APP_ACCOUNT_TOKEN_KEY, token, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  return token;
}

function isSpartanSubscription(purchase: Purchase) {
  return APPLE_SUBSCRIPTION_PRODUCT_IDS.includes(
    purchase.productId as (typeof APPLE_SUBSCRIPTION_PRODUCT_IDS)[number],
  );
}

/**
 * Called after sign in or registration. A customer may buy first, then protect
 * and sync that purchase with a Spartan account. StoreKit remains the source of
 * truth and the API prevents one original transaction from being claimed twice.
 */
export async function claimCurrentApplePurchases(): Promise<boolean> {
  const purchases = await getAvailablePurchases({ onlyIncludeActiveItemsIOS: true });
  let claimed = false;

  for (const purchase of purchases.filter(isSpartanSubscription)) {
    if (!purchase.purchaseToken) continue;
    const result = await claimAppleTransaction(
      purchase.purchaseToken,
      (purchase as PurchaseIOS).appAccountToken || undefined,
    );
    claimed = Boolean(result.active) || claimed;
  }

  return claimed;
}
