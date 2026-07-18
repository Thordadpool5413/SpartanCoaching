import { router } from "expo-router";
import { Text, View } from "react-native";

import { Card, MetricCard, Pill, PressableCard, ScreenScrollView, SectionHeader } from "@/components/ui";
import { ROLEPLAY_SCENARIOS } from "@/lib/catalog";
import { formatCompactNumber } from "@/lib/format";
import { ActivityItem, FavoriteItem, STORAGE_KEYS, useStoredJson } from "@/lib/storage";
import { colors, spacing } from "@/lib/theme";

const toolCards = [
  { title: "Daily Drill", subtitle: "Capture a live rep and log completion", href: "/drills", tone: "accent" as const },
  { title: "Role Play", subtitle: "Practice a live scenario with feedback", href: "/roleplay", tone: "good" as const },
  { title: "Assessment", subtitle: "Resume or start the candidate flow", href: "/assessment/default", tone: "warning" as const },
];

const calculatorCards = [
  { title: "ROI Calculator", subtitle: "Model revenue upside from coaching", href: "/calculators/roi" },
  { title: "Activity Calculator", subtitle: "Turn an admissions goal into a cadence", href: "/calculators/activity" },
  { title: "Branch Profitability", subtitle: "Run the full operating model", href: "/calculators/branch-profitability" },
];

const aiTools = [
  { title: "Playbooks", subtitle: "Scenario playbooks for the field", href: "/tools/playbooks" },
  { title: "Objections", subtitle: "Quick objection responses", href: "/tools/objections" },
  { title: "Research", subtitle: "Grounded research on a question", href: "/tools/research" },
  { title: "Cold Call Script", subtitle: "Generate a tight opener", href: "/tools/cold-call-script" },
  { title: "Email Templates", subtitle: "Follow-up, thank-you, or value-add", href: "/tools/email-templates" },
  { title: "Weekly Plan", subtitle: "Build the week's field cadence", href: "/tools/weekly-plan-builder" },
  { title: "Transcript Analysis", subtitle: "Coach a call transcript", href: "/tools/transcribe" },
];

export default function PracticeScreen() {
  const [activities] = useStoredJson<ActivityItem[]>(STORAGE_KEYS.activity, []);
  const [favorites] = useStoredJson<FavoriteItem[]>(STORAGE_KEYS.favorites, []);
  const [streak] = useStoredJson(STORAGE_KEYS.streak, {
    current: 0,
    best: 0,
    lastSeen: "",
    totalSessions: 0,
  });

  return (
    <ScreenScrollView contentContainerStyle={{ gap: spacing.lg }}>
      <View style={{ gap: 10, paddingTop: 8 }}>
        <Pill tone="good">Practice hub</Pill>
        <Text style={{ color: colors.text, fontSize: 30, lineHeight: 34, fontWeight: "900" }}>
          Build skill the same way you build momentum.
        </Text>
        <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 22 }}>
          Daily drills, role play, calculators, and AI tools live here. Everything is available without a login gate in beta.
        </Text>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
        <MetricCard label="Streak" value={`${streak.current}`} tone="accent" caption="Days in a row" />
        <MetricCard label="Favorites" value={formatCompactNumber(favorites.length)} tone="good" caption="Saved for quick access" />
        <MetricCard label="Recent" value={formatCompactNumber(activities.length)} tone="warning" caption="Actions in storage" />
        <MetricCard label="Tools" value={formatCompactNumber(aiTools.length + calculatorCards.length)} tone="neutral" caption="Quick-launch workflows" />
      </View>

      <Card>
        <SectionHeader title="Core practice" subtitle="The main workflows the field actually uses." />
        <View style={{ gap: spacing.sm }}>
          {toolCards.map((card) => (
            <PressableCard
              key={card.href}
              onPress={() => router.push(card.href)}
              style={{ borderLeftWidth: 4, borderLeftColor: colors[card.tone] }}
            >
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: "800" }}>{card.title}</Text>
              <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 4 }}>{card.subtitle}</Text>
            </PressableCard>
          ))}
        </View>
      </Card>

      <Card>
        <SectionHeader title="Calculators" subtitle="Fast math that helps reps and leaders make better calls." />
        <View style={{ gap: spacing.sm }}>
          {calculatorCards.map((card) => (
            <PressableCard key={card.href} onPress={() => router.push(card.href)}>
              <Text style={{ color: colors.text, fontSize: 15, fontWeight: "800" }}>{card.title}</Text>
              <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 4 }}>{card.subtitle}</Text>
            </PressableCard>
          ))}
        </View>
      </Card>

      <Card>
        <SectionHeader title="AI tools" subtitle="Prompt-driven workflows that already exist on the backend." />
        <View style={{ gap: spacing.sm }}>
          {aiTools.map((tool) => (
            <PressableCard key={tool.href} onPress={() => router.push(tool.href)}>
              <Text style={{ color: colors.text, fontSize: 15, fontWeight: "800" }}>{tool.title}</Text>
              <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 4 }}>{tool.subtitle}</Text>
            </PressableCard>
          ))}
        </View>
      </Card>

      <Card>
        <SectionHeader title="Role play scenarios" subtitle="A few baked-in situations for field reps and leaders." />
        <View style={{ gap: spacing.sm }}>
          {ROLEPLAY_SCENARIOS.map((scenario) => (
            <PressableCard key={scenario.id} onPress={() => router.push("/roleplay")} style={{ gap: 6 }}>
              <Text style={{ color: colors.text, fontSize: 15, fontWeight: "800" }}>{scenario.title}</Text>
              <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 17 }}>{scenario.subtitle}</Text>
            </PressableCard>
          ))}
        </View>
      </Card>
    </ScreenScrollView>
  );
}
