import React from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { font } from "@/lib/typography";
import { getWebSiteUrl } from "@/lib/api";
import { SpartanButton } from "./SpartanButton";
import { radius } from "@/lib/spacing";

type Props = {
  isAuthenticated?: boolean;
  title?: string;
  body?: string;
  /** Override primary CTA (default: Account or Login) */
  onPrimary?: () => void;
  primaryLabel?: string;
  showWebLink?: boolean;
  testID?: string;
};

/**
 * Compact locked-state CTA — reuse on Tools, Home shell B, gates.
 */
export function PaywallCard({
  isAuthenticated,
  title = "$14.99/week · cancel anytime",
  body = "Unlock live generation, saves, and Command Center on this iPhone.",
  onPrimary,
  primaryLabel,
  showWebLink = true,
  testID = "paywall-card",
}: Props) {
  const colors = useColors();
  const siteUrl = getWebSiteUrl();
  const label =
    primaryLabel ?? (isAuthenticated ? "Open Account to subscribe" : "Sign in to subscribe");

  return (
    <View
      testID={testID}
      style={[
        styles.card,
        {
          borderColor: colors.primary,
          backgroundColor: colors.card,
        },
      ]}
    >
      <Text style={[{ color: colors.primary, fontSize: 10, letterSpacing: 1.4 }, font("bold")]}>
        HOSPICE SALES PRO
      </Text>
      <Text style={[{ color: colors.foreground, fontSize: 16, marginTop: 6 }, font("bold")]}>
        {title}
      </Text>
      <Text
        style={[{ color: colors.mutedForeground, fontSize: 12, marginTop: 4, lineHeight: 17 }, font("regular")]}
      >
        {body}
      </Text>
      <SpartanButton
        title={label}
        onPress={
          onPrimary ??
          (() => router.push(isAuthenticated ? "/(tabs)/account" : "/login"))
        }
        style={{ marginTop: 12 }}
        testID={`${testID}-primary`}
      />
      {showWebLink ? (
        <Pressable
          onPress={() => void Linking.openURL(`${siteUrl}/hospice-sales-pro`)}
          style={{ marginTop: 10, minHeight: 40, justifyContent: "center" }}
        >
          <Text style={[{ color: colors.primary, fontSize: 13, textAlign: "center" }, font("semibold")]}>
            See full product →
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1.5,
    padding: 14,
  },
});
