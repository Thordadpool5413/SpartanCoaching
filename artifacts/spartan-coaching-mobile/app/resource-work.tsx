/**
 * Native interactive resource work (HSP-26) — weekly plan save/resume.
 */
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { goBackOrReplace } from "@/lib/navigation";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { font } from "@/lib/typography";
import { apiGet, getBaseUrl, getSessionToken } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

const RESOURCE_KEY = "weekly-plan";
const LOCAL_KEY = "spartan_resource_work_weekly-plan";

type FormState = {
  weekOf: string;
  territory: string;
  primaryObjective: string;
  focus1: string;
  focus2: string;
  focus3: string;
  recoveryPlan: string;
};

const empty: FormState = {
  weekOf: "",
  territory: "",
  primaryObjective: "",
  focus1: "",
  focus2: "",
  focus3: "",
  recoveryPlan: "",
};

export default function ResourceWorkScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { canUseFieldKit } = useAuth();
  const [form, setForm] = useState<FormState>(empty);
  const [detail, setDetail] = useState<{
    title?: string;
    whenToUse?: string;
    expectedOutcome?: string;
    completionTimeMinutes?: number;
  } | null>(null);
  const [status, setStatus] = useState("draft");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const persistLocal = useCallback(async (next: FormState) => {
    try {
      await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(next));
    } catch {
      /* offline */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const local = await AsyncStorage.getItem(LOCAL_KEY);
        if (local && !cancelled) {
          const parsed = JSON.parse(local) as FormState;
          setForm({ ...empty, ...parsed });
        }
        if (canUseFieldKit) {
          const data = await apiGet<{
            detail?: typeof detail;
            work?: { formData?: Record<string, unknown>; status?: string };
          }>(`/api/v1/resource-work/${RESOURCE_KEY}`);
          if (cancelled) return;
          setDetail(data.detail ?? null);
          if (data.work?.formData) {
            const fd = data.work.formData;
            setForm({
              weekOf: String(fd.weekOf ?? ""),
              territory: String(fd.territory ?? ""),
              primaryObjective: String(fd.primaryObjective ?? ""),
              focus1: Array.isArray(fd.focusAccounts)
                ? String(fd.focusAccounts[0] ?? "")
                : String(fd.focus1 ?? ""),
              focus2: Array.isArray(fd.focusAccounts)
                ? String(fd.focusAccounts[1] ?? "")
                : String(fd.focus2 ?? ""),
              focus3: Array.isArray(fd.focusAccounts)
                ? String(fd.focusAccounts[2] ?? "")
                : String(fd.focus3 ?? ""),
              recoveryPlan: String(fd.recoveryPlan ?? ""),
            });
            setStatus(data.work.status === "completed" ? "completed" : "draft");
          }
        } else {
          setDetail({
            title: "Spartan Weekly Plan",
            whenToUse: "Sunday night or Monday morning.",
            expectedOutcome: "A plan you can resume when signed in.",
            completionTimeMinutes: 15,
          });
        }
      } catch {
        if (!cancelled) {
          setDetail({
            title: "Spartan Weekly Plan",
            whenToUse: "Sunday night or Monday morning.",
            expectedOutcome: "Local draft until you are online.",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canUseFieldKit, reloadKey]);

  const setField = (key: keyof FormState, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      void persistLocal(next);
      return next;
    });
    setMessage(null);
    setError(null);
  };

  const save = async (nextStatus: "draft" | "completed") => {
    setSaving(true);
    setError(null);
    setMessage(null);
    await persistLocal(form);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const formData = {
      weekOf: form.weekOf,
      territory: form.territory,
      primaryObjective: form.primaryObjective,
      focusAccounts: [form.focus1, form.focus2, form.focus3],
      recoveryPlan: form.recoveryPlan,
    };

    if (!canUseFieldKit) {
      setMessage("Saved on this device. Sign in to sync across devices.");
      setSaving(false);
      return;
    }

    try {
      const token = await getSessionToken();
      const res = await fetch(`${getBaseUrl()}/api/v1/resource-work/${RESOURCE_KEY}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          formData,
          status: nextStatus,
          title: "Spartan Weekly Plan",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (data as { error?: { message?: string } })?.error?.message ||
            `Save failed (${res.status})`,
        );
      }
      const st = (data as { work?: { status?: string } }).work?.status;
      setStatus(st === "completed" ? "completed" : "draft");
      const errs = (data as { validation?: { errors?: string[] } }).validation?.errors;
      if (errs?.length && nextStatus === "completed") {
        setMessage("Saved as draft — add Week Of and Primary Objective to complete.");
      } else {
        setMessage(st === "completed" ? "Plan completed and synced." : "Progress saved.");
      }
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not sync. Local draft kept on this device.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: "Weekly Plan",
          headerShown: true,
        }}
      />
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 32,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            <Text style={[{ color: colors.primary, fontSize: 11, letterSpacing: 1 }, font("bold")]}>
              INTERACTIVE RESOURCE
            </Text>
            <Text style={[{ color: colors.foreground, fontSize: 22, marginTop: 6 }, font("heavy")]}>
              {detail?.title || "Spartan Weekly Plan"}
            </Text>
            <Text style={[{ color: colors.mutedForeground, marginTop: 4, fontSize: 13 }, font("regular")]}>
              Status: {status}
              {detail?.completionTimeMinutes
                ? ` · ~${detail.completionTimeMinutes} min`
                : ""}
            </Text>
            {detail?.whenToUse ? (
              <Text style={[styles.meta, { color: colors.mutedForeground }, font("regular")]}>
                When: {detail.whenToUse}
              </Text>
            ) : null}
            {detail?.expectedOutcome ? (
              <Text style={[styles.meta, { color: colors.mutedForeground }, font("regular")]}>
                Outcome: {detail.expectedOutcome}
              </Text>
            ) : null}
            <View
              style={[styles.workflowCard, { backgroundColor: colors.card, borderColor: colors.borderStrong }]}
              accessibilityLabel="Weekly plan completion checklist"
              testID="resource-work-completion-checklist"
            >
              <Text style={[{ color: colors.primary, fontSize: 10, letterSpacing: 1.4 }, font("bold")]}>
                PREPARE · COMPLETE THE JOB
              </Text>
              <Text style={[{ color: colors.foreground, fontSize: 14, marginTop: 5 }, font("bold")]}>
                Build a week you can execute, not a list you will abandon.
              </Text>
              {[
                "Choose three priority accounts and one measurable week win.",
                "Protect the first field block before lower-value work fills it.",
                "On Friday, mark the win kept, moved, or blocked before planning again.",
              ].map((step, index) => (
                <Text key={step} style={[styles.checklistStep, { color: colors.mutedForeground }, font("regular")]}>
                  <Text style={[{ color: colors.primary }, font("bold")]}>{index + 1}. </Text>
                  {step}
                </Text>
              ))}
              <Text style={[styles.workflowBoundary, { color: colors.mutedForeground }, font("regular")]}>
                Use professional account context only. Do not add patient names, contact details, or clinical information.
              </Text>
            </View>

            <Field
              label="Week of"
              value={form.weekOf}
              onChange={(v) => setField("weekOf", v)}
              colors={colors}
            />
            <Field
              label="Territory"
              value={form.territory}
              onChange={(v) => setField("territory", v)}
              colors={colors}
            />
            <Field
              label="Primary objective"
              value={form.primaryObjective}
              onChange={(v) => setField("primaryObjective", v)}
              colors={colors}
              multiline
            />
            <Field
              label="Focus account 1"
              value={form.focus1}
              onChange={(v) => setField("focus1", v)}
              colors={colors}
            />
            <Field
              label="Focus account 2"
              value={form.focus2}
              onChange={(v) => setField("focus2", v)}
              colors={colors}
            />
            <Field
              label="Focus account 3"
              value={form.focus3}
              onChange={(v) => setField("focus3", v)}
              colors={colors}
            />
            <Field
              label="Recovery plan"
              value={form.recoveryPlan}
              onChange={(v) => setField("recoveryPlan", v)}
              colors={colors}
              multiline
            />

            {message ? (
              <Text style={[{ color: colors.primary, marginTop: 12, fontSize: 13 }, font("semibold")]}>
                {message}
              </Text>
            ) : null}
            {error ? (
              <View style={{ marginTop: 12, gap: 8 }}>
                <Text style={[{ color: colors.destructive ?? "#b91c1c", fontSize: 13 }, font("regular")]}>
                  {error}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Retry loading weekly plan"
                  onPress={() => setReloadKey((current) => current + 1)}
                  style={styles.retry}
                  testID="button-retry-resource-work"
                >
                  <Text style={[{ color: colors.primary, fontSize: 13 }, font("bold")]}>Retry connection</Text>
                </Pressable>
              </View>
            ) : null}

            <View style={styles.actions}>
              <Pressable
                onPress={() => void save("draft")}
                disabled={saving}
                style={[styles.btn, { backgroundColor: colors.primary, opacity: saving ? 0.6 : 1 }]}
                testID="button-save-resource-work"
              >
                <Text style={[{ color: "#fff", fontSize: 15 }, font("bold")]}>
                  {saving ? "Saving…" : "Save progress"}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => void save("completed")}
                disabled={saving}
                style={[
                  styles.btn,
                  {
                    borderWidth: 1.5,
                    borderColor: colors.primary,
                    backgroundColor: "transparent",
                  },
                ]}
                testID="button-complete-resource-work"
              >
                <Text style={[{ color: colors.primary, fontSize: 15 }, font("bold")]}>
                  Mark complete
                </Text>
              </Pressable>
            </View>
            {status === "completed" ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/sales-workflow" as any)}
                style={[styles.nextAction, { borderColor: colors.primary, backgroundColor: colors.primaryMuted }]}
                testID="button-resource-work-next-action"
              >
                <View style={{ flex: 1 }}>
                  <Text style={[{ color: colors.primary, fontSize: 13 }, font("bold")]}>Next: open Sales Command Center</Text>
                  <Text style={[{ color: colors.mutedForeground, fontSize: 11, marginTop: 2 }, font("regular")]}>
                    Start with Monday’s first priority account and confirm the next step.
                  </Text>
                </View>
              </Pressable>
            ) : null}

            <Pressable onPress={() => goBackOrReplace("/(tabs)/learn")} style={{ marginTop: 16 }}>
              <Text style={[{ color: colors.mutedForeground, fontSize: 14 }, font("regular")]}>
                Back to Learn
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
  colors,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  colors: ReturnType<typeof useColors>;
  multiline?: boolean;
}) {
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={[{ color: colors.foreground, fontSize: 13, marginBottom: 6 }, font("semibold")]}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        textAlignVertical={multiline ? "top" : "center"}
        style={[
          styles.input,
          multiline && { minHeight: 72 },
          {
            color: colors.foreground,
            borderColor: colors.border,
            backgroundColor: colors.card,
          },
          font("regular"),
        ]}
        placeholderTextColor={colors.mutedForeground}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  meta: { fontSize: 13, lineHeight: 19, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  actions: { marginTop: 20, gap: 10 },
  workflowCard: { marginTop: 16, borderWidth: 1, borderRadius: 14, padding: 14 },
  checklistStep: { fontSize: 12, lineHeight: 18, marginTop: 8 },
  workflowBoundary: { fontSize: 10, lineHeight: 15, marginTop: 10 },
  retry: { minHeight: 40, justifyContent: "center", alignSelf: "flex-start" },
  nextAction: { marginTop: 16, minHeight: 66, borderWidth: 1, borderRadius: 12, padding: 13, justifyContent: "center" },
  btn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    minHeight: 48,
    justifyContent: "center",
  },
});
