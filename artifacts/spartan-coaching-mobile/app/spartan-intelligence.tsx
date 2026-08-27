import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, DeviceEventEmitter, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SpartanButton } from "@/components/ui/SpartanButton";
import { useColors } from "@/hooks/useColors";
import { apiGet, apiPost } from "@/lib/api";
import { font } from "@/lib/typography";

type Workspace = "referral" | "market" | "policy";
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

const workspaceChoices: Array<{ value: Workspace; label: string; icon: keyof typeof Feather.glyphMap }> = [
  { value: "referral", label: "Referral", icon: "users" },
  { value: "market", label: "Market", icon: "map" },
  { value: "policy", label: "Policy", icon: "book-open" },
];

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
  const [workspace, setWorkspace] = useState<Workspace>("referral");
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 48 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back to Explore" onPress={() => router.back()} style={styles.back}>
          <Feather name="arrow-left" size={18} color={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }, font("bold")]}>Explore</Text>
        </Pressable>
        <View style={styles.hero}>
          <Text style={[styles.kicker, { color: colors.primary }, font("bold")]}>SPARTAN INTELLIGENCE</Text>
          <Text style={[styles.title, { color: colors.foreground }, font("heavy")]}>Walk in prepared. Walk out with movement.</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }, font("regular")]}>Official CMS and NPPES data turned into decisions, conversations, and next actions.</Text>
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
        {workspace === "referral" ? <ReferralWorkspace colors={colors} /> : null}
        {workspace === "market" ? <MarketWorkspace colors={colors} /> : null}
        {workspace === "policy" ? <PolicyWorkspace colors={colors} /> : null}
        <SavedBriefs colors={colors} />
      </ScrollView>
    </View>
  );
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
      const response = await apiPost<{ brief: AccountBrief }>("/api/intelligence/account-brief", {
        provider: selected, accountType, relationshipStage: stage, meetingPurpose: purpose,
        knownBarrier: barrier, stakeholderRole: stakeholder, desiredCommitment: commitment,
      });
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

function PolicyWorkspace({ colors }: { colors: ReturnType<typeof useColors> }) {
  const [topic, setTopic] = useState("hospice-benefit"); const [audience, setAudience] = useState("referral-source");
  const [concern, setConcern] = useState(""); const [brief, setBrief] = useState<PolicyBrief | null>(null); const [status, setStatus] = useState("");
  const build = async () => {
    setStatus("Building the guide from current official references");
    try { const response = await apiPost<{ brief: PolicyBrief }>("/api/intelligence/policy-brief", { topic, audience, concern }); setBrief(response.brief); }
    catch (error) { Alert.alert("Guide unavailable", message(error)); }
    finally { setStatus(""); }
  };
  return <View style={styles.workspace}>
    <WorkspaceIntro number="03" eyebrow="CMS POLICY INTELLIGENCE" title="Explain the rule clearly. Know where your authority ends." text="Choose the decision and audience. Receive plain language, key facts, a human talk track, a verification checklist, language to avoid, and escalation guidance." colors={colors} />
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
    await AsyncStorage.setItem(SAVED_STORAGE_NAME, JSON.stringify([{ title, text: shareText, savedAt: new Date().toISOString() }, ...current].slice(0, 20)));
    DeviceEventEmitter.emit("spartan-intelligence-saved");
    Alert.alert("Saved", "This intelligence brief is saved on your device.");
  };
  return <View style={[styles.resultPanel, { backgroundColor: colors.card, borderColor: colors.primary }]}>
    <Text style={[styles.eyebrow, { color: colors.primary }, font("bold")]}>{eyebrow}</Text>
    <Text style={[styles.resultTitleLarge, { color: colors.foreground }, font("heavy")]}>{title}</Text>
    <View style={styles.actions}>
      <Action icon="copy" label="Copy" onPress={async () => { await Clipboard.setStringAsync(shareText); Alert.alert("Copied", "Ready to paste."); }} colors={colors} />
      <Action icon="share-2" label="Share" onPress={() => void Share.share({ title, message: shareText })} colors={colors} />
      <Action icon="bookmark" label="Save" onPress={() => void save()} colors={colors} />
    </View>
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
    await AsyncStorage.setItem(SAVED_STORAGE_NAME, JSON.stringify(next));
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

function Field({ label, value, onChangeText, placeholder, colors, multiline = false }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; colors: ReturnType<typeof useColors>; multiline?: boolean }) { return <View style={styles.field}><Text style={[styles.label, { color: colors.foreground }, font("bold")]}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.mutedForeground} multiline={multiline} style={[styles.input, multiline && styles.multiline, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.borderStrong }, font("regular")]} /></View>; }

function ChoiceField({ label, value, choices, onChange, colors }: { label: string; value: string; choices: Choice[]; onChange: (value: string) => void; colors: ReturnType<typeof useColors> }) {
  const [open, setOpen] = useState(false); const selected = choices.find((item) => item.value === value) || choices[0];
  return <View style={styles.field}><Text style={[styles.label, { color: colors.foreground }, font("bold")]}>{label}</Text><Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)} style={[styles.select, { backgroundColor: colors.background, borderColor: open ? colors.primary : colors.borderStrong }]}><Text style={[styles.selectText, { color: colors.foreground }, font("semibold")]}>{selected.label}</Text><Feather name={open ? "chevron-up" : "chevron-down"} size={20} color={colors.primary} /></Pressable>{open ? <View style={[styles.menu, { backgroundColor: colors.background, borderColor: colors.borderStrong }]}>{choices.map((item) => <Pressable key={item.value || "all"} onPress={() => { onChange(item.value); setOpen(false); }} style={[styles.menuItem, { borderBottomColor: colors.border }]}><Text style={[styles.menuText, { color: colors.foreground }, font(item.value === value ? "bold" : "regular")]}>{item.label}</Text>{item.value === value ? <Feather name="check" size={18} color={colors.primary} /> : null}</Pressable>)}</View> : null}</View>;
}

function ChoiceChip({ active, label, onPress, colors }: { active: boolean; label: string; onPress: () => void; colors: ReturnType<typeof useColors> }) { return <Pressable onPress={onPress} style={[styles.choiceChip, { backgroundColor: active ? colors.primary : colors.background, borderColor: active ? colors.primary : colors.border }]}><Text style={[styles.choiceText, { color: active ? colors.primaryForeground : colors.foreground }, font("bold")]}>{label}</Text></Pressable>; }
function ResultChoice({ title, meta, source, selected, onPress, colors }: { title: string; meta: string; source: string; selected: boolean; onPress: () => void; colors: ReturnType<typeof useColors> }) { return <Pressable accessibilityRole="button" onPress={onPress} style={[styles.resultChoice, { backgroundColor: colors.background, borderColor: selected ? colors.primary : colors.border }]}><View style={[styles.resultIcon, { backgroundColor: colors.primaryMuted }]}><Feather name={selected ? "check" : "arrow-up-right"} size={18} color={colors.primary} /></View><View style={styles.flex}><Text style={[styles.resultChoiceTitle, { color: colors.foreground }, font("bold")]}>{title}</Text><Text style={[styles.helper, { color: colors.mutedForeground }, font("regular")]}>{meta}</Text><Text style={[styles.source, { color: colors.mutedForeground }, font("regular")]}>{source}</Text></View></Pressable>; }
function Metric({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useColors> }) { return <View style={[styles.metric, { backgroundColor: colors.background, borderColor: colors.border }]}><Text style={[styles.metricValue, { color: colors.foreground }, font("heavy")]}>{value}</Text><Text style={[styles.metricLabel, { color: colors.mutedForeground }, font("bold")]}>{label}</Text></View>; }
function Fact({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useColors> }) { return <View style={[styles.fact, { borderColor: colors.border }]}><Text style={[styles.briefLabel, { color: colors.primary }, font("bold")]}>{label}</Text><Text style={[styles.body, { color: colors.foreground }, font("semibold")]}>{value}</Text></View>; }
function Callout({ title, text, colors }: { title: string; text: string; colors: ReturnType<typeof useColors> }) { return <View style={[styles.callout, { backgroundColor: colors.primaryMuted }]}><Text style={[styles.briefLabel, { color: colors.primary }, font("bold")]}>{title}</Text><Text style={[styles.body, { color: colors.foreground }, font("bold")]}>{text}</Text></View>; }
function TextBlock({ title, text, quote = false, colors }: { title: string; text: string; quote?: boolean; colors: ReturnType<typeof useColors> }) { return <View style={styles.block}><Text style={[styles.briefLabel, { color: colors.primary }, font("bold")]}>{title.toUpperCase()}</Text><Text style={[styles.body, quote && styles.quote, { color: colors.foreground, borderLeftColor: colors.primary }, font(quote ? "semibold" : "regular")]}>{text}</Text></View>; }
function ListSection({ title, items, colors, numbered = false, warning = false }: { title: string; items: string[]; colors: ReturnType<typeof useColors>; numbered?: boolean; warning?: boolean }) { return <View style={styles.block}><Text style={[styles.sectionHeading, { color: colors.foreground }, font("heavy")]}>{title}</Text>{items.map((item, index) => <View key={`${index}-${item}`} style={styles.line}><View style={[numbered ? styles.number : styles.dot, { backgroundColor: warning ? "#C46A13" : colors.primary }]}>{numbered ? <Text style={[styles.numberText, font("bold")]}>{index + 1}</Text> : null}</View><Text style={[styles.body, styles.flex, { color: colors.foreground }, font("regular")]}>{item}</Text></View>)}</View>; }
function LineItem({ text, icon, colors }: { text: string; icon: keyof typeof Feather.glyphMap; colors: ReturnType<typeof useColors> }) { return <View style={styles.line}><Feather name={icon} size={16} color={colors.primary} /><Text style={[styles.body, styles.flex, { color: colors.foreground }, font("regular")]}>{text}</Text></View>; }
function MeasureSection({ title, measures, colors }: { title: string; measures: HospiceMeasure[]; colors: ReturnType<typeof useColors> }) { return <View style={styles.block}><Text style={[styles.sectionHeading, { color: colors.foreground }, font("heavy")]}>{title}</Text>{measures.length ? measures.map((item) => <View key={item.code} style={[styles.measure, { borderColor: colors.border }]}><View style={styles.measureTop}><Text style={[styles.measureName, styles.flex, { color: colors.foreground }, font("bold")]}>{item.name}</Text><Text style={[styles.measureScore, { color: colors.primary }, font("heavy")]}>{item.displayScore}</Text></View><Text style={[styles.helper, { color: item.favorable === true ? "#37845A" : item.favorable === false ? "#C46A13" : colors.mutedForeground }, font("semibold")]}>{item.comparisonLabel}</Text><Text style={[styles.source, { color: colors.mutedForeground }, font("regular")]}>{item.reportingPeriod}</Text></View>) : <Text style={[styles.helper, { color: colors.mutedForeground }, font("regular")]}>CMS does not currently report these measures for this hospice.</Text>}</View>; }
function SourceNote({ text, colors }: { text: string; colors: ReturnType<typeof useColors> }) { return <View style={[styles.sourceNote, { borderTopColor: colors.border }]}><Feather name="shield" size={17} color={colors.primary} /><Text style={[styles.helper, styles.flex, { color: colors.mutedForeground }, font("regular")]}>{text}</Text></View>; }
function Action({ icon, label, onPress, colors }: { icon: keyof typeof Feather.glyphMap; label: string; onPress: () => void; colors: ReturnType<typeof useColors> }) { return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={[styles.action, { backgroundColor: colors.background, borderColor: colors.border }]}><Feather name={icon} size={17} color={colors.primary} /><Text style={[styles.actionText, { color: colors.foreground }, font("bold")]}>{label}</Text></Pressable>; }

const styles = StyleSheet.create({
  screen: { flex: 1 }, content: { paddingHorizontal: 20, gap: 22 }, back: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 44 }, backText: { fontSize: 15 },
  hero: { gap: 10 }, kicker: { fontSize: 10, letterSpacing: 2.1 }, title: { fontSize: 34, lineHeight: 39, letterSpacing: -1.1 }, subtitle: { fontSize: 16, lineHeight: 24 },
  workspaceTabs: { flexDirection: "row", borderWidth: 1, borderRadius: 18, padding: 5 }, workspaceTab: { flex: 1, minHeight: 48, borderRadius: 13, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 }, workspaceLabel: { fontSize: 12 },
  workspace: { gap: 20 }, intro: { gap: 9, paddingTop: 4 }, workspaceTitle: { fontSize: 27, lineHeight: 33, letterSpacing: -0.5 },
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
  measure: { borderTopWidth: 1, paddingTop: 13, gap: 4 }, measureTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 }, measureName: { fontSize: 14, lineHeight: 19 }, measureScore: { fontSize: 19 },
  sourceNote: { borderTopWidth: 1, paddingTop: 15, flexDirection: "row", gap: 10 },
  savedPanel: { borderWidth: 1, borderRadius: 22, padding: 17, gap: 12 }, savedHeader: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 12 }, savedItem: { borderTopWidth: 1, paddingTop: 12, flexDirection: "row", alignItems: "center", gap: 7 }, savedIcon: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
});
