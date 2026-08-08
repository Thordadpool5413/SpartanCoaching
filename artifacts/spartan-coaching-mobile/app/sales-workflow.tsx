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
import { SectionKicker } from "@/components/ui/SectionKicker";
import { SpartanCard } from "@/components/ui/SpartanCard";
import { SpartanButton } from "@/components/ui/SpartanButton";
import { getToolById } from "@workspace/field-kit-catalog";
import { memberIdToWorkflowUuid } from "@workspace/tenant-ids";

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
type CallOutcome =
  | "advanced"
  | "follow_up"
  | "not_interested"
  | "reschedule"
  | "no_show"
  | "canceled";
type DebriefDraft = {
  suggestedOutcome: CallOutcome;
  summary: string;
  commitments: string[];
  objectionsHeard: string[];
  nextStepSuggestion: string;
  coachingTips: string[];
  complianceFlags: string[];
  overallConfidence: number;
};
type DraftMeta = {
  source: "ai" | "fallback";
  confidence: number;
  tips: string[];
  flags: string[];
  nextStep: string;
  objections: string[];
};

const OUTCOMES: { value: CallOutcome; label: string }[] = [
  { value: "follow_up", label: "Follow up" },
  { value: "advanced", label: "Advanced" },
  { value: "not_interested", label: "Not interested" },
  { value: "reschedule", label: "Reschedule" },
  { value: "no_show", label: "No show" },
  { value: "canceled", label: "Canceled" },
];

const requestKey = () => `mobile-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const randomUuid = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const value = Math.floor(Math.random() * 16);
    return (character === "x" ? value : (value & 0x3) | 0x8).toString(16);
  });
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
  const [callOutcomes, setCallOutcomes] = useState<Record<string, CallOutcome>>({});
  const [callCommitments, setCallCommitments] = useState<Record<string, string>>({});
  const [draftMetaByCall, setDraftMetaByCall] = useState<Record<string, DraftMeta>>({});
  const [draftingCallId, setDraftingCallId] = useState<string | null>(null);

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
            ownerUserId: memberIdToWorkflowUuid(user.member.id),
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

  const draftDebrief = async (call: WorkflowCall) => {
    const notes = completionNotes[call.id]?.trim() ?? "";
    if (notes.length < 8) {
      setError("Add a few sentences about what happened, then draft the debrief.");
      return;
    }
    setDraftingCallId(call.id);
    setError("");
    try {
      const res = await apiPost<{
        draft: DebriefDraft;
        source: "ai" | "fallback";
      }>("/api/v1/sales-workflow/debrief/draft", {
        notes,
        purpose: call.purpose,
      }, { idempotencyKey: requestKey() });
      const d = res.draft;
      setCallOutcomes((current) => ({ ...current, [call.id]: d.suggestedOutcome }));
      setCompletionNotes((current) => ({ ...current, [call.id]: d.summary }));
      setCallCommitments((current) => ({
        ...current,
        [call.id]: d.commitments.join("\n"),
      }));
      setDraftMetaByCall((current) => ({
        ...current,
        [call.id]: {
          source: res.source,
          confidence: d.overallConfidence,
          tips: d.coachingTips ?? [],
          flags: d.complianceFlags ?? [],
          nextStep: d.nextStepSuggestion ?? "",
          objections: d.objectionsHeard ?? [],
        },
      }));
    } catch {
      setError("Could not draft debrief — enter fields manually.");
    } finally {
      setDraftingCallId(null);
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
      const commitments = (callCommitments[call.id] ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      await apiPost(
        `/api/v1/sales-workflow/calls/${call.id}/complete`,
        {
          expectedVersion: call.version,
          outcome: callOutcomes[call.id] ?? "follow_up",
          summary,
          consentConfirmed: false,
          commitments,
          referralSignals: [],
        },
        { idempotencyKey: requestKey() },
      );
      setCompletionNotes((current) => ({ ...current, [call.id]: "" }));
      setCallCommitments((current) => ({ ...current, [call.id]: "" }));
      setDraftMetaByCall((current) => {
        const next = { ...current };
        delete next[call.id];
        return next;
      });
      await load();
    } catch {
      setError("The call was not completed. Refresh and try again.");
    } finally {
      setSaving(false);
    }
  };

  const tool = getToolById("sales-workflow");

  if (!canUseFieldKit) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, padding: 24 }]}>
        <SectionKicker>Hospice Sales Pro</SectionKicker>
        <Text style={[styles.title, { color: colors.foreground, marginTop: 8 }]}>Access required</Text>
        <Text style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 8, marginBottom: 16 }}>
          Sign in with an active evaluation or client account to use Command Center.
        </Text>
        <SpartanButton title="Open account" onPress={() => router.push("/(tabs)/account")} />
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
        <SectionKicker>Hospice Sales Pro · Daily spine</SectionKicker>
        <Text style={[styles.title, { color: colors.foreground, marginTop: 8 }]}>
          {tool?.title || "Sales Command Center"}
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {tool?.description || "Plan, practice, complete, coach, and schedule the next step."}
        </Text>

        <SpartanCard style={{ marginTop: 12, marginBottom: 14 }}>
          <Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 17 }}>
            When: {tool?.whenToUse}
          </Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 17, marginTop: 6 }}>
            Why: {tool?.why}
          </Text>
        </SpartanCard>

        <View style={styles.dateRow}>
          <TextInput
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
          />
          <SpartanButton
            title={showSchedule ? "Close" : "Add call"}
            onPress={() => setShowSchedule((value) => !value)}
            style={{ minWidth: 110 }}
          />
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
              {saving ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Text style={[styles.primaryText, { color: colors.primaryForeground }]}>Save call</Text>
              )}
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
                    <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                      What happened (rough notes)
                    </Text>
                    <TextInput
                      value={completionNotes[call.id] ?? ""}
                      onChangeText={(value) => setCompletionNotes((current) => ({ ...current, [call.id]: value }))}
                      placeholder="Gatekeeper, DON concerns, commitments — no patient names"
                      placeholderTextColor={colors.mutedForeground}
                      multiline
                      style={[styles.notes, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                    />
                    <Pressable
                      disabled={saving || draftingCallId === call.id}
                      onPress={() => draftDebrief(call)}
                      style={[styles.secondary, { borderColor: colors.primary, opacity: draftingCallId === call.id ? 0.6 : 1 }]}
                    >
                      {draftingCallId === call.id ? (
                        <ActivityIndicator color={colors.primary} />
                      ) : (
                        <Text style={{ color: colors.primary, fontWeight: "700" }}>Draft debrief with AI</Text>
                      )}
                    </Pressable>
                    {draftMetaByCall[call.id] && (
                      <View style={[styles.draftPreview, { borderColor: colors.border, backgroundColor: colors.background }]}>
                        <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 13 }}>
                          Draft ready ({draftMetaByCall[call.id].source === "ai" ? "AI" : "offline fallback"}) ·{" "}
                          {Math.round(draftMetaByCall[call.id].confidence * 100)}% confidence
                        </Text>
                        {!!draftMetaByCall[call.id].nextStep && (
                          <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 6, lineHeight: 17 }}>
                            Next step: {draftMetaByCall[call.id].nextStep}
                          </Text>
                        )}
                        {draftMetaByCall[call.id].objections.length > 0 && (
                          <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 4, lineHeight: 17 }}>
                            Objections: {draftMetaByCall[call.id].objections.join(" · ")}
                          </Text>
                        )}
                        {draftMetaByCall[call.id].tips.map((tip) => (
                          <Text key={tip} style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 4, lineHeight: 17 }}>
                            · {tip}
                          </Text>
                        ))}
                        {draftMetaByCall[call.id].flags.length > 0 && (
                          <Text style={{ color: colors.primary, fontSize: 12, marginTop: 6, lineHeight: 17 }}>
                            Review flags: {draftMetaByCall[call.id].flags.join(" · ")}
                          </Text>
                        )}
                      </View>
                    )}
                    <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Outcome</Text>
                    <View style={styles.outcomeRow}>
                      {OUTCOMES.map((item) => {
                        const selected = (callOutcomes[call.id] ?? "follow_up") === item.value;
                        return (
                          <Pressable
                            key={item.value}
                            onPress={() =>
                              setCallOutcomes((current) => ({ ...current, [call.id]: item.value }))
                            }
                            style={[
                              styles.outcomeChip,
                              {
                                borderColor: selected ? colors.primary : colors.border,
                                backgroundColor: selected ? colors.primary : colors.background,
                              },
                            ]}
                          >
                            <Text
                              style={{
                                color: selected ? colors.primaryForeground : colors.foreground,
                                fontSize: 11,
                                fontWeight: "700",
                              }}
                            >
                              {item.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                      Commitments (one per line)
                    </Text>
                    <TextInput
                      value={callCommitments[call.id] ?? ""}
                      onChangeText={(value) =>
                        setCallCommitments((current) => ({ ...current, [call.id]: value }))
                      }
                      placeholder="Send packet Friday / Follow up Tue 10am"
                      placeholderTextColor={colors.mutedForeground}
                      multiline
                      style={[styles.notes, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background, minHeight: 64 }]}
                    />
                    <Pressable
                      disabled={saving || draftingCallId === call.id}
                      onPress={() => completeCall(call)}
                      style={[styles.primary, { backgroundColor: colors.primary, opacity: saving ? 0.6 : 1 }]}
                    >
                      <Text style={[styles.primaryText, { color: colors.primaryForeground }]}>
                        Complete call + coaching
                      </Text>
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
  notes: { minHeight: 88, borderWidth: 1, borderRadius: 10, padding: 12, marginTop: 6, marginBottom: 10, textAlignVertical: "top" },
  card: { borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 14 },
  cardTitle: { fontSize: 17, fontWeight: "800", marginBottom: 5 },
  fieldLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 0.4, textTransform: "uppercase", marginTop: 10 },
  draftPreview: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 8 },
  outcomeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6, marginBottom: 4 },
  outcomeChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  primary: { minHeight: 46, borderRadius: 10, paddingHorizontal: 16, alignItems: "center", justifyContent: "center", marginTop: 8 },
  primaryText: { fontWeight: "800" },
  secondary: { minHeight: 42, borderWidth: 1, borderRadius: 10, alignItems: "center", justifyContent: "center", marginTop: 4, marginBottom: 8 },
  error: { marginBottom: 14, lineHeight: 20 },
  safety: { fontSize: 11, lineHeight: 17, textAlign: "center", marginTop: 8 },
});
