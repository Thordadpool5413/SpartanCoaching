import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SpartanButton } from "@/components/ui/SpartanButton";
import { useColors } from "@/hooks/useColors";
import { apiGet, apiPost } from "@/lib/api";
import { font } from "@/lib/typography";

type NpiHit = {
  npi: string;
  name: string;
  credential?: string;
  taxonomy?: string;
  city?: string;
  state?: string;
  phone?: string;
  status?: string;
  lastUpdated?: string;
  taxonomies: string[];
  source: { label: string; url: string; checkedAt: string };
};

type Brief = {
  headline: string;
  verifiedFacts: Array<{ label: string; value: string }>;
  meetingObjective: string;
  opening: string;
  discoveryQuestions: string[];
  preparation: string[];
  nextMove: string;
  limitations: string[];
};

type PolicyTopic = "hospice-benefit" | "documentation" | "levels-of-care" | "election";
type PolicyBrief = {
  title: string;
  answer: string;
  talkTrack: string;
  reviewChecklist: string[];
  boundary: string;
  source: { label: string; liveCmsSnapshot: boolean };
};
type HospiceOrganization = {
  npi: string; ccn: string; organizationName: string; doingBusinessAs: string;
  city: string; state: string; zipCode: string; ownership: string;
};

const policyTopics: Array<{ value: PolicyTopic; label: string }> = [
  { value: "hospice-benefit", label: "Hospice benefit" },
  { value: "documentation", label: "Documentation" },
  { value: "levels-of-care", label: "Levels of care" },
  { value: "election", label: "Election" },
];

const stages = [
  { value: "new", label: "New" },
  { value: "developing", label: "Developing" },
  { value: "active", label: "Active" },
  { value: "reengage", label: "Reconnect" },
] as const;

export default function SpartanIntelligenceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<"person" | "organization">("person");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [results, setResults] = useState<NpiHit[]>([]);
  const [selected, setSelected] = useState<NpiHit | null>(null);
  const [stage, setStage] = useState<(typeof stages)[number]["value"]>("new");
  const [purpose, setPurpose] = useState("");
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(false);
  const [briefLoading, setBriefLoading] = useState(false);
  const [policyTopic, setPolicyTopic] = useState<PolicyTopic>("hospice-benefit");
  const [policyBrief, setPolicyBrief] = useState<PolicyBrief | null>(null);
  const [policyLoading, setPolicyLoading] = useState(false);
  const [marketState, setMarketState] = useState("");
  const [marketCity, setMarketCity] = useState("");
  const [marketResults, setMarketResults] = useState<HospiceOrganization[]>([]);
  const [marketLoading, setMarketLoading] = useState(false);

  const search = async () => {
    if (!name.trim()) {
      Alert.alert("Add a name", mode === "person" ? "Enter the provider's last name." : "Enter the organization name.");
      return;
    }
    setLoading(true);
    setBrief(null);
    setSelected(null);
    try {
      const params = new URLSearchParams();
      params.set(mode === "person" ? "lastName" : "organization", name.trim());
      if (city.trim()) params.set("city", city.trim());
      if (state.trim()) params.set("state", state.trim().toUpperCase());
      params.set("limit", "10");
      const response = await apiGet<{ results: NpiHit[] }>(`/api/reference/npi?${params.toString()}`);
      setResults(response.results || []);
      if (!response.results?.length) Alert.alert("No verified match", "Try a broader name or remove the city.");
    } catch (error) {
      Alert.alert("Search unavailable", error instanceof Error ? error.message : "Try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  const createBrief = async () => {
    if (!selected) return;
    setBriefLoading(true);
    try {
      const response = await apiPost<{ brief: Brief }>("/api/intelligence/account-brief", {
        provider: selected,
        relationshipStage: stage,
        meetingPurpose: purpose,
      });
      setBrief(response.brief);
    } catch (error) {
      Alert.alert("Brief unavailable", error instanceof Error ? error.message : "Try again in a moment.");
    } finally {
      setBriefLoading(false);
    }
  };

  const createPolicyBrief = async () => {
    setPolicyLoading(true);
    try {
      const response = await apiPost<{ brief: PolicyBrief }>("/api/intelligence/policy-brief", { topic: policyTopic });
      setPolicyBrief(response.brief);
    } catch (error) {
      Alert.alert("Guide unavailable", error instanceof Error ? error.message : "Try again in a moment.");
    } finally {
      setPolicyLoading(false);
    }
  };

  const searchMarket = async () => {
    if (!/^[A-Z]{2}$/.test(marketState)) {
      Alert.alert("Add a state", "Use the two letter state abbreviation.");
      return;
    }
    setMarketLoading(true);
    try {
      const params = new URLSearchParams({ state: marketState, limit: "25" });
      if (marketCity.trim()) params.set("city", marketCity.trim());
      const response = await apiGet<{ results: HospiceOrganization[] }>(`/api/intelligence/hospice-market?${params}`);
      setMarketResults(response.results || []);
      if (!response.results?.length) Alert.alert("No verified matches", "Try the state without a city.");
    } catch (error) {
      Alert.alert("Market data unavailable", error instanceof Error ? error.message : "Try again in a moment.");
    } finally {
      setMarketLoading(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 40 }]}>
        <Pressable onPress={() => router.back()} style={styles.back}><Feather name="arrow-left" size={18} color={colors.primary} /><Text style={[styles.backText, { color: colors.primary }, font("bold")]}>Explore</Text></Pressable>
        <Text style={[styles.kicker, { color: colors.primary }, font("bold")]}>SPARTAN INTELLIGENCE</Text>
        <Text style={[styles.title, { color: colors.foreground }, font("heavy")]}>Know the account before you enter the room.</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }, font("regular")]}>Verify the public provider record, then build a focused meeting brief grounded in your relationship.</Text>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderStrong }]}>
          <Text style={[styles.eyebrow, { color: colors.primary }, font("bold")]}>CMS POLICY NAVIGATOR</Text>
          <Text style={[styles.sectionTitle, { color: colors.foreground }, font("heavy")]}>Prepare the explanation before the conversation.</Text>
          <Text style={[styles.resultMeta, { color: colors.mutedForeground }, font("regular")]}>Choose a topic. Get plain language, a field ready talk track, review points, and visible source status.</Text>
          <View style={styles.stageWrap}>{policyTopics.map((item) => <Pressable key={item.value} onPress={() => { setPolicyTopic(item.value); setPolicyBrief(null); }} style={[styles.stage, { backgroundColor: policyTopic === item.value ? colors.primary : colors.background, borderColor: policyTopic === item.value ? colors.primary : colors.border }]}><Text style={[styles.stageText, { color: policyTopic === item.value ? colors.primaryForeground : colors.foreground }, font("semibold")]}>{item.label}</Text></Pressable>)}</View>
          <SpartanButton title="Build policy guide" loading={policyLoading} onPress={createPolicyBrief} />
          {policyBrief ? <View style={[styles.policyResult, { backgroundColor: colors.background, borderColor: colors.primary }]}><Text style={[styles.eyebrow, { color: colors.primary }, font("bold")]}>READY TO EXPLAIN</Text><Text style={[styles.sectionTitle, { color: colors.foreground }, font("heavy")]}>{policyBrief.title}</Text><BriefBlock title="Plain language" text={policyBrief.answer} colors={colors} /><BriefBlock title="Say it this way" text={`“${policyBrief.talkTrack}”`} colors={colors} strong /><Text style={[styles.briefLabel, { color: colors.primary }, font("bold")]}>REVIEW BEFORE USE</Text>{policyBrief.reviewChecklist.map((item) => <View key={item} style={styles.question}><Feather name="check-circle" size={18} color={colors.primary} /><Text style={[styles.briefText, { color: colors.foreground }, font("regular")]}>{item}</Text></View>)}<View style={[styles.note, { borderTopColor: colors.border }]}><Feather name="shield" size={16} color={colors.primary} /><Text style={[styles.noteText, { color: colors.mutedForeground }, font("regular")]}>{policyBrief.source.liveCmsSnapshot ? "Live CMS snapshot connected. " : "Educational baseline in use. "}{policyBrief.boundary}</Text></View></View> : null}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderStrong }]}>
          <Text style={[styles.eyebrow, { color: colors.primary }, font("bold")]}>LIVE CMS MARKET EXPLORER</Text>
          <Text style={[styles.sectionTitle, { color: colors.foreground }, font("heavy")]}>See the enrolled hospice landscape.</Text>
          <Text style={[styles.resultMeta, { color: colors.mutedForeground }, font("regular")]}>Search official CMS hospice enrollment data by state and city. Use it for market orientation, not performance claims.</Text>
          <View style={styles.fieldRow}><View style={{ width: 92 }}><Field label="State" value={marketState} onChangeText={(value) => setMarketState(value.toUpperCase().slice(0, 2))} placeholder="FL" colors={colors} /></View><View style={{ flex: 1 }}><Field label="City" value={marketCity} onChangeText={setMarketCity} placeholder="Optional" colors={colors} /></View></View>
          <SpartanButton title="Explore market" loading={marketLoading} onPress={searchMarket} />
          {marketResults.length ? <View style={styles.section}><Text style={[styles.briefLabel, { color: colors.primary }, font("bold")]}>VERIFIED ORGANIZATIONS</Text>{marketResults.map((item) => <View key={`${item.npi}-${item.ccn}`} style={[styles.marketResult, { backgroundColor: colors.background, borderColor: colors.border }]}><View style={[styles.icon, { backgroundColor: colors.primaryMuted }]}><Feather name="home" size={18} color={colors.primary} /></View><View style={{ flex: 1 }}><Text style={[styles.resultTitle, { color: colors.foreground }, font("bold")]}>{item.doingBusinessAs || item.organizationName}</Text>{item.doingBusinessAs && item.doingBusinessAs !== item.organizationName ? <Text style={[styles.resultMeta, { color: colors.mutedForeground }, font("regular")]}>{item.organizationName}</Text> : null}<Text style={[styles.resultMeta, { color: colors.mutedForeground }, font("regular")]}>{item.city}, {item.state} • {item.ownership}</Text><Text style={[styles.source, { color: colors.mutedForeground }, font("regular")]}>NPI {item.npi}{item.ccn ? ` • CCN ${item.ccn}` : ""}</Text></View></View>)}</View> : null}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderStrong }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }, font("heavy")]}>Find a referral source</Text>
          <View style={styles.segmentRow}>{(["person", "organization"] as const).map((item) => <Pressable key={item} onPress={() => setMode(item)} style={[styles.segment, { backgroundColor: mode === item ? colors.primary : colors.background, borderColor: mode === item ? colors.primary : colors.border }]}><Text style={[styles.segmentText, { color: mode === item ? colors.primaryForeground : colors.foreground }, font("bold")]}>{item === "person" ? "Provider" : "Organization"}</Text></Pressable>)}</View>
          <Field label={mode === "person" ? "Provider last name" : "Organization name"} value={name} onChangeText={setName} placeholder={mode === "person" ? "Example: Ortiz" : "Example: Coastal Medical Group"} colors={colors} />
          <View style={styles.fieldRow}><View style={{ flex: 1 }}><Field label="City" value={city} onChangeText={setCity} placeholder="Optional" colors={colors} /></View><View style={{ width: 92 }}><Field label="State" value={state} onChangeText={(value) => setState(value.toUpperCase().slice(0, 2))} placeholder="FL" colors={colors} /></View></View>
          <SpartanButton title="Search verified providers" loading={loading} onPress={search} />
        </View>

        {results.length ? <View style={styles.section}><Text style={[styles.eyebrow, { color: colors.primary }, font("bold")]}>VERIFIED RESULTS</Text>{results.map((result) => <Pressable key={result.npi} onPress={() => { setSelected(result); setBrief(null); }} style={[styles.result, { backgroundColor: colors.card, borderColor: selected?.npi === result.npi ? colors.primary : colors.border }]}><View style={[styles.icon, { backgroundColor: colors.primaryMuted }]}><Feather name={result.taxonomy?.toLowerCase().includes("organization") ? "home" : "user"} size={18} color={colors.primary} /></View><View style={{ flex: 1 }}><Text style={[styles.resultTitle, { color: colors.foreground }, font("bold")]}>{result.name}{result.credential ? `, ${result.credential}` : ""}</Text><Text style={[styles.resultMeta, { color: colors.mutedForeground }, font("regular")]}>{[result.taxonomy, result.city, result.state].filter(Boolean).join(" • ")}</Text><Text style={[styles.source, { color: colors.mutedForeground }, font("regular")]}>NPI {result.npi} • CMS NPPES</Text></View><Feather name={selected?.npi === result.npi ? "check-circle" : "chevron-right"} size={20} color={colors.primary} /></Pressable>)}</View> : null}

        {selected ? <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderStrong }]}><Text style={[styles.eyebrow, { color: colors.primary }, font("bold")]}>ELITE ACCOUNT BRIEF</Text><Text style={[styles.sectionTitle, { color: colors.foreground }, font("heavy")]}>Prepare for {selected.name}</Text><Text style={[styles.label, { color: colors.foreground }, font("bold")]}>Relationship</Text><View style={styles.stageWrap}>{stages.map((item) => <Pressable key={item.value} onPress={() => setStage(item.value)} style={[styles.stage, { backgroundColor: stage === item.value ? colors.primary : colors.background, borderColor: stage === item.value ? colors.primary : colors.border }]}><Text style={[styles.stageText, { color: stage === item.value ? colors.primaryForeground : colors.foreground }, font("semibold")]}>{item.label}</Text></Pressable>)}</View><Field label="What needs to happen in this meeting?" value={purpose} onChangeText={setPurpose} placeholder="Optional. Use the recommended objective or add your own." colors={colors} multiline /><SpartanButton title="Build account brief" loading={briefLoading} onPress={createBrief} /></View> : null}

        {brief ? <View style={[styles.brief, { backgroundColor: colors.card, borderColor: colors.primary }]}><Text style={[styles.eyebrow, { color: colors.primary }, font("bold")]}>READY FOR THE ROOM</Text><Text style={[styles.sectionTitle, { color: colors.foreground }, font("heavy")]}>{brief.headline}</Text><BriefBlock title="Meeting objective" text={brief.meetingObjective} colors={colors} /><BriefBlock title="How to open" text={brief.opening} colors={colors} /><Text style={[styles.briefLabel, { color: colors.primary }, font("bold")]}>QUESTIONS WORTH ASKING</Text>{brief.discoveryQuestions.map((question, index) => <View key={question} style={styles.question}><View style={[styles.number, { backgroundColor: colors.primary }]}><Text style={[styles.numberText, font("bold")]}>{index + 1}</Text></View><Text style={[styles.briefText, { color: colors.foreground }, font("regular")]}>{question}</Text></View>)}<BriefBlock title="Walk out with this" text={brief.nextMove} colors={colors} strong /><View style={[styles.note, { borderTopColor: colors.border }]}><Feather name="shield" size={16} color={colors.primary} /><Text style={[styles.noteText, { color: colors.mutedForeground }, font("regular")]}>{brief.limitations[0]}</Text></View></View> : null}
      </ScrollView>
    </View>
  );
}

function Field({ label, value, onChangeText, placeholder, colors, multiline = false }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; colors: ReturnType<typeof useColors>; multiline?: boolean }) { return <View style={styles.field}><Text style={[styles.label, { color: colors.foreground }, font("bold")]}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.mutedForeground} multiline={multiline} style={[styles.input, multiline && styles.multiline, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.borderStrong }, font("regular")]} /></View>; }

function BriefBlock({ title, text, colors, strong = false }: { title: string; text: string; colors: ReturnType<typeof useColors>; strong?: boolean }) { return <View style={styles.block}><Text style={[styles.briefLabel, { color: colors.primary }, font("bold")]}>{title.toUpperCase()}</Text><Text style={[styles.briefText, { color: colors.foreground }, font(strong ? "bold" : "regular")]}>{text}</Text></View>; }

const styles = StyleSheet.create({
  screen: { flex: 1 }, content: { paddingHorizontal: 22, gap: 20 }, back: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 44 }, backText: { fontSize: 15 }, kicker: { fontSize: 11, letterSpacing: 2.2, marginTop: 4 }, title: { fontSize: 37, lineHeight: 41, letterSpacing: -1.2, maxWidth: 560 }, subtitle: { fontSize: 17, lineHeight: 25, maxWidth: 620 }, card: { borderWidth: 1, borderRadius: 24, padding: 20, gap: 16 }, policyResult: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 15 }, marketResult: { borderWidth: 1, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }, section: { gap: 10 }, sectionTitle: { fontSize: 23, lineHeight: 29 }, eyebrow: { fontSize: 10, letterSpacing: 2 }, segmentRow: { flexDirection: "row", gap: 10 }, segment: { flex: 1, minHeight: 44, borderWidth: 1, borderRadius: 14, alignItems: "center", justifyContent: "center" }, segmentText: { fontSize: 14, textTransform: "capitalize" }, fieldRow: { flexDirection: "row", gap: 12 }, field: { gap: 8 }, label: { fontSize: 14 }, input: { minHeight: 52, borderWidth: 1, borderRadius: 15, paddingHorizontal: 15, fontSize: 16 }, multiline: { minHeight: 96, paddingTop: 14, textAlignVertical: "top" }, result: { borderWidth: 1, borderRadius: 18, padding: 15, flexDirection: "row", alignItems: "center", gap: 12 }, icon: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center" }, resultTitle: { fontSize: 16, lineHeight: 21 }, resultMeta: { fontSize: 13, lineHeight: 19, marginTop: 3 }, source: { fontSize: 11, marginTop: 5 }, stageWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, stage: { borderWidth: 1, borderRadius: 999, minHeight: 40, paddingHorizontal: 14, alignItems: "center", justifyContent: "center" }, stageText: { fontSize: 13 }, brief: { borderWidth: 1, borderRadius: 24, padding: 20, gap: 18 }, block: { gap: 7 }, briefLabel: { fontSize: 10, letterSpacing: 1.8 }, briefText: { flex: 1, fontSize: 16, lineHeight: 24 }, question: { flexDirection: "row", alignItems: "flex-start", gap: 12 }, number: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" }, numberText: { color: "#FFFFFF", fontSize: 12 }, note: { borderTopWidth: 1, paddingTop: 16, flexDirection: "row", gap: 10 }, noteText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
