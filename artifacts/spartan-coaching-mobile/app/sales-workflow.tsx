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
import {
  buildEmailDraftPayload,
  buildNextCallPayload,
  canDraftEmailFromAction,
  canScheduleNextFromAction,
  type WorkflowNextActionLike,
} from "@/lib/commandCenterNextActions";

type WorkflowCall = {
  id: string;
  version: number;
  purpose: string;
  status: string;
  schedule: { startsAt: string; durationMinutes: number };
};
type WorkflowPlan = { id: string; callId: string; version: number; status: string };
type WorkflowAction = WorkflowNextActionLike & {
  id: string;
  title: string;
  status: string;
  dueAt?: string;
};
type TodayResponse = {
  calls: WorkflowCall[];
  plans: WorkflowPlan[];
  actions: WorkflowAction[];
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
type NextActionItem = {
  id: string;
  title: string;
  type?: string;
  status?: string;
  dueAt?: string;
};
type CoachingReview = {
  coachingId: string;
  coachingVersion: number;
  nextActions: NextActionItem[];
  selectedIds: string[];
  /** Optional short coaching blurb (no raw PHI dump) */
  summary?: string;
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
  const [coachingReview, setCoachingReview] = useState<CoachingReview | null>(null);
  /** Action id for inline schedule-next form (pass 5). */
  const [scheduleNextId, setScheduleNextId] = useState<string | null>(null);
  const [nextPurpose, setNextPurpose] = useState("");
  const [nextDate, setNextDate] = useState(new Date().toISOString().slice(0, 10));
  const [nextTime, setNextTime] = useState("10:00");
  const [emailDraftPreview, setEmailDraftPreview] = useState<{
    actionId: string;
    subject: string;
    body: string;
  } | null>(null);

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
      const result = await apiPost<{
        coaching: {
          id: string;
          version: number;
          coaching?: { output?: Record<string, unknown> };
          performance?: { output?: Record<string, unknown> };
        };
        nextActions: NextActionItem[];
      }>(
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
      const actions = Array.isArray(result.nextActions) ? result.nextActions : [];
      const output =
        result.coaching?.coaching?.output ?? result.coaching?.performance?.output;
      const coachingSummary =
        output && typeof output === "object"
          ? String(
              (output as { personalizedFeedback?: string; callSummary?: string })
                .personalizedFeedback ||
                (output as { callSummary?: string }).callSummary ||
                "",
            ).slice(0, 400)
          : "";
      // Human-in-the-loop: next actions stay drafts until the rep approves.
      setCoachingReview({
        coachingId: result.coaching.id,
        coachingVersion: result.coaching.version,
        nextActions: actions,
        selectedIds: actions.map((a) => a.id),
        summary: coachingSummary || undefined,
      });
      await load();
    } catch {
      setError("The call was not completed. Refresh and try again.");
    } finally {
      setSaving(false);
    }
  };

  const toggleAction = (actionId: string) => {
    setCoachingReview((current) => {
      if (!current) return current;
      const selected = current.selectedIds.includes(actionId)
        ? current.selectedIds.filter((id) => id !== actionId)
        : [...current.selectedIds, actionId];
      return { ...current, selectedIds: selected };
    });
  };

  const approveCoaching = async () => {
    if (!coachingReview) return;
    setSaving(true);
    setError("");
    try {
      await apiPost(
        `/api/v1/sales-workflow/coaching/${coachingReview.coachingId}/approve`,
        {
          expectedVersion: coachingReview.coachingVersion,
          acceptedActionIds: coachingReview.selectedIds,
        },
        { idempotencyKey: requestKey() },
      );
      setCoachingReview(null);
      await load();
    } catch {
      setError("Could not approve next actions. Try again or review later.");
    } finally {
      setSaving(false);
    }
  };

  const openScheduleNext = (action: WorkflowAction) => {
    setScheduleNextId(action.id);
    setNextPurpose(action.title || "Follow-up visit");
    setEmailDraftPreview(null);
    setError("");
  };

  const scheduleNextFromAction = async (action: WorkflowAction) => {
    if (!canScheduleNextFromAction(action) || !action.cycleId) {
      setError("This action cannot be scheduled yet.");
      return;
    }
    if (!nextPurpose.trim()) {
      setError("Add a purpose for the next call.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const startsAt = new Date(`${nextDate}T${nextTime}:00`).toISOString();
      await apiPost(
        `/api/v1/sales-workflow/cycles/${action.cycleId}/next-call`,
        buildNextCallPayload({
          action,
          purpose: nextPurpose,
          startsAtIso: startsAt,
        }),
        { idempotencyKey: requestKey() },
      );
      setScheduleNextId(null);
      setNextPurpose("");
      await load();
    } catch {
      setError("Could not schedule the next call. Refresh and try again.");
    } finally {
      setSaving(false);
    }
  };

  const draftEmailFromAction = async (action: WorkflowAction) => {
    if (!canDraftEmailFromAction(action)) {
      setError("This action is not ready for an email draft.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const draft = await apiPost<{ subject?: string; body?: string }>(
        `/api/v1/sales-workflow/next-actions/${action.id}/email-draft`,
        buildEmailDraftPayload(action),
        { idempotencyKey: requestKey() },
      );
      setEmailDraftPreview({
        actionId: action.id,
        subject: draft.subject || "(no subject)",
        body: (draft.body || "").slice(0, 2000),
      });
      setScheduleNextId(null);
      await load();
    } catch {
      setError("Could not create email draft. Try again.");
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

        {coachingReview && (
          <View
            style={[styles.card, { borderColor: colors.primary, backgroundColor: colors.card }]}
            testID="coaching-review-panel"
          >
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Review coaching & next steps
            </Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 13, lineHeight: 18 }}>
              The call is saved. Approve only the next actions you will own. Nothing is accepted until
              you confirm.
            </Text>
            {!!coachingReview.summary && (
              <Text
                style={{
                  color: colors.foreground,
                  fontSize: 13,
                  lineHeight: 18,
                  marginTop: 10,
                }}
              >
                {coachingReview.summary}
              </Text>
            )}
            {coachingReview.nextActions.length === 0 ? (
              <Text style={{ color: colors.mutedForeground, marginTop: 12, fontSize: 13 }}>
                No draft next actions returned. You can close and continue.
              </Text>
            ) : (
              coachingReview.nextActions.map((action) => {
                const checked = coachingReview.selectedIds.includes(action.id);
                return (
                  <Pressable
                    key={action.id}
                    onPress={() => toggleAction(action.id)}
                    style={[
                      styles.actionRow,
                      {
                        borderColor: checked ? colors.primary : colors.border,
                        backgroundColor: colors.background,
                      },
                    ]}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked }}
                  >
                    <Text style={{ color: colors.primary, fontWeight: "800", width: 22 }}>
                      {checked ? "✓" : "○"}
                    </Text>
                    <View style={{ flex: 1 }}>
                      {!!action.type && (
                        <Text
                          style={{
                            color: colors.mutedForeground,
                            fontSize: 10,
                            fontWeight: "800",
                            textTransform: "uppercase",
                          }}
                        >
                          {action.type.replace(/_/g, " ")}
                        </Text>
                      )}
                      <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 14 }}>
                        {action.title}
                      </Text>
                    </View>
                  </Pressable>
                );
              })
            )}
            <View style={styles.reviewActions}>
              <Pressable
                disabled={saving}
                onPress={() => setCoachingReview(null)}
                style={[styles.secondary, { borderColor: colors.border, flex: 1, marginTop: 0 }]}
              >
                <Text style={{ color: colors.mutedForeground, fontWeight: "700" }}>Review later</Text>
              </Pressable>
              <Pressable
                disabled={saving}
                onPress={approveCoaching}
                style={[
                  styles.primary,
                  {
                    backgroundColor: colors.primary,
                    flex: 1,
                    marginTop: 0,
                    opacity: saving ? 0.6 : 1,
                  },
                ]}
                testID="approve-coaching-actions"
              >
                {saving ? (
                  <ActivityIndicator color={colors.primaryForeground} />
                ) : (
                  <Text style={[styles.primaryText, { color: colors.primaryForeground }]}>
                    Approve selected
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        )}

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
          <View
            style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}
            testID="card-next-actions"
          >
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Next actions</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 12, marginBottom: 4 }}>
              Approved actions only — schedule the next visit or draft a follow-up email.
            </Text>
            {data.actions.map((action) => (
              <View
                key={action.id}
                style={[styles.actionRow, { borderColor: colors.border }]}
                testID={`next-action-${action.id}`}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700" }}>
                    {(action.type || "task").replace("_", " ")} · {action.status || "open"}
                  </Text>
                  <Text style={{ color: colors.foreground, marginTop: 4, fontWeight: "700" }}>
                    {action.title}
                  </Text>
                  {canScheduleNextFromAction(action) ? (
                    scheduleNextId === action.id ? (
                      <View style={{ marginTop: 10 }}>
                        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                          Purpose
                        </Text>
                        <TextInput
                          value={nextPurpose}
                          onChangeText={setNextPurpose}
                          style={[
                            styles.input,
                            {
                              borderColor: colors.border,
                              color: colors.foreground,
                              backgroundColor: colors.background,
                            },
                          ]}
                          testID="input-next-call-purpose"
                        />
                        <View style={styles.dateRow}>
                          <TextInput
                            value={nextDate}
                            onChangeText={setNextDate}
                            placeholder="YYYY-MM-DD"
                            style={[
                              styles.input,
                              {
                                borderColor: colors.border,
                                color: colors.foreground,
                                backgroundColor: colors.background,
                              },
                            ]}
                            testID="input-next-call-date"
                          />
                          <TextInput
                            value={nextTime}
                            onChangeText={setNextTime}
                            placeholder="HH:MM"
                            style={[
                              styles.input,
                              {
                                borderColor: colors.border,
                                color: colors.foreground,
                                backgroundColor: colors.background,
                              },
                            ]}
                            testID="input-next-call-time"
                          />
                        </View>
                        <SpartanButton
                          title={saving ? "Scheduling…" : "Confirm next call"}
                          disabled={saving}
                          onPress={() => void scheduleNextFromAction(action)}
                          testID="button-confirm-next-call"
                        />
                        <Pressable
                          onPress={() => setScheduleNextId(null)}
                          style={[styles.secondary, { borderColor: colors.border }]}
                        >
                          <Text style={{ color: colors.mutedForeground, fontWeight: "700" }}>
                            Cancel
                          </Text>
                        </Pressable>
                      </View>
                    ) : (
                      <SpartanButton
                        title="Schedule next call"
                        variant="outline"
                        disabled={saving}
                        onPress={() => openScheduleNext(action)}
                        style={{ marginTop: 10 }}
                        testID={`button-schedule-next-${action.id}`}
                      />
                    )
                  ) : null}
                  {canDraftEmailFromAction(action) ? (
                    <SpartanButton
                      title={saving ? "Drafting…" : "Create email draft"}
                      variant="outline"
                      disabled={saving}
                      onPress={() => void draftEmailFromAction(action)}
                      style={{ marginTop: 10 }}
                      testID={`button-email-draft-${action.id}`}
                    />
                  ) : null}
                  {emailDraftPreview?.actionId === action.id ? (
                    <View
                      style={[
                        styles.draftPreview,
                        { borderColor: colors.border, marginTop: 10 },
                      ]}
                      testID="email-draft-preview"
                    >
                      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                        Draft subject
                      </Text>
                      <Text style={{ color: colors.foreground, fontWeight: "700" }}>
                        {emailDraftPreview.subject}
                      </Text>
                      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                        Draft body (copy on device — no PHI)
                      </Text>
                      <Text style={{ color: colors.mutedForeground, fontSize: 13, lineHeight: 18 }}>
                        {emailDraftPreview.body || "Empty draft body"}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
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
  actionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  reviewActions: { flexDirection: "row", gap: 10, marginTop: 14 },
  error: { marginBottom: 14, lineHeight: 20 },
  safety: { fontSize: 11, lineHeight: 17, textAlign: "center", marginTop: 8 },
});
