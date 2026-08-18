import React, { useCallback, useEffect, useState } from "react";
import { Alert, Platform, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import {
  deepLinkToSubscriptions,
  ErrorCode,
  getAvailablePurchases,
  useIAP,
  type Purchase,
  type PurchaseIOS,
} from "react-native-iap";
import {
  ELITE_WEEKLY_PLAN,
  STANDARD_WEEKLY_PLAN,
} from "@workspace/field-kit-catalog";
import { SpartanButton } from "@/components/ui/SpartanButton";
import { useColors } from "@/hooks/useColors";
import {
  claimAppleTransaction,
  fetchAppleBillingCatalog,
  verifyGuestAppleTransaction,
  type AppleBillingConfig,
  type AppleVerificationResult,
} from "@/lib/api";
import { getApplePurchaseSessionToken } from "@/lib/applePurchaseSession";
import { font } from "@/lib/typography";

type Props = {
  plan?: "standard_weekly" | "elite_weekly";
  isAuthenticated?: boolean;
  showPurchase?: boolean;
  showManage?: boolean;
  showRestore?: boolean;
  onPricesLoaded?: (prices: AppleSubscriptionDisplayPrices) => void;
  onPurchaseComplete?: (result: AppleVerificationResult) => Promise<void> | void;
  onEntitlementChanged?: () => Promise<void> | void;
};

export type AppleSubscriptionDisplayPrices = Partial<
  Record<"standard_weekly" | "elite_weekly", string>
>;

export function AppleSubscriptionActions({
  plan = "standard_weekly",
  isAuthenticated = false,
  showPurchase = false,
  showManage = false,
  showRestore = true,
  onPricesLoaded,
  onPurchaseComplete,
  onEntitlementChanged,
}: Props) {
  const colors = useColors();
  const [config, setConfig] = useState<AppleBillingConfig | null>(null);
  const [appAccountToken, setAppAccountToken] = useState<string | null>(null);
  const [busy, setBusy] = useState<"purchase" | "restore" | null>(null);
  const [storeError, setStoreError] = useState<string | null>(null);

  const {
    connected,
    subscriptions,
    fetchProducts,
    requestPurchase,
    finishTransaction,
  } = useIAP({
    onPurchaseSuccess: (purchase) => {
      void complete(purchase)
        .then(() => Alert.alert(
          "Membership purchased",
          isAuthenticated
            ? "Your Spartan Coaching access is active."
            : "Apple confirmed your membership. Create or sign in to your Spartan account to sync access and saved work.",
        ))
        .catch((error) => Alert.alert("Purchase verification failed", error?.message || "Contact support before trying again."))
        .finally(() => setBusy(null));
    },
    onPurchaseError: (error) => {
      setBusy(null);
      if (error.code !== ErrorCode.UserCancelled) {
        Alert.alert("Purchase was not completed", error.message);
      }
    },
    onError: (error) => setStoreError(error.message),
  });

  const complete = useCallback(async (purchase: Purchase, expectedAccountToken: string | null = appAccountToken) => {
    if (!purchase.purchaseToken) throw new Error("Apple did not return a signed transaction");
    const purchaseSession = (purchase as PurchaseIOS).appAccountToken || expectedAccountToken || undefined;
    const result = isAuthenticated
      ? await claimAppleTransaction(purchase.purchaseToken, purchaseSession)
      : await verifyGuestAppleTransaction(purchase.purchaseToken, purchaseSession);
    if (!result.active) throw new Error("This Apple subscription is not active");
    await finishTransaction({ purchase, isConsumable: false });
    await onPurchaseComplete?.(result);
    await onEntitlementChanged?.();
    return result;
  }, [appAccountToken, finishTransaction, isAuthenticated, onEntitlementChanged, onPurchaseComplete]);

  useEffect(() => {
    if (Platform.OS !== "ios") return;
    void Promise.all([
      fetchAppleBillingCatalog(),
      getApplePurchaseSessionToken(),
    ])
      .then(([catalog, token]) => {
        setConfig(catalog);
        setAppAccountToken(token);
      })
      .catch((error) => setStoreError(error?.message || "Apple billing could not be loaded"));
  }, []);

  useEffect(() => {
    if (!connected || !config?.configured) return;
    void fetchProducts({
      skus: config.products.map((product) => product.id),
      type: "subs",
    });
  }, [connected, config, fetchProducts]);

  const standardDisplayPrice = subscriptions.find(
    (product) => product.id === STANDARD_WEEKLY_PLAN.appleProductId,
  )?.displayPrice;
  const eliteDisplayPrice = subscriptions.find(
    (product) => product.id === ELITE_WEEKLY_PLAN.appleProductId,
  )?.displayPrice;

  useEffect(() => {
    if (!onPricesLoaded || subscriptions.length === 0) return;
    onPricesLoaded({
      ...(standardDisplayPrice ? { standard_weekly: standardDisplayPrice } : {}),
      ...(eliteDisplayPrice ? { elite_weekly: eliteDisplayPrice } : {}),
    });
  }, [eliteDisplayPrice, onPricesLoaded, standardDisplayPrice, subscriptions.length]);

  if (Platform.OS !== "ios") return null;

  const productId = plan === "elite_weekly"
    ? ELITE_WEEKLY_PLAN.appleProductId
    : STANDARD_WEEKLY_PLAN.appleProductId;
  const storeProduct = subscriptions.find((product) => product.id === productId);
  const ready = Boolean(connected && config?.configured && storeProduct && appAccountToken);
  const planName = plan === "elite_weekly"
    ? "Spartan Coaching Elite"
    : "Spartan Coaching Standard";

  const purchase = async () => {
    if (!config || !ready || !appAccountToken) return;
    setBusy("purchase");
    setStoreError(null);
    try {
      await requestPurchase({
        request: {
          apple: {
            sku: productId,
            appAccountToken,
            andDangerouslyFinishTransactionAutomatically: false,
          },
        },
        type: "subs",
      });
    } catch (error: any) {
      setBusy(null);
      if (error?.code !== ErrorCode.UserCancelled) {
        Alert.alert("Purchase was not completed", error?.message || "Try again.");
      }
    }
  };

  const restore = async () => {
    setBusy("restore");
    setStoreError(null);
    try {
      const purchases = await getAvailablePurchases({ onlyIncludeActiveItemsIOS: true });
      const candidates = purchases.filter((purchase) =>
        config?.products.some((product) => product.id === purchase.productId),
      );
      if (!candidates.length) {
        Alert.alert("No active purchases found", "Confirm that this iPhone is signed in to the Apple ID used for the subscription.");
        return;
      }
      for (const restored of candidates) await complete(restored, null);
      Alert.alert(
        "Purchases restored",
        isAuthenticated
          ? "Your verified Spartan Coaching membership is active."
          : "Apple found your membership. Sign in or create an account to sync access.",
      );
    } catch (error: any) {
      Alert.alert("Restore failed", error?.message || "Contact support for help restoring access.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={{ gap: 10 }}>
      {showPurchase ? (
        <>
          <View style={{ gap: 3 }}>
            <Text
              style={[{ color: colors.foreground, fontSize: 15, lineHeight: 21, textAlign: "center" }, font("bold")]}
            >
              {planName} · {storeProduct?.displayPrice || "Apple price unavailable"} per week
            </Text>
            <Text style={[{ color: colors.mutedForeground, fontSize: 11, lineHeight: 16, textAlign: "center" }, font("regular")]}>Payment is charged to your Apple Account. The subscription renews automatically each week unless canceled at least 24 hours before the current period ends.</Text>
          </View>
          <SpartanButton
            title={
              busy === "purchase"
                ? "Completing Apple purchase"
                : ready
                  ? `Subscribe with Apple${storeProduct?.displayPrice ? ` · ${storeProduct.displayPrice}` : ""}`
                  : "Loading App Store price"
            }
            onPress={() => void purchase()}
            loading={busy === "purchase"}
            disabled={!ready}
            testID="button-subscribe"
          />
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 18 }}>
            <Pressable accessibilityRole="link" onPress={() => router.push({ pathname: "/legal", params: { document: "terms" } } as any)} testID="subscription-terms-link">
              <Text style={[{ color: colors.primary, fontSize: 11 }, font("semibold")]}>Terms of Use</Text>
            </Pressable>
            <Pressable accessibilityRole="link" onPress={() => router.push({ pathname: "/legal", params: { document: "privacy" } } as any)} testID="subscription-privacy-link">
              <Text style={[{ color: colors.primary, fontSize: 11 }, font("semibold")]}>Privacy Policy</Text>
            </Pressable>
          </View>
        </>
      ) : null}
      {showManage ? (
        <SpartanButton
          title="Manage Apple subscription"
          variant="outline"
          onPress={() => void deepLinkToSubscriptions({})}
          testID="button-manage-apple-subscription"
        />
      ) : null}
      {showRestore ? (
        <SpartanButton
          title={busy === "restore" ? "Restoring purchases" : "Restore Apple purchases"}
          variant="outline"
          onPress={() => void restore()}
          loading={busy === "restore"}
          disabled={!connected || !config?.configured}
          testID="button-restore-purchases"
        />
      ) : null}
      {storeError ? (
        <Text
          selectable
          style={[{ color: colors.mutedForeground, fontSize: 11, lineHeight: 16, textAlign: "center" }, font("regular")]}
        >
          {storeError}
        </Text>
      ) : null}
    </View>
  );
}
