import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Stack, router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/AuthContext";
import { apiGet, apiPost } from "@/lib/api";

type WorkflowCall = {
  id: string;
  version: number;
  purpose: string;
  status: string;
  schedule: { startsAt: string; durationMinutes: number };
};
type WorkflowPlan = { id: string; callId: string; version: number; status: string };
type TodayResponse = {
  calls: WorkflowCall[];
  plans: WorkflowPlan[];
  actions: Array<{ id: string; title: string; status: string; dueAt?: string }>;
  syncJobs: Array<{ id: string; status: string }>;
};

const requestKey = () => `mobile-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const randomUuid = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const value = Math.floor(Math.random() * 16);
    return (character === "x" ? value : (value & 0x3) | 0x8).toString(16);
  });
const memberUuid = (value: number) =>
  `00000000-0000-5000-9000-${value.toString(16).padStart(12, "0").slice(-12)}`;

export default function SalesWorkflowScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, canUseFieldKit } = useAuth();
  const [data, setData] = useState<TodayResponse>({
    calls: [],
    plans: [],
    actions: [],
    syncJobs: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [contactFirst, setContactFirst] = useState("");
  const [contactLast, setContactLast] = useState("");
  const [purpose, setPurpose] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("09:00");
  const [completionNotes, setCompletionNotes] = useState<Record<string, string>>({});

  const bounds = useMemo(() => {
    const start = new Date(`${date}T00:00:00`);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { from: start.toISOString(), to: end.toISOString() };
  }, [date]);

  const load = useCallback(async () => {
    if (!canUseFieldKit) return;
    setLoading(true);
    setError("");
    try {
      setData(
        await apiGet<TodayResponse>(
          `/api/v1/sales-workflow/today?from=${encodeURIComponent(bounds.from)}&to=${encodeURIComponent(bounds.to)}`,
        ),
      );
    } catch {
      setError("Could not load your sales day. Pull to refresh or try again.");
    } finally {
      setLoading(false);
    }
  }, [bounds.from, bounds.to, canUseFieldKit]);

  useEffect(() => {
    void load();
  }, [load]);

  const schedule = async () => {
    if (!user?.member || !accountName.trim() || !contactFirst.trim() || !purpose.trim()) {
      setError("Add the account, contact first name, and call purpose.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const contactId = randomUuid();
      await apiPost(
        "/api/v1/sales-workflow/cycles",
        {
          account: {
            name: accountName.trim(),
            ownerUserId: memberUuid(user.member.id),
            contacts: [
              {
                id: contactId,
                firstName: contactFirst.trim(),
                lastName: contactLast.trim(),
                isPrimary: true,
              },
            ],
          },
          contactIds: [contactId],
          purpose: purpose.trim(),
          schedule: {
            startsAt: new Date(`${date}T${time}:00`).toISOString(),
            durationMinutes: 30,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York",
            remindersMinutes: [30],
          },
        },
        { idempotencyKey: requestKey() },
      );
      setAccountName("");
      setContactFirst("");
      setContactLast("");
      setPurpose("");
      setShowSchedule(false);
      await load();
    } catch {
      setError("The call could not be scheduled. Check the fields and try again.");
    } finally {
      setSaving(false);
    }
  };

  const buildPlan = async (plan: WorkflowPlan) => {
    setSaving(true);
    setError("");
    try {
      await apiPost(
        `/api/v1/sales-workflow/plans/${plan.id}/build`,
        { expectedVersion: plan.version },
        { idempotencyKey: requestKey() },
      );
      await load();
    } catch {
      setError("The connected pre-call plan could not be generated.");
    } finally {
      setSaving(false);
    }
  };

  const completeCall = async (call: WorkflowCall) => {
    const summary = completionNotes[call.id]?.trim();
    if (!summary) {
      setError("Add a short outcome summary before completing the call.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await apiPost(
        `/api/v1/sales-workflow/calls/${call.id}/complete`,
        {
          expectedVersion: call.version,
          outcome: "follow_up",
          summary,
          consentConfirmed: false,
          commitments: [],
          referralSignals: [],
        },
        { idempotencyKey: requestKey() },
      );
      setCompletionNotes((current) => ({ ...current, [call.id]: "" }));
      await load();
    } catch {
      setError("The call was not completed. Refresh and try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!canUseFieldKit) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Field Kit access required</Text>
        <Pressable onPress={() => router.push("/(tabs)/account")} style={[styles.primary, { backgroundColor: colors.primary }]}>
          <Text style={styles.primaryText}>Open account</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Sales Command Center" }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: 18, paddingBottom: insets.bottom + 32 }}
      >
        <View style={styles.heading}>
          <View style={[styles.icon, { backgroundColor: colors.accent }]}>
            <Feather name="calendar" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.foreground }]}>Your sales day</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Plan, practice, complete, coach, and schedule the next step.
            </Text>
          </View>
        </View>

        <View style={styles.dateRow}>
          <TextInput
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
          />
          <Pressable onPress={() => setShowSchedule((value) => !value)} style={[styles.primary, { backgroundColor: colors.primary }]}>
            <Text style={styles.primaryText}>{showSchedule ? "Close" : "Add call"}</Text>
          </Pressable>
        </View>

        {showSchedule && (
          <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Schedule a call</Text>
            {[
              ["Account name", accountName, setAccountName],
              ["Contact first name", contactFirst, setContactFirst],
              ["Contact last name", contactLast, setContactLast],
              ["Purpose and desired outcome", purpose, setPurpose],
              ["Start time (HH:MM)", time, setTime],
            ].map(([placeholder, value, setter]) => (
              <TextInput
                key={placeholder as string}
                value={value as string}
                onChangeText={setter as (value: string) => void}
                placeholder={placeholder as string}
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
              />
            ))}
            <Pressable disabled={saving} onPress={schedule} style={[styles.primary, { backgroundColor: colors.primary, opacity: saving ? 0.6 : 1 }]}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Save call</Text>}
            </Pressable>
          </View>
        )}

        {!!error && <Text style={[styles.error, { color: colors.primary }]}>{error}</Text>}
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 30 }} />
        ) : data.calls.length === 0 ? (
          <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>No calls scheduled</Text>
            <Text style={{ color: colors.mutedForeground }}>Add the first account call for this day.</Text>
          </View>
        ) : (
          data.calls.map((call) => {
            const plan = data.plans.find((item) => item.callId === call.id);
            return (
              <View key={call.id} style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>{call.purpose}</Text>
                <Text style={{ color: colors.mutedForeground }}>
                  {new Date(call.schedule.startsAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} · {call.status}
                </Text>
                {plan?.status === "draft" && (
                  <Pressable disabled={saving} onPress={() => buildPlan(plan)} style={[styles.secondary, { borderColor: colors.primary }]}>
                    <Text style={{ color: colors.primary, fontWeight: "700" }}>Build connected plan</Text>
                  </Pressable>
                )}
                {!["completed", "canceled", "no_show"].includes(call.status) && (
                  <>
                    <TextInput
                      value={completionNotes[call.id] ?? ""}
                      onChangeText={(value) => setCompletionNotes((current) => ({ ...current, [call.id]: value }))}
                      placeholder="Outcome, commitments, and next step"
                      placeholderTextColor={colors.mutedForeground}
                      multiline
                      style={[styles.notes, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                    />
                    <Pressable disabled={saving} onPress={() => completeCall(call)} style={[styles.primary, { backgroundColor: colors.primary }]}>
                      <Text style={styles.primaryText}>Complete call + coaching</Text>
                    </Pressable>
                  </>
                )}
              </View>
            );
          })
        )}

        {data.actions.length > 0 && (
          <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Next actions</Text>
            {data.actions.map((action) => (
              <Text key={action.id} style={{ color: colors.foreground, marginTop: 8 }}>
                • {action.title}
              </Text>
            ))}
          </View>
        )}
        <Text style={[styles.safety, { color: colors.mutedForeground }]}>
          Do not enter patient-identifying information. AI coaching remains a draft until you review it.
        </Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 18, padding: 24 },
  heading: { flexDirection: "row", gap: 12, alignItems: "center", marginBottom: 18 },
  icon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "800" },
  subtitle: { fontSize: 13, lineHeight: 19, marginTop: 3 },
  dateRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  input: { flex: 1, minHeight: 46, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, marginBottom: 10 },
  notes: { minHeight: 88, borderWidth: 1, borderRadius: 10, padding: 12, marginTop: 14, marginBottom: 10, textAlignVertical: "top" },
  card: { borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 14 },
  cardTitle: { fontSize: 17, fontWeight: "800", marginBottom: 5 },
  primary: { minHeight: 46, borderRadius: 10, paddingHorizontal: 16, alignItems: "center", justifyContent: "center" },
  primaryText: { color: "#fff", fontWeight: "800" },
  secondary: { minHeight: 42, borderWidth: 1, borderRadius: 10, alignItems: "center", justifyContent: "center", marginTop: 12 },
  error: { marginBottom: 14, lineHeight: 20 },
  safety: { fontSize: 11, lineHeight: 17, textAlign: "center", marginTop: 8 },
});
