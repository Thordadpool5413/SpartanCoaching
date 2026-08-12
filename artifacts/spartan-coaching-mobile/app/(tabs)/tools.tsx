/**
 * Tools catalog only — tool runs live at /tool/[tab].
 * Deep link: /(tabs)/tools?tab=objection → redirects to /tool/objection
 */
import React, { useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/AuthContext";
import {
  FIELD_KIT_TOOLS,
  FIELD_KIT_DAILY_TOOL_IDS,
  FIELD_KIT_LEADER_TOOL_IDS,
  DISCOVERY_INTENTS,
  PRODUCT_SURFACE_PLACEMENT,
  filterDiscoveryIntents,
  type FieldKitTool,
} from "@workspace/field-kit-catalog";
import { SpartanCard } from "@/components/ui/SpartanCard";
import { SectionKicker } from "@/components/ui/SectionKicker";
import { ListRow } from "@/components/ui/ListRow";
import { font } from "@/lib/typography";
import { CATALOG_ID_TO_TAB, isToolTab, openToolHref } from "@/lib/toolDeepLinks";
import { PaywallCard } from "@/components/ui/PaywallCard";
import { OfflineQueueBanner } from "@/components/OfflineQueueBanner";
import { apiGet } from "@/lib/api";
import { MAX_FONT_SIZE_MULTIPLIER } from "@/lib/iosProductQuality";

type SearchHit = {
  id: string;
  type: string;
  title: string;
  snippet: string;
  href: string;
  mobileHref?: string;
  score: number;
  group: string;
};

type SearchResponse = {
  groups: Array<{ type: string; label: string; hits: SearchHit[] }>;
  total: number;
};

export default function ToolsCatalogScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { canUseFieldKit, isAuthenticated } = useAuth();
  const params = useLocalSearchParams<{ tab?: string | string[] }>();
  const [filter, setFilter] = useState("");
  const [remoteGroups, setRemoteGroups] = useState<SearchResponse["groups"]>([]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 90;

  // Legacy deep link migration: tools?tab=objection → /tool/objection
  useEffect(() => {
    const raw = params.tab;
    const tab = Array.isArray(raw) ? raw[0] : raw;
    if (isToolTab(tab)) {
      router.replace(openToolHref(tab) as any);
    }
  }, [params.tab]);

  // Universal search (HSP-36) — native grouping from shared backend contract
  useEffect(() => {
    const q = filter.trim();
    if (!isAuthenticated || q.length < 2) {
      setRemoteGroups([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      void apiGet<SearchResponse>(
        `/api/v1/search?q=${encodeURIComponent(q)}&limit=20`,
      )
        .then((data) => {
          if (!cancelled) setRemoteGroups(data.groups || []);
        })
        .catch(() => {
          if (!cancelled) setRemoteGroups([]);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [filter, isAuthenticated]);

  const openCatalogTool = (tool: FieldKitTool) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const tab = CATALOG_ID_TO_TAB[tool.id];
    if (tab) {
      router.push(openToolHref(tab) as any);
      return;
    }
    if (tool.mobile === "webview" || tool.mobileRoute === "/tool-web") {
      router.push({
        pathname: "/tool-web",
        params: { toolId: tool.id, path: tool.path },
      } as any);
      return;
    }
    if (tool.mobileRoute && !tool.mobileToolTab) {
      router.push(tool.mobileRoute as any);
      return;
    }
    router.push({
      pathname: "/tool-web",
      params: { toolId: tool.id, path: tool.path },
    } as any);
  };

  const q = filter.trim().toLowerCase();
  const matches = (t: FieldKitTool) =>
    !q ||
    t.title.toLowerCase().includes(q) ||
    t.description.toLowerCase().includes(q) ||
    (t.whenToUse || "").toLowerCase().includes(q);

  const command = FIELD_KIT_TOOLS.find((t) => t.id === "sales-workflow");
  // Shared with web Tools page (FIELD_KIT_*_TOOL_IDS). Command is pinned above.
  const dailyIdSet = new Set<string>(
    FIELD_KIT_DAILY_TOOL_IDS.filter((id) => id !== "sales-workflow"),
  );
  const leaderIdSet = new Set<string>([...FIELD_KIT_LEADER_TOOL_IDS]);
  const daily = FIELD_KIT_TOOLS.filter((t) => dailyIdSet.has(t.id) && matches(t));
  const leaders = FIELD_KIT_TOOLS.filter((t) => leaderIdSet.has(t.id) && matches(t));
  const rest = FIELD_KIT_TOOLS.filter(
    (t) =>
      t.id !== "sales-workflow" &&
      !dailyIdSet.has(t.id) &&
      !leaderIdSet.has(t.id) &&
      t.category !== "Learn" &&
      matches(t),
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="screen-tools-catalog">
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 12,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.foreground }, font("heavy")]}>
          What do you need?
        </Text>
        <Text style={[{ color: colors.mutedForeground, fontSize: 13, marginTop: 4 }, font("regular")]}>
          {canUseFieldKit
            ? "Start with intent · tools & field resources"
            : "Preview free · live tools with subscription"}
        </Text>
        <TextInput
          style={[
            styles.search,
            {
              color: colors.foreground,
              backgroundColor: colors.card,
              borderColor: colors.border,
              marginTop: 12,
            },
          ]}
          placeholder="Search tools, resources, method…"
          placeholderTextColor={colors.mutedForeground}
          value={filter}
          onChangeText={setFilter}
          clearButtonMode="while-editing"
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          accessibilityLabel="Universal search"
          maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
          testID="tools-filter"
        />
      </View>

      {!canUseFieldKit && (
        <View style={{ marginHorizontal: 16, marginTop: 12 }} testID="tools-paywall">
          <PaywallCard
            isAuthenticated={isAuthenticated}
            body="Unlock live generation. Browse the map free."
          />
        </View>
      )}

      <OfflineQueueBanner />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomPad + 24, paddingTop: 12 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {remoteGroups.length > 0 ? (
          <View testID="universal-search-results" style={{ marginBottom: 16 }}>
            <SectionKicker>Search results</SectionKicker>
            {remoteGroups.map((group) => (
              <View key={group.type} style={{ marginBottom: 12 }}>
                <Text
                  style={[styles.sectionLabel, { color: colors.primary }, font("bold")]}
                  maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                >
                  {group.label.toUpperCase()}
                </Text>
                {group.hits.map((hit) => (
                  <ListRow
                    key={hit.id}
                    title={hit.title}
                    subtitle={hit.snippet}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      const href = hit.mobileHref || hit.href;
                      if (href.startsWith("/tool/")) {
                        router.push(href as any);
                      } else if (href.startsWith("/(tabs)")) {
                        router.push(href as any);
                      } else if (hit.type === "tool" && hit.id.startsWith("tool:")) {
                        const toolId = hit.id.replace(/^tool:/, "");
                        const tool = FIELD_KIT_TOOLS.find((t) => t.id === toolId);
                        if (tool) openCatalogTool(tool);
                        else router.push(href as any);
                      } else {
                        router.push(href as any);
                      }
                    }}
                    testID={`search-hit-${hit.id.replace(/[^a-z0-9]+/gi, "-")}`}
                  />
                ))}
              </View>
            ))}
          </View>
        ) : null}

        <SectionKicker>Hospice Sales Pro · intent map</SectionKicker>

        {filterDiscoveryIntents(filter).map((intent) => (
          <View key={intent.id} style={{ marginBottom: 14 }} testID={`intent-${intent.id}`}>
            <Text style={[styles.sectionLabel, { color: colors.primary }, font("bold")]}>
              {intent.title.toUpperCase()}
            </Text>
            <Text
              style={[
                { color: colors.mutedForeground, fontSize: 12, marginBottom: 6, lineHeight: 17 },
                font("regular"),
              ]}
            >
              {intent.description}
            </Text>
            {intent.destinations.slice(0, 5).map((d) => (
              <ListRow
                key={`${intent.id}-${d.id}-${d.webPath}`}
                title={d.label}
                subtitle={
                  d.surface === "field_resources"
                    ? "Field resource"
                    : d.surface === "learn"
                      ? "Learn"
                      : d.surface === "command"
                        ? "Command Center"
                        : "Tool"
                }
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  if (d.kind === "tool" || d.kind === "command") {
                    const tool = FIELD_KIT_TOOLS.find((t) => t.id === d.id);
                    if (tool) {
                      openCatalogTool(tool);
                      return;
                    }
                  }
                  if (d.surface === "field_resources" || d.kind === "resource") {
                    router.push({
                      pathname: "/tool-web",
                      params: { toolId: d.id, path: d.webPath },
                    } as any);
                    return;
                  }
                  if (d.surface === "learn" || d.kind === "learn") {
                    router.push("/(tabs)/learn" as any);
                    return;
                  }
                  router.push({
                    pathname: "/tool-web",
                    params: { toolId: d.id, path: d.webPath },
                  } as any);
                }}
                testID={`intent-dest-${intent.id}-${d.id}`}
              />
            ))}
          </View>
        ))}

        <ListRow
          title={PRODUCT_SURFACE_PLACEMENT.field_resources.label}
          subtitle={PRODUCT_SURFACE_PLACEMENT.field_resources.meaning}
          icon="folder"
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/(tabs)/learn" as any);
          }}
          testID="tools-link-field-resources"
        />

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 8 }, font("bold")]}>
          OR BROWSE TOOLS
        </Text>

        {command && matches(command) && (
          <Pressable
            onPress={() => openCatalogTool(command)}
            style={{ marginTop: 10, marginBottom: 16 }}
            testID="tools-hero-command"
          >
            <SpartanCard variant="emphasis">
              <SectionKicker>Daily operating system</SectionKicker>
              <Text style={[{ color: colors.foreground, fontSize: 20, marginTop: 8 }, font("heavy")]}>
                {command.title}
              </Text>
              <Text
                style={[{ color: colors.mutedForeground, fontSize: 13, marginTop: 6, lineHeight: 19 }, font("regular")]}
              >
                {command.description}
              </Text>
              <Text style={[{ color: colors.primary, marginTop: 12 }, font("bold")]}>
                Open Command Center →
              </Text>
            </SpartanCard>
          </Pressable>
        )}

        {daily.length > 0 && (
          <View style={{ marginBottom: 12 }} testID="tools-daily">
            <Text style={[styles.sectionLabel, { color: colors.primary }, font("bold")]}>PRACTICE & PREPARE</Text>
            {daily.map((t) => (
              <ListRow
                key={t.id}
                title={t.title}
                subtitle={t.whenToUse || t.description}
                onPress={() => openCatalogTool(t)}
                testID={`tool-row-${t.id}`}
              />
            ))}
          </View>
        )}

        {leaders.length > 0 && (
          <View style={{ marginBottom: 12 }} testID="tools-leaders">
            <Text style={[styles.sectionLabel, { color: colors.primary }, font("bold")]}>
              FOR DIRECTORS & LEADERS
            </Text>
            {leaders.map((t) => (
              <ListRow
                key={t.id}
                title={t.title}
                subtitle={t.whenToUse || t.description}
                onPress={() => openCatalogTool(t)}
              />
            ))}
          </View>
        )}

        {rest.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            <Text style={[styles.sectionLabel, { color: colors.primary }, font("bold")]}>MORE IN THE KIT</Text>
            {rest.map((t) => (
              <ListRow
                key={t.id}
                title={t.title}
                subtitle={
                  t.mobile === "webview"
                    ? `${t.whenToUse || t.description} · Web tool`
                    : t.whenToUse || t.description
                }
                onPress={() => openCatalogTool(t)}
              />
            ))}
          </View>
        )}

        {!daily.length && !leaders.length && !rest.length && !matches(command!) && (
          <Text style={[{ color: colors.mutedForeground, marginTop: 24, textAlign: "center" }, font("regular")]}>
            No tools match “{filter}”
          </Text>
        )}

        <ListRow
          title="Advanced library"
          subtitle="Field AI + clinical vault · authorized tools only"
          icon="cpu"
          onPress={() => router.push("/ai-tools" as any)}
          testID="advanced-ai-tools-library"
        />
        <Text
          style={[
            {
              color: colors.mutedForeground,
              fontSize: 11,
              lineHeight: 16,
              marginTop: 4,
              marginBottom: 8,
              textAlign: "center",
            },
            font("regular"),
          ]}
        >
          Daily tools are native. Some specialty tools open as Web tools (same site, session secured).
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 30, letterSpacing: -0.5, marginTop: 4 },
  search: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 44,
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 1.4,
    marginBottom: 8,
    marginTop: 4,
  },
});
