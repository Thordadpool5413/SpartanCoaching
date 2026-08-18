import { Feather } from "@expo/vector-icons";
import * as Crypto from "expo-crypto";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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
  buildConnectedToolInput,
  getSpartanAiToolConnections,
  getSpartanAiTool,
  type AiToolField,
  type AiToolSpec,
  type SpartanAiToolId,
} from "@workspace/spartan-ai-tools";
import { consumeAiToolHandoff, stageAiToolHandoff } from "@/lib/aiToolHandoff";
import { useColors } from "@/hooks/useColors";
import { apiGet, apiPost } from "@/lib/api";
import { font } from "@/lib/typography";
import { VAULT, VAULT_COPY } from "@/lib/clinicalVaultTheme";
import { ClinicalVaultBadge, ClinicalVaultToolBanner } from "@/components/ClinicalVaultChrome";
import { PremiumAiResult, formatAiResultForSharing } from "@/components/PremiumAiResult";

type FormValue = string | boolean;
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

function initialForm(
  tool: AiToolSpec,
  source: Record<string, unknown> = tool.exampleInput as Record<string, unknown>,
): Record<string, FormValue> {
  const result: Record<string, FormValue> = {};
  for (const field of tool.fields) {
    const example = source[field.key];
    if (field.kind === "boolean") result[field.key] = Boolean(example);
    else if (field.kind === "string-list") result[field.key] = Array.isArray(example) ? example.join("\n") : "";
    else if (field.kind === "json" || field.kind === "json-list") result[field.key] = example == null ? "" : JSON.stringify(example, null, 2);
    else result[field.key] = example == null ? "" : String(example);
  }
  return result;
}

function parsedInput(tool: AiToolSpec, values: Record<string, FormValue>): Record<string, unknown> {
  const input: Record<string, unknown> = {};
  for (const field of tool.fields) {
    const raw = values[field.key];
    if (field.kind === "boolean") input[field.key] = Boolean(raw);
    else if (field.kind === "number") input[field.key] = Number(raw);
    else if (field.kind === "string-list") {
      input[field.key] = String(raw ?? "").split("\n").map((item) => item.trim()).filter(Boolean);
    } else if (field.kind === "json" || field.kind === "json-list") {
      input[field.key] = String(raw ?? "").trim() ? JSON.parse(String(raw)) : field.kind === "json-list" ? [] : {};
    } else if (String(raw ?? "").trim() || field.required) input[field.key] = String(raw ?? "").trim();
  }
  return tool.inputSchema.parse(input) as Record<string, unknown>;
}

function Field({ field, value, onChange }: { field: AiToolField; value: FormValue; onChange: (next: FormValue) => void }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (field.kind === "boolean") {
    return (
      <View style={styles.switchRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{field.label}</Text>
          <Text style={styles.fieldHint}>Choose whether this should be included in the result.</Text>
        </View>
        <Switch accessibilityLabel={field.label} accessibilityRole="switch" value={value === true} onValueChange={onChange} />
      </View>
    );
  }

  if (field.kind === "select") {
    return (
      <View style={styles.field}>
        <Text style={styles.label}>{field.label}{field.required ? " *" : ""}</Text>
        <View style={styles.choiceRow}>
          {(field.options ?? []).map((option) => {
            const selected = value === option;
            return (
              <Pressable
                key={option}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => { onChange(option); void Haptics.selectionAsync(); }}
                style={[styles.choice, selected && styles.choiceSelected]}
              >
                <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{option}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  const multiline = ["text", "string-list", "json", "json-list"].includes(field.kind);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{field.label}{field.required ? " *" : ""}</Text>
      {field.kind === "string-list" ? <Text style={styles.fieldHint}>One item per line.</Text> : null}
      {(field.kind === "json" || field.kind === "json-list") ? <Text style={styles.fieldHint}>Structured data is supported here. Keep patient identifiers out of every field.</Text> : null}
      <TextInput
        accessibilityLabel={field.label}
        value={String(value ?? "")}
        onChangeText={onChange}
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
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [values, setValues] = useState(() => initialForm(tool));
  const [run, setRun] = useState<ToolRun | null>(null);
  const [history, setHistory] = useState<ToolRun[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmedDeidentified, setConfirmedDeidentified] = useState(false);
  const connections = getSpartanAiToolConnections(tool.id);
  const clinical = tool.containsPhi;

  async function loadData() {
    setError("");
    try {
      if (clinical) {
        await apiGet("/api/clinical/coverage/snapshots");
        setHistory([]);
      } else {
        const response = await apiGet<{ runs: ToolRun[] }>(`/api/ai-tools/${tool.id}/runs`);
        setHistory(response.runs || []);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Tool data could not be loaded.");
    }
  }

  useEffect(() => {
    const handoff = consumeAiToolHandoff(tool.id);
    if (handoff) {
      setValues(initialForm(tool, buildConnectedToolInput(handoff.sourceToolId, tool.id, handoff.output)));
    }
    void loadData();
  }, [tool.id]);

  async function runTool() {
    setBusy(true);
    setError("");
    try {
      const input = parsedInput(tool, values);
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

  const runLabel = run ? "Run it again" : `Build ${tool.name.toLowerCase()}`;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      style={styles.screen}
      contentContainerStyle={[styles.container, clinical && styles.clinicalContainer]}
      showsVerticalScrollIndicator={false}
      testID={`ai-tool-${tool.id}`}
    >
      <Pressable accessibilityRole="button" accessibilityLabel="Back to advanced tools" onPress={() => router.back()} style={styles.back}>
        <Feather name="arrow-left" size={18} color={clinical ? VAULT.accent : colors.primary} />
        <Text style={[styles.backText, clinical && { color: VAULT.accent }]}>{clinical ? VAULT_COPY.backLibrary : "Advanced tools"}</Text>
      </Pressable>

      <View style={styles.hero}>
        <View style={styles.badges}>
          <Text style={[styles.badge, clinical && styles.clinicalBadge]}>{tool.category.toUpperCase()}</Text>
          {clinical ? <ClinicalVaultBadge /> : <Text style={styles.privateBadge}>ELITE WORKSPACE</Text>}
        </View>
        <Text style={styles.title}>{tool.name}</Text>
        <Text style={styles.description}>{tool.description}</Text>
        <View style={styles.promiseRow}>
          <Feather name="zap" size={16} color={colors.primary} />
          <Text style={styles.promiseText}>Give it the right context. Get a structured result you can act on, review, save, or continue into the next compatible workflow.</Text>
        </View>
      </View>

      {clinical ? <ClinicalVaultToolBanner /> : null}

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
        {tool.fields.map((field) => (
          <Field key={field.key} field={field} value={values[field.key] ?? (field.kind === "boolean" ? false : "")} onChange={(value) => setValues((current) => ({ ...current, [field.key]: value }))} />
        ))}
        {error ? <View style={styles.errorCard}><Feather name="alert-circle" size={17} color={colors.destructive} /><Text style={styles.error}>{error}</Text></View> : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Run ${tool.name}`}
          disabled={busy || (clinical && !confirmedDeidentified)}
          onPress={runTool}
          style={[styles.primaryButton, (busy || (clinical && !confirmedDeidentified)) && styles.disabled]}
        >
          {busy ? <ActivityIndicator color="#FFFFFF" /> : <><Text style={styles.primaryButtonText}>{runLabel}</Text><Feather name="arrow-right" size={20} color="#FFFFFF" /></>}
        </Pressable>
      </View>

      <View style={styles.workflowHeading}>
        <Text style={styles.sectionKicker}>2 · RESULT</Text>
        <Text style={styles.sectionTitle}>{run?.output != null ? "Turn the output into a decision." : "The useful part appears here."}</Text>
        <Text style={styles.sectionBody}>{clinical ? "Clinical results are ephemeral, watermarked, and presented with review requirements." : "Results are saved to your account so you can return to them without rebuilding the work."}</Text>
      </View>

      {busy && !run?.output ? <ResultSkeleton styles={styles} /> : run?.output != null ? (
        <>
          <PremiumAiResult output={run.output} watermark={run.watermark} reviewStatus={run.reviewStatus} />
          <View style={styles.resultActions}>
            <Pressable disabled={busy} onPress={() => void shareResult()} style={styles.resultAction}><Feather name="share-2" size={18} color={colors.primary} /><View style={{ flex: 1 }}><Text style={styles.resultActionTitle}>Share or export</Text><Text style={styles.resultActionBody}>Readable output, not a JSON dump.</Text></View><Feather name="chevron-right" size={18} color={colors.mutedForeground} /></Pressable>
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
