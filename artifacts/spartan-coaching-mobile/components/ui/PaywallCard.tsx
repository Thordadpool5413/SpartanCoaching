import React, { useEffect } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { font } from "@/lib/typography";
import { getWebSiteUrl } from "@/lib/api";
import { SpartanButton } from "./SpartanButton";
import { radius } from "@/lib/spacing";
import { MAX_FONT_SIZE_MULTIPLIER } from "@/lib/iosProductQuality";
import { trackMobileEvent } from "@/lib/analytics";

type Props = {
  isAuthenticated?: boolean;
  title?: string;
  body?: string;
  onPrimary?: () => void;
  primaryLabel?: string;
  showWebLink?: boolean;
  orgStatus?: string | null;
  testID?: string;
};

const BENEFITS = [
  "Live generation on field tools",
  "Command Center for today’s visits",
  "Saves and checklist synced to web",
  "Cancel anytime · same seat on iPhone & website",
];

/**
 * Subscription theater card — locked / expired / trial continue.
 * Billing is Stripe on web (no StoreKit); restore = sign in.
 */
export function PaywallCard({
  isAuthenticated,
  title = "$14.99/week · cancel anytime",
  body = "Unlock live tools and Command Center on this iPhone. Subscribe on the website with the same account.",
  onPrimary,
  primaryLabel,
  showWebLink = true,
  orgStatus,
  testID = "paywall-card",
}: Props) {
  const colors = useColors();
  const siteUrl = getWebSiteUrl();
  const label =
    primaryLabel ?? (isAuthenticated ? "Subscribe on website" : "Sign in to subscribe");

  useEffect(() => {
    void trackMobileEvent("craft", "paywall_view", {
      metadata: {
        surface: "paywall",
        platform: "ios",
        plan: (orgStatus || "unknown").slice(0, 32),
      },
    });
  }, [orgStatus]);

  const handlePrimary = () => {
    void trackMobileEvent("craft", "paywall_cta_tap", {
      metadata: {
        surface: "paywall",
        platform: "ios",
        source: isAuthenticated ? "account" : "login",
      },
    });
    if (onPrimary) {
      onPrimary();
      return;
    }
    if (isAuthenticated) {
      router.push("/(tabs)/account");
    } else {
      router.push("/login");
    }
  };

  return (
    <View
      testID={testID}
      accessibilityRole="summary"
      style={[
        styles.card,
        {
          borderColor: colors.primary,
          backgroundColor: colors.card,
        },
      ]}
    >
      <Text
        maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
        style={[{ color: colors.primary, fontSize: 10, letterSpacing: 1.4 }, font("bold")]}
      >
        HOSPICE SALES PRO
      </Text>
      <Text
        maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
        style={[{ color: colors.foreground, fontSize: 18, marginTop: 6 }, font("heavy")]}
      >
        {title}
      </Text>
      <Text
        maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
        style={[
          { color: colors.mutedForeground, fontSize: 13, marginTop: 6, lineHeight: 18 },
          font("regular"),
        ]}
      >
        {body}
      </Text>

      <View style={{ marginTop: 14, gap: 8 }}>
        {BENEFITS.map((line) => (
          <View key={line} style={styles.benefitRow}>
            <Feather name="check" size={14} color={colors.success || colors.primary} />
            <Text
              maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
              style={[{ color: colors.foreground, fontSize: 13, flex: 1, lineHeight: 18 }, font("regular")]}
            >
              {line}
            </Text>
          </View>
        ))}
      </View>

      <SpartanButton title={label} onPress={handlePrimary} style={{ marginTop: 16 }} />

      <Text
        maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
        style={[
          { color: colors.mutedForeground, fontSize: 11, marginTop: 12, lineHeight: 16 },
          font("regular"),
        ]}
      >
        Already subscribed? Sign in with the same email. Access restores from your account—no App Store
        restore button.
      </Text>

      {showWebLink ? (
        <Pressable
          onPress={() => {
            void trackMobileEvent("craft", "web_handoff_tap", {
              metadata: { surface: "paywall", platform: "ios", source: "hsp_lander" },
            });
            void Linking.openURL(`${siteUrl}/hospice-sales-pro`);
          }}
          accessibilityRole="link"
          style={{ marginTop: 10 }}
        >
          <Text style={[{ color: colors.primary, fontSize: 13 }, font("semibold")]}>
            Open Hospice Sales Pro on the web
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderRadius: radius.lg,
    padding: 16,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
});
