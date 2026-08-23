import React, { useEffect, useState } from "react";
import {
  Alert,
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
  FIELD_KIT_CATEGORIES,
  FIELD_KIT_TOOLS,
  type FieldKitCategory,
  type FieldKitTool,
} from "@workspace/field-kit-catalog";
import { OfflineQueueBanner } from "@/components/OfflineQueueBanner";
import { SpartanButton } from "@/components/ui/SpartanButton";
import { useColors } from "@/hooks/useColors";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { MAX_FONT_SIZE_MULTIPLIER } from "@/lib/iosProductQuality";
import { CATALOG_ID_TO_TAB, isToolTab, openToolHref } from "@/lib/toolDeepLinks";
import { font } from "@/lib/typography";
import LearnScreen from "./learn";

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

const NATIVE_SEARCH_DESTINATIONS: Record<string, string> = {
  "/portal": "/(tabs)",
  "/": "/(tabs)",
  "/tools": "/(tabs)/tools",
  "/learn": "/(tabs)/tools?view=library",
  "/library": "/(tabs)/tools?view=library",
  "/coach": "/(tabs)/coach",
  "/contact": "/(tabs)/contact",
  "/account": "/(tabs)/account",
};

function toolIcon(tool: FieldKitTool): React.ComponentProps<typeof Feather>["name"] {
  const icons: Record<string, React.ComponentProps<typeof Feather>["name"]> = {
    "sales-workflow": "target",
    playbooks: "book-open",
    objections: "message-circle",
    "role-play": "users",
    research: "search",
    transcribe: "mic",
    "email-templates": "mail",
    "activity-calculator": "bar-chart-2",
    "rep-cost": "dollar-sign",
    roi: "trending-up",
    branch: "git-branch",
    "cold-call": "phone",
    "weekly-plan": "calendar",
    "brand-video": "video",
  };
  return icons[tool.id] || "arrow-up-right";
}

function mobileToolTitle(tool: FieldKitTool) {
  return tool.title;
}

export default function ExploreScreen() {
  const params = useLocalSearchParams<{ view?: string | string[] }>();
  const rawView = params.view;
  const view = Array.isArray(rawView) ? rawView[0] : rawView;
  if (view === "library") return <LearnScreen />;
  return <ToolsCatalogScreen />;
}

function ToolsCatalogScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { canUseFieldKit, canUseElite, isAuthenticated } = useAuth();
  const params = useLocalSearchParams<{ tab?: string | string[]; category?: string | string[] }>();
  const [filter, setFilter] = useState("");
  const [category, setCategory] = useState<"All" | FieldKitCategory>(() => {
    const requested = Array.isArray(params.category) ? params.category[0] : params.category;
    return FIELD_KIT_CATEGORIES.includes(requested as FieldKitCategory) ? requested as FieldKitCategory : "All";
  });
  const [remoteGroups, setRemoteGroups] = useState<SearchResponse["groups"]>([]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 24;

  useEffect(() => {
    const raw = params.tab;
    const tab = Array.isArray(raw) ? raw[0] : raw;
    if (isToolTab(tab)) router.replace(openToolHref(tab) as any);
  }, [params.tab]);

  useEffect(() => {
    const requested = Array.isArray(params.category) ? params.category[0] : params.category;
    if (FIELD_KIT_CATEGORIES.includes(requested as FieldKitCategory)) {
      setCategory(requested as FieldKitCategory);
    }
  }, [params.category]);

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
    if (tool.mobileRoute && !tool.mobileToolTab) {
      router.push(tool.mobileRoute as any);
      return;
    }
    Alert.alert("Tool could not open", "Return to Explore and try again. If this continues, send a support request from Account.");
  };

  const accessLabel = (tool: FieldKitTool) => {
    if ((tool as FieldKitTool & { membership?: "standard" | "elite" }).membership === "elite") return canUseElite ? "INCLUDED" : "ELITE";
    return canUseFieldKit ? "INCLUDED" : "STANDARD";
  };

  const openSearchHit = (hit: SearchHit) => {
    if (hit.mobileHref && (hit.mobileHref.startsWith("/tool/") || hit.mobileHref.startsWith("/(tabs)") || hit.mobileHref.startsWith("/ai-tools/"))) {
      router.push(hit.mobileHref as any);
      return;
    }
    if (hit.type === "tool" && hit.id.startsWith("tool:")) {
      const tool = FIELD_KIT_TOOLS.find((item) => item.id === hit.id.replace(/^tool:/, ""));
      if (tool) {
        openCatalogTool(tool);
        return;
      }
    }
    if (hit.type === "resource") {
      router.push("/(tabs)/tools?view=library" as any);
      return;
    }
    const native = NATIVE_SEARCH_DESTINATIONS[hit.href];
    if (native) {
      router.push(native as any);
      return;
    }
    Alert.alert("Result could not open", "Use Explore to find the native version. If it is missing, send a support request from Account.");
  };

  const q = filter.trim().toLowerCase();
  const matches = (tool: FieldKitTool) =>
    (category === "All" || tool.category === category) && (
      !q ||
      tool.title.toLowerCase().includes(q) ||
      tool.description.toLowerCase().includes(q) ||
       (tool.whenToUse || "").toLowerCase().includes(q) ||
       (tool.scenario || "").toLowerCase().includes(q) ||
       (tool.outcome || "").toLowerCase().includes(q)
    );

  const visibleTools = FIELD_KIT_TOOLS.filter(matches);
  const toolGroups = FIELD_KIT_CATEGORIES.map((group) => ({
    category: group,
    tools: visibleTools.filter((tool) => tool.category === group),
  })).filter((group) => group.tools.length > 0);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]} testID="screen-explore">
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <Text style={[styles.kicker, { color: colors.primary }, font("bold")]}>EVERYTHING IN ONE PLACE</Text>
        <Text style={[styles.title, { color: colors.foreground }, font("heavy")]}>Explore</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }, font("regular")]}>All {FIELD_KIT_TOOLS.length} field tools, the complete Library, private Coach, and saved work. Nothing important is buried.</Text>
        <View style={[styles.searchShell, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            style={[styles.search, { color: colors.foreground }, font("regular")]}
            placeholder="What do you need to accomplish?"
            placeholderTextColor={colors.mutedForeground}
            value={filter}
            onChangeText={setFilter}
            clearButtonMode="while-editing"
            autoCorrect={false}
            returnKeyType="search"
            accessibilityLabel="Search tools"
            maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
            testID="tools-filter"
          />
        </View>
      </View>

      <OfflineQueueBanner />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 24, paddingBottom: bottomPad + 36 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {!q ? (
          <>
            <View style={styles.destinationGrid} testID="explore-destinations">
            <ExploreDestination icon="book-open" title="Library" body="Read, listen, and use field resources inside the app." onPress={() => router.push("/(tabs)/tools?view=library" as any)} />
            <ExploreDestination icon="check-circle" title="My Work" body="Resume eligible saved work and review what is ready for your next move." onPress={() => router.push("/(tabs)/my-work" as any)} />
            <ExploreDestination icon="layers" title="Access map" body="See what Standard and Elite include." onPress={() => router.push("/access" as any)} />
            <ExploreDestination icon="compass" title="Guided tour" body="Walk through preparation, practice, Coach feedback, and follow through." onPress={() => router.push("/tour" as any)} />
            </View>
            <View style={[styles.boundaryNote, { backgroundColor: colors.card, borderColor: colors.borderStrong }]} testID="tool-directory-safety-note">
              <Feather name="shield" size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.boundaryTitle, { color: colors.foreground }, font("bold")]}>Use deidentified field context only</Text>
                <Text style={[styles.boundaryBody, { color: colors.mutedForeground }, font("regular")]}>Never enter patient identifiers or PHI. Saved-work availability is tool-specific; clinical/vault content and Command Center continuity stay out of device cache and shared saved work.</Text>
              </View>
            </View>
          </>
        ) : null}

        {remoteGroups.length > 0 ? (
          <View style={{ marginBottom: 24 }} testID="universal-search-results">
            <Text style={[styles.sectionEyebrow, { color: colors.primary }, font("bold")]}>SEARCH RESULTS</Text>
            {remoteGroups.flatMap((group) => group.hits).map((hit) => (
              <ActionRow key={hit.id} title={hit.title} subtitle={hit.snippet} icon="search" onPress={() => openSearchHit(hit)} />
            ))}
          </View>
        ) : null}

        <View style={{ marginTop: q ? 0 : 20 }} testID="complete-tool-directory">
          <View style={styles.directoryHeading}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionEyebrow, { color: colors.primary }, font("bold")]}>COMPLETE TOOL DIRECTORY</Text>
              <Text style={[styles.sectionTitle, { color: colors.foreground }, font("heavy")]}>{category === "All" ? `All ${FIELD_KIT_TOOLS.length} tools` : `${category} tools`}</Text>
              <Text style={[styles.sectionBody, { color: colors.mutedForeground }, font("regular")]}>Every tool is visible here. Choose a job, understand when to use it, and open the native iPhone experience.</Text>
            </View>
            <View style={[styles.countBadge, { backgroundColor: colors.primary }]}><Text style={[styles.countNumber, font("heavy")]}>{visibleTools.length}</Text><Text style={[styles.countLabel, font("bold")]}>VISIBLE</Text></View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRail}>
            {(["All", ...FIELD_KIT_CATEGORIES] as const).map((item) => {
              const active = category === item;
              return <Pressable key={item} accessibilityRole="radio" accessibilityState={{ checked: active }} onPress={() => setCategory(item)} style={[styles.categoryChip, { backgroundColor: active ? colors.primary : colors.card, borderColor: active ? colors.primary : colors.borderStrong }]}><Text style={[styles.categoryLabel, { color: active ? "#FFFFFF" : colors.foreground }, font(active ? "bold" : "semibold")]}>{item}</Text></Pressable>;
            })}
          </ScrollView>
          {toolGroups.map((group) => (
            <View key={group.category} style={styles.toolGroup} testID={`tool-category-${group.category.toLowerCase()}`}>
              <View style={styles.groupTitleRow}><Text style={[styles.groupTitle, { color: colors.foreground }, font("heavy")]}>{group.category}</Text><Text style={[styles.groupCount, { color: colors.mutedForeground }, font("semibold")]}>{group.tools.length} {group.tools.length === 1 ? "tool" : "tools"}</Text></View>
              {group.tools.map((tool) => <ActionRow key={tool.id} title={mobileToolTitle(tool)} subtitle={tool.outcome || tool.whenToUse || tool.description} icon={toolIcon(tool)} badge={accessLabel(tool)} onPress={() => openCatalogTool(tool)} testID={`tool-row-${tool.id}`} />)}
            </View>
          ))}
        </View>

        {!visibleTools.length && remoteGroups.length === 0 ? (
          <View style={[styles.empty, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Feather name="search" size={24} color={colors.primary} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }, font("bold")]}>No match for “{filter}”</Text>
            <Text style={[styles.emptyBody, { color: colors.mutedForeground }, font("regular")]}>Try a job such as objection, visit, email, research, or weekly plan.</Text>
            <SpartanButton title="Clear search" variant="outline" onPress={() => setFilter("")} style={{ alignSelf: "stretch", marginTop: 8 }} />
          </View>
        ) : null}

        <Pressable
          onPress={() => canUseElite ? router.push("/ai-tools" as any) : router.push("/membership" as any)}
          style={({ pressed }) => [styles.eliteCard, { backgroundColor: colors.heroBackground, borderColor: colors.borderStrong, opacity: pressed ? 0.92 : 1 }]}
          testID="advanced-ai-tools-library"
        >
          <View style={[styles.eliteBadge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.eliteBadgeText, { color: colors.primaryForeground }, font("bold")]}>ELITE</Text>
          </View>
          <Text style={[styles.eliteTitle, { color: colors.heroForeground }, font("heavy")]}>Advanced field and clinical tools</Text>
          <Text style={[styles.eliteBody, { color: colors.heroMuted }, font("regular")]}>Deidentified clinical education, grounded research, and specialized analysis. Clinical outputs use saved jurisdiction context and still require the appropriate medical director or compliance approval.</Text>
          <View style={styles.eliteCta}>
            <Text style={[{ color: colors.heroForeground, fontSize: 14 }, font("bold")]}>{canUseElite ? "Open Elite tools" : "Explore Elite"}</Text>
            <Feather name="arrow-right" size={18} color={colors.heroForeground} />
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function ExploreDestination({ icon, title, body, onPress }: { icon: React.ComponentProps<typeof Feather>["name"]; title: string; body: string; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.destinationCard, { backgroundColor: colors.card, borderColor: colors.borderStrong, opacity: pressed ? 0.7 : 1 }]}>
      <View style={[styles.destinationIcon, { backgroundColor: colors.primaryMuted }]}><Feather name={icon} size={19} color={colors.primary} /></View>
      <View style={styles.destinationCopy}>
        <Text style={[styles.destinationTitle, { color: colors.foreground }, font("bold")]}>{title}</Text>
        <Text style={[styles.destinationBody, { color: colors.mutedForeground }, font("regular")]}>{body}</Text>
      </View>
      <Feather name="chevron-right" size={19} color={colors.primary} />
    </Pressable>
  );
}

function ActionRow({ title, subtitle, icon, badge, onPress, testID }: { title: string; subtitle?: string; icon: React.ComponentProps<typeof Feather>["name"]; badge?: string; onPress: () => void; testID?: string }) {
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
        <View style={styles.actionTitleRow}>
          <Text style={[styles.actionTitle, { color: colors.foreground }, font("bold")]}>{title}</Text>
          {badge ? <Text style={[styles.rowBadge, { color: colors.primary, backgroundColor: colors.primaryMuted }, font("bold")]}>{badge}</Text> : null}
        </View>
        {subtitle ? <Text style={[styles.actionBody, { color: colors.mutedForeground }, font("regular")]} numberOfLines={2}>{subtitle}</Text> : null}
      </View>
      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 22, paddingBottom: 20, borderBottomWidth: StyleSheet.hairlineWidth },
  kicker: { fontSize: 10, letterSpacing: 2.2 },
  title: { fontSize: 36, letterSpacing: -1.1, marginTop: 6 },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 5, maxWidth: 340 },
  searchShell: { minHeight: 50, borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10, marginTop: 16 },
  search: { flex: 1, fontSize: 15, minHeight: 48 },
  destinationGrid: { gap: 14, marginBottom: 36 },
  boundaryNote: { borderWidth: 1, borderRadius: 18, padding: 15, flexDirection: "row", alignItems: "flex-start", gap: 11, marginTop: -20, marginBottom: 28 },
  boundaryTitle: { fontSize: 13 },
  boundaryBody: { fontSize: 11, lineHeight: 16, marginTop: 3 },
  destinationCard: { minHeight: 104, flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 1, borderRadius: 20, borderCurve: "continuous", paddingHorizontal: 17, paddingVertical: 16 },
  destinationIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  destinationCopy: { flex: 1 },
  destinationTitle: { fontSize: 15 },
  destinationBody: { fontSize: 12, lineHeight: 17, marginTop: 3 },
  directoryHeading: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  countBadge: { width: 60, height: 60, borderRadius: 20, borderCurve: "continuous", alignItems: "center", justifyContent: "center" },
  countNumber: { color: "#FFFFFF", fontSize: 21, lineHeight: 23 },
  countLabel: { color: "rgba(255,255,255,0.78)", fontSize: 7, letterSpacing: 1.1 },
  categoryRail: { gap: 8, paddingVertical: 6, paddingRight: 12, marginBottom: 12 },
  categoryChip: { minHeight: 42, justifyContent: "center", borderWidth: 1, borderRadius: 999, paddingHorizontal: 16 },
  categoryLabel: { fontSize: 12 },
  toolGroup: { marginTop: 32 },
  groupTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  groupTitle: { fontSize: 20, letterSpacing: -0.3 },
  groupCount: { fontSize: 10 },
  sectionHeading: { flexDirection: "row", alignItems: "flex-end", gap: 12, marginBottom: 12 },
  sectionEyebrow: { fontSize: 10, letterSpacing: 1.9, marginBottom: 6 },
  sectionTitle: { fontSize: 23, letterSpacing: -0.5, marginBottom: 6 },
  sectionBody: { fontSize: 13, lineHeight: 19, marginBottom: 14 },
  step: { fontSize: 11, marginBottom: 7 },
  featureCard: { borderWidth: 1, borderRadius: 20, padding: 17, flexDirection: "row", alignItems: "flex-start", gap: 13, marginBottom: 11 },
  featureIcon: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  cardEyebrow: { fontSize: 9, letterSpacing: 1.7, marginBottom: 5 },
  cardMetaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  accessBadge: { fontSize: 8, letterSpacing: 1, borderWidth: StyleSheet.hairlineWidth, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 3, overflow: "hidden" },
  cardTitle: { fontSize: 18, letterSpacing: -0.25 },
  cardBody: { fontSize: 13, lineHeight: 18, marginTop: 5 },
  intentRail: { gap: 10, paddingBottom: 3 },
  intentChip: { width: 190, minHeight: 94, borderWidth: 1, borderRadius: 16, padding: 14 },
  intentTitle: { fontSize: 14 },
  intentBody: { fontSize: 12, lineHeight: 17, marginTop: 6 },
  actionRow: { minHeight: 88, borderWidth: StyleSheet.hairlineWidth * 2, borderRadius: 18, borderCurve: "continuous", padding: 16, flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 12 },
  actionIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  actionTitle: { fontSize: 15 },
  actionTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  rowBadge: { fontSize: 8, letterSpacing: 0.8, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 999, overflow: "hidden" },
  actionBody: { fontSize: 12, lineHeight: 17, marginTop: 3 },
  empty: { borderWidth: 1, borderRadius: 20, padding: 22, alignItems: "center", marginTop: 8 },
  emptyTitle: { fontSize: 18, marginTop: 10 },
  emptyBody: { fontSize: 13, lineHeight: 19, textAlign: "center", marginTop: 5 },
  eliteCard: { borderWidth: 1, borderRadius: 24, borderCurve: "continuous", padding: 22, marginTop: 38 },
  eliteBadge: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, marginBottom: 13 },
  eliteBadgeText: { fontSize: 9, letterSpacing: 1.6 },
  eliteTitle: { fontSize: 21, letterSpacing: -0.4 },
  eliteBody: { fontSize: 13, lineHeight: 20, marginTop: 8 },
  eliteCta: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 16 },
});
