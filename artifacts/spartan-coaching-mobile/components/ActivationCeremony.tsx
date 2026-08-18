/**
 * One-time unlock ceremony after Hospice Sales Pro access becomes active.
 * Also refreshes entitlement when returning from Stripe Checkout.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AppState,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/AuthContext";
import { font } from "@/lib/typography";
import { SpartanButton } from "@/components/ui/SpartanButton";
import {
  clearCheckoutPending,
  hasSeenActivation,
  isCheckoutPending,
  markActivationSeen,
  wasStripeOpenedRecently,
} from "@/lib/activationCeremony";
import { radius } from "@/lib/spacing";

export function ActivationCeremony() {
  const colors = useColors();
  const { canUseFieldKit, isAuthenticated, user, refresh } = useAuth();
  const [visible, setVisible] = useState(false);
  const prevAllowed = useRef<boolean | null>(null);
  const memberId = user?.member?.id;

  const tryShow = useCallback(async () => {
    if (!isAuthenticated || !canUseFieldKit || !memberId) return;
    const seen = await hasSeenActivation(memberId);
    const pending = await isCheckoutPending();
    const fromStripe = await wasStripeOpenedRecently();
    // Show if never seen, or returning from checkout
    if (!seen || pending || fromStripe) {
      setVisible(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [isAuthenticated, canUseFieldKit, memberId]);

  // Detect unlock transition false → true
  useEffect(() => {
    const prev = prevAllowed.current;
    prevAllowed.current = canUseFieldKit;
    if (prev === false && canUseFieldKit === true) {
      void tryShow();
    } else if (prev === null && canUseFieldKit) {
      // Cold start already unlocked — only if checkout pending
      void (async () => {
        if ((await isCheckoutPending()) || (await wasStripeOpenedRecently())) {
          await tryShow();
        }
      })();
    }
  }, [canUseFieldKit, tryShow]);

  // Return from Safari / Stripe → refresh entitlement, maybe ceremony
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active") {
        void (async () => {
          const pending = await isCheckoutPending();
          const fromStripe = await wasStripeOpenedRecently();
          if (pending || fromStripe) {
            await refresh();
            // slight delay for server webhook
            setTimeout(() => {
              void refresh().then(() => tryShow());
            }, 800);
          }
        })();
      }
    });
    return () => sub.remove();
  }, [refresh, tryShow]);

  const dismiss = async (goCommand: boolean) => {
    if (memberId) await markActivationSeen(memberId);
    await clearCheckoutPending();
    setVisible(false);
    if (goCommand) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push("/(tabs)/command");
    }
  };

  if (!visible) return null;

  const firstName = user?.member?.name?.split(" ")[0] || "";

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent testID="activation-ceremony">
      <View style={[styles.backdrop, { backgroundColor: colors.overlay ?? "rgba(5,8,16,0.85)" }]}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.primary }]}>
          <View style={[styles.iconWrap, { backgroundColor: colors.primaryMuted }]}>
            <Feather name="check-circle" size={28} color={colors.primary} />
          </View>
          <Text style={[{ color: colors.primary, fontSize: 10, letterSpacing: 1.4, marginTop: 14 }, font("bold")]}>
            HOSPICE SALES PRO
          </Text>
          <Text style={[{ color: colors.foreground, fontSize: 22, marginTop: 8, textAlign: "center" }, font("heavy")]}>
            {firstName ? `You're in, ${firstName}` : "You're in"}
          </Text>
          <Text
            style={[
              {
                color: colors.mutedForeground,
                fontSize: 14,
                lineHeight: 20,
                marginTop: 10,
                textAlign: "center",
              },
              font("regular"),
            ]}
          >
            Your tools are ready on this iPhone. Start in Field Planner, add the next facility account
            without PHI, and prepare the conversation from there.
          </Text>
          <SpartanButton
            title="Open Field Planner"
            onPress={() => void dismiss(true)}
            style={{ marginTop: 20, alignSelf: "stretch" }}
            testID="activation-open-command"
          />
          <Pressable
            onPress={() => void dismiss(false)}
            style={{ marginTop: 14, minHeight: 44, justifyContent: "center" }}
            testID="activation-dismiss"
          >
            <Text style={[{ color: colors.mutedForeground, textAlign: "center", fontSize: 14 }, font("semibold")]}>
              Not now
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    padding: 24,
    alignItems: "center",
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
});
