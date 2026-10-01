import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { Feather } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, AppState, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { apiDelete, apiGet, apiPost, uploadPatientReviewFile } from "@/lib/api";
import { useColors } from "@/hooks/useColors";
import { font } from "@/lib/typography";

const BASE = "/api/clinical/patient-review/sessions";
const MIME: Record<string, string> = {
  pdf: "application/pdf", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", txt: "text/plain",
};
type Policy = { id: string; source: string; title: string; documentId: string; version: string; retiredAt: string | null; effectiveAt: string | null; educationalBaseline: boolean };
type Picked = { uri: string; name: string; size: number; contentType: string };
type CareService = { id: string; name: string; family: string; summary: string };
type CareOpportunity = {
  serviceId: string; serviceName: string; family: string; status: "clinical_review_suggested";
  reason: string[]; evidence: { path: string; text: string }[]; missingChecks: string[];
  availability: "available" | "not_listed" | "verify"; reviewerRole: string; sourceUrl: string;
  humanReviewRequired: true; eligibilityDetermined: false;
};
type ContinuumReview = {
  registryVersion: string; screenedServiceCount: number; opportunities: CareOpportunity[];
  limitations: string[]; humanReviewRequired: true;
};
type Review = {
  output: Record<string, unknown>; watermark: string;
  coveragePolicy: { documentId: string; version: string };
  careOpportunities?: ContinuumReview | null;
};

export default function PatientReviewScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [available, setAvailable] = useState(false);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [policyId, setPolicyId] = useState("");
  const [files, setFiles] = useState<Picked[]>([]);
  const filesRef = useRef<Picked[]>([]);
  const sessionRef = useRef("");
  const pickerActive = useRef(false);
  const [verified, setVerified] = useState(false);
  const [challenge, setChallenge] = useState<{ challengeId: string; challengeToken: string } | null>(null);
  const [code, setCode] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Review | null>(null);
  const [careServices, setCareServices] = useState<CareService[]>([]);
  const [careRegistryVersion, setCareRegistryVersion] = useState("");
  const [county, setCounty] = useState("");
  const [currentServiceId, setCurrentServiceId] = useState("");
  const [showServicePicker, setShowServicePicker] = useState(false);

  function clearCopies() {
    for (const item of filesRef.current) {
      try { new File(item.uri).delete(); } catch { /* Cache file may already be gone. */ }
    }
    filesRef.current = [];
    setFiles([]);
  }

  async function close() {
    const id = sessionRef.current;
    if (id) {
      await apiDelete(`${BASE}/${id}`);
      sessionRef.current = "";
    }
    clearCopies(); setResult(null); setConfirmed(false);
  }

  useEffect(() => {
    void Promise.all([
      apiGet<{ clinical: { patientDocumentsAccepted: boolean } }>("/api/ai-tools"),
      apiGet<{ snapshots: Policy[] }>("/api/clinical/coverage/snapshots"),
      apiGet<{ enabled: boolean; registryVersion: string; services: CareService[] }>(`${BASE}/services`),
    ]).then(([capabilities, coverage, careCatalog]) => {
      setAvailable(capabilities.clinical.patientDocumentsAccepted);
      setPolicies(coverage.snapshots.filter((item) => item.source === "CMS_MCD" && !item.retiredAt && !item.educationalBaseline && item.effectiveAt && new Date(item.effectiveAt) <= new Date()));
      setCareServices(careCatalog.enabled ? careCatalog.services : []);
      setCareRegistryVersion(careCatalog.enabled ? careCatalog.registryVersion : "");
    }).catch((caught) => setError(caught instanceof Error ? caught.message : "Policies could not load."));
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "background" && !pickerActive.current) void close().catch(() => setError("Deletion could not be verified. Secure cleanup will retry."));
    });
    return () => {
      subscription.remove();
      if (sessionRef.current) void apiDelete(`${BASE}/${sessionRef.current}`).catch(() => undefined);
      for (const item of filesRef.current) try { new File(item.uri).delete(); } catch { /* Cleanup fallback. */ }
    };
  }, []);

  async function pick() {
    setError("");
    pickerActive.current = true;
    let picked: DocumentPicker.DocumentPickerResult;
    try { picked = await DocumentPicker.getDocumentAsync({ type: Object.values(MIME), multiple: true, copyToCacheDirectory: true }); }
    finally { pickerActive.current = false; }
    if (picked.canceled) return;
    const selected = picked.assets.map((item) => ({ uri: item.uri, name: item.name,
      size: item.size ?? 0, contentType: MIME[item.name.split(".").pop()?.toLowerCase() ?? ""] ?? "" }));
    if (selected.length > 5 || selected.some((item) => !item.contentType || item.size < 1 || item.size > 25 * 1024 * 1024)) {
      for (const item of selected) try { new File(item.uri).delete(); } catch { /* Cache cleanup. */ }
      setError("Choose up to five PDF, DOCX, PNG, JPEG, or TXT files, each no larger than 25 MB.");
      return;
    }
    clearCopies(); filesRef.current = selected; setFiles(selected);
  }

  async function run() {
    if (!verified || !policyId || !files.length || !confirmed) return;
    setBusy(true); setError(""); setResult(null);
    try {
      const created = await apiPost<{ sessionId: string }>(BASE, { coverageSnapshotId: policyId });
      sessionRef.current = created.sessionId;
      for (const item of files) {
        await uploadPatientReviewFile(created.sessionId, new File(item.uri), item.contentType);
      }
      clearCopies();
      const completed = await apiPost<{ result: Review }>(`${BASE}/${created.sessionId}/finalize`, {
        confirmedHumanReview: true,
        careContext: {
          ...(county.trim() ? { county: county.trim() } : {}),
          ...(currentServiceId ? { currentServiceIds: [currentServiceId] } : {}),
        },
      }, { timeoutMs: 240_000 });
      sessionRef.current = "";
      setResult(completed.result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Review failed.");
      try { await close(); } catch { setError("Review stopped. Deletion could not be verified; secure cleanup is being retried."); }
    } finally { setBusy(false); }
  }

  const button = (label: string, action: () => void, disabled = false) =>
    <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={action}
      style={[styles.button, { backgroundColor: disabled ? colors.muted : colors.primary }]}>
      <Text style={[styles.buttonText, { color: disabled ? colors.mutedForeground : colors.primaryForeground }, font("bold")]}>{label}</Text>
    </Pressable>;

  return <ScrollView contentContainerStyle={[styles.container, { paddingTop: Math.max(insets.top + 16, 35), paddingBottom: insets.bottom + 48, backgroundColor: colors.background }]}>
    <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}><Feather name="arrow-left" size={19} color={colors.foreground} /><Text style={{ color: colors.foreground }}>Advanced tools</Text></Pressable>
    <Text style={[styles.title, { color: colors.foreground }, font("bold")]}>Patient record review</Text>
    <Text style={[styles.copy, { color: colors.mutedForeground }]}>Review documented facts against current CMS policy. This is a draft for a hospice clinician; it cannot diagnose, determine eligibility, code, or prescribe.</Text>
    {!available ? <Text style={[styles.card, { color: colors.foreground, borderColor: colors.border }]}>Patient uploads are unavailable until covered storage and file scanning are configured. The deidentified tool is still available.</Text> : <>
      <View style={[styles.card, { borderColor: colors.border }]}><Text style={[styles.heading, { color: colors.foreground }]}>1. Verify clinical access</Text>
        {!verified && (!challenge ? button("Email security code", () => void apiPost<typeof challenge>("/api/clinical/mfa/request", {}).then(setChallenge).catch((caught) => setError(String(caught))))
          : <><TextInput accessibilityLabel="Security code" keyboardType="number-pad" maxLength={6} value={code} onChangeText={setCode} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} />
          {button("Verify code", () => void apiPost("/api/clinical/mfa/verify", { ...challenge, code }).then(() => setVerified(true)).catch((caught) => setError(String(caught))), code.length !== 6)}</>)}
        {verified && <Text style={{ color: colors.foreground }}>Verified for 15 minutes.</Text>}</View>
      <View style={[styles.card, { borderColor: colors.border }]}><Text style={[styles.heading, { color: colors.foreground }]}>2. Select CMS policy</Text>
        {policies.map((policy) => <Pressable key={policy.id} accessibilityRole="radio" accessibilityState={{ checked: policy.id === policyId }} onPress={() => setPolicyId(policy.id)} style={[styles.option, { borderColor: policy.id === policyId ? colors.primary : colors.border }]}><Text style={{ color: colors.foreground }}>{policy.title} · {policy.documentId} · {policy.version}</Text></Pressable>)}
        {!policies.length && <Text style={{ color: colors.mutedForeground }}>No current CMS MCD snapshot is loaded. An administrator must sync coverage first.</Text>}</View>
      <View style={[styles.card, { borderColor: colors.border }]}><Text style={[styles.heading, { color: colors.foreground }]}>3. Choose records</Text>
        <Text style={[styles.copy, { color: colors.mutedForeground }]}>Up to five PDF, DOCX, PNG, JPEG, or TXT files (25 MB each). Only temporary file copies are used on this device. Server uploads are deleted after review or when this screen closes.</Text>
        {button("Choose files", () => void pick(), busy)}
        {files.map((item, index) => <Text key={`${item.uri}-${index}`} style={{ color: colors.foreground }}>{index + 1}. {item.name}</Text>)}</View>
      {careServices.length > 0 && <View style={[styles.card, { borderColor: colors.border }]}>
        <Text style={[styles.heading, { color: colors.foreground }]}>4. Andwell continuum review</Text>
        <Text style={[styles.copy, { color: colors.mutedForeground }]}>Optional context improves additional-service screening. It does not determine eligibility or create a referral.</Text>
        <TextInput
          accessibilityLabel="Patient county"
          placeholder="County, for example Cumberland"
          placeholderTextColor={colors.mutedForeground}
          value={county}
          onChangeText={setCounty}
          style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
        />
        <Pressable accessibilityRole="button" onPress={() => setShowServicePicker((value) => !value)} style={[styles.option, { borderColor: colors.border }]}>
          <Text style={{ color: colors.foreground }}>{currentServiceId ? careServices.find((service) => service.id === currentServiceId)?.name ?? "Current service selected" : "Select current Andwell service (optional)"}</Text>
        </Pressable>
        {showServicePicker && <View style={{ gap: 8 }}>
          <Pressable accessibilityRole="radio" accessibilityState={{ checked: !currentServiceId }} onPress={() => { setCurrentServiceId(""); setShowServicePicker(false); }} style={[styles.option, { borderColor: !currentServiceId ? colors.primary : colors.border }]}><Text style={{ color: colors.foreground }}>Not selected / verify manually</Text></Pressable>
          {careServices.map((service) => <Pressable key={service.id} accessibilityRole="radio" accessibilityState={{ checked: currentServiceId === service.id }} onPress={() => { setCurrentServiceId(service.id); setShowServicePicker(false); }} style={[styles.option, { borderColor: currentServiceId === service.id ? colors.primary : colors.border }]}><Text style={{ color: colors.foreground }}>{service.name}</Text></Pressable>)}
        </View>}
        <Text style={[styles.copy, { color: colors.mutedForeground, fontSize: 12 }]}>Registry: {careRegistryVersion}</Text>
      </View>}
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: confirmed }} onPress={() => setConfirmed(!confirmed)} style={styles.confirm}><Feather name={confirmed ? "check-square" : "square"} size={22} color={colors.primary} /><Text style={[styles.copy, { color: colors.foreground, flex: 1 }]}>I am authorized to review these records and a qualified clinician will verify the draft.</Text></Pressable>
      {button(busy ? "Reviewing securely…" : "Review records", () => void run(), !verified || !policyId || !files.length || !confirmed || busy)}
      {button("Close and delete", () => void close().catch(() => setError("Deletion could not be verified; cleanup will retry.")), busy)}
    </>}
    {busy && <ActivityIndicator color={colors.primary} />}
    {error && <Text accessibilityRole="alert" style={{ color: colors.destructive }}>{error}</Text>}
    {result && <View style={[styles.card, { borderColor: colors.border }]}><Text style={[styles.heading, { color: colors.foreground }]}>Draft evidence review</Text>
      <Text style={[styles.copy, { color: colors.foreground }]}>{result.watermark}</Text>
      {Object.entries(result.output).map(([key, value]) => <View key={key} style={styles.section}><Text style={[styles.heading, { color: colors.foreground }]}>{key.replace(/([a-z])([A-Z])/g, "$1 $2")}</Text><Text selectable={false} style={[styles.copy, { color: colors.foreground }]}>{typeof value === "string" ? value : JSON.stringify(value, null, 2)}</Text></View>)}
      {result.careOpportunities && <View style={styles.section}>
        <Text style={[styles.heading, { color: colors.foreground }]}>Potential additional Andwell services</Text>
        <Text style={[styles.copy, { color: colors.mutedForeground }]}>Screening prompts for qualified review only. No eligibility, coverage, admission, level-of-care, or treatment decision has been made.</Text>
        {result.careOpportunities.opportunities.length === 0
          ? <Text style={[styles.copy, { color: colors.foreground }]}>No additional service signal was identified in the facts extracted for this review. That does not mean another need is absent.</Text>
          : result.careOpportunities.opportunities.map((opportunity) => <View key={opportunity.serviceId} style={[styles.option, { borderColor: colors.border, gap: 6 }]}>
              <Text style={[styles.heading, { color: colors.foreground, fontSize: 15 }]}>{opportunity.serviceName}</Text>
              <Text style={[styles.copy, { color: colors.foreground }]}><Text style={font("bold")}>Why it surfaced: </Text>{opportunity.reason.join("; ")}</Text>
              {opportunity.evidence.slice(0, 3).map((evidence, index) => <Text key={`${opportunity.serviceId}-e-${index}`} style={[styles.copy, { color: colors.mutedForeground }]}>• {evidence.text}</Text>)}
              <Text style={[styles.copy, { color: colors.foreground }]}><Text style={font("bold")}>Still verify: </Text>{opportunity.missingChecks.join("; ")}</Text>
              <Text style={[styles.copy, { color: colors.foreground }]}><Text style={font("bold")}>Route to: </Text>{opportunity.reviewerRole}</Text>
              <Text style={[styles.copy, { color: colors.mutedForeground }]}>Availability: {opportunity.availability === "available" ? "county listed" : opportunity.availability === "not_listed" ? "county not listed - verify" : "verify"}</Text>
            </View>)}
        {result.careOpportunities.limitations.map((limitation, index) => <Text key={index} style={[styles.copy, { color: colors.mutedForeground, fontSize: 12 }]}>{limitation}</Text>)}
      </View>}
      {button("Clear result", () => setResult(null))}</View>}
  </ScrollView>;
}

const styles = StyleSheet.create({ container: { paddingHorizontal: 20, gap: 18 }, back: { flexDirection: "row", alignItems: "center", gap: 8 }, title: { fontSize: 27 }, copy: { fontSize: 14, lineHeight: 22 }, card: { borderWidth: 1, borderRadius: 16, padding: 18, gap: 13 }, heading: { fontSize: 17, fontWeight: "700" }, input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 18 }, option: { borderWidth: 1, padding: 12, borderRadius: 10 }, confirm: { flexDirection: "row", gap: 12, alignItems: "flex-start" }, button: { borderRadius: 10, paddingVertical: 14, paddingHorizontal: 18, alignItems: "center" }, buttonText: { fontSize: 15 }, section: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12, gap: 8 } });
