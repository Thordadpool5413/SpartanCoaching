/**
 * One-time unlock ceremony after Hospice Sales Pro access becomes active.
 * It is triggered by the authoritative entitlement transition after Apple
 * purchase verification, account claim, or company seat activation.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
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
  hasSeenActivation,
  markActivationSeen,
} from "@/lib/activationCeremony";
import { radius } from "@/lib/spacing";

export function ActivationCeremony() {
  const colors = useColors();
  const { canUseFieldKit, isAuthenticated, user } = useAuth();
  const [visible, setVisible] = useState(false);
  const prevAllowed = useRef<boolean | null>(null);
  const memberId = user?.member?.id;

  const tryShow = useCallback(async () => {
    if (!isAuthenticated || !canUseFieldKit || !memberId) return;
    const seen = await hasSeenActivation(memberId);
    if (!seen) {
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
      void tryShow();
    }
  }, [canUseFieldKit, tryShow]);

  const dismiss = async (openExplore: boolean) => {
    if (memberId) await markActivationSeen(memberId);
    setVisible(false);
    if (openExplore) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push("/(tabs)/tools");
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
            YOUR MEMBERSHIP IS ACTIVE
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
            Your tools are ready on this iPhone. Explore what your membership includes, then choose
            the one resource that helps with the conversation in front of you.
          </Text>
          <SpartanButton
            title="Explore your tools"
            onPress={() => void dismiss(true)}
            style={{ marginTop: 20, alignSelf: "stretch" }}
            testID="activation-open-explore"
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
