import React, { useEffect, useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  DISCOVERY_INTENTS,
  FIELD_KIT_DAILY_TOOL_IDS,
  FIELD_KIT_LEADER_TOOL_IDS,
  FIELD_KIT_TOOLS,
  type FieldKitTool,
} from "@workspace/field-kit-catalog";
import { OfflineQueueBanner } from "@/components/OfflineQueueBanner";
import { PaywallCard } from "@/components/ui/PaywallCard";
import { SpartanButton } from "@/components/ui/SpartanButton";
import { useColors } from "@/hooks/useColors";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { MAX_FONT_SIZE_MULTIPLIER } from "@/lib/iosProductQuality";
import { CATALOG_ID_TO_TAB, isToolTab, openToolHref } from "@/lib/toolDeepLinks";
import { font } from "@/lib/typography";

type SearchHit = {
  id: string;
  type: string;
  title: string;
  snippet: string;
  href: string;
  mobileHref?: string;
};

type SearchResponse = {
  groups: Array<{ type: string; label: string; hits: SearchHit[] }>;
};

const FEATURED_IDS = ["sales-workflow", "objections", "role-play"] as const;
const FEATURED_COPY: Record<(typeof FEATURED_IDS)[number], { eyebrow: string; promise: string; icon: React.ComponentProps<typeof Feather>["name"] }> = {
  "sales-workflow": {
    eyebrow: "RUN THE DAY",
    promise: "Choose the account, prepare the visit, capture the outcome, and lock the next move.",
    icon: "target",
  },
  objections: {
    eyebrow: "HANDLE THE MOMENT",
    promise: "Turn the objection you actually heard into a useful education conversation.",
    icon: "shield",
  },
  "role-play": {
    eyebrow: "REHEARSE THE ASK",
    promise: "Practice the hard part before the room gets busy and the stakes get real.",
    icon: "message-circle",
  },
};

function toolIcon(tool: FieldKitTool): React.ComponentProps<typeof Feather>["name"] {
  const icons: Record<string, React.ComponentProps<typeof Feather>["name"]> = {
    playbooks: "book-open",
    research: "search",
    transcribe: "mic",
    "email-templates": "mail",
    "activity-calculator": "bar-chart-2",
    "rep-cost": "dollar-sign",
    roi: "trending-up",
    branch: "git-branch",
    "cold-call": "phone",
    "weekly-plan": "calendar",
  };
  return icons[tool.id] || "arrow-up-right";
}

export default function ToolsCatalogScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { canUseFieldKit, canUseElite, isAuthenticated } = useAuth();
  const params = useLocalSearchParams<{ tab?: string | string[] }>();
  const [filter, setFilter] = useState("");
  const [remoteGroups, setRemoteGroups] = useState<SearchResponse["groups"]>([]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 24;

  useEffect(() => {
    const raw = params.tab;
    const tab = Array.isArray(raw) ? raw[0] : raw;
    if (isToolTab(tab)) router.replace(openToolHref(tab) as any);
  }, [params.tab]);

  useEffect(() => {
    const q = filter.trim();
    if (!isAuthenticated || q.length < 2) {
      setRemoteGroups([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      void apiGet<SearchResponse>(`/api/v1/search?q=${encodeURIComponent(q)}&limit=12`)
        .then((data) => {
          if (!cancelled) setRemoteGroups(data.groups || []);
        })
        .catch(() => {
          if (!cancelled) setRemoteGroups([]);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [filter, isAuthenticated]);

  const openCatalogTool = (tool: FieldKitTool) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const tab = CATALOG_ID_TO_TAB[tool.id];
    if (tab) {
      router.push(openToolHref(tab) as any);
      return;
    }
    if (tool.mobileRoute && tool.mobileRoute !== "/tool-web" && !tool.mobileToolTab) {
      router.push(tool.mobileRoute as any);
      return;
    }
    router.push({ pathname: "/tool-web", params: { toolId: tool.id, path: tool.path } } as any);
  };

  const openSearchHit = (hit: SearchHit) => {
    const href = hit.mobileHref || hit.href;
    if (href.startsWith("/tool/") || href.startsWith("/(tabs)")) {
      router.push(href as any);
      return;
    }
    if (hit.type === "tool" && hit.id.startsWith("tool:")) {
      const tool = FIELD_KIT_TOOLS.find((item) => item.id === hit.id.replace(/^tool:/, ""));
      if (tool) {
        openCatalogTool(tool);
        return;
      }
    }
    router.push(href as any);
  };

  const q = filter.trim().toLowerCase();
  const matches = (tool: FieldKitTool) =>
    !q ||
    tool.title.toLowerCase().includes(q) ||
    tool.description.toLowerCase().includes(q) ||
    (tool.whenToUse || "").toLowerCase().includes(q);

  const featured = FEATURED_IDS
    .map((id) => FIELD_KIT_TOOLS.find((tool) => tool.id === id))
    .filter((tool): tool is FieldKitTool => Boolean(tool && matches(tool)));

  const dailyIds = useMemo(() => new Set<string>(FIELD_KIT_DAILY_TOOL_IDS), []);
  const leaderIds = useMemo(() => new Set<string>(FIELD_KIT_LEADER_TOOL_IDS), []);
  const fieldTools = FIELD_KIT_TOOLS.filter(
    (tool) => !FEATURED_IDS.includes(tool.id as (typeof FEATURED_IDS)[number]) && dailyIds.has(tool.id) && matches(tool),
  );
  const leaderTools = FIELD_KIT_TOOLS.filter((tool) => leaderIds.has(tool.id) && matches(tool));

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]} testID="screen-tools-catalog">
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <Text style={[styles.kicker, { color: colors.primary }, font("bold")]}>FIELD WORKSPACE</Text>
        <Text style={[styles.title, { color: colors.foreground }, font("heavy")]}>Practice</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }, font("regular")]}>Choose the outcome. Use one tool. Leave with the next move.</Text>
        <View style={[styles.searchShell, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            style={[styles.search, { color: colors.foreground }, font("regular")]}
            placeholder="What do you need to prepare?"
            placeholderTextColor={colors.mutedForeground}
            value={filter}
            onChangeText={setFilter}
            clearButtonMode="while-editing"
            autoCorrect={false}
            returnKeyType="search"
            accessibilityLabel="Search practice tools"
            maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
            testID="tools-filter"
          />
        </View>
      </View>

      <OfflineQueueBanner />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: bottomPad + 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {remoteGroups.length > 0 ? (
          <View style={{ marginBottom: 24 }} testID="universal-search-results">
            <Text style={[styles.sectionEyebrow, { color: colors.primary }, font("bold")]}>SEARCH RESULTS</Text>
            {remoteGroups.flatMap((group) => group.hits).map((hit) => (
              <ActionRow key={hit.id} title={hit.title} subtitle={hit.snippet} icon="search" onPress={() => openSearchHit(hit)} />
            ))}
          </View>
        ) : null}

        {!q ? (
          <>
            <View style={styles.sectionHeading}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionEyebrow, { color: colors.primary }, font("bold")]}>START WITH THE MOMENT</Text>
                <Text style={[styles.sectionTitle, { color: colors.foreground }, font("heavy")]}>What are you walking into?</Text>
              </View>
              <Text style={[styles.step, { color: colors.mutedForeground }, font("semibold")]}>3 clear paths</Text>
            </View>

            {featured.map((tool, index) => {
              const copy = FEATURED_COPY[tool.id as (typeof FEATURED_IDS)[number]];
              return (
                <Pressable
                  key={tool.id}
                  onPress={() => openCatalogTool(tool)}
                  testID={tool.id === "sales-workflow" ? "tools-hero-command" : `tool-row-${tool.id}`}
                  style={({ pressed }) => [
                    styles.featureCard,
                    {
                      backgroundColor: index === 0 ? colors.heroBackground : colors.card,
                      borderColor: index === 0 ? colors.primary : colors.border,
                      opacity: pressed ? 0.92 : 1,
                      transform: [{ scale: pressed ? 0.99 : 1 }],
                    },
                  ]}
                >
                  <View style={[styles.featureIcon, { backgroundColor: index === 0 ? colors.primary : colors.primaryMuted }]}>
                    <Feather name={copy.icon} size={20} color={index === 0 ? colors.primaryForeground : colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardEyebrow, { color: index === 0 ? colors.heroMuted : colors.primary }, font("bold")]}>{copy.eyebrow}</Text>
                    <Text style={[styles.cardTitle, { color: index === 0 ? colors.heroForeground : colors.foreground }, font("heavy")]}>{tool.title}</Text>
                    <Text style={[styles.cardBody, { color: index === 0 ? colors.heroMuted : colors.mutedForeground }, font("regular")]}>{copy.promise}</Text>
                  </View>
                  <Feather name="arrow-up-right" size={21} color={index === 0 ? colors.heroForeground : colors.primary} />
                </Pressable>
              );
            })}

            {!canUseFieldKit ? (
              <View style={{ marginTop: 8, marginBottom: 22 }} testID="tools-paywall">
                <PaywallCard
                  isAuthenticated={isAuthenticated}
                  title="Turn these previews into live fieldwork"
                  body="Standard unlocks live generation, saved work, and continuity across your iPhone and the Spartan Coaching website."
                  primaryLabel="Choose membership"
                  onPrimary={() => router.push("/(tabs)/account")}
                />
              </View>
            ) : null}

            <Text style={[styles.sectionEyebrow, { color: colors.primary, marginTop: 18 }, font("bold")]}>CHOOSE BY OUTCOME</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.intentRail}>
              {DISCOVERY_INTENTS.slice(0, 6).map((intent) => (
                <Pressable
                  key={intent.id}
                  onPress={() => setFilter(intent.title)}
                  style={({ pressed }) => [styles.intentChip, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
                  testID={`intent-${intent.id}`}
                >
                  <Text style={[styles.intentTitle, { color: colors.foreground }, font("bold")]}>{intent.title}</Text>
                  <Text style={[styles.intentBody, { color: colors.mutedForeground }, font("regular")]} numberOfLines={2}>{intent.description}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </>
        ) : null}

        {fieldTools.length > 0 ? (
          <View style={{ marginTop: q ? 0 : 24 }} testID="tools-job-prepare">
            <Text style={[styles.sectionEyebrow, { color: colors.primary }, font("bold")]}>FIELD KIT</Text>
            <Text style={[styles.sectionTitle, { color: colors.foreground }, font("heavy")]}>Build the next move</Text>
            <Text style={[styles.sectionBody, { color: colors.mutedForeground }, font("regular")]}>Focused tools for preparation, follow up, planning, and measurement.</Text>
            {fieldTools.map((tool) => (
              <ActionRow key={tool.id} title={tool.title} subtitle={tool.whenToUse || tool.description} icon={toolIcon(tool)} onPress={() => openCatalogTool(tool)} testID={`tool-row-${tool.id}`} />
            ))}
          </View>
        ) : null}

        {leaderTools.length > 0 ? (
          <View style={{ marginTop: 26 }} testID="tools-leaders">
            <Text style={[styles.sectionEyebrow, { color: colors.primary }, font("bold")]}>LEADERSHIP</Text>
            <Text style={[styles.sectionTitle, { color: colors.foreground }, font("heavy")]}>Coach the system</Text>
            {leaderTools.map((tool) => (
              <ActionRow key={tool.id} title={tool.title} subtitle={tool.whenToUse || tool.description} icon={toolIcon(tool)} onPress={() => openCatalogTool(tool)} />
            ))}
          </View>
        ) : null}

        {!featured.length && !fieldTools.length && !leaderTools.length && remoteGroups.length === 0 ? (
          <View style={[styles.empty, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Feather name="search" size={24} color={colors.primary} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }, font("bold")]}>No match for “{filter}”</Text>
            <Text style={[styles.emptyBody, { color: colors.mutedForeground }, font("regular")]}>Try a job such as objection, visit, email, research, or weekly plan.</Text>
            <SpartanButton title="Clear search" variant="outline" onPress={() => setFilter("")} style={{ alignSelf: "stretch", marginTop: 8 }} />
          </View>
        ) : null}

        <Pressable
          onPress={() => canUseElite ? router.push("/ai-tools" as any) : router.push("/(tabs)/account" as any)}
          style={({ pressed }) => [styles.eliteCard, { backgroundColor: colors.heroBackground, borderColor: colors.borderStrong, opacity: pressed ? 0.92 : 1 }]}
          testID="advanced-ai-tools-library"
        >
          <View style={[styles.eliteBadge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.eliteBadgeText, { color: colors.primaryForeground }, font("bold")]}>ELITE</Text>
          </View>
          <Text style={[styles.eliteTitle, { color: colors.heroForeground }, font("heavy")]}>Advanced field and clinical tools</Text>
          <Text style={[styles.eliteBody, { color: colors.heroMuted }, font("regular")]}>Deidentified clinical education, grounded research, and specialized analysis. All output is suggested guidance and requires the appropriate medical director or compliance approval.</Text>
          <View style={styles.eliteCta}>
            <Text style={[{ color: colors.heroForeground, fontSize: 14 }, font("bold")]}>{canUseElite ? "Open Elite tools" : "Explore Elite"}</Text>
            <Feather name="arrow-right" size={18} color={colors.heroForeground} />
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function ActionRow({ title, subtitle, icon, onPress, testID }: { title: string; subtitle?: string; icon: React.ComponentProps<typeof Feather>["name"]; onPress: () => void; testID?: string }) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
      style={({ pressed }) => [styles.actionRow, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] }]}
    >
      <View style={[styles.actionIcon, { backgroundColor: colors.primaryMuted }]}><Feather name={icon} size={18} color={colors.primary} /></View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.actionTitle, { color: colors.foreground }, font("bold")]}>{title}</Text>
        {subtitle ? <Text style={[styles.actionBody, { color: colors.mutedForeground }, font("regular")]} numberOfLines={2}>{subtitle}</Text> : null}
      </View>
      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  kicker: { fontSize: 10, letterSpacing: 2.2 },
  title: { fontSize: 36, letterSpacing: -1.1, marginTop: 6 },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 5, maxWidth: 340 },
  searchShell: { minHeight: 50, borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10, marginTop: 16 },
  search: { flex: 1, fontSize: 15, minHeight: 48 },
  sectionHeading: { flexDirection: "row", alignItems: "flex-end", gap: 12, marginBottom: 12 },
  sectionEyebrow: { fontSize: 10, letterSpacing: 1.9, marginBottom: 6 },
  sectionTitle: { fontSize: 23, letterSpacing: -0.5, marginBottom: 6 },
  sectionBody: { fontSize: 13, lineHeight: 19, marginBottom: 14 },
  step: { fontSize: 11, marginBottom: 7 },
  featureCard: { borderWidth: 1, borderRadius: 20, padding: 17, flexDirection: "row", alignItems: "flex-start", gap: 13, marginBottom: 11 },
  featureIcon: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  cardEyebrow: { fontSize: 9, letterSpacing: 1.7, marginBottom: 5 },
  cardTitle: { fontSize: 18, letterSpacing: -0.25 },
  cardBody: { fontSize: 13, lineHeight: 18, marginTop: 5 },
  intentRail: { gap: 10, paddingBottom: 3 },
  intentChip: { width: 190, minHeight: 94, borderWidth: 1, borderRadius: 16, padding: 14 },
  intentTitle: { fontSize: 14 },
  intentBody: { fontSize: 12, lineHeight: 17, marginTop: 6 },
  actionRow: { minHeight: 72, borderWidth: StyleSheet.hairlineWidth * 2, borderRadius: 16, padding: 13, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 9 },
  actionIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  actionTitle: { fontSize: 15 },
  actionBody: { fontSize: 12, lineHeight: 17, marginTop: 3 },
  empty: { borderWidth: 1, borderRadius: 20, padding: 22, alignItems: "center", marginTop: 8 },
  emptyTitle: { fontSize: 18, marginTop: 10 },
  emptyBody: { fontSize: 13, lineHeight: 19, textAlign: "center", marginTop: 5 },
  eliteCard: { borderWidth: 1, borderRadius: 22, padding: 20, marginTop: 28 },
  eliteBadge: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, marginBottom: 13 },
  eliteBadgeText: { fontSize: 9, letterSpacing: 1.6 },
  eliteTitle: { fontSize: 21, letterSpacing: -0.4 },
  eliteBody: { fontSize: 13, lineHeight: 20, marginTop: 8 },
  eliteCta: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 16 },
});
