import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { SpartanHeader } from "@/components/ui/SpartanHeader";
import { font } from "@/lib/typography";

interface CoachEliteGateProps {
  isAuthenticated: boolean;
}

function ValueRow({
  icon,
  text,
  styles,
  colors,
}: {
  icon: "mic" | "message-circle" | "lock";
  text: string;
  styles: ReturnType<typeof makeStyles>;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.valueRow}>
      <View style={styles.valueIcon}>
        <Feather name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={styles.valueText}>{text}</Text>
    </View>
  );
}

export function CoachEliteGate({ isAuthenticated }: CoachEliteGateProps) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <SafeAreaView
      style={styles.safe}
      edges={["top"]}
      testID="screen-elite-coach-gate"
    >
      <ScrollView contentContainerStyle={styles.gateContent}>
        <SpartanHeader
          title="Coach"
          actionLabel={isAuthenticated ? undefined : "Sign in"}
        />
        <View style={styles.gateBadge}>
          <Feather name="shield" size={15} color={colors.primary} />
          <Text style={styles.gateBadgeText}>HOSPICE SALES PRO ELITE</Text>
        </View>
        <Text style={styles.gateTitle}>
          Private practice that prepares you for the room.
        </Text>
        <Text style={styles.gateBody}>
          Rehearse by voice or text, receive direct coaching, and leave with
          one clear commitment.
        </Text>
        <View style={styles.valueCard}>
          <ValueRow
            icon="mic"
            text="Private voice rehearsal and transcription"
            styles={styles}
            colors={colors}
          />
          <ValueRow
            icon="message-circle"
            text="Emotionally intelligent Spartan Coach feedback"
            styles={styles}
            colors={colors}
          />
          <ValueRow
            icon="lock"
            text="Raw conversations stay private and expire after 90 days"
            styles={styles}
            colors={colors}
          />
        </View>
        <Pressable
          style={styles.primaryButton}
          onPress={() => router.push("/membership" as any)}
        >
          <Text style={styles.primaryButtonText}>
            Compare Elite and subscribe
          </Text>
          <Feather name="arrow-right" size={19} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.gatePrice}>
          Hospice Sales Pro Elite is $19.99 per week. Cancel anytime.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    gateContent: {
      paddingHorizontal: 22,
      paddingTop: 14,
      paddingBottom: 40,
    },
    gateBadge: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      marginTop: 28,
      paddingHorizontal: 11,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: colors.primaryMuted,
    },
    gateBadgeText: {
      color: colors.primary,
      fontSize: 10,
      letterSpacing: 1.3,
      ...font("bold"),
    },
    gateTitle: {
      color: colors.foreground,
      fontSize: 34,
      lineHeight: 39,
      letterSpacing: -1,
      marginTop: 16,
      ...font("heavy"),
    },
    gateBody: {
      color: colors.mutedForeground,
      fontSize: 17,
      lineHeight: 25,
      marginTop: 12,
      ...font("regular"),
    },
    valueCard: {
      marginTop: 24,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      padding: 16,
      gap: 15,
    },
    valueRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    valueIcon: {
      width: 36,
      height: 36,
      borderRadius: 11,
      backgroundColor: colors.primaryMuted,
      alignItems: "center",
      justifyContent: "center",
    },
    valueText: {
      flex: 1,
      color: colors.foreground,
      fontSize: 14,
      lineHeight: 20,
      ...font("medium"),
    },
    primaryButton: {
      minHeight: 56,
      borderRadius: 15,
      backgroundColor: colors.primary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      paddingHorizontal: 18,
      marginTop: 18,
    },
    primaryButtonText: {
      flex: 1,
      color: "#FFFFFF",
      fontSize: 16,
      ...font("bold"),
    },
    gatePrice: {
      color: colors.mutedForeground,
      fontSize: 12,
      lineHeight: 18,
      textAlign: "center",
      marginTop: 12,
      ...font("regular"),
    },
  });
}
