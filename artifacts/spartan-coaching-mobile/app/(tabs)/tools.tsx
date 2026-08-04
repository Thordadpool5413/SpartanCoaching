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
import { FIELD_KIT_TOOLS, type FieldKitTool } from "@workspace/field-kit-catalog";
import { SpartanCard } from "@/components/ui/SpartanCard";
import { SectionKicker } from "@/components/ui/SectionKicker";
import { ListRow } from "@/components/ui/ListRow";
import { font } from "@/lib/typography";
import { CATALOG_ID_TO_TAB, isToolTab, openToolHref } from "@/lib/toolDeepLinks";
import { PaywallCard } from "@/components/ui/PaywallCard";

export default function ToolsCatalogScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { canUseFieldKit, isAuthenticated } = useAuth();
  const params = useLocalSearchParams<{ tab?: string | string[] }>();
  const [filter, setFilter] = useState("");

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
  const dailyIds = ["objections", "playbooks", "role-play", "weekly-plan", "cold-call", "email-templates"];
  const leaderIds = ["activity-calculator", "roi", "rep-cost", "branch"];
  const daily = FIELD_KIT_TOOLS.filter((t) => dailyIds.includes(t.id) && matches(t));
  const leaders = FIELD_KIT_TOOLS.filter((t) => leaderIds.includes(t.id) && matches(t));
  const rest = FIELD_KIT_TOOLS.filter(
    (t) =>
      t.id !== "sales-workflow" &&
      !dailyIds.includes(t.id) &&
      !leaderIds.includes(t.id) &&
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
        <Text style={[styles.headerTitle, { color: colors.foreground }, font("heavy")]}>Tools</Text>
        <Text style={[{ color: colors.mutedForeground, fontSize: 13, marginTop: 4 }, font("regular")]}>
          {canUseFieldKit
            ? "Command Center first · satellites below"
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
          placeholder="Filter tools…"
          placeholderTextColor={colors.mutedForeground}
          value={filter}
          onChangeText={setFilter}
          clearButtonMode="while-editing"
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

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomPad + 24, paddingTop: 12 }}
        showsVerticalScrollIndicator={false}
      >
        <SectionKicker>Hospice Sales Pro · map</SectionKicker>

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
