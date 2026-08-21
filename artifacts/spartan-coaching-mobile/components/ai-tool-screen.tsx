import { Feather } from "@expo/vector-icons";
import * as Crypto from "expo-crypto";
import * as Haptics from "expo-haptics";
import { router, type Href } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { goBackOrReplace } from "@/lib/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  buildAiToolExperienceInput,
  buildConnectedToolInput,
  getAiToolExperience,
  getSpartanAiToolConnections,
  getSpartanAiTool,
  hydrateAiToolExperienceValues,
  initialAiToolExperienceValues,
  type AiToolExperienceField,
  type AiToolExperienceValue,
  type SpartanAiToolId,
} from "@workspace/spartan-ai-tools";
import { consumeAiToolHandoff, stageAiToolHandoff } from "@/lib/aiToolHandoff";
import { useColors } from "@/hooks/useColors";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { apiGet, apiPost } from "@/lib/api";
import { font } from "@/lib/typography";
import { trackProductOutcome } from "@/lib/analytics";
import { fetchJurisdictionContext, type JurisdictionContext } from "@/lib/jurisdictionApi";
import { VAULT, VAULT_COPY } from "@/lib/clinicalVaultTheme";
import { ClinicalVaultBadge, ClinicalVaultToolBanner } from "@/components/ClinicalVaultChrome";
import { PremiumAiResult, formatAiResultForSharing } from "@/components/PremiumAiResult";

type FormValue = AiToolExperienceValue;
type ToolRun = {
  id?: string;
  status?: string;
  reviewStatus?: string;
  output?: unknown;
  createdAt: string;
  watermark?: string;
  retention?: "ephemeral";
  recoverable?: boolean;
};

function GuidedField({
  field,
  value,
  onChange,
}: {
  field: AiToolExperienceField;
  value: FormValue;
  onChange: (next: FormValue) => void;
}) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const options = field.options ?? [];
  const selectedValues = Array.isArray(value) ? value : [];
  const initialCustom =
    field.kind === "multi-choice"
      ? selectedValues.find((item) => !options.includes(item)) ?? ""
      : typeof value === "string" && value && !options.includes(value)
        ? value
        : "";
  const [otherOpen, setOtherOpen] = useState(Boolean(initialCustom));
  const [otherValue, setOtherValue] = useState(initialCustom);

  const selectSingle = (option: string) => {
    setOtherOpen(false);
    setOtherValue("");
    onChange(option);
    if (Platform.OS !== "web") void Haptics.selectionAsync();
  };

  const toggleMultiple = (option: string) => {
    const current = Array.isArray(value) ? value : [];
    onChange(
      current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option],
    );
    if (Platform.OS !== "web") void Haptics.selectionAsync();
  };

  const updateOther = (next: string) => {
    const previous = otherValue;
    setOtherValue(next);
    if (field.kind === "multi-choice") {
      const current = Array.isArray(value) ? value : [];
      onChange([
        ...current.filter((item) => item !== previous && options.includes(item)),
        ...(next.trim() ? [next] : []),
      ]);
    } else {
      onChange(next);
    }
  };

  if (field.kind === "single-choice" || field.kind === "multi-choice") {
    return (
      <View style={styles.field}>
        <Text style={styles.label}>
          {field.label}
          {field.required ? " *" : ""}
        </Text>
        {field.helper ? <Text style={styles.fieldHint}>{field.helper}</Text> : null}
        <View accessibilityRole={field.kind === "single-choice" ? "radiogroup" : undefined} style={styles.choiceRow}>
          {options.map((option) => {
            const selected =
              field.kind === "multi-choice"
                ? selectedValues.includes(option)
                : value === option;
            return (
              <Pressable
                key={option}
                accessibilityRole={field.kind === "single-choice" ? "radio" : "checkbox"}
                accessibilityState={{ checked: selected }}
                onPress={() =>
                  field.kind === "multi-choice"
                    ? toggleMultiple(option)
                    : selectSingle(option)
                }
                style={[styles.choice, selected && styles.choiceSelected]}
              >
                <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>
                  {option}
                </Text>
              </Pressable>
            );
          })}
          {field.allowOther ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Add another ${field.label.toLowerCase()}`}
              onPress={() => {
                setOtherOpen(true);
                if (field.kind === "single-choice") onChange(otherValue);
                if (Platform.OS !== "web") void Haptics.selectionAsync();
              }}
              style={[styles.choice, otherOpen && styles.choiceSelected]}
            >
              <Text style={[styles.choiceText, otherOpen && styles.choiceTextSelected]}>Other</Text>
            </Pressable>
          ) : null}
        </View>
        {otherOpen ? (
          <TextInput
            accessibilityLabel={`Other ${field.label}`}
            value={otherValue}
            onChangeText={updateOther}
            placeholder="Enter your own response"
            placeholderTextColor={colors.mutedForeground}
            autoFocus
            style={styles.input}
          />
        ) : null}
      </View>
    );
  }

  const multiline = field.kind === "long-text";
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {field.label}
        {field.required ? " *" : ""}
      </Text>
      {field.helper ? <Text style={styles.fieldHint}>{field.helper}</Text> : null}
      <TextInput
        accessibilityLabel={field.label}
        value={String(value ?? "")}
        onChangeText={(next) => onChange(field.kind === "number" ? Number(next) : next)}
        placeholder={field.placeholder}
        placeholderTextColor={colors.mutedForeground}
        multiline={multiline}
        keyboardType={field.kind === "number" ? "numeric" : "default"}
        textAlignVertical={multiline ? "top" : "center"}
        style={[styles.input, multiline && styles.multiline]}
      />
    </View>
  );
}

export function AiToolScreen({ toolId }: { toolId: SpartanAiToolId }) {
  const tool = getSpartanAiTool(toolId)!;
  const experience = getAiToolExperience(toolId);
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const { isOnline, isChecking, refresh } = useNetworkStatus();
  const [values, setValues] = useState<Record<string, FormValue>>(() => initialAiToolExperienceValues(toolId));
  const [run, setRun] = useState<ToolRun | null>(null);
  const [history, setHistory] = useState<ToolRun[]>([]);
  const [busy, setBusy] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [progressStage, setProgressStage] = useState(0);
  const [error, setError] = useState("");
  const [confirmedDeidentified, setConfirmedDeidentified] = useState(false);
  const clinical = tool.containsPhi;
  const [jurisdiction, setJurisdiction] = useState<JurisdictionContext | null>(null);
  const [jurisdictionChecking, setJurisdictionChecking] = useState(clinical);
  const connections = getSpartanAiToolConnections(tool.id);
  const networkBlocked = isChecking || !isOnline;

  async function loadData() {
    if (networkBlocked) return;
    setError("");
    try {
      if (clinical) {
        setJurisdictionChecking(true);
        const context = await fetchJurisdictionContext();
        setJurisdiction(context);
        setJurisdictionChecking(false);
        if (!context.state || !context.macRegion) {
          setHistory([]);
          return;
        }
        await apiGet("/api/clinical/coverage/snapshots");
        setHistory([]);
      } else {
        const response = await apiGet<{ runs: ToolRun[] }>(`/api/ai-tools/${tool.id}/runs`);
        setHistory(response.runs || []);
      }
    } catch (caught) {
      if (clinical) setJurisdictionChecking(false);
      setError(caught instanceof Error ? caught.message : "Tool data could not be loaded.");
    }
  }

  useEffect(() => {
    const handoff = consumeAiToolHandoff(tool.id);
    if (handoff) {
      setValues(
        hydrateAiToolExperienceValues(
          tool.id,
          buildConnectedToolInput(handoff.sourceToolId, tool.id, handoff.output),
        ),
      );
    } else {
      setValues(initialAiToolExperienceValues(tool.id));
    }
  }, [tool.id]);

  useEffect(() => {
    if (!busy) {
      setElapsedSeconds(0);
      setProgressStage(0);
      return;
    }
    const startedAt = Date.now();
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setElapsedSeconds(elapsed);
      setProgressStage(Math.min(experience.progressStages.length - 1, Math.floor(elapsed / 4)));
    }, 1000);
    return () => clearInterval(timer);
  }, [busy, experience.progressStages.length]);

  useEffect(() => {
    if (!networkBlocked) void loadData();
  }, [tool.id, networkBlocked]);

  async function runTool() {
    if (networkBlocked) {
      setError("Secure connection required. Advanced tools do not process or queue protected work while this device is offline.");
      if (!isChecking) void refresh();
      return;
    }

    setBusy(true);
    setError("");
    try {
      const input = tool.inputSchema.parse(buildAiToolExperienceInput(tool.id, values)) as Record<string, unknown>;
      let completed: ToolRun;
      if (clinical) {
        const response = await apiPost<{ result: ToolRun }>(`/api/ai-tools/${tool.id}/ephemeral-runs`, { input, confirmedDeidentified });
        completed = response.result;
      } else {
        const response = await apiPost<{ run: ToolRun }>(`/api/ai-tools/${tool.id}/runs`, { input }, { idempotencyKey: Crypto.randomUUID() });
        completed = response.run;
        setHistory((current) => [response.run, ...current.filter((item) => item.id !== response.run.id)]);
      }
      setRun(completed);
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
      void trackProductOutcome("tool_completion", { toolId: tool.id, platform: "ios" });
      if (Platform.OS !== "web") void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The tool could not complete this run.");
      if (Platform.OS !== "web") void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setBusy(false);
    }
  }

  async function shareResult() {
    if (run?.output == null) return;
    if (networkBlocked) {
      setError("Secure connection required before this result can be shared or exported.");
      if (!isChecking) void refresh();
      return;
    }

    setBusy(true);
    setError("");
    try {
      let output: unknown = run.output;
      let watermark = run.watermark;
      if (!clinical && run.id) {
        const exported = await apiGet<{ run: ToolRun }>(`/api/ai-tool-runs/${run.id}/export`);
        output = exported.run.output;
        watermark = exported.run.watermark || watermark;
      }
      await Share.share({ message: formatAiResultForSharing(tool.name, output, watermark) });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The result could not be shared.");
    } finally {
      setBusy(false);
    }
  }

  const runLabel = run ? "Build a new version" : experience.submitLabel;
  const missingRequired = experience.fields.some((field) => {
    if (!field.required) return false;
    const value = values[field.key];
    return Array.isArray(value) ? value.length === 0 : String(value ?? "").trim().length === 0;
  });

  return (
    <ScrollView
      ref={scrollRef}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      style={styles.screen}
      contentContainerStyle={[styles.container, { paddingTop: Math.max(insets.top + 12, 28) }, clinical && styles.clinicalContainer]}
      showsVerticalScrollIndicator={false}
      testID={`ai-tool-${tool.id}`}
    >
      <Pressable accessibilityRole="button" accessibilityLabel="Back to advanced tools" onPress={() => goBackOrReplace("/ai-tools")} style={styles.back}>
        <Feather name="arrow-left" size={18} color={clinical ? VAULT.accent : colors.primary} />
        <Text style={[styles.backText, clinical && { color: VAULT.accent }]}>{clinical ? VAULT_COPY.backLibrary : "Advanced tools"}</Text>
      </Pressable>

      <View style={styles.hero}>
        <View style={styles.badges}>
          <Text style={[styles.badge, clinical && styles.clinicalBadge]}>{tool.category.toUpperCase()}</Text>
          {clinical ? <ClinicalVaultBadge /> : <Text style={styles.privateBadge}>ELITE WORKSPACE</Text>}
        </View>
        <Text style={styles.title}>{experience.title ?? tool.name}</Text>
        <Text style={styles.description}>{experience.promise}</Text>
        <View style={styles.promiseRow}>
          <Feather name="zap" size={16} color={colors.primary} />
          <Text style={styles.promiseText}>Make a few clear choices. Spartan handles the structure and gives you a result you can use.</Text>
        </View>
      </View>

      {clinical ? <ClinicalVaultToolBanner /> : null}

      {clinical ? (
        <View style={[styles.jurisdictionCard, (!jurisdiction?.state || !jurisdiction?.macRegion) && styles.jurisdictionMissing]}>
          <View style={styles.safetyHeading}>
            <Feather name="map-pin" size={18} color={VAULT.accent} />
            <Text style={styles.safetyTitle}>{jurisdictionChecking ? "Confirming jurisdiction" : jurisdiction?.state && jurisdiction?.macRegion ? "Jurisdiction confirmed" : "Jurisdiction required"}</Text>
          </View>
          {jurisdiction?.state && jurisdiction?.macRegion ? (
            <>
              <Text style={styles.jurisdictionState}>{jurisdiction.state}</Text>
              <Text style={styles.warningText}>{jurisdiction.macRegion}</Text>
              <Text style={styles.jurisdictionNote}>This context narrows the educational output. It does not replace current source verification or required approval.</Text>
            </>
          ) : jurisdictionChecking ? (
            <ActivityIndicator color={VAULT.accent} style={{ alignSelf: "flex-start" }} />
          ) : (
            <>
              <Text style={styles.warningText}>Select your primary state in Account. The app will assign the current Home Health and Hospice MAC before this tool can run.</Text>
              <Pressable accessibilityRole="button" onPress={() => router.push("/jurisdiction" as Href)} style={styles.networkAction}>
                <Text style={[styles.networkActionText, { color: VAULT.accent }]}>Set jurisdiction</Text>
                <Feather name="arrow-right" size={16} color={VAULT.accent} />
              </Pressable>
            </>
          )}
        </View>
      ) : null}

      {networkBlocked ? (
        <View accessibilityRole="alert" style={styles.networkCard}>
          <View style={styles.safetyHeading}>
            <Feather name={isChecking ? "wifi" : "wifi-off"} size={18} color={colors.primary} />
            <Text style={styles.safetyTitle}>{isChecking ? "Checking secure connection" : "Secure connection required"}</Text>
          </View>
          <Text style={styles.warningText}>Advanced tools run online so protected work is never queued on this device. Existing results can remain visible, but running, exporting, and sharing stay locked until the service is reachable.</Text>
          {!isChecking ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Check secure connection" onPress={() => void refresh()} style={styles.networkAction}>
              <Text style={styles.networkActionText}>Check connection</Text>
              <Feather name="refresh-cw" size={16} color={colors.primary} />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {tool.safetyWarnings.length ? (
        <View style={styles.safetyCard}>
          <View style={styles.safetyHeading}><Feather name="shield" size={18} color={clinical ? VAULT.accent : colors.primary} /><Text style={styles.safetyTitle}>Before you use this tool</Text></View>
          {tool.safetyWarnings.map((warning) => <View key={warning} style={styles.warningRow}><View style={styles.warningDot} /><Text style={styles.warningText}>{warning}</Text></View>)}
        </View>
      ) : null}

      {clinical ? (
        <View style={[styles.clinicalGate, { borderColor: VAULT.borderSubtle, backgroundColor: VAULT.surface }]}>
          <Text style={styles.sectionKicker}>DEIDENTIFIED CLINICAL WORKSPACE</Text>
          <Text style={styles.sectionTitle}>{VAULT_COPY.workspaceTitle}</Text>
          <Text style={styles.sectionBody}>Do not enter patient names, dates, record numbers, contact details, or patient documents. Outputs are educational suggestions and require the appropriate medical director, compliance, or both to approve them.</Text>
          <View style={styles.confirmRow}>
            <Text style={styles.confirmText}>I confirm this input is deidentified and contains no patient documents.</Text>
            <Switch accessibilityLabel="Confirm input is deidentified" value={confirmedDeidentified} onValueChange={setConfirmedDeidentified} />
          </View>
        </View>
      ) : null}

      <View style={styles.workflowHeading}>
        <Text style={styles.sectionKicker}>1 · CONTEXT</Text>
        <Text style={styles.sectionTitle}>Give the tool what it needs.</Text>
        <Text style={styles.sectionBody}>Required fields are marked. Examples can be edited or replaced with your own non patient specific context.</Text>
      </View>

      <View style={styles.formCard}>
        {experience.fields.map((field) => (
          <GuidedField key={field.key} field={field} value={values[field.key] ?? (field.kind === "multi-choice" ? [] : "")} onChange={(value) => setValues((current) => ({ ...current, [field.key]: value }))} />
        ))}
        {error ? <View style={styles.errorCard}><Feather name="alert-circle" size={17} color={colors.destructive} /><Text style={styles.error}>{error}</Text></View> : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Run ${tool.name}`}
          disabled={busy || missingRequired || networkBlocked || (clinical && (!confirmedDeidentified || jurisdictionChecking || !jurisdiction?.state || !jurisdiction?.macRegion))}
          onPress={runTool}
          style={[styles.primaryButton, (busy || missingRequired || networkBlocked || (clinical && (!confirmedDeidentified || jurisdictionChecking || !jurisdiction?.state || !jurisdiction?.macRegion))) && styles.disabled]}
        >
          {busy ? (
            <View accessibilityRole="progressbar" accessibilityLiveRegion="polite" style={{ alignItems: "center", gap: 6 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <ActivityIndicator color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>{experience.progressStages[progressStage]}</Text>
              </View>
              <Text style={[styles.primaryButtonText, { fontSize: 11, opacity: 0.82 }]}>
                {elapsedSeconds < 8 ? "Building your result" : `Still working · ${elapsedSeconds}s`}
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.primaryButtonText}>{isChecking ? "Checking connection" : !isOnline ? "Secure connection required" : runLabel}</Text>
              <Feather name="arrow-right" size={20} color="#FFFFFF" />
            </>
          )}
        </Pressable>
      </View>

      <View style={styles.workflowHeading}>
        <Text style={styles.sectionKicker}>2 · RESULT</Text>
        <Text style={styles.sectionTitle}>{run?.output != null ? experience.resultTitle : "Your result will appear here."}</Text>
        <Text style={styles.sectionBody}>{clinical ? "Clinical results are ephemeral, watermarked, and presented with review requirements." : "Results are saved to your account so you can return to them without rebuilding the work."}</Text>
      </View>

      {busy && !run?.output ? <ResultSkeleton styles={styles} /> : run?.output != null ? (
        <>
          <PremiumAiResult output={run.output} watermark={run.watermark} reviewStatus={run.reviewStatus} />
          <View style={styles.resultActions}>
            <Pressable disabled={busy || networkBlocked} onPress={() => void shareResult()} style={[styles.resultAction, (busy || networkBlocked) && styles.disabled]}><Feather name="share-2" size={18} color={colors.primary} /><View style={{ flex: 1 }}><Text style={styles.resultActionTitle}>Share or export</Text><Text style={styles.resultActionBody}>{networkBlocked ? "Secure connection required." : "Readable output, not a JSON dump."}</Text></View><Feather name="chevron-right" size={18} color={colors.mutedForeground} /></Pressable>
            {!clinical ? <View style={styles.savedRow}><Feather name="check-circle" size={17} color={colors.success} /><Text style={styles.savedText}>Saved to your account automatically</Text></View> : <View style={styles.savedRow}><Feather name="clock" size={17} color={VAULT.accent} /><Text style={styles.savedText}>Ephemeral clinical workspace · no run history stored</Text></View>}
          </View>
        </>
      ) : (
        <View style={styles.emptyResult}>
          <View style={styles.emptyIcon}><Feather name={clinical ? "shield" : "file-text"} size={23} color={clinical ? VAULT.accent : colors.primary} /></View>
          <Text style={styles.emptyTitle}>{clinical ? VAULT_COPY.emptyResult : "A field ready result starts with the context above."}</Text>
          <Text style={styles.emptyBody}>The result will be organized by answer, language, actions, reasoning, evidence, and review requirements when those sections are present.</Text>
        </View>
      )}

      {run?.output != null && connections.length > 0 ? (
        <View style={styles.workflowHeading}>
          <Text style={styles.sectionKicker}>3 · CONTINUE</Text>
          <Text style={styles.sectionTitle}>Do not let the result die on this screen.</Text>
          <Text style={styles.sectionBody}>Carry compatible output into the next workflow. The handoff stays in memory and is not written to device storage.</Text>
          <View style={styles.connectionList}>
            {connections.map((connection) => {
              const target = getSpartanAiTool(connection.to);
              if (!target) return null;
              return (
                <Pressable
                  key={connection.to}
                  accessibilityRole="button"
                  accessibilityLabel={connection.label}
                  onPress={() => {
                    stageAiToolHandoff({ sourceToolId: tool.id, targetToolId: connection.to, output: run.output });
                    router.push(target.mobilePath as never);
                  }}
                  style={({ pressed }) => [styles.connectionRow, pressed && styles.pressed]}
                >
                  <View style={styles.connectionIcon}><Feather name="git-branch" size={18} color={colors.primary} /></View>
                  <View style={{ flex: 1 }}><Text style={styles.connectionTitle}>{connection.label}</Text><Text style={styles.connectionBody}>{target.name}</Text></View>
                  <Feather name="arrow-right" size={18} color={colors.primary} />
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      <View style={styles.workflowHeading}>
        <Text style={styles.sectionKicker}>{clinical ? "PRIVACY" : "RECENT WORK"}</Text>
        <Text style={styles.sectionTitle}>{clinical ? "No clinical history means no surprise archive." : "Return to previous runs."}</Text>
        {clinical ? <Text style={styles.sectionBody}>{VAULT_COPY.noHistory}</Text> : history.length === 0 ? <Text style={styles.sectionBody}>No saved runs yet. Your completed nonclinical work will appear here.</Text> : (
          <View style={styles.historyList}>
            {history.slice(0, 10).map((item) => (
              <Pressable key={item.id} onPress={() => { setRun(item); void Haptics.selectionAsync(); }} style={styles.historyRow}>
                <View style={styles.historyIcon}><Feather name="clock" size={16} color={colors.primary} /></View>
                <View style={{ flex: 1 }}><Text style={styles.historyTitle}>{new Date(item.createdAt).toLocaleString()}</Text><Text style={styles.historyBody}>{item.status ?? "completed"}</Text></View>
                <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function ResultSkeleton({ styles }: { styles: ReturnType<typeof makeStyles> }) {
  return (
    <View style={styles.skeletonCard} testID="ai-result-loading">
      <View style={[styles.skeletonLine, { width: "38%" }]} />
      <View style={[styles.skeletonLine, { width: "92%" }]} />
      <View style={[styles.skeletonLine, { width: "76%" }]} />
      <View style={[styles.skeletonLine, { width: "86%" }]} />
      <ActivityIndicator style={{ marginTop: 8 }} />
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    container: { paddingHorizontal: 20, paddingBottom: 70, gap: 16 },
    clinicalContainer: { borderTopWidth: 3, borderTopColor: VAULT.accent },
    back: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 44, alignSelf: "flex-start" },
    backText: { color: colors.primary, fontSize: 13, ...font("semibold") },
    hero: { gap: 10, paddingBottom: 5 },
    badges: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
    badge: { color: colors.primary, borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.primaryMuted, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, fontSize: 8, letterSpacing: 1, ...font("bold") },
    clinicalBadge: { color: VAULT.accent, borderColor: VAULT.border, backgroundColor: VAULT.surface },
    privateBadge: { color: colors.mutedForeground, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.card, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, fontSize: 8, letterSpacing: 1, ...font("bold") },
    title: { color: colors.foreground, fontSize: 34, lineHeight: 39, letterSpacing: -1, ...font("heavy") },
    description: { color: colors.mutedForeground, fontSize: 15, lineHeight: 22, ...font("regular") },
    promiseRow: { flexDirection: "row", alignItems: "flex-start", gap: 9, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderStrong, paddingTop: 12 },
    promiseText: { flex: 1, color: colors.foreground, fontSize: 11, lineHeight: 17, ...font("medium") },
    safetyCard: { borderRadius: 17, borderCurve: "continuous", backgroundColor: colors.muted, padding: 14, gap: 8 },
    safetyHeading: { flexDirection: "row", alignItems: "center", gap: 8 },
    safetyTitle: { color: colors.foreground, fontSize: 13, ...font("bold") },
    warningRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
    warningDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.primary, marginTop: 6 },
    warningText: { flex: 1, color: colors.mutedForeground, fontSize: 10, lineHeight: 15, ...font("regular") },
    networkCard: { borderRadius: 17, borderCurve: "continuous", borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.card, padding: 14, gap: 9 },
    jurisdictionCard: { borderRadius: 17, borderCurve: "continuous", borderWidth: 1, borderColor: VAULT.borderSubtle, backgroundColor: VAULT.surface, padding: 14, gap: 8 },
    jurisdictionMissing: { borderStyle: "dashed" },
    jurisdictionState: { color: colors.foreground, fontSize: 15, ...font("bold") },
    jurisdictionNote: { color: colors.mutedForeground, fontSize: 9, lineHeight: 14, ...font("regular") },
    networkAction: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderStrong, paddingTop: 9 },
    networkActionText: { color: colors.primary, fontSize: 11, ...font("bold") },
    clinicalGate: { borderWidth: 1, borderLeftWidth: 3, borderLeftColor: VAULT.accent, borderRadius: 18, borderCurve: "continuous", padding: 15, gap: 9 },
    confirmRow: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderStrong, paddingTop: 10 },
    confirmText: { flex: 1, color: colors.foreground, fontSize: 11, lineHeight: 17, ...font("medium") },
    workflowHeading: { gap: 6, marginTop: 8 },
    sectionKicker: { color: colors.primary, fontSize: 9, letterSpacing: 1.8, ...font("bold") },
    sectionTitle: { color: colors.foreground, fontSize: 23, lineHeight: 28, letterSpacing: -0.5, ...font("heavy") },
    sectionBody: { color: colors.mutedForeground, fontSize: 11, lineHeight: 17, ...font("regular") },
    formCard: { borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.card, borderRadius: 20, borderCurve: "continuous", padding: 16, gap: 16 },
    field: { gap: 7 },
    label: { color: colors.foreground, fontSize: 13, ...font("bold") },
    fieldHint: { color: colors.mutedForeground, fontSize: 9, lineHeight: 14, ...font("regular") },
    input: { minHeight: 50, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 14, borderCurve: "continuous", backgroundColor: colors.input, color: colors.foreground, paddingHorizontal: 13, fontSize: 14, ...font("regular") },
    multiline: { minHeight: 112, paddingTop: 12, paddingBottom: 12 },
    switchRow: { minHeight: 62, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, paddingTop: 9 },
    choiceRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
    choice: { minHeight: 40, justifyContent: "center", borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 20, backgroundColor: colors.background, paddingHorizontal: 12 },
    choiceSelected: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
    choiceText: { color: colors.mutedForeground, fontSize: 10, ...font("semibold") },
    choiceTextSelected: { color: colors.primary },
    errorCard: { flexDirection: "row", alignItems: "flex-start", gap: 9, borderRadius: 13, backgroundColor: colors.muted, padding: 11 },
    error: { flex: 1, color: colors.destructive, fontSize: 10, lineHeight: 15, ...font("semibold") },
    primaryButton: { minHeight: 58, borderRadius: 17, borderCurve: "continuous", backgroundColor: colors.primary, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18 },
    primaryButtonText: { color: "#FFFFFF", fontSize: 15, ...font("bold") },
    disabled: { opacity: 0.45 },
    skeletonCard: { borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.card, borderRadius: 18, borderCurve: "continuous", padding: 16, gap: 10 },
    skeletonLine: { height: 12, borderRadius: 6, backgroundColor: colors.muted },
    emptyResult: { alignItems: "center", borderWidth: 1, borderStyle: "dashed", borderColor: colors.borderStrong, borderRadius: 20, borderCurve: "continuous", padding: 22, gap: 8 },
    emptyIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.primaryMuted, alignItems: "center", justifyContent: "center" },
    emptyTitle: { color: colors.foreground, fontSize: 14, lineHeight: 19, textAlign: "center", ...font("bold") },
    emptyBody: { color: colors.mutedForeground, fontSize: 10, lineHeight: 15, textAlign: "center", ...font("regular") },
    resultActions: { borderRadius: 18, borderCurve: "continuous", borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.card, overflow: "hidden" },
    resultAction: { minHeight: 68, flexDirection: "row", alignItems: "center", gap: 11, paddingHorizontal: 14 },
    resultActionTitle: { color: colors.foreground, fontSize: 12, ...font("bold") },
    resultActionBody: { color: colors.mutedForeground, fontSize: 9, lineHeight: 14, marginTop: 2, ...font("regular") },
    savedRow: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingHorizontal: 14 },
    savedText: { color: colors.mutedForeground, fontSize: 9, ...font("medium") },
    connectionList: { marginTop: 5 },
    connectionRow: { minHeight: 68, flexDirection: "row", alignItems: "center", gap: 11, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderStrong, paddingVertical: 11 },
    connectionIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.primaryMuted, alignItems: "center", justifyContent: "center" },
    connectionTitle: { color: colors.foreground, fontSize: 12, ...font("bold") },
    connectionBody: { color: colors.mutedForeground, fontSize: 9, marginTop: 2, ...font("regular") },
    historyList: { borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 18, borderCurve: "continuous", backgroundColor: colors.card, overflow: "hidden", marginTop: 5 },
    historyRow: { minHeight: 62, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    historyIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.primaryMuted, alignItems: "center", justifyContent: "center" },
    historyTitle: { color: colors.foreground, fontSize: 11, ...font("semibold") },
    historyBody: { color: colors.mutedForeground, fontSize: 9, marginTop: 2, textTransform: "capitalize", ...font("regular") },
    pressed: { opacity: 0.78, transform: [{ scale: 0.995 }] },
  });
}
