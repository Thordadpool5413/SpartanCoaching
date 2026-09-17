import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, DeviceEventEmitter, Linking, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SpartanButton } from "@/components/ui/SpartanButton";
import { useColors } from "@/hooks/useColors";
import { AI_REQUEST_TIMEOUT_MS, apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import { font } from "@/lib/typography";
import { encodeStorageJson } from "@/lib/storageJson";
import { saveCoachHandoff } from "@/lib/coachHandoff";
import { buildMedicareRuntimePath, type MedicareRuntimeOperationKey } from "@workspace/api-contract";

type Workspace = "platform" | "operations" | "referral" | "market" | "decision" | "policy" | "monitor";
type Choice = { value: string; label: string };
type Source = { label: string; url?: string; checkedAt?: string };

type NpiHit = {
  npi: string; name: string; credential?: string; taxonomy?: string; city?: string; state?: string;
  phone?: string; status?: string; taxonomies: string[]; enumerationType?: string; source: Source;
};

type AccountBrief = {
  headline: string; verifiedFacts: Array<{ label: string; value: string }>; accountLens: string;
  meetingObjective: string; opening: string; discoveryQuestions: string[]; valueHypotheses: string[];
  watchouts: string[]; preparation: string[]; followUpMessage: string;
  thirtyDayPlan: Array<{ timing: string; action: string; outcome: string }>;
  nextMove: string; limitations: string[]; source: Source;
};

type PolicyBrief = {
  title: string; purpose: string; answer: string; keyFacts: string[]; talkTrack: string;
  reviewChecklist: string[]; whatNotToSay: string[]; escalation: string; boundary: string;
  sources: Source[]; source: Source & { liveCmsSnapshot: boolean };
};

type HospiceOrganization = {
  npi: string; ccn: string; organizationName: string; doingBusinessAs: string; facilityName: string;
  address: string; city: string; state: string; zipCode: string; county: string; phone: string;
  ownership: string; certificationDate: string; yearsCertified: number | null; source: Source;
};

type MarketSummary = {
  totalMatched: number; displayed: number; ownership: Array<{ label: string; count: number }>;
  establishedBefore2000: number; newestCertificationYear: number | null; sourceCheckedAt: string;
};

type HospiceMeasure = {
  code: string; name: string; displayScore: string; stateScore: number | null; comparisonLabel: string;
  favorable: boolean | null; reportingPeriod: string;
};

type HospiceProfile = {
  organization: HospiceOrganization; quality: HospiceMeasure[]; familyExperience: HospiceMeasure[];
  serviceArea: { zipCodes: string[]; count: number }; strengths: string[]; questionsToAsk: string[];
  interpretation: string; sources: Source[];
};

type DecisionBrief = {
  title: string; purpose: string; recommendedMove: string; whyNow: string[];
  evidence: Array<{ label: string; value: string; period: string; interpretation: string }>;
  questionsToValidate: string[];
  nextActions: Array<{ timing: string; action: string; successSignal: string }>;
  stopConditions: string[];
  confidence: { score: number; label: string; availableSignals: number; possibleSignals: number; explanation: string };
  limitations: string[]; sources: Source[];
};

type WatchRecord = {
  id: string; ccn: string; state: string; label: string; createdAt: string;
  monitor: { lastCheckedAt?: string; lastChangeAt?: string; lastStatus?: string; lastError?: string } | null;
};

type AlertRecord = {
  id: string; providerCcn: string; providerLabel: string; state: string; createdAt: string;
  severity: "low" | "medium" | "high"; summary: string; readAt: string | null;
};

type DecisionStatus = "Committed" | "In progress" | "Blocked" | "Complete" | "Deferred";
type DecisionActionRecord = {
  id: string; providerCcn: string; recommendationKey: string; title: string; category: string; gate: string;
  priority: number; status: DecisionStatus; owner: string; dueDate: string; note: string; createdAt: string; updatedAt: string;
};
const decisionStatuses: Choice[] = [
  { value: "Committed", label: "Committed" }, { value: "In progress", label: "In progress" },
  { value: "Blocked", label: "Blocked" }, { value: "Complete", label: "Complete" }, { value: "Deferred", label: "Deferred" },
];

const workspaceChoices: Array<{ value: Workspace; label: string; icon: keyof typeof Feather.glyphMap }> = [
  { value: "platform", label: "Overview", icon: "grid" },
  { value: "operations", label: "All tools", icon: "layers" },
  { value: "referral", label: "Provider", icon: "users" },
  { value: "market", label: "Market", icon: "map" },
  { value: "decision", label: "Decide", icon: "target" },
  { value: "monitor", label: "Monitor", icon: "bell" },
  { value: "policy", label: "Policy", icon: "book-open" },
];

const platformCapabilities = [
  ["Provider", "Verify identity and prepare the account", "referral", "users"],
  ["Market", "Explore Care Compare records and profiles", "market", "map"],
  ["Decide", "Build an evidence-backed next move", "decision", "target"],
  ["Monitor", "Track providers and act on real change", "monitor", "bell"],
  ["Policy", "Explain sourced CMS guidance clearly", "policy", "book-open"],
] as const;

const policyTopics: Choice[] = [
  { value: "hospice-benefit", label: "Medicare hospice benefit" },
  { value: "eligibility-certification", label: "Eligibility and certification" },
  { value: "election", label: "Hospice election" },
  { value: "election-addendum", label: "Election statement addendum" },
  { value: "revocation-discharge", label: "Revocation and discharge" },
  { value: "plan-of-care-idg", label: "Plan of care and IDG" },
  { value: "levels-of-care", label: "All levels of care" },
  { value: "continuous-home-care", label: "Continuous home care" },
  { value: "general-inpatient-care", label: "General inpatient care" },
  { value: "inpatient-respite", label: "Inpatient respite" },
  { value: "face-to-face-recertification", label: "Face to face and recertification" },
  { value: "documentation", label: "Documentation" },
];

const audiences: Choice[] = [
  { value: "family", label: "Patient or family" }, { value: "referral-source", label: "Referral source" },
  { value: "sales-rep", label: "Field representative" }, { value: "clinical-leader", label: "Clinical leader" },
];
const accountTypes: Choice[] = [
  { value: "physician-practice", label: "Physician practice" }, { value: "hospital", label: "Hospital" },
  { value: "snf", label: "Skilled nursing" }, { value: "assisted-living", label: "Assisted living" },
  { value: "home-health", label: "Home health" }, { value: "community", label: "Community organization" },
  { value: "other", label: "Other" },
];
const stages: Choice[] = [
  { value: "new", label: "New account" }, { value: "developing", label: "Developing" },
  { value: "active", label: "Active partner" }, { value: "reengage", label: "Reconnect" },
];
const ownershipChoices: Choice[] = [
  { value: "", label: "All ownership types" }, { value: "For-Profit", label: "For profit" },
  { value: "Non-Profit", label: "Nonprofit" }, { value: "Other", label: "Other" },
];

const SAVED_STORAGE_NAME = "spartan_intelligence_saved_v2";

export default function SpartanIntelligenceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [workspace, setWorkspace] = useState<Workspace>("platform");
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 48 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back to Tools" onPress={() => router.back()} style={styles.back}>
          <Feather name="arrow-left" size={18} color={colors.readablePrimary} />
          <Text style={[styles.backText, { color: colors.readablePrimary }, font("bold")]}>Tools</Text>
        </Pressable>
        <View style={styles.hero}>
          <Text style={[styles.kicker, { color: colors.readablePrimary }, font("bold")]}>CMS MEDICARE KNOWLEDGE HUB</Text>
          <Text style={[styles.title, { color: colors.foreground }, font("heavy")]}>National hospice intelligence in your field kit.</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }, font("regular")]}>Move through verified provider, market, decision, and policy workflows without leaving Spartan.</Text>
          <View style={styles.trustGrid}>
            <TrustItem icon="shield" label="Verified fact" colors={colors} />
            <TrustItem icon="bar-chart-2" label="Calculated result" colors={colors} />
            <TrustItem icon="message-circle" label="Coach guidance" colors={colors} />
            <TrustItem icon="alert-circle" label="Missing, not zero" colors={colors} />
          </View>
        </View>
        <View style={[styles.workspaceTabs, { backgroundColor: colors.card, borderColor: colors.borderStrong }]}>
          {workspaceChoices.map((item) => {
            const active = workspace === item.value;
            return <Pressable key={item.value} accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={() => setWorkspace(item.value)} style={[styles.workspaceTab, { backgroundColor: active ? colors.primary : "transparent" }]}>
              <Feather name={item.icon} size={17} color={active ? colors.primaryForeground : colors.mutedForeground} />
              <Text style={[styles.workspaceLabel, { color: active ? colors.primaryForeground : colors.foreground }, font("bold")]}>{item.label}</Text>
            </Pressable>;
          })}
        </View>
        {workspace === "platform" ? <PlatformWorkspace colors={colors} onOpen={setWorkspace} /> : null}
        {workspace === "operations" ? <OperationsWorkspace colors={colors} /> : null}
        {workspace === "referral" ? <ReferralWorkspace colors={colors} /> : null}
        {workspace === "market" ? <MarketWorkspace colors={colors} /> : null}
        {workspace === "decision" ? <DecisionWorkspace colors={colors} /> : null}
        {workspace === "monitor" ? <MonitorWorkspace colors={colors} /> : null}
        {workspace === "policy" ? <PolicyWorkspace colors={colors} /> : null}
        <SavedBriefs colors={colors} />
      </ScrollView>
    </View>
  );
}

function PlatformWorkspace({ colors, onOpen }: { colors: ReturnType<typeof useColors>; onOpen: (workspace: Workspace) => void }) {
  return <View style={styles.workspace}>
    <WorkspaceIntro number="00" eyebrow="COMMAND CENTER" title="Know what is true. Make the next move." text="One native Spartan workspace for verified public evidence, careful interpretation, field decisions, and accountable follow-through." colors={colors} />
    <Panel colors={colors}>
      <View style={styles.capabilityList}>
        {platformCapabilities.map(([title, detail, destination, icon], index) => <Pressable accessibilityRole="button" onPress={() => onOpen(destination)} key={title} style={[styles.capability, { borderColor: colors.border }]}>
          <View style={[styles.capabilityNumber, { backgroundColor: colors.primaryMuted }]}><Text style={[styles.capabilityNumberText, { color: colors.readablePrimary }, font("bold")]}>{String(index + 1).padStart(2, "0")}</Text></View>
          <View style={styles.flex}><Text selectable style={[styles.sectionHeading, { color: colors.foreground }, font("bold")]}>{title}</Text><Text selectable style={[styles.helper, { color: colors.mutedForeground }, font("regular")]}>{detail}</Text></View><Feather name={icon} size={18} color={colors.readablePrimary} />
        </Pressable>)}
      </View>
      <SourceNote text="Public CMS and NPPES evidence. Sources, reporting periods, and limitations stay attached. Never enter patient information." colors={colors} />
    </Panel>
  </View>;
}

type MedicareOperation = readonly [string, string, MedicareRuntimeOperationKey, keyof typeof Feather.glyphMap];
const operations: MedicareOperation[] = [
  ["National command", "State market, county, provider, and competition signals", "dashboard", "map"],
  ["Provider 360", "Ownership, quality, utilization, and evidence", "intelligence", "home"],
  ["HCRIS economics", "Cost report operating and financial coordinates", "hcris", "bar-chart-2"],
  ["SSVI signals", "Service, utilization, and value indicators", "ssvi", "activity"],
  ["Service geography", "Observed reach, concentration, and white space", "service-geography", "map-pin"],
  ["Territory deployment", "Prioritized field deployment from verified evidence", "territory-deployment-private", "navigation"],
  ["Physician 360", "NPI services, eligibility, and referral context", "physician", "user"],
  ["Watchlist", "Tracked providers and current monitoring status", "watchlist", "bell"],
  ["Decision actions", "Owners, dates, next actions, and status", "decision-actions", "check-square"],
  ["Source diagnostics", "CMS freshness, cache, source, and model health", "system-diagnostics", "shield"],
];

function operationIdentifier(key: MedicareRuntimeOperationKey): { label: string; placeholder: string; pattern: RegExp; message: string } | null {
  if (key === "dashboard") return null;
  if (key === "physician") return { label: "Physician NPI", placeholder: "10 digit NPI", pattern: /^\d{10}$/, message: "Enter the physician's 10 digit NPI." };
  return { label: "Provider CCN", placeholder: "6 digit CCN", pattern: /^\d{6}$/, message: "Enter the provider's 6 digit CCN." };
}

function summarizeRecord(data: unknown): Array<{ label: string; value: string }> {
  if (!data || typeof data !== "object" || Array.isArray(data)) return [];
  return Object.entries(data as Record<string, unknown>).map(([label, value]) => {
    if (Array.isArray(value)) return { label, value: `${value.length} record${value.length === 1 ? "" : "s"}` };
    if (value && typeof value === "object") return { label, value: `${Object.keys(value).length} field${Object.keys(value).length === 1 ? "" : "s"}` };
    return { label, value: value === null || value === undefined || value === "" ? "Not reported" : String(value) };
  }).filter((row) => row.value !== "0 fields");
}

function fieldTitle(field: string) { const spaced = field.replace(/([A-Z])/g, " $1"); return spaced.charAt(0).toUpperCase() + spaced.slice(1); }
function pickTitle(row: Record<string, unknown>): string {
  for (const key of ["name", "title", "label", "providerLabel", "facilityName", "organizationName", "doingBusinessAs", "county"]) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  const id = row.ccn ?? row.npi ?? row.fips ?? row.id;
  return id !== undefined && id !== null && id !== "" ? String(id) : "Record";
}
function pickSubtitle(row: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const key of ["city", "state", "county", "status", "type", "ownership"]) {
    const value = row[key];
    if (typeof value === "string" && value.trim() && !parts.includes(value.trim())) parts.push(value.trim());
  }
  for (const key of ["ccn", "npi", "score", "adc", "rating"]) {
    const value = row[key];
    if (typeof value === "number" && Number.isFinite(value)) parts.push(`${key.toUpperCase()} ${Math.round(value * 100) / 100}`);
  }
  return parts.slice(0, 3).join("  •  ");
}
function previewArrays(data: unknown): Array<{ field: string; total: number; items: Array<{ title: string; subtitle: string }> }> {
  if (!data || typeof data !== "object" || Array.isArray(data)) return [];
  return Object.entries(data as Record<string, unknown>)
    .filter((entry): entry is [string, unknown[]] => Array.isArray(entry[1]) && entry[1].length > 0 && typeof entry[1][0] === "object" && entry[1][0] !== null)
    .map(([field, value]) => {
      const rows = value as Array<Record<string, unknown>>;
      return { field, total: rows.length, items: rows.slice(0, 5).map((row) => ({ title: pickTitle(row), subtitle: pickSubtitle(row) })) };
    });
}

function OperationsWorkspace({ colors }: { colors: ReturnType<typeof useColors> }) {
  const [selected, setSelected] = useState<MedicareOperation>(operations[0]);
  const [state, setState] = useState("OK");
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const run = async () => {
    const key = selected[2];
    const identifierRule = operationIdentifier(key);
    if (identifierRule && !identifierRule.pattern.test(identifier.trim())) {
      Alert.alert("Check the identifier", identifierRule.message);
      return;
    }
    setLoading(true); setResult(null); setShowRaw(false);
    try {
      const path = buildMedicareRuntimePath(key, {
        ccn: identifier,
        npi: identifier,
        state,
      });
      setResult(await apiGet(path, { timeoutMs: AI_REQUEST_TIMEOUT_MS }));
    } catch (error) { setResult({ error: message(error) }); }
    finally { setLoading(false); }
  };
  const shareText = () => JSON.stringify(result, null, 2);
  const save = async () => {
    setSaveStatus("Saving to My Work");
    try {
      await apiPost("/api/v1/member-work", {
        kind: "intelligence_brief", toolId: "spartan-intelligence", title: `${selected[0]} evidence record`, status: "completed",
        input: { workspace: "operations", operation: selected[2], state, identifier },
        output: { text: shareText() }, nextAction: { title: "Pressure-test this evidence with Coach", href: "/portal/coach" }, sourcePlatform: "ios",
      }, { retry: true });
      Alert.alert("Saved to My Work", "This evidence record is available on iPhone and web.");
    } catch { Alert.alert("Saved on this iPhone", "Cross-device saving is temporarily unavailable. Your work is safe on this device."); }
    finally { setSaveStatus(""); }
  };
  const summary = summarizeRecord(result);
  const preview = previewArrays(result);
  return <View style={styles.workspace}>
    <WorkspaceIntro number="05" eyebrow="FULL MEDICARE OPERATIONS" title="Every intelligence tool, one secure workspace." text="Open national, provider, financial, geography, referral, monitoring, decision, and source-health operations from the same tenant-scoped platform used on web." colors={colors} />
    <View style={styles.capabilityList}>{operations.map((item) => <Pressable key={item[2]} onPress={() => { setSelected(item); setResult(null); setShowRaw(false); }} style={[styles.capability, { borderBottomColor: colors.border }]}><View style={[styles.capabilityNumber, { backgroundColor: selected[2] === item[2] ? colors.primary : colors.primaryMuted }]}><Feather name={item[3]} size={17} color={selected[2] === item[2] ? colors.primaryForeground : colors.readablePrimary} /></View><View style={styles.flex}><Text style={[styles.resultChoiceTitle, { color: colors.foreground }, font("bold")]}>{item[0]}</Text><Text style={[styles.helper, { color: colors.mutedForeground }, font("regular")]}>{item[1]}</Text></View><Feather name="chevron-right" size={18} color={colors.mutedForeground} /></Pressable>)}</View>
    <Panel colors={colors}>
      <Text style={[styles.sectionHeading, { color: colors.foreground }, font("heavy")]}>{selected[0]}</Text>
      <View style={styles.fieldRow}><View style={styles.stateField}><Field label="State" value={state} onChangeText={(value) => setState(value.slice(0, 2).toUpperCase())} placeholder="OK" colors={colors} /></View><View style={styles.flex}><Field label={operationIdentifier(selected[2])?.label || "Provider CCN (optional)"} value={identifier} onChangeText={(value) => setIdentifier(value.replace(/\D/g, "").slice(0, 10))} placeholder={operationIdentifier(selected[2])?.placeholder || "Optional"} colors={colors} keyboardType="number-pad" /></View></View>
      <SpartanButton title={loading ? "Loading intelligence…" : "Run verified analysis"} onPress={() => void run()} disabled={loading} />
      {loading ? <Progress status="Retrieving and calculating CMS evidence" colors={colors} /> : null}
      {result ? <View style={styles.block}>
        <Text style={[styles.eyebrow, { color: colors.primary }, font("bold")]}>EVIDENCE SUMMARY</Text>
        {summary.length ? <View style={styles.factGrid}>{summary.map((row) => <Fact key={row.label} label={row.label} value={row.value} colors={colors} />)}</View> : <Text style={[styles.helper, { color: colors.mutedForeground }, font("regular")]}>No structured fields were returned.</Text>}
        {preview.map((group) => <View key={group.field} style={styles.block}>
          <Text style={[styles.sectionHeading, { color: colors.foreground }, font("heavy")]}>{fieldTitle(group.field)} ({group.total})</Text>
          {group.items.map((item, index) => <LineItem key={`${group.field}-${index}`} text={item.subtitle ? `${item.title}  —  ${item.subtitle}` : item.title} icon="arrow-up-right" colors={colors} />)}
          {group.total > group.items.length ? <Text style={[styles.helper, { color: colors.mutedForeground }, font("regular")]}>+{group.total - group.items.length} more in the complete evidence record.</Text> : null}
        </View>)}
        <View style={styles.actions}>
          <Action icon="copy" label="Copy" onPress={async () => { await Clipboard.setStringAsync(shareText()); Alert.alert("Copied", "Ready to paste."); }} colors={colors} />
          <Action icon="share-2" label="Share" onPress={() => void Share.share({ title: selected[0], message: shareText() })} colors={colors} />
          <Action icon="bookmark" label="Save" onPress={() => void save()} colors={colors} />
        </View>
        {saveStatus ? <Progress status={saveStatus} colors={colors} /> : null}
        <Pressable accessibilityRole="button" onPress={() => setShowRaw(!showRaw)} style={styles.line}>
          <Feather name={showRaw ? "chevron-up" : "chevron-down"} size={18} color={colors.readablePrimary} />
          <Text style={[styles.body, { color: colors.readablePrimary }, font("bold")]}>{showRaw ? "Hide" : "View"} complete evidence record</Text>
        </Pressable>
        {showRaw ? <View style={[styles.evidenceCard, { borderColor: colors.border, backgroundColor: colors.background }]}><Text selectable style={[styles.jsonRecord, { color: colors.foreground }, font("regular")]}>{shareText()}</Text></View> : null}
      </View> : null}
    </Panel>
  </View>;
}

function ReferralWorkspace({ colors }: { colors: ReturnType<typeof useColors> }) {
  const [mode, setMode] = useState<"person" | "organization">("person");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [results, setResults] = useState<NpiHit[]>([]);
  const [selected, setSelected] = useState<NpiHit | null>(null);
  const [accountType, setAccountType] = useState("physician-practice");
  const [stage, setStage] = useState("new");
  const [purpose, setPurpose] = useState("");
  const [barrier, setBarrier] = useState("");
  const [stakeholder, setStakeholder] = useState("");
  const [commitment, setCommitment] = useState("");
  const [brief, setBrief] = useState<AccountBrief | null>(null);
  const [status, setStatus] = useState("");

  const search = async () => {
    if (!name.trim()) return Alert.alert("Add a name", mode === "person" ? "Enter the provider’s last name." : "Enter the organization name.");
    setStatus("Checking the live NPPES registry"); setSelected(null); setBrief(null);
    try {
      const params = new URLSearchParams({ limit: "10" });
      params.set(mode === "person" ? "lastName" : "organization", name.trim());
      if (city.trim()) params.set("city", city.trim());
      if (state.trim()) params.set("state", state.trim().toUpperCase());
      const response = await apiGet<{ results: NpiHit[] }>(`/api/reference/npi?${params}`);
      setResults(response.results || []);
      if (!response.results?.length) Alert.alert("No verified match", "Try a broader name or remove the city.");
    } catch (error) { Alert.alert("Search unavailable", message(error)); }
    finally { setStatus(""); }
  };

  const build = async () => {
    if (!selected) return;
    setStatus("Building the account strategy");
    try {
      const response = await apiPost<{ brief: AccountBrief }>(
        "/api/intelligence/account-brief",
        {
          provider: selected, accountType, relationshipStage: stage, meetingPurpose: purpose,
          knownBarrier: barrier, stakeholderRole: stakeholder, desiredCommitment: commitment,
        },
        { retry: true, timeoutMs: AI_REQUEST_TIMEOUT_MS },
      );
      setBrief(response.brief);
    } catch (error) { Alert.alert("Plan unavailable", message(error)); }
    finally { setStatus(""); }
  };

  return <View style={styles.workspace}>
    <WorkspaceIntro number="01" eyebrow="REFERRAL INTELLIGENCE" title="Turn a verified provider into an account strategy." text="Verify who you are meeting, choose the account context, and leave with discovery questions, value hypotheses, follow up language, and a thirty day plan." colors={colors} />
    <Panel colors={colors}>
      <Step title="Find the right account" text="Search the public NPPES registry. No patient information." colors={colors} />
      <View style={styles.segmentRow}>{(["person", "organization"] as const).map((item) => <ChoiceChip key={item} active={mode === item} label={item === "person" ? "Provider" : "Organization"} onPress={() => setMode(item)} colors={colors} />)}</View>
      <Field label={mode === "person" ? "Provider last name" : "Organization name"} value={name} onChangeText={setName} placeholder={mode === "person" ? "Example: Ortiz" : "Example: Coastal Medical Group"} colors={colors} />
      <View style={styles.fieldRow}><View style={styles.flex}><Field label="City" value={city} onChangeText={setCity} placeholder="Optional" colors={colors} /></View><View style={styles.stateField}><Field label="State" value={state} onChangeText={(v) => setState(v.toUpperCase().slice(0, 2))} placeholder="FL" colors={colors} /></View></View>
      <SpartanButton title="Search verified providers" loading={status.includes("NPPES")} onPress={search} />
      <Progress status={status} colors={colors} />
      {results.map((item) => <ResultChoice key={item.npi} title={`${item.name}${item.credential ? `, ${item.credential}` : ""}`} meta={[item.taxonomy, item.city, item.state].filter(Boolean).join("  •  ")} source={`NPI ${item.npi}  •  CMS NPPES`} selected={selected?.npi === item.npi} onPress={() => { setSelected(item); setBrief(null); }} colors={colors} />)}
    </Panel>
    {selected ? <Panel colors={colors}>
      <Step title="Shape the strategy" text={`Build the plan for ${selected.name}. Choose what is known. Use Other only when the listed options do not fit.`} colors={colors} />
      <ChoiceField label="Account type" value={accountType} choices={accountTypes} onChange={setAccountType} colors={colors} />
      <ChoiceField label="Relationship" value={stage} choices={stages} onChange={setStage} colors={colors} />
      <Field label="Meeting objective" value={purpose} onChangeText={setPurpose} placeholder="What should be different after this meeting?" colors={colors} multiline />
      <Field label="Known barrier" value={barrier} onChangeText={setBarrier} placeholder="Example: families hear about hospice too late" colors={colors} multiline />
      <Field label="Stakeholder role" value={stakeholder} onChangeText={setStakeholder} placeholder="Example: Director of Nursing" colors={colors} />
      <Field label="Commitment to earn" value={commitment} onChangeText={setCommitment} placeholder="Example: Schedule a staff education" colors={colors} />
      <SpartanButton title="Build account strategy" loading={status.includes("strategy")} onPress={build} />
      <Progress status={status} colors={colors} />
    </Panel> : null}
    {brief ? <AccountResult brief={brief} colors={colors} /> : null}
  </View>;
}

function MarketWorkspace({ colors }: { colors: ReturnType<typeof useColors> }) {
  const [state, setState] = useState(""); const [city, setCity] = useState(""); const [county, setCounty] = useState("");
  const [zipCode, setZipCode] = useState(""); const [name, setName] = useState(""); const [ownership, setOwnership] = useState("");
  const [results, setResults] = useState<HospiceOrganization[]>([]); const [summary, setSummary] = useState<MarketSummary | null>(null);
  const [profile, setProfile] = useState<HospiceProfile | null>(null); const [status, setStatus] = useState("");
  const search = async () => {
    if (!/^[A-Z]{2}$/.test(state)) return Alert.alert("Add a state", "Use the two letter state abbreviation.");
    setStatus("Searching current CMS Care Compare data"); setProfile(null);
    try {
      const params = new URLSearchParams({ state, limit: "50" });
      if (city.trim()) params.set("city", city.trim()); if (county.trim()) params.set("county", county.trim());
      if (zipCode.trim()) params.set("zipCode", zipCode.trim()); if (name.trim()) params.set("name", name.trim());
      if (ownership) params.set("ownership", ownership);
      const response = await apiGet<{ results: HospiceOrganization[]; summary: MarketSummary }>(`/api/intelligence/hospice-market?${params}`);
      setResults(response.results || []); setSummary(response.summary);
      if (!response.results?.length) Alert.alert("No verified matches", "Remove one filter or search the entire state.");
    } catch (error) { Alert.alert("Market search unavailable", message(error)); }
    finally { setStatus(""); }
  };
  const openProfile = async (item: HospiceOrganization) => {
    setStatus(`Loading quality and family experience for ${item.doingBusinessAs || item.facilityName}`);
    try { const response = await apiGet<{ profile: HospiceProfile }>(`/api/intelligence/hospice-profile?ccn=${item.ccn}`); setProfile(response.profile); }
    catch (error) { Alert.alert("Profile unavailable", message(error)); }
    finally { setStatus(""); }
  };
  return <View style={styles.workspace}>
    <WorkspaceIntro number="02" eyebrow="HOSPICE MARKET INTELLIGENCE" title="See the market beyond a list of names." text="Search official Care Compare records, then open a hospice profile with quality results, family experience, state comparisons, service area, and questions worth asking." colors={colors} />
    <Panel colors={colors}>
      <Step title="Define the market" text="State is required. Add only the filters that improve the decision." colors={colors} />
      <View style={styles.fieldRow}><View style={styles.stateField}><Field label="State" value={state} onChangeText={(v) => setState(v.toUpperCase().slice(0, 2))} placeholder="FL" colors={colors} /></View><View style={styles.flex}><Field label="City" value={city} onChangeText={setCity} placeholder="Optional" colors={colors} /></View></View>
      <View style={styles.fieldRow}><View style={styles.flex}><Field label="County" value={county} onChangeText={setCounty} placeholder="Optional" colors={colors} /></View><View style={styles.zipField}><Field label="ZIP" value={zipCode} onChangeText={(v) => setZipCode(v.replace(/\D/g, "").slice(0, 5))} placeholder="Optional" colors={colors} /></View></View>
      <Field label="Hospice name" value={name} onChangeText={setName} placeholder="Optional" colors={colors} />
      <ChoiceField label="Ownership" value={ownership} choices={ownershipChoices} onChange={setOwnership} colors={colors} />
      <SpartanButton title="Explore verified market" loading={status.includes("Searching")} onPress={search} />
      <Progress status={status} colors={colors} />
    </Panel>
    {summary ? <Panel colors={colors}>
      <Step title="Market snapshot" text={`${summary.totalMatched} verified hospices matched. Showing ${summary.displayed}.`} colors={colors} />
      <View style={styles.metricRow}><Metric label="MATCHED" value={String(summary.totalMatched)} colors={colors} /><Metric label="ESTABLISHED BEFORE 2000" value={String(summary.establishedBefore2000)} colors={colors} /></View>
      {summary.ownership.slice(0, 4).map((item) => <LineItem key={item.label} text={`${item.label}: ${item.count}`} icon="pie-chart" colors={colors} />)}
      <Text style={[styles.helper, { color: colors.mutedForeground }, font("regular")]}>Select a hospice to open its complete CMS profile.</Text>
      {results.map((item) => <ResultChoice key={item.ccn} title={item.doingBusinessAs || item.facilityName} meta={`${item.city}, ${item.state}  •  ${item.ownership}`} source={`CCN ${item.ccn}${item.npi ? `  •  NPI ${item.npi}` : ""}`} selected={profile?.organization.ccn === item.ccn} onPress={() => void openProfile(item)} colors={colors} />)}
      <Progress status={status} colors={colors} />
    </Panel> : null}
    {profile ? <HospiceProfileResult profile={profile} colors={colors} /> : null}
  </View>;
}

function DecisionWorkspace({ colors }: { colors: ReturnType<typeof useColors> }) {
  const [ccn, setCcn] = useState("");
  const [goal, setGoal] = useState("");
  const [brief, setBrief] = useState<DecisionBrief | null>(null);
  const [status, setStatus] = useState("");
  const build = async () => {
    if (!/^\d{6}$/.test(ccn)) return Alert.alert("Add a hospice CCN", "Enter the six-digit CCN from a verified hospice profile.");
    setStatus("Building the evidence-backed decision brief");
    setBrief(null);
    try {
      const response = await apiPost<{ brief: DecisionBrief }>(
        "/api/intelligence/market-decision",
        { ccn, goal },
        { retry: true, timeoutMs: AI_REQUEST_TIMEOUT_MS },
      );
      setBrief(response.brief);
    } catch (error) { Alert.alert("Decision brief unavailable", message(error)); }
    finally { setStatus(""); }
  };
  return <View style={styles.workspace}>
    <WorkspaceIntro number="03" eyebrow="DECISION ROOM" title="Move from public data to one defensible action." text="Use a verified hospice CCN. Evidence, reporting periods, limitations, confidence, next actions, and stop conditions stay visible." colors={colors} />
    <Panel colors={colors}>
      <Step title="Name the decision" text="Missing evidence lowers coverage. It is never treated as poor performance." colors={colors} />
      <Field label="Hospice CCN" value={ccn} onChangeText={(value) => setCcn(value.replace(/\D/g, "").slice(0, 6))} placeholder="Six digits" colors={colors} />
      <Field label="Decision you need to make" value={goal} onChangeText={setGoal} placeholder="Example: Should this account receive focused field development this quarter?" colors={colors} multiline />
      <SpartanButton title="Build decision brief" loading={Boolean(status)} onPress={build} />
      <Progress status={status} colors={colors} />
    </Panel>
    {brief ? <DecisionResult brief={brief} colors={colors} /> : null}
    {/^\d{6}$/.test(ccn) ? <ExecutionQueue ccn={ccn} colors={colors} /> : null}
  </View>;
}

function ExecutionQueue({ ccn, colors }: { ccn: string; colors: ReturnType<typeof useColors> }) {
  const [records, setRecords] = useState<DecisionActionRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState("");
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");

  const load = async () => {
    setStatus("Loading the execution queue");
    try {
      const response = await apiGet<{ records: DecisionActionRecord[] }>(`/api/decision-actions?ccn=${ccn}`);
      setRecords(response.records || []);
      setLoaded(true);
    } catch (error) { Alert.alert("Execution queue unavailable", message(error)); }
    finally { setStatus(""); }
  };

  const add = async () => {
    if (!title.trim()) return Alert.alert("Add a title", "Name the action you are committing to.");
    setStatus("Adding to the execution queue");
    try {
      const response = await apiPost<DecisionActionRecord>("/api/decision-actions", {
        providerCcn: ccn, recommendationKey: `manual-${Date.now()}`, title: title.trim(), owner: owner.trim(), dueDate: dueDate.trim(), note: note.trim(),
      });
      setRecords((prev) => [response, ...prev]);
      setTitle(""); setOwner(""); setDueDate(""); setNote("");
    } catch (error) { Alert.alert("Could not add action", message(error)); }
    finally { setStatus(""); }
  };

  const setActionStatus = async (record: DecisionActionRecord, next: DecisionStatus) => {
    try {
      const response = await apiPut<DecisionActionRecord>(`/api/decision-actions/${record.id}`, { providerCcn: ccn, status: next });
      setRecords((prev) => prev.map((item) => (item.id === record.id ? response : item)));
    } catch (error) { Alert.alert("Could not update status", message(error)); }
  };

  const remove = async (record: DecisionActionRecord) => {
    try {
      await apiDelete(`/api/decision-actions/${record.id}?ccn=${ccn}`);
      setRecords((prev) => prev.filter((item) => item.id !== record.id));
    } catch (error) { Alert.alert("Could not remove action", message(error)); }
  };

  return <Panel colors={colors}>
    <Step title="Execution queue" text="Owners, due dates, and status for this hospice's committed decisions." colors={colors} />
    <SpartanButton title={loaded ? "Refresh execution queue" : "Load execution queue"} variant={loaded ? "outline" : undefined} loading={status.includes("Loading")} onPress={() => void load()} />
    {records.map((record) => <View key={record.id} style={[styles.listRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
      <View style={styles.flex}>
        <Text style={[styles.body, { color: colors.foreground }, font("bold")]}>{record.title}</Text>
        {record.owner || record.dueDate ? <Text style={[styles.helper, { color: colors.mutedForeground }, font("regular")]}>{[record.owner, record.dueDate].filter(Boolean).join("  •  ")}</Text> : null}
        <View style={styles.statusWrap}>{decisionStatuses.map((item) => <Pressable key={item.value} onPress={() => void setActionStatus(record, item.value as DecisionStatus)} style={[styles.statusChip, { backgroundColor: record.status === item.value ? colors.primary : colors.background, borderColor: record.status === item.value ? colors.primary : colors.border }]}><Text style={[styles.statusChipText, { color: record.status === item.value ? colors.primaryForeground : colors.foreground }, font("semibold")]}>{item.label}</Text></Pressable>)}</View>
      </View>
      <Pressable accessibilityLabel={`Remove ${record.title}`} onPress={() => void remove(record)} style={styles.savedIcon}><Feather name="trash-2" size={17} color={colors.mutedForeground} /></Pressable>
    </View>)}
    {loaded && !records.length ? <Text style={[styles.helper, { color: colors.mutedForeground }, font("regular")]}>No committed actions yet for this hospice.</Text> : null}
    <Field label="New action" value={title} onChangeText={setTitle} placeholder="Example: Schedule staff education with DON" colors={colors} />
    <View style={styles.fieldRow}><View style={styles.flex}><Field label="Owner" value={owner} onChangeText={setOwner} placeholder="Optional" colors={colors} /></View><View style={styles.stateField}><Field label="Due" value={dueDate} onChangeText={setDueDate} placeholder="YYYY-MM-DD" colors={colors} /></View></View>
    <Field label="Note" value={note} onChangeText={setNote} placeholder="Optional context" colors={colors} multiline />
    <SpartanButton title="Add to execution queue" variant="outline" loading={status.includes("Adding")} onPress={() => void add()} />
    <Progress status={status} colors={colors} />
  </Panel>;
}

function MonitorWorkspace({ colors }: { colors: ReturnType<typeof useColors> }) {
  const [watchlist, setWatchlist] = useState<WatchRecord[]>([]);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState("");
  const [ccn, setCcn] = useState("");
  const [state, setState] = useState("");
  const [label, setLabel] = useState("");

  const load = async () => {
    setStatus("Loading watchlist and alerts");
    try {
      const [watchResponse, alertResponse] = await Promise.all([
        apiGet<{ records: WatchRecord[] }>("/api/watchlist"),
        apiGet<{ alerts: AlertRecord[] }>("/api/alerts"),
      ]);
      setWatchlist(watchResponse.records || []);
      setAlerts(alertResponse.alerts || []);
      setLoaded(true);
    } catch (error) { Alert.alert("Monitoring unavailable", message(error)); }
    finally { setStatus(""); }
  };

  useEffect(() => { void load(); }, []);

  const addWatch = async () => {
    if (!/^\d{6}$/.test(ccn)) return Alert.alert("Add a hospice CCN", "Enter the six-digit CCN from a verified hospice profile.");
    setStatus("Adding to the watchlist");
    try {
      const response = await apiPost<WatchRecord>("/api/watchlist", { ccn, state: state.toUpperCase(), label: label.trim() || ccn });
      setWatchlist((prev) => [response, ...prev.filter((item) => item.id !== response.id)]);
      setCcn(""); setState(""); setLabel("");
    } catch (error) { Alert.alert("Could not add to watchlist", message(error)); }
    finally { setStatus(""); }
  };

  const checkNow = async (watch: WatchRecord) => {
    setStatus(`Checking ${watch.label}`);
    try {
      await apiPost(`/api/watchlist/${watch.id}/check`, {});
      await load();
    } catch (error) { Alert.alert("Check failed", message(error)); }
    finally { setStatus(""); }
  };

  const removeWatch = async (watch: WatchRecord) => {
    try {
      await apiDelete(`/api/watchlist/${watch.id}`);
      setWatchlist((prev) => prev.filter((item) => item.id !== watch.id));
    } catch (error) { Alert.alert("Could not remove", message(error)); }
  };

  const markRead = async (alert: AlertRecord) => {
    try {
      const response = await apiPut<AlertRecord>(`/api/alerts/${alert.id}`, {});
      setAlerts((prev) => prev.map((item) => (item.id === alert.id ? response : item)));
    } catch (error) { Alert.alert("Could not update alert", message(error)); }
  };

  const unread = alerts.filter((item) => !item.readAt).length;

  return <View style={styles.workspace}>
    <WorkspaceIntro number="06" eyebrow="MONITORING" title="Watch what matters. Act on what changes." text="Track hospices, receive verified change alerts, and clear them once addressed." colors={colors} />
    <Panel colors={colors}>
      <Step title="Add a hospice to your watchlist" text="Monitoring runs automatically once a hospice is added." colors={colors} />
      <View style={styles.fieldRow}><View style={styles.flex}><Field label="Hospice CCN" value={ccn} onChangeText={(value) => setCcn(value.replace(/\D/g, "").slice(0, 6))} placeholder="Six digits" colors={colors} /></View><View style={styles.stateField}><Field label="State" value={state} onChangeText={(value) => setState(value.toUpperCase().slice(0, 2))} placeholder="OK" colors={colors} /></View></View>
      <Field label="Label" value={label} onChangeText={setLabel} placeholder="Optional. Example: Regional Hospice - Tulsa" colors={colors} />
      <SpartanButton title="Add to watchlist" loading={status.includes("Adding")} onPress={() => void addWatch()} />
      <Progress status={status} colors={colors} />
    </Panel>
    <Panel colors={colors}>
      <Step title="Watched hospices" text={`${watchlist.length} tracked. Tap refresh to pull current evidence now.`} colors={colors} />
      {watchlist.map((watch) => <View key={watch.id} style={[styles.listRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
        <View style={styles.flex}>
          <Text style={[styles.body, { color: colors.foreground }, font("bold")]}>{watch.label}</Text>
          <Text style={[styles.helper, { color: colors.mutedForeground }, font("regular")]}>CCN {watch.ccn}{watch.state ? `  •  ${watch.state}` : ""}</Text>
          <Text style={[styles.source, { color: colors.mutedForeground }, font("regular")]}>{watch.monitor?.lastCheckedAt ? `Last checked ${formatCheckedAt(watch.monitor.lastCheckedAt)}` : "Not yet checked"}</Text>
        </View>
        <Pressable accessibilityLabel={`Check ${watch.label} now`} onPress={() => void checkNow(watch)} style={styles.savedIcon}><Feather name="refresh-cw" size={17} color={colors.readablePrimary} /></Pressable>
        <Pressable accessibilityLabel={`Remove ${watch.label}`} onPress={() => void removeWatch(watch)} style={styles.savedIcon}><Feather name="trash-2" size={17} color={colors.mutedForeground} /></Pressable>
      </View>)}
      {loaded && !watchlist.length ? <Text style={[styles.helper, { color: colors.mutedForeground }, font("regular")]}>No hospices tracked yet.</Text> : null}
    </Panel>
    <Panel colors={colors}>
      <Step title="Alerts" text={`${unread} unread of ${alerts.length} total.`} colors={colors} />
      {alerts.map((alert) => <View key={alert.id} style={[styles.listRow, { borderColor: alert.readAt ? colors.border : colors.primary, backgroundColor: colors.background }]}>
        <View style={styles.flex}>
          <Text style={[styles.body, { color: colors.foreground }, font("bold")]}>{alert.providerLabel}</Text>
          <Text style={[styles.helper, { color: colors.mutedForeground }, font("regular")]}>{alert.summary}</Text>
          <Text style={[styles.source, { color: colors.mutedForeground }, font("regular")]}>{alert.severity.toUpperCase()}  •  {formatCheckedAt(alert.createdAt)}</Text>
        </View>
        {!alert.readAt ? <Pressable accessibilityLabel={`Mark ${alert.providerLabel} read`} onPress={() => void markRead(alert)} style={styles.savedIcon}><Feather name="check" size={17} color={colors.readablePrimary} /></Pressable> : null}
      </View>)}
      {loaded && !alerts.length ? <Text style={[styles.helper, { color: colors.mutedForeground }, font("regular")]}>No alerts yet.</Text> : null}
    </Panel>
  </View>;
}

function PolicyWorkspace({ colors }: { colors: ReturnType<typeof useColors> }) {
  const [topic, setTopic] = useState("hospice-benefit"); const [audience, setAudience] = useState("referral-source");
  const [concern, setConcern] = useState(""); const [brief, setBrief] = useState<PolicyBrief | null>(null); const [status, setStatus] = useState("");
  const build = async () => {
    setStatus("Building the guide from current official references");
    try {
      const response = await apiPost<{ brief: PolicyBrief }>(
        "/api/intelligence/policy-brief",
        { topic, audience, concern },
        { retry: true, timeoutMs: AI_REQUEST_TIMEOUT_MS },
      );
      setBrief(response.brief);
    }
    catch (error) { Alert.alert("Guide unavailable", message(error)); }
    finally { setStatus(""); }
  };
  return <View style={styles.workspace}>
    <WorkspaceIntro number="04" eyebrow="CMS POLICY INTELLIGENCE" title="Explain the rule clearly. Know where your authority ends." text="Choose the decision and audience. Receive plain language, key facts, a human talk track, a verification checklist, language to avoid, and escalation guidance." colors={colors} />
    <Panel colors={colors}>
      <Step title="Prepare the explanation" text="Choose the exact policy decision and who needs the answer." colors={colors} />
      <ChoiceField label="Policy decision" value={topic} choices={policyTopics} onChange={(v) => { setTopic(v); setBrief(null); }} colors={colors} />
      <ChoiceField label="Audience" value={audience} choices={audiences} onChange={setAudience} colors={colors} />
      <Field label="Question or concern" value={concern} onChangeText={setConcern} placeholder="Optional. What needs to be explained or decided?" colors={colors} multiline />
      <SpartanButton title="Build policy guide" loading={Boolean(status)} onPress={build} />
      <Progress status={status} colors={colors} />
    </Panel>
    {brief ? <PolicyResult brief={brief} colors={colors} /> : null}
  </View>;
}

function DecisionResult({ brief, colors }: { brief: DecisionBrief; colors: ReturnType<typeof useColors> }) {
  const shareText = [brief.title, brief.purpose, `Recommended move: ${brief.recommendedMove}`, "Why now", ...brief.whyNow, "Questions to validate", ...brief.questionsToValidate, "Next actions", ...brief.nextActions.map((item) => `${item.timing}: ${item.action} Success: ${item.successSignal}`), "Stop conditions", ...brief.stopConditions, ...brief.limitations].join("\n\n");
  return <ResultPanel eyebrow="DECISION BRIEF" title={brief.title} shareText={shareText} colors={colors}>
    <View style={styles.metricRow}><Metric label="EVIDENCE COVERAGE" value={`${brief.confidence.score}%`} colors={colors} /><Metric label="CONFIDENCE" value={brief.confidence.label} colors={colors} /></View>
    <Callout title="RECOMMENDED MOVE" text={brief.recommendedMove} colors={colors} />
    <ListSection title="Why now" items={brief.whyNow} colors={colors} />
    <View style={styles.block}><Text style={[styles.sectionHeading, { color: colors.foreground }, font("heavy")]}>Evidence ledger</Text>{brief.evidence.map((item) => <View key={`${item.label}-${item.period}`} style={[styles.evidenceCard, { borderColor: colors.border, backgroundColor: colors.background }]}><View style={styles.measureTop}><Text selectable style={[styles.measureName, styles.flex, { color: colors.foreground }, font("bold")]}>{item.label}</Text><Text selectable style={[styles.measureScore, { color: colors.primary }, font("heavy")]}>{item.value}</Text></View><Text selectable style={[styles.source, { color: colors.mutedForeground }, font("bold")]}>PERIOD  •  {item.period}</Text><Text selectable style={[styles.helper, { color: colors.mutedForeground }, font("regular")]}>{item.interpretation}</Text></View>)}</View>
    <ListSection title="Questions to validate" items={brief.questionsToValidate} colors={colors} numbered />
    <Text style={[styles.sectionHeading, { color: colors.foreground }, font("heavy")]}>Execution plan</Text>
    {brief.nextActions.map((item, index) => <View key={item.timing} style={[styles.planRow, { borderColor: colors.border }]}><View style={[styles.number, { backgroundColor: colors.primary }]}><Text style={[styles.numberText, font("bold")]}>{index + 1}</Text></View><View style={styles.flex}><Text style={[styles.planTiming, { color: colors.primary }, font("bold")]}>{item.timing}</Text><Text selectable style={[styles.body, { color: colors.foreground }, font("regular")]}>{item.action}</Text><Text selectable style={[styles.helper, { color: colors.mutedForeground }, font("regular")]}>Success: {item.successSignal}</Text></View></View>)}
    <ListSection title="Stop conditions" items={brief.stopConditions} colors={colors} warning />
    <View style={styles.block}><Text style={[styles.sectionHeading, { color: colors.foreground }, font("heavy")]}>Official sources</Text>{brief.sources.map((source) => <SourceLink key={`${source.label}-${source.url || "source"}`} source={source} colors={colors} />)}</View>
    <SourceNote text={`${brief.confidence.explanation} ${brief.limitations.join(" ")}`} colors={colors} />
  </ResultPanel>;
}

function AccountResult({ brief, colors }: { brief: AccountBrief; colors: ReturnType<typeof useColors> }) {
  const shareText = [brief.headline, brief.accountLens, `Objective: ${brief.meetingObjective}`, `Opening: ${brief.opening}`, "Questions", ...brief.discoveryQuestions, "Value", ...brief.valueHypotheses, `Next move: ${brief.nextMove}`, "Follow up", brief.followUpMessage].join("\n\n");
  return <ResultPanel eyebrow="ACCOUNT STRATEGY" title={brief.headline} shareText={shareText} colors={colors}>
    <Callout title="ACCOUNT LENS" text={brief.accountLens} colors={colors} />
    <TextBlock title="Meeting objective" text={brief.meetingObjective} colors={colors} />
    <TextBlock title="Open this way" text={brief.opening} colors={colors} quote />
    <ListSection title="Questions worth asking" items={brief.discoveryQuestions} colors={colors} numbered />
    <ListSection title="Value hypotheses to test" items={brief.valueHypotheses} colors={colors} />
    <ListSection title="Prepare before the meeting" items={brief.preparation} colors={colors} />
    <ListSection title="Watchouts" items={brief.watchouts} colors={colors} warning />
    <TextBlock title="Follow up message" text={brief.followUpMessage} colors={colors} quote />
    <Text style={[styles.sectionHeading, { color: colors.foreground }, font("heavy")]}>Thirty day movement plan</Text>
    {brief.thirtyDayPlan.map((item, index) => <View key={item.timing} style={[styles.planRow, { borderColor: colors.border }]}><View style={[styles.number, { backgroundColor: colors.primary }]}><Text style={[styles.numberText, font("bold")]}>{index + 1}</Text></View><View style={styles.flex}><Text style={[styles.planTiming, { color: colors.primary }, font("bold")]}>{item.timing}</Text><Text style={[styles.body, { color: colors.foreground }, font("regular")]}>{item.action}</Text><Text style={[styles.helper, { color: colors.mutedForeground }, font("regular")]}>{item.outcome}</Text></View></View>)}
    <Callout title="COMMITMENT TO EARN" text={brief.nextMove} colors={colors} />
    <SourceNote text={brief.limitations.join(" ")} colors={colors} />
  </ResultPanel>;
}

function HospiceProfileResult({ profile, colors }: { profile: HospiceProfile; colors: ReturnType<typeof useColors> }) {
  const org = profile.organization;
  const shareText = [`${org.doingBusinessAs || org.facilityName} CMS profile`, `${org.city}, ${org.state}`, `CCN ${org.ccn}`, "Strength signals", ...profile.strengths, "Questions to ask", ...profile.questionsToAsk, profile.interpretation].join("\n\n");
  return <ResultPanel eyebrow="VERIFIED HOSPICE PROFILE" title={org.doingBusinessAs || org.facilityName} shareText={shareText} colors={colors}>
    <View style={styles.factGrid}><Fact label="CCN" value={org.ccn} colors={colors} /><Fact label="NPI" value={org.npi || "Not linked"} colors={colors} /><Fact label="Ownership" value={org.ownership} colors={colors} /><Fact label="Certified" value={org.certificationDate || "Not reported"} colors={colors} /></View>
    <TextBlock title="Location" text={`${org.address}\n${org.city}, ${org.state} ${org.zipCode}\n${org.phone}`} colors={colors} />
    <Callout title="SERVICE AREA" text={`${profile.serviceArea.count} ZIP codes reported by CMS. ${profile.serviceArea.zipCodes.slice(0, 12).join(", ")}${profile.serviceArea.count > 12 ? " and more" : ""}.`} colors={colors} />
    <MeasureSection title="Quality and claims signals" measures={profile.quality} colors={colors} />
    <MeasureSection title="Family experience" measures={profile.familyExperience} colors={colors} />
    <ListSection title="Strength signals to validate" items={profile.strengths} colors={colors} />
    <ListSection title="Questions worth asking" items={profile.questionsToAsk} colors={colors} numbered />
    <SourceNote text={profile.interpretation} colors={colors} />
  </ResultPanel>;
}

function PolicyResult({ brief, colors }: { brief: PolicyBrief; colors: ReturnType<typeof useColors> }) {
  const shareText = [brief.title, brief.purpose, brief.answer, "Say it this way", brief.talkTrack, "Key facts", ...brief.keyFacts, "Verify", ...brief.reviewChecklist, "Avoid", ...brief.whatNotToSay, "Escalate", brief.escalation, brief.boundary].join("\n\n");
  return <ResultPanel eyebrow="POLICY GUIDE" title={brief.title} shareText={shareText} colors={colors}>
    <Text style={[styles.helper, { color: colors.mutedForeground }, font("regular")]}>{brief.purpose}</Text>
    <TextBlock title="Plain language" text={brief.answer} colors={colors} />
    <TextBlock title="Say it this way" text={brief.talkTrack} colors={colors} quote />
    <ListSection title="Key facts" items={brief.keyFacts} colors={colors} />
    <ListSection title="Verify before use" items={brief.reviewChecklist} colors={colors} />
    <ListSection title="Do not say" items={brief.whatNotToSay} colors={colors} warning />
    <Callout title="ESCALATE HERE" text={brief.escalation} colors={colors} />
    <Text style={[styles.sectionHeading, { color: colors.foreground }, font("heavy")]}>Official references</Text>
    {brief.sources.map((source) => <LineItem key={source.label} text={source.label} icon="external-link" colors={colors} />)}
    <SourceNote text={brief.boundary} colors={colors} />
  </ResultPanel>;
}

function ResultPanel({ eyebrow, title, shareText, colors, children }: { eyebrow: string; title: string; shareText: string; colors: ReturnType<typeof useColors>; children: React.ReactNode }) {
  const save = async () => {
    const raw = await AsyncStorage.getItem(SAVED_STORAGE_NAME); const current = raw ? JSON.parse(raw) as unknown[] : [];
    await AsyncStorage.setItem(SAVED_STORAGE_NAME, encodeStorageJson([{ title, text: shareText, savedAt: new Date().toISOString() }, ...current].slice(0, 20)));
    DeviceEventEmitter.emit("spartan-intelligence-saved");
    try {
      await apiPost("/api/v1/member-work", {
        kind: "intelligence_brief", toolId: "spartan-intelligence", title, status: "completed",
        input: { workspace: eyebrow.toLowerCase() }, output: { text: shareText },
        nextAction: { title: "Pressure-test this intelligence with Coach", href: "/portal/coach" }, sourcePlatform: "ios",
      }, { retry: true });
      Alert.alert("Saved to My Work", "This intelligence is available on iPhone and web.");
    } catch {
      Alert.alert("Saved on this iPhone", "Cross-device saving is temporarily unavailable. Your work is safe on this device.");
    }
  };
  return <View style={[styles.resultPanel, { backgroundColor: colors.card, borderColor: colors.primary }]}>
    <Text style={[styles.eyebrow, { color: colors.primary }, font("bold")]}>{eyebrow}</Text>
    <Text style={[styles.resultTitleLarge, { color: colors.foreground }, font("heavy")]}>{title}</Text>
    <View style={styles.actions}>
      <Action icon="copy" label="Copy" onPress={async () => { await Clipboard.setStringAsync(shareText); Alert.alert("Copied", "Ready to paste."); }} colors={colors} />
      <Action icon="share-2" label="Share" onPress={() => void Share.share({ title, message: shareText })} colors={colors} />
      <Action icon="bookmark" label="Save" onPress={() => void save()} colors={colors} />
    </View>
    <SpartanButton title="Ask Coach about this" variant="outline" onPress={() => void saveCoachHandoff({ situation: shareText.slice(0, 4000), intention: `Pressure-test this ${eyebrow.toLowerCase()} and help me choose the strongest next action.` }).then(() => router.push("/(tabs)/coach"))} />
    {children}
  </View>;
}

function SavedBriefs({ colors }: { colors: ReturnType<typeof useColors> }) {
  const [items, setItems] = useState<Array<{ title: string; text: string; savedAt: string }>>([]);
  const [open, setOpen] = useState(false);
  const load = async () => {
    try {
      const raw = await AsyncStorage.getItem(SAVED_STORAGE_NAME);
      setItems(raw ? JSON.parse(raw) : []);
    } catch { setItems([]); }
  };
  useEffect(() => {
    void load();
    const subscription = DeviceEventEmitter.addListener("spartan-intelligence-saved", () => void load());
    return () => subscription.remove();
  }, []);
  if (!items.length) return null;
  const remove = async (savedAt: string) => {
    const next = items.filter((item) => item.savedAt !== savedAt);
    setItems(next);
    await AsyncStorage.setItem(SAVED_STORAGE_NAME, encodeStorageJson(next));
  };
  return <View style={[styles.savedPanel, { backgroundColor: colors.card, borderColor: colors.borderStrong }]}>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)} style={styles.savedHeader}>
      <View style={styles.flex}><Text style={[styles.eyebrow, { color: colors.primary }, font("bold")]}>SAVED INTELLIGENCE</Text><Text style={[styles.sectionHeading, { color: colors.foreground }, font("heavy")]}>{items.length} brief{items.length === 1 ? "" : "s"} ready to return to</Text></View>
      <Feather name={open ? "chevron-up" : "chevron-down"} size={21} color={colors.primary} />
    </Pressable>
    {open ? items.map((item) => <View key={item.savedAt} style={[styles.savedItem, { borderTopColor: colors.border }]}><View style={styles.flex}><Text style={[styles.resultChoiceTitle, { color: colors.foreground }, font("bold")]}>{item.title}</Text><Text style={[styles.source, { color: colors.mutedForeground }, font("regular")]}>{new Date(item.savedAt).toLocaleString()}</Text></View><Pressable accessibilityLabel={`Copy ${item.title}`} onPress={() => void Clipboard.setStringAsync(item.text)} style={styles.savedIcon}><Feather name="copy" size={17} color={colors.primary} /></Pressable><Pressable accessibilityLabel={`Share ${item.title}`} onPress={() => void Share.share({ title: item.title, message: item.text })} style={styles.savedIcon}><Feather name="share-2" size={17} color={colors.primary} /></Pressable><Pressable accessibilityLabel={`Delete ${item.title}`} onPress={() => void remove(item.savedAt)} style={styles.savedIcon}><Feather name="trash-2" size={17} color={colors.mutedForeground} /></Pressable></View>) : null}
  </View>;
}

function WorkspaceIntro({ number, eyebrow, title, text, colors }: { number: string; eyebrow: string; title: string; text: string; colors: ReturnType<typeof useColors> }) { return <View style={styles.intro}><Text style={[styles.kicker, { color: colors.primary }, font("bold")]}>{number}  •  {eyebrow}</Text><Text style={[styles.workspaceTitle, { color: colors.foreground }, font("heavy")]}>{title}</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }, font("regular")]}>{text}</Text></View>; }
function Panel({ colors, children }: { colors: ReturnType<typeof useColors>; children: React.ReactNode }) { return <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.borderStrong }]}>{children}</View>; }
function Step({ title, text, colors }: { title: string; text: string; colors: ReturnType<typeof useColors> }) { return <View style={styles.step}><Text style={[styles.sectionHeading, { color: colors.foreground }, font("heavy")]}>{title}</Text><Text style={[styles.helper, { color: colors.mutedForeground }, font("regular")]}>{text}</Text></View>; }
function Progress({ status, colors }: { status: string; colors: ReturnType<typeof useColors> }) { return status ? <View accessibilityLiveRegion="polite" style={[styles.progress, { backgroundColor: colors.primaryMuted }]}><ActivityIndicator color={colors.primary} /><View style={styles.flex}><Text style={[styles.progressTitle, { color: colors.foreground }, font("bold")]}>{status}</Text><Text style={[styles.helper, { color: colors.mutedForeground }, font("regular")]}>This usually takes a few seconds.</Text></View></View> : null; }
function message(error: unknown) { return error instanceof Error ? error.message : "Try again in a moment."; }
function formatCheckedAt(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "date unavailable" : date.toLocaleDateString(); }
function TrustItem({ icon, label, colors }: { icon: keyof typeof Feather.glyphMap; label: string; colors: ReturnType<typeof useColors> }) { return <View style={[styles.trustItem, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name={icon} size={14} color={colors.readablePrimary} /><Text style={[styles.trustLabel, { color: colors.foreground }, font("semibold")]}>{label}</Text></View>; }

function Field({ label, value, onChangeText, placeholder, colors, multiline = false, keyboardType }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; colors: ReturnType<typeof useColors>; multiline?: boolean; keyboardType?: React.ComponentProps<typeof TextInput>["keyboardType"] }) { return <View style={styles.field}><Text style={[styles.label, { color: colors.foreground }, font("bold")]}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.mutedForeground} multiline={multiline} keyboardType={keyboardType} style={[styles.input, multiline && styles.multiline, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.borderStrong }, font("regular")]} /></View>; }

function ChoiceField({ label, value, choices, onChange, colors }: { label: string; value: string; choices: Choice[]; onChange: (value: string) => void; colors: ReturnType<typeof useColors> }) {
  const [open, setOpen] = useState(false); const selected = choices.find((item) => item.value === value) || choices[0];
  return <View style={styles.field}><Text style={[styles.label, { color: colors.foreground }, font("bold")]}>{label}</Text><Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)} style={[styles.select, { backgroundColor: colors.background, borderColor: open ? colors.primary : colors.borderStrong }]}><Text style={[styles.selectText, { color: colors.foreground }, font("semibold")]}>{selected.label}</Text><Feather name={open ? "chevron-up" : "chevron-down"} size={20} color={colors.readablePrimary} /></Pressable>{open ? <View style={[styles.menu, { backgroundColor: colors.background, borderColor: colors.borderStrong }]}>{choices.map((item) => <Pressable key={item.value || "all"} onPress={() => { onChange(item.value); setOpen(false); }} style={[styles.menuItem, { borderBottomColor: colors.border }]}><Text style={[styles.menuText, { color: colors.foreground }, font(item.value === value ? "bold" : "regular")]}>{item.label}</Text>{item.value === value ? <Feather name="check" size={18} color={colors.readablePrimary} /> : null}</Pressable>)}</View> : null}</View>;
}

function ChoiceChip({ active, label, onPress, colors }: { active: boolean; label: string; onPress: () => void; colors: ReturnType<typeof useColors> }) { return <Pressable onPress={onPress} style={[styles.choiceChip, { backgroundColor: active ? colors.primary : colors.background, borderColor: active ? colors.primary : colors.border }]}><Text style={[styles.choiceText, { color: active ? colors.primaryForeground : colors.foreground }, font("bold")]}>{label}</Text></Pressable>; }
function ResultChoice({ title, meta, source, selected, onPress, colors }: { title: string; meta: string; source: string; selected: boolean; onPress: () => void; colors: ReturnType<typeof useColors> }) { return <Pressable accessibilityRole="button" onPress={onPress} style={[styles.resultChoice, { backgroundColor: colors.background, borderColor: selected ? colors.primary : colors.border }]}><View style={[styles.resultIcon, { backgroundColor: colors.primaryMuted }]}><Feather name={selected ? "check" : "arrow-up-right"} size={18} color={colors.readablePrimary} /></View><View style={styles.flex}><Text style={[styles.resultChoiceTitle, { color: colors.foreground }, font("bold")]}>{title}</Text><Text style={[styles.helper, { color: colors.mutedForeground }, font("regular")]}>{meta}</Text><Text style={[styles.source, { color: colors.mutedForeground }, font("regular")]}>{source}</Text></View></Pressable>; }
function Metric({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useColors> }) { return <View style={[styles.metric, { backgroundColor: colors.background, borderColor: colors.border }]}><Text style={[styles.metricValue, { color: colors.foreground }, font("heavy")]}>{value}</Text><Text style={[styles.metricLabel, { color: colors.mutedForeground }, font("bold")]}>{label}</Text></View>; }
function Fact({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useColors> }) { return <View style={[styles.fact, { borderColor: colors.border }]}><Text style={[styles.briefLabel, { color: colors.readablePrimary }, font("bold")]}>{label}</Text><Text style={[styles.body, { color: colors.foreground }, font("semibold")]}>{value}</Text></View>; }
function Callout({ title, text, colors }: { title: string; text: string; colors: ReturnType<typeof useColors> }) { return <View style={[styles.callout, { backgroundColor: colors.primaryMuted }]}><Text style={[styles.briefLabel, { color: colors.readablePrimary }, font("bold")]}>{title}</Text><Text style={[styles.body, { color: colors.foreground }, font("bold")]}>{text}</Text></View>; }
function TextBlock({ title, text, quote = false, colors }: { title: string; text: string; quote?: boolean; colors: ReturnType<typeof useColors> }) { return <View style={styles.block}><Text style={[styles.briefLabel, { color: colors.readablePrimary }, font("bold")]}>{title.toUpperCase()}</Text><Text style={[styles.body, quote && styles.quote, { color: colors.foreground, borderLeftColor: colors.primary }, font(quote ? "semibold" : "regular")]}>{text}</Text></View>; }
function ListSection({ title, items, colors, numbered = false, warning = false }: { title: string; items: string[]; colors: ReturnType<typeof useColors>; numbered?: boolean; warning?: boolean }) { return <View style={styles.block}><Text style={[styles.sectionHeading, { color: colors.foreground }, font("heavy")]}>{title}</Text>{items.map((item, index) => <View key={`${index}-${item}`} style={styles.line}><View style={[numbered ? styles.number : styles.dot, { backgroundColor: warning ? "#C46A13" : colors.primary }]}>{numbered ? <Text style={[styles.numberText, font("bold")]}>{index + 1}</Text> : null}</View><Text style={[styles.body, styles.flex, { color: colors.foreground }, font("regular")]}>{item}</Text></View>)}</View>; }
function LineItem({ text, icon, colors }: { text: string; icon: keyof typeof Feather.glyphMap; colors: ReturnType<typeof useColors> }) { return <View style={styles.line}><Feather name={icon} size={16} color={colors.readablePrimary} /><Text style={[styles.body, styles.flex, { color: colors.foreground }, font("regular")]}>{text}</Text></View>; }
function SourceLink({ source, colors }: { source: Source; colors: ReturnType<typeof useColors> }) { const content = <><Feather name="external-link" size={16} color={colors.readablePrimary} /><View style={styles.flex}><Text style={[styles.body, { color: colors.foreground }, font("semibold")]}>{source.label}</Text>{source.checkedAt ? <Text style={[styles.helper, { color: colors.mutedForeground }, font("regular")]}>Checked {formatCheckedAt(source.checkedAt)}</Text> : null}</View></>; return source.url ? <Pressable accessibilityRole="link" accessibilityLabel={`Open official source: ${source.label}`} hitSlop={8} onPress={() => void Linking.openURL(source.url!)} style={({ pressed }) => [styles.line, pressed && { opacity: 0.72 }]}>{content}</Pressable> : <View style={styles.line}>{content}</View>; }
function MeasureSection({ title, measures, colors }: { title: string; measures: HospiceMeasure[]; colors: ReturnType<typeof useColors> }) { return <View style={styles.block}><Text style={[styles.sectionHeading, { color: colors.foreground }, font("heavy")]}>{title}</Text>{measures.length ? measures.map((item) => <View key={item.code} style={[styles.measure, { borderColor: colors.border }]}><View style={styles.measureTop}><Text style={[styles.measureName, styles.flex, { color: colors.foreground }, font("bold")]}>{item.name}</Text><Text style={[styles.measureScore, { color: colors.primary }, font("heavy")]}>{item.displayScore}</Text></View><Text style={[styles.helper, { color: item.favorable === true ? "#37845A" : item.favorable === false ? "#C46A13" : colors.mutedForeground }, font("semibold")]}>{item.comparisonLabel}</Text><Text style={[styles.source, { color: colors.mutedForeground }, font("regular")]}>{item.reportingPeriod}</Text></View>) : <Text style={[styles.helper, { color: colors.mutedForeground }, font("regular")]}>CMS does not currently report these measures for this hospice.</Text>}</View>; }
function SourceNote({ text, colors }: { text: string; colors: ReturnType<typeof useColors> }) { return <View style={[styles.sourceNote, { borderTopColor: colors.border }]}><Feather name="shield" size={17} color={colors.readablePrimary} /><Text style={[styles.helper, styles.flex, { color: colors.mutedForeground }, font("regular")]}>{text}</Text></View>; }
function Action({ icon, label, onPress, colors }: { icon: keyof typeof Feather.glyphMap; label: string; onPress: () => void; colors: ReturnType<typeof useColors> }) { return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={[styles.action, { backgroundColor: colors.background, borderColor: colors.border }]}><Feather name={icon} size={17} color={colors.readablePrimary} /><Text style={[styles.actionText, { color: colors.foreground }, font("bold")]}>{label}</Text></Pressable>; }

const styles = StyleSheet.create({
  screen: { flex: 1 }, content: { paddingHorizontal: 20, gap: 22 }, back: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 44 }, backText: { fontSize: 15 },
  hero: { gap: 10 }, kicker: { fontSize: 10, letterSpacing: 2.1 }, title: { fontSize: 34, lineHeight: 39, letterSpacing: -1.1 }, subtitle: { fontSize: 16, lineHeight: 24 }, trustGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 }, trustItem: { width: "48%", minHeight: 38, borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 7 }, trustLabel: { flex: 1, fontSize: 11, lineHeight: 14 },
  workspaceTabs: { flexDirection: "row", flexWrap: "wrap", gap: 5, borderWidth: 1, borderRadius: 18, padding: 5 }, workspaceTab: { width: "48%", flexGrow: 1, minHeight: 48, borderRadius: 13, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 }, workspaceLabel: { fontSize: 12 },
  workspace: { gap: 20 }, intro: { gap: 9, paddingTop: 4 }, workspaceTitle: { fontSize: 27, lineHeight: 33, letterSpacing: -0.5 },
  capabilityList: { gap: 0 }, capability: { minHeight: 68, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 12 }, capabilityNumber: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" }, capabilityNumberText: { fontSize: 10, letterSpacing: 1 },
  panel: { borderWidth: 1, borderRadius: 22, padding: 18, gap: 16 }, step: { gap: 5 }, sectionHeading: { fontSize: 19, lineHeight: 24 }, helper: { fontSize: 13, lineHeight: 19 },
  field: { gap: 8 }, label: { fontSize: 14 }, input: { minHeight: 52, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, fontSize: 16 }, multiline: { minHeight: 92, paddingTop: 13, textAlignVertical: "top" },
  fieldRow: { flexDirection: "row", gap: 11 }, flex: { flex: 1 }, stateField: { width: 88 }, zipField: { width: 116 }, segmentRow: { flexDirection: "row", gap: 9 },
  choiceChip: { flex: 1, minHeight: 44, borderWidth: 1, borderRadius: 13, alignItems: "center", justifyContent: "center" }, choiceText: { fontSize: 14 },
  select: { minHeight: 52, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, selectText: { fontSize: 15, flex: 1 },
  menu: { borderWidth: 1, borderRadius: 14, overflow: "hidden" }, menuItem: { minHeight: 48, paddingHorizontal: 14, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, menuText: { fontSize: 14, flex: 1 },
  progress: { borderRadius: 15, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }, progressTitle: { fontSize: 14 },
  resultChoice: { borderWidth: 1, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 11 }, resultIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" }, resultChoiceTitle: { fontSize: 15, lineHeight: 20 }, source: { fontSize: 10, lineHeight: 15, marginTop: 3 },
  metricRow: { flexDirection: "row", gap: 10 }, metric: { flex: 1, borderWidth: 1, borderRadius: 15, padding: 13, gap: 4 }, metricValue: { fontSize: 25 }, metricLabel: { fontSize: 8, lineHeight: 12, letterSpacing: 1.1 },
  resultPanel: { borderWidth: 1, borderRadius: 24, padding: 19, gap: 19 }, eyebrow: { fontSize: 9, letterSpacing: 2 }, resultTitleLarge: { fontSize: 25, lineHeight: 31 }, actions: { flexDirection: "row", gap: 8 }, action: { flex: 1, minHeight: 44, borderWidth: 1, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 }, actionText: { fontSize: 12 },
  callout: { borderRadius: 16, padding: 15, gap: 7 }, briefLabel: { fontSize: 9, letterSpacing: 1.6 }, body: { fontSize: 15, lineHeight: 23 }, block: { gap: 10 }, quote: { borderLeftWidth: 3, paddingLeft: 13 },
  line: { flexDirection: "row", alignItems: "flex-start", gap: 11 }, dot: { width: 7, height: 7, borderRadius: 4, marginTop: 8 }, number: { width: 27, height: 27, borderRadius: 14, alignItems: "center", justifyContent: "center" }, numberText: { color: "#FFFFFF", fontSize: 11 },
  planRow: { borderTopWidth: 1, paddingTop: 14, flexDirection: "row", gap: 11 }, planTiming: { fontSize: 11, letterSpacing: 0.5, marginBottom: 3 },
  factGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 }, fact: { width: "48%", borderWidth: 1, borderRadius: 14, padding: 12, gap: 5 },
  measure: { borderTopWidth: 1, paddingTop: 13, gap: 4 }, evidenceCard: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 7 }, measureTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 }, measureName: { fontSize: 14, lineHeight: 19 }, measureScore: { fontSize: 19 },
  jsonRecord: { fontSize: 11, lineHeight: 17 },
  sourceNote: { borderTopWidth: 1, paddingTop: 15, flexDirection: "row", gap: 10 },
  savedPanel: { borderWidth: 1, borderRadius: 22, padding: 17, gap: 12 }, savedHeader: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 12 }, savedItem: { borderTopWidth: 1, paddingTop: 12, flexDirection: "row", alignItems: "center", gap: 7 }, savedIcon: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  listRow: { borderWidth: 1, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 11 },
  statusWrap: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 8 }, statusChip: { borderWidth: 1, borderRadius: 999, minHeight: 34, paddingHorizontal: 11, alignItems: "center", justifyContent: "center" }, statusChipText: { fontSize: 11 },
});
