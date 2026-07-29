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
  getSpartanAiTool,
  type AiToolField,
  type AiToolSpec,
  type SpartanAiToolId,
} from "@workspace/spartan-ai-tools";
import { useColors } from "@/hooks/useColors";
import {
  ApiError,
  apiDelete,
  apiGet,
  apiPost,
  uploadToSignedUrl,
} from "@/lib/api";

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

function initialForm(tool: AiToolSpec): Record<string, FormValue> {
  const result: Record<string, FormValue> = {};
  for (const field of tool.fields) {
    const example = tool.exampleInput[field.key];
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

  async function unlockClinical() {
    if (!tool.containsPhi) return true;
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
      if (!(await unlockClinical())) return;
      if (tool.containsPhi) {
        const snapshotResponse = await apiGet<{
          snapshots: CoverageSnapshot[];
        }>("/api/clinical/coverage/snapshots");
        setSnapshots(snapshotResponse.snapshots);
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
          !ephemeralSessionRef.current
        ) {
          throw new Error("Upload at least one record before finalizing.");
        }
        const path =
          tool.id === "medical-record-lcd-verifier"
            ? `/api/clinical/ephemeral-sessions/${ephemeralSessionRef.current?.id}/finalize`
            : `/api/ai-tools/${tool.id}/ephemeral-runs`;
        const response = await apiPost<{ result: ToolRun }>(path, {
          input,
          ...(tool.id === "medical-record-lcd-verifier"
            ? {}
            : { coverageSnapshotId: snapshotId }),
        });
        setRun(response.result);
        updateEphemeralSession(null);
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
      <View
        style={[styles.privacyOverlay, { backgroundColor: colors.background }]}
      >
        <Feather name="shield" size={42} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Clinical workspace protected
        </Text>
        <Text style={{ color: colors.mutedForeground, textAlign: "center" }}>
          Return to Spartan Coaching to reauthenticate and continue.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back to AI Tool Library"
        onPress={() => router.back()}
        style={styles.back}
      >
        <Feather name="arrow-left" size={18} color={colors.primary} />
        <Text
          style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}
        >
          AI Tool Library
        </Text>
      </Pressable>
      <View style={styles.badges}>
        <Text
          style={[
            styles.badge,
            { color: colors.primary, borderColor: colors.primary },
          ]}
        >
          {tool.category}
        </Text>
        {tool.containsPhi && (
          <Text
            style={[styles.badge, { color: "#B45309", borderColor: "#D97706" }]}
          >
            Clinical
          </Text>
        )}
      </View>
      <Text style={[styles.title, { color: colors.foreground }]}>
        {tool.name}
      </Text>
      <Text style={[styles.description, { color: colors.mutedForeground }]}>
        {tool.description}
      </Text>

      {tool.containsPhi && (
        <View
          style={[
            styles.warning,
            { borderColor: "#D97706", backgroundColor: "#D9770614" },
          ]}
        >
          <Feather name="shield" size={18} color="#D97706" />
          <Text style={[styles.warningText, { color: colors.foreground }]}>
            Educational decision support only. Qualified clinical review is
            required. This is not a diagnosis, coverage determination, or
            autonomous eligibility decision.
          </Text>
        </View>
      )}

      {needsMfa && (
        <View
          style={[
            styles.card,
            { borderColor: "#D97706", backgroundColor: colors.card },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
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

      {tool.containsPhi && !needsMfa && (
        <View
          style={[
            styles.card,
            { borderColor: colors.border, backgroundColor: colors.card },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Ephemeral clinical workspace
          </Text>
          <Text style={{ color: colors.mutedForeground, lineHeight: 20 }}>
            Patient inputs and generated results are not saved. Closing, signing
            out, or restarting permanently loses this work.
          </Text>
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
          {tool.id === "medical-record-lcd-verifier" && (
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
          disabled={busy || needsMfa || (tool.containsPhi && !snapshotId)}
          onPress={runTool}
          style={[
            styles.primaryButton,
            {
              backgroundColor: colors.primary,
              opacity:
                busy || needsMfa || (tool.containsPhi && !snapshotId) ? 0.5 : 1,
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
        {run?.output != null ? (
          <>
            {tool.containsPhi && (
              <View
                style={[
                  styles.watermark,
                  { borderColor: "#D97706", backgroundColor: "#D9770614" },
                ]}
              >
                <Text
                  style={{
                    color: colors.foreground,
                    fontFamily: "Inter_700Bold",
                    lineHeight: 19,
                  }}
                >
                  {run.watermark}
                </Text>
              </View>
            )}
            <ResultValue value={run.output} colors={colors} />
          </>
        ) : (
          <Text style={{ color: colors.mutedForeground }}>
            Complete the form to generate a structured result.
          </Text>
        )}
      </View>

      <View
        style={[
          styles.card,
          { borderColor: colors.border, backgroundColor: colors.card },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          {tool.containsPhi ? "No clinical history" : "Recent runs"}
        </Text>
        {tool.containsPhi ? (
          <Text style={{ color: colors.mutedForeground, lineHeight: 20 }}>
            Clinical inputs and results are never added to history. Sharing uses
            the in-memory result and creates no server export.
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
