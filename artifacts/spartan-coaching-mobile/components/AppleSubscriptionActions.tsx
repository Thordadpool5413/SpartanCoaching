import React, { useCallback, useEffect, useState } from "react";
import { Alert, Linking, Platform, Pressable, Text, View } from "react-native";
import {
  deepLinkToSubscriptions,
  ErrorCode,
  getAvailablePurchases,
  useIAP,
  type Purchase,
} from "react-native-iap";
import {
  ELITE_WEEKLY_PLAN,
  STANDARD_WEEKLY_PLAN,
} from "@workspace/field-kit-catalog";
import { SpartanButton } from "@/components/ui/SpartanButton";
import { useColors } from "@/hooks/useColors";
import {
  fetchAppleBillingConfig,
  verifyAppleTransaction,
  type AppleBillingConfig,
} from "@/lib/api";
import { font } from "@/lib/typography";
import {
  APP_STORE_PRIVACY_URL,
  APP_STORE_TERMS_URL,
} from "@/lib/appStoreReadiness";

type Props = {
  plan?: "standard_weekly" | "elite_weekly";
  showPurchase?: boolean;
  showManage?: boolean;
  onEntitlementChanged: () => Promise<void> | void;
};

export function AppleSubscriptionActions({
  plan = "standard_weekly",
  showPurchase = false,
  showManage = false,
  onEntitlementChanged,
}: Props) {
  const colors = useColors();
  const [config, setConfig] = useState<AppleBillingConfig | null>(null);
  const [busy, setBusy] = useState<"purchase" | "restore" | null>(null);
  const [storeError, setStoreError] = useState<string | null>(null);

  const complete = useCallback(async (purchase: Purchase) => {
    if (!purchase.purchaseToken) throw new Error("Apple did not return a signed transaction");
    const result = await verifyAppleTransaction(purchase.purchaseToken);
    if (!result.active) throw new Error("This Apple subscription is not active");
    await finishTransaction({ purchase, isConsumable: false });
    await onEntitlementChanged();
  }, [onEntitlementChanged]);

  const {
    connected,
    subscriptions,
    fetchProducts,
    requestPurchase,
    finishTransaction,
  } = useIAP({
    onPurchaseSuccess: (purchase) => {
      void complete(purchase)
        .then(() => Alert.alert("Membership active", "Your Spartan Coaching access is ready."))
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

  useEffect(() => {
    if (Platform.OS !== "ios") return;
    void fetchAppleBillingConfig()
      .then(setConfig)
      .catch((error) => setStoreError(error?.message || "Apple billing could not be loaded"));
  }, []);

  useEffect(() => {
    if (!connected || !config?.configured) return;
    void fetchProducts({
      skus: config.products.map((product) => product.id),
      type: "subs",
    });
  }, [connected, config, fetchProducts]);

  if (Platform.OS !== "ios") return null;

  const productId = plan === "elite_weekly"
    ? ELITE_WEEKLY_PLAN.appleProductId
    : STANDARD_WEEKLY_PLAN.appleProductId;
  const storeProduct = subscriptions.find((product) => product.id === productId);
  const ready = Boolean(connected && config?.configured && storeProduct);
  const planName = plan === "elite_weekly"
    ? "Spartan Coaching Elite"
    : "Spartan Coaching Standard";

  const purchase = async () => {
    if (!config || !ready) return;
    setBusy("purchase");
    setStoreError(null);
    try {
      await requestPurchase({
        request: {
          apple: {
            sku: productId,
            appAccountToken: config.appAccountToken,
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
      for (const restored of candidates) await complete(restored);
      Alert.alert("Purchases restored", "Your verified Spartan Coaching membership is active.");
    } catch (error: any) {
      Alert.alert("Restore failed", error?.message || "Contact support for help restoring access.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={{ gap: 9 }}>
      {showPurchase ? (
        <>
          <View style={{ gap: 3 }}>
            <Text style={[{ color: colors.foreground, fontSize: 14, lineHeight: 20, textAlign: "center" }, font("bold")]}>
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
                  : "App Store products unavailable"
            }
            onPress={() => void purchase()}
            loading={busy === "purchase"}
            disabled={!ready}
            testID="button-subscribe"
          />
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 18 }}>
            <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(APP_STORE_TERMS_URL)} testID="subscription-terms-link">
              <Text style={[{ color: colors.primary, fontSize: 11 }, font("semibold")]}>Terms of Use</Text>
            </Pressable>
            <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(APP_STORE_PRIVACY_URL)} testID="subscription-privacy-link">
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
      <SpartanButton
        title={busy === "restore" ? "Restoring purchases" : "Restore Apple purchases"}
        variant="outline"
        onPress={() => void restore()}
        loading={busy === "restore"}
        disabled={!connected || !config?.configured}
        testID="button-restore-purchases"
      />
      {storeError ? (
        <Text style={[{ color: colors.mutedForeground, fontSize: 10, lineHeight: 15, textAlign: "center" }, font("regular")]}>
          {storeError}
        </Text>
      ) : null}
    </View>
  );
}
