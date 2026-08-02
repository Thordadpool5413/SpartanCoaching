import { Feather } from "@expo/vector-icons";
import * as Crypto from "expo-crypto";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import * as LocalAuthentication from "expo-local-authentication";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
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
import * as Haptics from "expo-haptics";
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
import {
  ApiError,
  apiDelete,
  apiGet,
  apiPost,
  uploadToSignedUrl,
} from "@/lib/api";
import { font } from "@/lib/typography";
import { VAULT, VAULT_COPY } from "@/lib/clinicalVaultTheme";
import {
  ClinicalVaultBadge,
  ClinicalVaultToolBanner,
} from "@/components/ClinicalVaultChrome";

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
type CoverageSnapshot = { id: string; title: string; version: string };

function initialForm(
  tool: AiToolSpec,
  source: Record<string, unknown> = tool.exampleInput as Record<
    string,
    unknown
  >,
): Record<string, FormValue> {
  const result: Record<string, FormValue> = {};
  for (const field of tool.fields) {
    const example = source[field.key];
    if (field.kind === "boolean") result[field.key] = Boolean(example);
    else if (field.kind === "string-list") {
      result[field.key] = Array.isArray(example) ? example.join("\n") : "";
    } else if (field.kind === "json" || field.kind === "json-list") {
      result[field.key] =
        example == null ? "" : JSON.stringify(example, null, 2);
    } else {
      result[field.key] = example == null ? "" : String(example);
    }
  }
  return result;
}

function parsedInput(
  tool: AiToolSpec,
  values: Record<string, FormValue>,
): Record<string, unknown> {
  const input: Record<string, unknown> = {};
  for (const field of tool.fields) {
    const raw = values[field.key];
    if (field.kind === "boolean") {
      input[field.key] = Boolean(raw);
    } else if (field.kind === "number") {
      input[field.key] = Number(raw);
    } else if (field.kind === "string-list") {
      input[field.key] = String(raw ?? "")
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);
    } else if (field.kind === "json" || field.kind === "json-list") {
      input[field.key] = String(raw ?? "").trim()
        ? JSON.parse(String(raw))
        : field.kind === "json-list"
          ? []
          : {};
    } else if (String(raw ?? "").trim() || field.required) {
      input[field.key] = String(raw ?? "").trim();
    }
  }
  return tool.inputSchema.parse(input) as Record<string, unknown>;
}

function humanize(value: string): string {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll("_", " ");
}

function ResultValue({
  value,
  colors,
  depth = 0,
}: {
  value: unknown;
  colors: ReturnType<typeof useColors>;
  depth?: number;
}) {
  if (value == null)
    return <Text style={{ color: colors.mutedForeground }}>Not provided</Text>;
  if (typeof value !== "object") {
    return (
      <Text style={[styles.resultText, { color: colors.foreground }]}>
        {String(value)}
      </Text>
    );
  }
  if (Array.isArray(value)) {
    return (
      <View style={styles.resultStack}>
        {value.map((item, index) => (
          <View
            key={index}
            style={[
              styles.resultItem,
              {
                borderColor: colors.border,
                backgroundColor: colors.background,
              },
            ]}
          >
            <ResultValue value={item} colors={colors} depth={depth + 1} />
          </View>
        ))}
      </View>
    );
  }
  return (
    <View style={styles.resultStack}>
      {Object.entries(value as Record<string, unknown>).map(([key, child]) => (
        <View key={key}>
          <Text style={[styles.resultLabel, { color: colors.foreground }]}>
            {humanize(key)}
          </Text>
          <ResultValue value={child} colors={colors} depth={depth + 1} />
        </View>
      ))}
    </View>
  );
}

function Field({
  field,
  value,
  onChange,
  colors,
}: {
  field: AiToolField;
  value: FormValue;
  onChange: (next: FormValue) => void;
  colors: ReturnType<typeof useColors>;
}) {
  if (field.kind === "boolean") {
    return (
      <View style={[styles.switchRow, { borderColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.foreground }]}>
          {field.label}
        </Text>
        <Switch
          accessibilityLabel={field.label}
          accessibilityRole="switch"
          value={value === true}
          onValueChange={onChange}
        />
      </View>
    );
  }
  if (field.kind === "select") {
    return (
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.foreground }]}>
          {field.label} *
        </Text>
        <View style={styles.choiceRow}>
          {(field.options ?? []).map((option) => (
            <Pressable
              key={option}
              accessibilityRole="radio"
              accessibilityLabel={`${field.label}: ${option}`}
              accessibilityState={{ selected: value === option }}
              onPress={() => onChange(option)}
              style={[
                styles.choice,
                {
                  borderColor:
                    value === option ? colors.primary : colors.border,
                  backgroundColor:
                    value === option
                      ? `${colors.primary}20`
                      : colors.background,
                },
              ]}
            >
              <Text
                style={{
                  color: colors.foreground,
                  fontFamily: "Inter_500Medium",
                }}
              >
                {option}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }
  const multiline = ["text", "string-list", "json", "json-list"].includes(
    field.kind,
  );
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.foreground }]}>
        {field.label}
        {field.required ? " *" : ""}
      </Text>
      <TextInput
        accessibilityLabel={field.label}
        value={String(value ?? "")}
        onChangeText={onChange}
        placeholder={field.placeholder}
        placeholderTextColor={colors.mutedForeground}
        multiline={multiline}
        keyboardType={field.kind === "number" ? "numeric" : "default"}
        textAlignVertical={multiline ? "top" : "center"}
        style={[
          styles.input,
          multiline && styles.multiline,
          {
            borderColor: colors.border,
            backgroundColor: colors.background,
            color: colors.foreground,
          },
        ]}
      />
    </View>
  );
}

export function AiToolScreen({ toolId }: { toolId: SpartanAiToolId }) {
  const tool = getSpartanAiTool(toolId)!;
  const colors = useColors();
  const [values, setValues] = useState(() => initialForm(tool));
  const [run, setRun] = useState<ToolRun | null>(null);
  const [history, setHistory] = useState<ToolRun[]>([]);
  const [snapshots, setSnapshots] = useState<CoverageSnapshot[]>([]);
  const [snapshotId, setSnapshotId] = useState("");
  const [ephemeralSession, setEphemeralSession] = useState<{
    id: string;
    coverageSnapshotId: string;
    expiresAt: string;
  } | null>(null);
  const ephemeralSessionRef = useRef(ephemeralSession);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [needsMfa, setNeedsMfa] = useState(false);
  const [clinicalMode, setClinicalMode] = useState<"deidentified" | "phi">(
    "deidentified",
  );
  const [coverageRequired, setCoverageRequired] = useState(false);
  const [allowsDocumentUpload, setAllowsDocumentUpload] = useState(false);
  const [runtimeReady, setRuntimeReady] = useState(true);
  const [missingControls, setMissingControls] = useState<string[]>([]);
  const [confirmedDeidentified, setConfirmedDeidentified] = useState(false);
  const [challenge, setChallenge] = useState<{
    challengeId: string;
    challengeToken: string;
  } | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [clinicalScreenObscured, setClinicalScreenObscured] = useState(false);
  const selectedSnapshot = useMemo(
    () => snapshots.find((item) => item.id === snapshotId),
    [snapshots, snapshotId],
  );

  function updateEphemeralSession(session: typeof ephemeralSession): void {
    ephemeralSessionRef.current = session;
    setEphemeralSession(session);
  }

  async function unlockClinical(mode: "deidentified" | "phi") {
    if (!tool.containsPhi || mode !== "phi") return true;
    const available = await LocalAuthentication.hasHardwareAsync();
    if (!available) return true;
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Reopen protected clinical tools",
      fallbackLabel: "Use device passcode",
      disableDeviceFallback: false,
    });
    if (!result.success) {
      setError("Device verification is required to reopen clinical tools.");
      return false;
    }
    return true;
  }

  async function loadData() {
    setError("");
    try {
      if (tool.containsPhi) {
        const snapshotResponse = await apiGet<{
          snapshots: CoverageSnapshot[];
          operationMode: "deidentified" | "phi";
          required: boolean;
          allowsDocumentUpload: boolean;
          runtimeReady?: boolean;
          missingControls?: string[];
        }>("/api/clinical/coverage/snapshots");
        if (!(await unlockClinical(snapshotResponse.operationMode))) return;
        setSnapshots(snapshotResponse.snapshots);
        setClinicalMode(snapshotResponse.operationMode);
        setCoverageRequired(snapshotResponse.required);
        setAllowsDocumentUpload(snapshotResponse.allowsDocumentUpload);
        setRuntimeReady(snapshotResponse.runtimeReady !== false);
        setMissingControls(snapshotResponse.missingControls ?? []);
        setSnapshotId(
          (current) => current || snapshotResponse.snapshots[0]?.id || "",
        );
        setHistory([]);
      } else {
        const response = await apiGet<{ runs: ToolRun[] }>(
          `/api/ai-tools/${tool.id}/runs`,
        );
        setHistory(response.runs);
      }
      setNeedsMfa(false);
    } catch (caught) {
      if (
        caught instanceof ApiError &&
        caught.code === "CLINICAL_MFA_REQUIRED"
      ) {
        setNeedsMfa(true);
      } else {
        setError(
          caught instanceof Error
            ? caught.message
            : "Tool data could not be loaded.",
        );
      }
    }
  }

  useEffect(() => {
    const handoff = consumeAiToolHandoff(tool.id);
    if (handoff) {
      setValues(
        initialForm(
          tool,
          buildConnectedToolInput(
            handoff.sourceToolId,
            tool.id,
            handoff.output,
          ),
        ),
      );
    }
    void loadData();
  }, [tool.id]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (tool.containsPhi) setClinicalScreenObscured(state !== "active");
    });
    return () => subscription.remove();
  }, [tool.containsPhi]);

  useEffect(() => {
    const sessionId = ephemeralSession?.id;
    if (!sessionId) return;
    return () => {
      void apiDelete(`/api/clinical/ephemeral-sessions/${sessionId}`).catch(
        () => undefined,
      );
    };
  }, [ephemeralSession?.id]);

  async function runTool() {
    setBusy(true);
    setError("");
    try {
      const input = parsedInput(tool, values);
      if (tool.containsPhi) {
        if (
          tool.id === "medical-record-lcd-verifier" &&
          clinicalMode === "phi" &&
          !ephemeralSessionRef.current
        ) {
          throw new Error("Upload at least one record before finalizing.");
        }
        const path =
          tool.id === "medical-record-lcd-verifier" && clinicalMode === "phi"
            ? `/api/clinical/ephemeral-sessions/${ephemeralSessionRef.current?.id}/finalize`
            : `/api/ai-tools/${tool.id}/ephemeral-runs`;
        const response = await apiPost<{ result: ToolRun }>(path, {
          input,
          ...(tool.id === "medical-record-lcd-verifier" &&
          clinicalMode === "phi"
            ? {}
            : {
                coverageSnapshotId: snapshotId || undefined,
                confirmedDeidentified:
                  clinicalMode === "deidentified"
                    ? confirmedDeidentified
                    : undefined,
              }),
        });
        setRun(response.result);
        updateEphemeralSession(null);
        if (Platform.OS !== "web") {
          void Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          );
        }
      } else {
        const response = await apiPost<{ run: ToolRun }>(
          `/api/ai-tools/${tool.id}/runs`,
          { input },
          { idempotencyKey: Crypto.randomUUID() },
        );
        setRun(response.run);
        setHistory((current) => [
          response.run,
          ...current.filter((item) => item.id !== response.run.id),
        ]);
        if (Platform.OS !== "web") {
          void Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          );
        }
      }
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === "CLINICAL_MFA_REQUIRED")
        setNeedsMfa(true);
      setError(
        caught instanceof Error
          ? caught.message
          : "The tool could not complete this run.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function shareResult() {
    if (!run?.output) return;
    setBusy(true);
    setError("");
    try {
      if (tool.containsPhi) {
        await Share.share({
          message: JSON.stringify(
            {
              watermark: run.watermark,
              retention: "ephemeral",
              generatedAt: run.createdAt,
              result: run.output,
            },
            null,
            2,
          ),
        });
      } else {
        if (!run.id) throw new Error("The saved result is unavailable.");
        const exported = await apiGet<{ run: ToolRun }>(
          `/api/ai-tool-runs/${run.id}/export`,
        );
        await Share.share({ message: JSON.stringify(exported.run, null, 2) });
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The result could not be exported.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function requestMfa() {
    setBusy(true);
    try {
      setChallenge(await apiPost("/api/clinical/mfa/request", {}));
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Code could not be sent.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function verifyMfa() {
    if (!challenge) return;
    setBusy(true);
    try {
      await apiPost("/api/clinical/mfa/verify", {
        ...challenge,
        code: mfaCode,
      });
      setNeedsMfa(false);
      await loadData();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Code could not be verified.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function uploadAsset(asset: {
    uri: string;
    name?: string | null;
    mimeType?: string | null;
    size?: number;
  }) {
    if (!snapshotId) throw new Error("Select CMS evidence first.");
    const contentType = asset.mimeType || "application/octet-stream";
    const displayLabel =
      asset.name ||
      `document-${Date.now()}.${contentType.split("/")[1] || "bin"}`;
    try {
      let session = ephemeralSessionRef.current;
      if (!session || session.coverageSnapshotId !== snapshotId) {
        if (session) {
          await apiDelete(
            `/api/clinical/ephemeral-sessions/${session.id}`,
          ).catch(() => undefined);
        }
        const created = await apiPost<{
          session: {
            id: string;
            coverageSnapshotId: string;
            expiresAt: string;
          };
        }>("/api/clinical/ephemeral-sessions", {
          coverageSnapshotId: snapshotId,
        });
        session = created.session;
        updateEphemeralSession(session);
      }
      const blob = await (await fetch(asset.uri)).blob();
      const sizeBytes = asset.size ?? blob.size;
      const authorization = await apiPost<{
        documentToken: string;
        uploadUrl: string;
        requiredHeaders: Record<string, string>;
      }>(
        `/api/clinical/ephemeral-sessions/${session.id}/documents/upload-url`,
        { contentType, sizeBytes },
      );
      await uploadToSignedUrl(authorization.uploadUrl, blob, contentType);
      await apiPost(
        `/api/clinical/ephemeral-sessions/${session.id}/documents/${authorization.documentToken}/complete`,
        {},
      );
      const extraction = await apiPost<{ text: string }>(
        `/api/clinical/ephemeral-sessions/${session.id}/documents/${authorization.documentToken}/extract`,
        {},
      );
      setValues((current) => ({
        ...current,
        recordText: [
          String(current.recordText ?? ""),
          `--- ${displayLabel} ---\n${extraction.text}`,
        ]
          .filter(Boolean)
          .join("\n\n"),
      }));
    } finally {
      if (asset.uri.startsWith("file:")) {
        await FileSystem.deleteAsync(asset.uri, {
          idempotent: true,
        }).catch(() => undefined);
      }
    }
  }

  async function chooseDocument(camera: boolean) {
    setUploading(true);
    setError("");
    try {
      if (camera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted)
          throw new Error("Camera permission is required.");
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          quality: 0.85,
        });
        if (!result.canceled) await uploadAsset(result.assets[0]);
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: ["application/pdf", "image/jpeg", "image/png", "text/plain"],
          multiple: true,
          copyToCacheDirectory: true,
        });
        if (!result.canceled) {
          for (const asset of result.assets.slice(0, 25))
            await uploadAsset(asset);
        }
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Document processing failed.",
      );
    } finally {
      setUploading(false);
    }
  }

  function cycle<T extends { id: string }>(
    items: T[],
    current: string,
  ): string {
    if (!items.length) return "";
    const index = items.findIndex((item) => item.id === current);
    return items[(index + 1) % items.length].id;
  }

  if (tool.containsPhi && clinicalScreenObscured) {
    return (
      <View style={[styles.privacyOverlay, { backgroundColor: VAULT.privacyBg }]}>
        <Feather name="shield" size={40} color={VAULT.accentSoft} />
        <Text style={[{ color: VAULT.privacyFg, fontSize: 18 }, font("bold")]}>
          {VAULT_COPY.privacyTitle}
        </Text>
        <Text
          style={[
            { color: VAULT.privacyMuted, textAlign: "center", lineHeight: 22, maxWidth: 280 },
            font("regular"),
          ]}
        >
          {VAULT_COPY.privacyBody}
        </Text>
      </View>
    );
  }

  const vault = tool.containsPhi;
  const chromeAccent = vault ? VAULT.accent : colors.primary;
  const fg = colors.foreground;
  const muted = colors.mutedForeground;
  const cardBorder = vault ? VAULT.borderSubtle : colors.border;
  const cardBg = vault ? colors.card : colors.card;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.container,
        vault && { borderTopWidth: 3, borderTopColor: VAULT.accent },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back to Advanced library"
        onPress={() => router.back()}
        style={styles.back}
      >
        <Feather name="arrow-left" size={18} color={chromeAccent} />
        <Text style={[{ color: chromeAccent }, font("semibold")]}>
          {vault ? VAULT_COPY.backLibrary : "AI Tool Library"}
        </Text>
      </Pressable>
      <View style={styles.badges}>
        <Text
          style={[
            styles.badge,
            {
              color: chromeAccent,
              borderColor: vault ? VAULT.border : colors.primary,
              backgroundColor: vault ? VAULT.surface : "transparent",
            },
            font("semibold"),
          ]}
        >
          {tool.category}
        </Text>
        {vault ? <ClinicalVaultBadge /> : null}
      </View>
      <Text style={[styles.title, { color: fg }, font("bold")]}>{tool.name}</Text>
      <Text style={[styles.description, { color: muted }, font("regular")]}>
        {tool.description}
      </Text>

      {vault ? <ClinicalVaultToolBanner /> : null}

      {needsMfa && (
        <View
          style={[
            styles.card,
            { borderColor: VAULT.border, backgroundColor: cardBg },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: fg }, font("bold")]}>
            Clinical verification
          </Text>
          {!challenge ? (
            <Pressable
              style={[
                styles.primaryButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={requestMfa}
            >
              <Text style={styles.primaryButtonText}>Email six-digit code</Text>
            </Pressable>
          ) : (
            <>
              <TextInput
                value={mfaCode}
                onChangeText={(value) =>
                  setMfaCode(value.replace(/\D/g, "").slice(0, 6))
                }
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                placeholder="000000"
                placeholderTextColor={colors.mutedForeground}
                style={[
                  styles.input,
                  { color: colors.foreground, borderColor: colors.border },
                ]}
              />
              <Pressable
                disabled={mfaCode.length !== 6}
                style={[
                  styles.primaryButton,
                  {
                    backgroundColor: colors.primary,
                    opacity: mfaCode.length === 6 ? 1 : 0.5,
                  },
                ]}
                onPress={verifyMfa}
              >
                <Text style={styles.primaryButtonText}>
                  Verify clinical session
                </Text>
              </Pressable>
            </>
          )}
        </View>
      )}

      {tool.containsPhi && clinicalMode === "phi" && !runtimeReady && (
        <View
          style={[
            styles.card,
            { borderColor: colors.destructive, backgroundColor: colors.card },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            PHI runtime is not fully configured
          </Text>
          <Text style={{ color: colors.mutedForeground, lineHeight: 20 }}>
            BAA gates may be set, but required infrastructure is still missing.
            Clinical runs stay fail-closed until every control is present.
          </Text>
          {missingControls.map((control) => (
            <Text
              key={control}
              style={{ color: colors.mutedForeground, marginTop: 6 }}
            >
              • {control}
            </Text>
          ))}
        </View>
      )}

      {tool.containsPhi && !needsMfa && (
        <View
          style={[
            styles.card,
            {
              borderColor: VAULT.borderSubtle,
              backgroundColor: VAULT.surface,
              borderLeftWidth: 3,
              borderLeftColor: VAULT.accent,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: fg }, font("bold")]}>
            {VAULT_COPY.workspaceTitle}
            {clinicalMode === "phi" && runtimeReady ? " · PHI operational" : ""}
          </Text>
          <Text style={[{ color: muted, lineHeight: 20 }, font("regular")]}>
            {clinicalMode === "phi"
              ? "Patient inputs and generated results are not saved. Closing, signing out, or restarting permanently loses this work."
              : "This live workspace accepts de-identified information only. Inputs and generated results are not saved, and qualified clinical review remains required."}
          </Text>
          {clinicalMode === "deidentified" && (
            <View style={[styles.switchRow, { borderColor: colors.border }]}>
              <Text
                style={{
                  color: colors.foreground,
                  flex: 1,
                  lineHeight: 20,
                  paddingRight: 12,
                }}
              >
                I confirm there are no patient identifiers in this input.
              </Text>
              <Switch
                accessibilityLabel="Confirm input is de-identified"
                value={confirmedDeidentified}
                onValueChange={setConfirmedDeidentified}
              />
            </View>
          )}
          {coverageRequired && (
            <Pressable
              style={[styles.selector, { borderColor: colors.border }]}
              onPress={() => {
                setSnapshotId(cycle(snapshots, snapshotId));
                setRun(null);
              }}
            >
              <Text style={{ color: colors.foreground, flex: 1 }}>
                {selectedSnapshot
                  ? `${selectedSnapshot.title} · v${selectedSnapshot.version}`
                  : "Select CMS evidence"}
              </Text>
              <Feather
                name="chevron-down"
                size={18}
                color={colors.mutedForeground}
              />
            </Pressable>
          )}
          {tool.id === "medical-record-lcd-verifier" &&
            allowsDocumentUpload && (
              <View style={styles.inline}>
                <Pressable
                  disabled={uploading || !snapshotId}
                  style={[
                    styles.secondaryButton,
                    { flex: 1, borderColor: colors.border },
                  ]}
                  onPress={() => chooseDocument(false)}
                >
                  <Text style={{ color: colors.foreground }}>Choose files</Text>
                </Pressable>
                <Pressable
                  disabled={uploading || !snapshotId}
                  style={[
                    styles.secondaryButton,
                    { flex: 1, borderColor: colors.border },
                  ]}
                  onPress={() => chooseDocument(true)}
                >
                  <Text style={{ color: colors.foreground }}>Take photo</Text>
                </Pressable>
              </View>
            )}
          {uploading && <ActivityIndicator color={colors.primary} />}
        </View>
      )}

      <View
        style={[
          styles.card,
          { borderColor: colors.border, backgroundColor: colors.card },
        ]}
      >
        {tool.fields.map((field) => (
          <Field
            key={field.key}
            field={field}
            value={values[field.key] ?? (field.kind === "boolean" ? false : "")}
            onChange={(value) =>
              setValues((current) => ({ ...current, [field.key]: value }))
            }
            colors={colors}
          />
        ))}
        {!!error && <Text style={styles.error}>{error}</Text>}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Run ${tool.name}`}
          disabled={
            busy ||
            needsMfa ||
            (tool.containsPhi && clinicalMode === "phi" && !runtimeReady) ||
            (tool.containsPhi && coverageRequired && !snapshotId) ||
            (tool.containsPhi &&
              clinicalMode === "deidentified" &&
              !confirmedDeidentified)
          }
          onPress={runTool}
          style={[
            styles.primaryButton,
            {
              backgroundColor: colors.primary,
              opacity:
                busy ||
                needsMfa ||
                (tool.containsPhi &&
                  clinicalMode === "phi" &&
                  !runtimeReady) ||
                (tool.containsPhi && coverageRequired && !snapshotId) ||
                (tool.containsPhi &&
                  clinicalMode === "deidentified" &&
                  !confirmedDeidentified)
                  ? 0.5
                  : 1,
            },
          ]}
        >
          {busy ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Run {tool.name}</Text>
          )}
        </Pressable>
      </View>

      {run?.output != null &&
        getSpartanAiToolConnections(tool.id).length > 0 && (
          <View
            style={[
              styles.card,
              { borderColor: colors.border, backgroundColor: colors.card },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Continue this workflow
            </Text>
            <Text style={{ color: colors.mutedForeground, lineHeight: 20 }}>
              Prefill a compatible tool from this result. The handoff stays in
              memory and is not saved on the device.
            </Text>
            {getSpartanAiToolConnections(tool.id).map((connection) => {
              const target = getSpartanAiTool(connection.to);
              if (!target) return null;
              return (
                <Pressable
                  key={connection.to}
                  accessibilityRole="button"
                  accessibilityLabel={connection.label}
                  onPress={() => {
                    stageAiToolHandoff({
                      sourceToolId: tool.id,
                      targetToolId: connection.to,
                      output: run.output,
                    });
                    router.push(target.mobilePath as never);
                  }}
                  style={[
                    styles.secondaryButton,
                    { borderColor: colors.border },
                  ]}
                >
                  <Text
                    style={{
                      color: colors.primary,
                      fontFamily: "Inter_600SemiBold",
                    }}
                  >
                    {connection.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

      <View
        style={[
          styles.card,
          { borderColor: colors.border, backgroundColor: colors.card },
        ]}
      >
        <View style={styles.sectionHeading}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Result
          </Text>
          {run?.output != null && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Export and share result"
              disabled={busy}
              onPress={() => void shareResult()}
            >
              <Feather name="share-2" size={19} color={colors.primary} />
            </Pressable>
          )}
        </View>
        {busy ? (
          <View style={{ gap: 10, paddingVertical: 8 }}>
            <View
              style={{
                height: 12,
                borderRadius: 6,
                backgroundColor: colors.muted,
                width: "70%",
              }}
            />
            <View
              style={{
                height: 12,
                borderRadius: 6,
                backgroundColor: colors.muted,
                width: "100%",
              }}
            />
            <View
              style={{
                height: 12,
                borderRadius: 6,
                backgroundColor: colors.muted,
                width: "85%",
              }}
            />
            <ActivityIndicator color={colors.primary} style={{ marginTop: 8 }} />
          </View>
        ) : run?.output != null ? (
          <>
            {tool.containsPhi && (
              <View
                style={[
                  styles.watermark,
                  { borderColor: VAULT.border, backgroundColor: VAULT.surface },
                ]}
              >
                <Text style={[{ color: fg, lineHeight: 19 }, font("bold")]}>
                  {run.watermark}
                </Text>
              </View>
            )}
            <ResultValue value={run.output} colors={colors} />
          </>
        ) : (
          <View
            style={{
              borderWidth: 1,
              borderStyle: "dashed",
              borderColor: vault ? VAULT.borderSubtle : colors.border,
              borderRadius: 12,
              padding: 20,
              alignItems: "center",
              backgroundColor: vault ? VAULT.surface : "transparent",
            }}
          >
            <Feather
              name={vault ? "shield" : "file-text"}
              size={22}
              color={vault ? VAULT.accent : colors.mutedForeground}
            />
            <Text
              style={[
                {
                  color: muted,
                  textAlign: "center",
                  marginTop: 10,
                  lineHeight: 20,
                },
                font("regular"),
              ]}
            >
              {vault
                ? VAULT_COPY.emptyResult
                : "Complete the form and run the tool to generate a field-ready result."}
            </Text>
          </View>
        )}
      </View>

      <View
        style={[
          styles.card,
          { borderColor: cardBorder, backgroundColor: cardBg },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: fg }, font("bold")]}>
          {tool.containsPhi ? "No clinical history" : "Recent runs"}
        </Text>
        {tool.containsPhi ? (
          <Text style={[{ color: muted, lineHeight: 20 }, font("regular")]}>
            {VAULT_COPY.noHistory}
          </Text>
        ) : history.length === 0 ? (
          <Text style={{ color: colors.mutedForeground }}>
            No saved runs yet.
          </Text>
        ) : (
          history.slice(0, 10).map((item) => (
            <Pressable
              key={item.id}
              onPress={() => setRun(item)}
              style={[styles.historyRow, { borderColor: colors.border }]}
            >
              <Text style={{ color: colors.foreground }}>
                {new Date(item.createdAt).toLocaleString()}
              </Text>
              <Text style={{ color: colors.mutedForeground }}>
                {item.status ?? "completed"}
              </Text>
            </Pressable>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  privacyOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    padding: 32,
  },
  container: { padding: 20, paddingBottom: 64, gap: 16 },
  back: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 44 },
  badges: { flexDirection: "row", gap: 8 },
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  title: { fontSize: 30, lineHeight: 36, fontFamily: "Inter_700Bold" },
  description: { fontSize: 16, lineHeight: 24 },
  warning: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    gap: 10,
  },
  warningText: { flex: 1, fontSize: 13, lineHeight: 19 },
  watermark: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 12,
  },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 16 },
  sectionHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  field: { gap: 7 },
  label: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  multiline: { minHeight: 112, paddingTop: 12 },
  switchRow: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  choiceRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choice: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  selector: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  inline: { flexDirection: "row", gap: 10, alignItems: "center" },
  primaryButton: {
    minHeight: 50,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
  secondaryButton: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  error: { color: "#DC2626", lineHeight: 20 },
  resultStack: { gap: 12 },
  resultItem: { borderWidth: 1, borderRadius: 10, padding: 12 },
  resultLabel: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    textTransform: "capitalize",
    marginBottom: 4,
  },
  resultText: { fontSize: 14, lineHeight: 21 },
  historyRow: { borderTopWidth: 1, paddingVertical: 12, gap: 4 },
});
