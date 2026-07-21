import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/AuthContext";

export default function AccountScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, isLoading, isAuthenticated, canUseFieldKit, logout } = useAuth();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 90;

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{
          paddingTop: topPad + 24,
          paddingBottom: bottomPad,
          paddingHorizontal: 20,
        }}
      >
        <Text style={[styles.kicker, { color: colors.primary }]}>CLIENT ACCESS</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Your Field Kit</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          Sign in to use the private AI Field Kit on the go — objections, playbooks, role-play, and more.
          Evaluation access is approved by Spartan Coaching.
        </Text>

        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>
          {[
            "Hospice-specific tools, not generic sales AI",
            "Ethics-first · no PHI in tools",
            "Same access as the web Field Kit",
          ].map((line) => (
            <View key={line} style={styles.bulletRow}>
              <Feather name="check-circle" size={16} color={colors.primary} />
              <Text style={[styles.bulletText, { color: colors.foreground }]}>{line}</Text>
            </View>
          ))}
        </View>

        <Pressable
          onPress={() => router.push("/login")}
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.primaryBtnText}>Client login</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/(tabs)/contact")} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.primary, textAlign: "center", fontWeight: "700" }}>
            Request access or book a call
          </Text>
        </Pressable>
      </ScrollView>
    );
  }

  const org = user.organization;
  const fk = user.fieldKit;
  const statusLabel =
    org?.status === "trial"
      ? "Evaluation"
      : org?.status === "active"
        ? "Active client"
        : org?.status === "expired"
          ? "Evaluation ended"
          : org?.status || "—";

  let trialLine: string | null = null;
  if (org?.status === "trial" && fk?.hoursRemaining != null) {
    const h = fk.hoursRemaining;
    trialLine =
      h < 1
        ? `Ends in ~${Math.max(1, Math.round(h * 60))}m`
        : h < 48
          ? `Ends in ~${Math.round(h)}h`
          : `Ends in ~${Math.round(h / 24)}d`;
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: topPad + 24,
        paddingBottom: bottomPad,
        paddingHorizontal: 20,
      }}
    >
      <Text style={[styles.kicker, { color: colors.primary }]}>ACCOUNT</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>
        {user.member.name.split(" ")[0]}
      </Text>
      <Text style={[styles.body, { color: colors.mutedForeground }]}>{user.member.email}</Text>

      <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card, marginTop: 20 }]}>
        <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>Status</Text>
        <Text style={[styles.cardValue, { color: colors.foreground }]}>{statusLabel}</Text>
        {trialLine ? (
          <Text style={{ color: "#fbbf24", marginTop: 6, fontWeight: "600" }}>{trialLine}</Text>
        ) : null}
        <Text style={[styles.cardLabel, { color: colors.mutedForeground, marginTop: 14 }]}>
          Organization
        </Text>
        <Text style={[styles.cardValue, { color: colors.foreground }]}>{org?.name || "—"}</Text>
        <Text style={[styles.cardLabel, { color: colors.mutedForeground, marginTop: 14 }]}>
          Field Kit
        </Text>
        <Text
          style={[
            styles.cardValue,
            { color: canUseFieldKit ? "#4ade80" : colors.primary },
          ]}
        >
          {canUseFieldKit ? "Unlocked" : "Locked"}
        </Text>
      </View>

      {!canUseFieldKit && (
        <View style={[styles.card, { borderColor: colors.primary, backgroundColor: colors.card, marginTop: 12 }]}>
          <Text style={{ color: colors.foreground, fontWeight: "700", marginBottom: 6 }}>
            {org?.status === "expired" ? "Evaluation ended — continue as a client" : "Access is not active"}
          </Text>
          <Text style={{ color: colors.mutedForeground, lineHeight: 20, fontSize: 14 }}>
            {org?.status === "expired"
              ? "Book a short debrief to activate membership, discuss seats, and keep the Field Kit on. Or contact us to request more evaluation time."
              : "Schedule a strategy call to continue as a client, or request an extended evaluation."}
          </Text>
          <Pressable onPress={() => router.push("/(tabs)/contact")} style={{ marginTop: 12 }}>
            <Text style={{ color: colors.primary, fontWeight: "700" }}>
              {org?.status === "expired" ? "Continue as a client →" : "Contact Spartan →"}
            </Text>
          </Pressable>
        </View>
      )}

      <Pressable
        onPress={async () => {
          await logout();
          router.replace("/(tabs)");
        }}
        style={[styles.outlineBtn, { borderColor: colors.border, marginTop: 24 }]}
      >
        <Text style={{ color: colors.foreground, fontWeight: "700" }}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  kicker: { fontSize: 11, fontWeight: "800", letterSpacing: 2, marginBottom: 8 },
  title: { fontSize: 30, fontWeight: "900", marginBottom: 8 },
  body: { fontSize: 15, lineHeight: 22, marginBottom: 8 },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  bulletRow: { flexDirection: "row", gap: 10, alignItems: "flex-start", marginBottom: 10 },
  bulletText: { flex: 1, fontSize: 14, lineHeight: 20 },
  primaryBtn: {
    marginTop: 24,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  outlineBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  cardLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  cardValue: { fontSize: 16, fontWeight: "700", marginTop: 2 },
});
