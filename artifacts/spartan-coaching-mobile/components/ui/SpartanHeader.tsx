import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { HelmetMark } from "@/components/brand/HelmetMark";
import { useColors } from "@/hooks/useColors";
import { font } from "@/lib/typography";

export function SpartanHeader({
  title = "Hospice Sales Pro",
  subtitle = "by Spartan Coaching",
  showAccount = true,
  actionLabel,
  actionRoute = "/login",
}: {
  title?: string;
  subtitle?: string;
  showAccount?: boolean;
  actionLabel?: string;
  actionRoute?: string;
}) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.root}>
      <View style={styles.identity}>
        <HelmetMark size={42} />
        <View style={styles.identityCopy}>
          <Text numberOfLines={1} style={styles.title}>{title}</Text>
          <Text numberOfLines={1} style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>
      {actionLabel ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={() => router.push(actionRoute as never)}
          style={({ pressed }) => [styles.textAction, pressed && styles.pressed]}
        >
          <Text style={styles.textActionLabel}>{actionLabel}</Text>
        </Pressable>
      ) : showAccount ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open Account"
          hitSlop={8}
          onPress={() => router.push("/(tabs)/account" as never)}
          style={({ pressed }) => [styles.account, pressed && styles.pressed]}
        >
          <Feather name="user" size={21} color={colors.foreground} />
        </Pressable>
      ) : null}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    root: {
      minHeight: 54,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    identity: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, minHeight: 48 },
    identityCopy: { flex: 1, justifyContent: "center", gap: 1 },
    title: { color: colors.foreground, fontSize: 16, letterSpacing: -0.25, ...font("heavy") },
    subtitle: { color: colors.mutedForeground, fontSize: 9, letterSpacing: 0.35, ...font("semibold") },
    account: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderCurve: "continuous",
      alignItems: "center",
      justifyContent: "center",
    },
    textAction: { minHeight: 44, justifyContent: "center", paddingHorizontal: 4 },
    textActionLabel: { color: colors.primary, fontSize: 15, ...font("bold") },
    pressed: { opacity: 0.58 },
  });
}
