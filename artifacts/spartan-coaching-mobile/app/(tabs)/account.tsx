import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/AuthContext";
import {
  fetchOnboardingMobile,
  updateOnboardingMobile,
} from "@/lib/api";
import {
  formatTrialRemaining,
  isChecklistDone,
  visibleChecklist,
} from "@/lib/onboarding";

const ROLES = [
  { id: "rep", label: "Rep / liaison" },
  { id: "director", label: "Director" },
  { id: "vp", label: "VP / exec" },
  { id: "owner", label: "Owner" },
  { id: "other", label: "Other" },
];

export default function AccountScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, isLoading, isAuthenticated, canUseFieldKit, logout, refresh } = useAuth();

  const [jobRole, setJobRole] = useState("");
  const [territoryNote, setTerritoryNote] = useState("");
  const [topObjections, setTopObjections] = useState("");
  const [checklist, setChecklist] = useState<Record<string, boolean | string>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 90;

  const load = useCallback(async () => {
    if (!canUseFieldKit) return;
    try {
      const data = await fetchOnboardingMobile();
      setJobRole(data.member.jobRole || "");
      setTerritoryNote(data.member.territoryNote || "");
      setTopObjections(data.member.topObjections || "");
      setChecklist(data.member.checklistProgress || {});
    } catch {
      // ignore
    }
  }, [canUseFieldKit]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

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
            "First-session checklist syncs with the website",
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

  const trialLine = formatTrialRemaining(fk?.hoursRemaining);
  const items = visibleChecklist(jobRole);
  const doneCount = items.filter((i) => isChecklistDone(checklist, i.id)).length;

  const saveProfile = async () => {
    setSaving(true);
    setMsg(null);
    try {
      await updateOnboardingMobile({
        jobRole: jobRole || null,
        territoryNote: territoryNote.trim() || null,
        topObjections: topObjections.trim() || null,
      });
      await refresh();
      setMsg("Saved");
    } catch (e: any) {
      setMsg(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

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

      <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card, marginTop: 16 }]}>
        <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>Status</Text>
        <Text style={[styles.cardValue, { color: colors.foreground }]}>{statusLabel}</Text>
        {trialLine && org?.status === "trial" ? (
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
          style={[styles.cardValue, { color: canUseFieldKit ? "#4ade80" : colors.primary }]}
        >
          {canUseFieldKit ? "Unlocked" : "Locked"}
        </Text>
        {canUseFieldKit && (
          <>
            <Text style={[styles.cardLabel, { color: colors.mutedForeground, marginTop: 14 }]}>
              Checklist
            </Text>
            <Text style={[styles.cardValue, { color: colors.foreground }]}>
              {doneCount}/{items.length} complete
              {doneCount > 0 ? " · Activated" : " · Not activated yet"}
            </Text>
          </>
        )}
      </View>

      {!canUseFieldKit && (
        <View style={[styles.card, { borderColor: colors.primary, backgroundColor: colors.card, marginTop: 12 }]}>
          <Text style={{ color: colors.foreground, fontWeight: "700", marginBottom: 6 }}>
            {org?.status === "expired" ? "Evaluation ended — continue as a client" : "Access is not active"}
          </Text>
          <Text style={{ color: colors.mutedForeground, lineHeight: 20, fontSize: 14 }}>
            {org?.status === "expired"
              ? "Book a short debrief to activate membership, discuss seats, and keep the Field Kit on."
              : "Schedule a strategy call to continue as a client."}
          </Text>
          <Pressable onPress={() => router.push("/(tabs)/contact")} style={{ marginTop: 12 }}>
            <Text style={{ color: colors.primary, fontWeight: "700" }}>
              {org?.status === "expired" ? "Continue as a client →" : "Contact Spartan →"}
            </Text>
          </Pressable>
        </View>
      )}

      {canUseFieldKit && (
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card, marginTop: 12 }]}>
          <Text style={{ color: colors.foreground, fontWeight: "800", marginBottom: 10 }}>Field profile</Text>
          <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>Role</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8, marginBottom: 12 }}>
            {ROLES.map((r) => (
              <Pressable
                key={r.id}
                onPress={() => setJobRole(r.id)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: jobRole === r.id ? colors.primary : colors.border,
                  backgroundColor: jobRole === r.id ? "rgba(232,41,30,0.12)" : "transparent",
                }}
              >
                <Text
                  style={{
                    color: jobRole === r.id ? colors.primary : colors.foreground,
                    fontWeight: "700",
                    fontSize: 12,
                  }}
                >
                  {r.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>Territory notes</Text>
          <TextInput
            value={territoryNote}
            onChangeText={setTerritoryNote}
            placeholder="Market, facilities, focus…"
            placeholderTextColor={colors.mutedForeground}
            multiline
            style={[
              styles.input,
              { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background },
            ]}
          />

          <Text style={[styles.cardLabel, { color: colors.mutedForeground, marginTop: 12 }]}>
            Top objections
          </Text>
          <TextInput
            value={topObjections}
            onChangeText={setTopObjections}
            placeholder="not ready, already have provider…"
            placeholderTextColor={colors.mutedForeground}
            multiline
            style={[
              styles.input,
              { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background },
            ]}
          />

          <Pressable
            onPress={saveProfile}
            disabled={saving}
            style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1, marginTop: 14 }]}
          >
            <Text style={styles.primaryBtnText}>{saving ? "Saving…" : "Save profile"}</Text>
          </Pressable>
          {msg ? (
            <Text style={{ color: colors.mutedForeground, marginTop: 8, fontSize: 13 }}>{msg}</Text>
          ) : null}
          <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 10 }}>
            No PHI. Coaching context only.
          </Text>
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
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 6,
    minHeight: 72,
    textAlignVertical: "top",
    fontSize: 14,
  },
});
