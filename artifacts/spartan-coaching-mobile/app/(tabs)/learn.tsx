import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EmptyState } from "@/components/ui/EmptyState";
import { SpartanButton } from "@/components/ui/SpartanButton";
import { useColors } from "@/hooks/useColors";
import { apiGet, getWebSiteUrl } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { groupResources, type ResourceLike } from "@/lib/resourceGroups";
import { openToolHref } from "@/lib/toolDeepLinks";
import { font } from "@/lib/typography";

type LearnTab = "articles" | "podcasts" | "resources";

type Article = {
  id: number;
  title: string;
  description: string;
  linkedinUrl: string;
  publishDate: number;
  featured: boolean;
  pdfUrl?: string | null;
};

type Podcast = {
  id: number;
  title: string;
  description?: string | null;
  episodeNumber?: number | null;
  audioUrl?: string | null;
  publishDate?: string | number | null;
  duration?: string | null;
};

const TABS: Array<{ key: LearnTab; label: string; icon: React.ComponentProps<typeof Feather>["name"] }> = [
  { key: "articles", label: "Read", icon: "file-text" },
  { key: "podcasts", label: "Listen", icon: "headphones" },
  { key: "resources", label: "Use", icon: "folder" },
];

const METHOD_LINKS = [
  { label: "Method", path: "/method", icon: "compass" as const },
  { label: "Drills", path: "/drills", icon: "repeat" as const },
  { label: "Quiz", path: "/quiz", icon: "check-square" as const },
  { label: "Manifesto", path: "/manifesto", icon: "flag" as const },
];

function formatDate(value?: string | number | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function absoluteUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${getWebSiteUrl()}${path.startsWith("/") ? "" : "/"}${path}`;
}

function openExternal(path?: string | null) {
  if (!path) return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  void Linking.openURL(absoluteUrl(path));
}

export default function LearnScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { canUseFieldKit, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<LearnTab>("articles");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 24;

  const articlesQuery = useQuery<{ articles: Article[] }>({
    queryKey: ["articles"],
    queryFn: () => apiGet<{ articles: Article[] }>("/api/articles"),
    enabled: activeTab === "articles",
  });
  const podcastsQuery = useQuery<{ podcasts: Podcast[] }>({
    queryKey: ["podcasts"],
    queryFn: () => apiGet<{ podcasts: Podcast[] }>("/api/podcasts"),
    enabled: activeTab === "podcasts",
  });
  const resourcesQuery = useQuery<{ resources: ResourceLike[]; ownershipLabel?: string }>({
    queryKey: ["resources"],
    queryFn: () => apiGet<{ resources: ResourceLike[]; ownershipLabel?: string }>("/api/resources"),
    enabled: activeTab === "resources",
  });
  const providerQuery = useQuery<{
    items: Array<{ id: number; title: string; description?: string | null; fileUrl: string; kind: string }>;
  }>({
    queryKey: ["provider-resources"],
    queryFn: () => apiGet("/api/v1/provider-resources"),
    enabled: activeTab === "resources" && canUseFieldKit,
  });

  const articles = articlesQuery.data?.articles ?? [];
  const featured = articles.find((article) => article.featured) ?? articles[0];
  const remainingArticles = featured ? articles.filter((article) => article.id !== featured.id) : [];
  const podcasts = podcastsQuery.data?.podcasts ?? [];
  const resources = resourcesQuery.data?.resources ?? [];
  const resourceGroups = useMemo(() => groupResources(resources), [resources]);
  const providerItems = providerQuery.data?.items ?? [];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]} testID="screen-learn">
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <Text style={[styles.kicker, { color: colors.primary }, font("bold")]}>SPARTAN KNOWLEDGE</Text>
        <Text style={[styles.title, { color: colors.foreground }, font("heavy")]}>Library</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }, font("regular")]}>Field intelligence for the conversation before you. Read less. Use more.</Text>

        <View style={[styles.segmented, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          {TABS.map((tab) => {
            const selected = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => {
                  void Haptics.selectionAsync();
                  setActiveTab(tab.key);
                }}
                style={[styles.segment, selected && { backgroundColor: colors.card }]}
                testID={`learn-tab-${tab.key}`}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
              >
                <Feather name={tab.icon} size={16} color={selected ? colors.primary : colors.mutedForeground} />
                <Text style={[styles.segmentLabel, { color: selected ? colors.foreground : colors.mutedForeground }, font(selected ? "bold" : "regular")]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {activeTab === "articles" ? (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: bottomPad + 24 }} showsVerticalScrollIndicator={false}>
          <Text style={[styles.sectionEyebrow, { color: colors.primary }, font("bold")]}>THE SPARTAN METHOD</Text>
          <View style={styles.methodGrid}>
            {METHOD_LINKS.map((item) => (
              <Pressable
                key={item.path}
                onPress={() => router.push({ pathname: "/tool-web", params: { path: item.path, toolId: "brand-video" } } as any)}
                style={({ pressed }) => [styles.methodChip, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 }]}
              >
                <View style={[styles.methodIcon, { backgroundColor: colors.primaryMuted }]}><Feather name={item.icon} size={18} color={colors.primary} /></View>
                <Text style={[styles.methodLabel, { color: colors.foreground }, font("bold")]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>

          {articlesQuery.isLoading ? <Loading /> : null}
          {articlesQuery.error ? (
            <EmptyState icon="alert-circle" title="Could not load the library" body="Check your connection and try again." ctaTitle="Retry" onCta={() => void articlesQuery.refetch()} />
          ) : null}

          {!articlesQuery.isLoading && !articlesQuery.error && featured ? (
            <>
              <Text style={[styles.sectionEyebrow, { color: colors.primary, marginTop: 24 }, font("bold")]}>FEATURED FIELD NOTE</Text>
              <Pressable
                onPress={() => openExternal(featured.pdfUrl || featured.linkedinUrl)}
                style={({ pressed }) => [styles.featureCard, { backgroundColor: colors.heroBackground, borderColor: colors.primary, opacity: pressed ? 0.94 : 1 }]}
                accessibilityRole="link"
              >
                <Text style={[styles.featureMeta, { color: colors.heroMuted }, font("semibold")]}>{formatDate(featured.publishDate) || "SPARTAN COACHING"}</Text>
                <Text style={[styles.featureTitle, { color: colors.heroForeground }, font("heavy")]}>{featured.title}</Text>
                <Text style={[styles.featureBody, { color: colors.heroMuted }, font("regular")]} numberOfLines={4}>{featured.description}</Text>
                <View style={styles.featureAction}>
                  <Text style={[{ color: colors.heroForeground, fontSize: 14 }, font("bold")]}>Read field note</Text>
                  <Feather name="arrow-up-right" size={18} color={colors.heroForeground} />
                </View>
              </Pressable>

              {remainingArticles.length > 0 ? (
                <View style={{ marginTop: 26 }}>
                  <Text style={[styles.sectionEyebrow, { color: colors.primary }, font("bold")]}>LATEST</Text>
                  {remainingArticles.map((article) => (
                    <LibraryRow
                      key={article.id}
                      title={article.title}
                      subtitle={article.description}
                      meta={formatDate(article.publishDate)}
                      icon="file-text"
                      onPress={() => openExternal(article.pdfUrl || article.linkedinUrl)}
                    />
                  ))}
                </View>
              ) : null}
            </>
          ) : null}

          {!articlesQuery.isLoading && !articlesQuery.error && articles.length === 0 ? (
            <EmptyState icon="file-text" title="No field notes yet" body="New reading will appear here when it is published." />
          ) : null}
        </ScrollView>
      ) : null}

      {activeTab === "podcasts" ? (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: bottomPad + 24 }} showsVerticalScrollIndicator={false}>
          <Text style={[styles.sectionEyebrow, { color: colors.primary }, font("bold")]}>LISTEN IN THE FIELD</Text>
          <Text style={[styles.sectionTitle, { color: colors.foreground }, font("heavy")]}>Briefings worth the drive</Text>
          <Text style={[styles.sectionBody, { color: colors.mutedForeground }, font("regular")]}>Practical conversations for the route between accounts.</Text>
          {podcastsQuery.isLoading ? <Loading /> : null}
          {podcastsQuery.error ? <EmptyState icon="alert-circle" title="Could not load episodes" ctaTitle="Retry" onCta={() => void podcastsQuery.refetch()} /> : null}
          {!podcastsQuery.isLoading && !podcastsQuery.error && podcasts.length === 0 ? <EmptyState icon="headphones" title="No episodes yet" body="Published episodes will appear here." /> : null}
          {podcasts.map((podcast) => (
            <LibraryRow
              key={podcast.id}
              title={podcast.title}
              subtitle={podcast.description || "Spartan Coaching audio briefing"}
              meta={[podcast.episodeNumber ? `Episode ${podcast.episodeNumber}` : null, podcast.duration, formatDate(podcast.publishDate)].filter(Boolean).join(" · ")}
              icon={podcast.audioUrl ? "play" : "headphones"}
              onPress={podcast.audioUrl ? () => openExternal(podcast.audioUrl) : undefined}
            />
          ))}
        </ScrollView>
      ) : null}

      {activeTab === "resources" ? (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: bottomPad + 24 }} showsVerticalScrollIndicator={false} testID="learn-resources">
          <View style={[styles.safetyCard, { backgroundColor: colors.primaryMuted, borderColor: colors.primary }]}>
            <Feather name="shield" size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.safetyTitle, { color: colors.foreground }, font("bold")]}>Keep every resource deidentified</Text>
              <Text style={[styles.safetyBody, { color: colors.mutedForeground }, font("regular")]}>Never enter patient names, dates of birth, medical record numbers, or other patient identifiers.</Text>
            </View>
          </View>

          <Text style={[styles.sectionEyebrow, { color: colors.primary, marginTop: 22 }, font("bold")]}>WORKING TOOLS</Text>
          <LibraryRow title="Grounded Research" subtitle="Ask a territory or market question with source aware support." meta="Interactive tool" icon="search" onPress={() => router.push(openToolHref("research") as any)} testID="learn-link-research-tool" />
          <LibraryRow title="Weekly Plan" subtitle="Build, save, and resume the week across devices." meta="Interactive worksheet" icon="edit-3" onPress={() => router.push("/resource-work" as any)} testID="learn-link-resource-work" />

          {!canUseFieldKit ? (
            <View style={[styles.lockCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.lockTitle, { color: colors.foreground }, font("heavy")]}>{isAuthenticated ? "Unlock the complete field library" : "Sign in for the complete field library"}</Text>
              <Text style={[styles.lockBody, { color: colors.mutedForeground }, font("regular")]}>Membership includes current worksheets, field guides, and saved work.</Text>
              <SpartanButton title={isAuthenticated ? "Open Account" : "Client login"} onPress={() => router.push(isAuthenticated ? "/(tabs)/account" : "/login")} style={{ marginTop: 14 }} />
            </View>
          ) : null}

          {canUseFieldKit ? (
            <View style={{ marginTop: 24 }} testID="provider-resource-library">
              <Text style={[styles.sectionEyebrow, { color: colors.primary }, font("bold")]}>YOUR ORGANIZATION</Text>
              {providerQuery.isLoading ? <Loading compact /> : null}
              {!providerQuery.isLoading && providerItems.length === 0 ? <Text style={[styles.sectionBody, { color: colors.mutedForeground }, font("regular")]}>No private organization resources have been published.</Text> : null}
              {providerItems.map((item) => (
                <LibraryRow key={item.id} title={item.title} subtitle={item.description || "Private organization resource"} meta={item.kind} icon="briefcase" onPress={() => openExternal(item.fileUrl)} testID={`provider-resource-${item.id}`} />
              ))}
            </View>
          ) : null}

          <View style={{ marginTop: 24 }}>
            <Text style={[styles.sectionEyebrow, { color: colors.primary }, font("bold")]}>{(resourcesQuery.data?.ownershipLabel || "HOSPICE SALES PRO CORE").toUpperCase()}</Text>
            {resourcesQuery.isLoading ? <Loading /> : null}
            {resourcesQuery.error ? <EmptyState icon="alert-circle" title="Could not load resources" ctaTitle="Retry" onCta={() => void resourcesQuery.refetch()} /> : null}
            {!resourcesQuery.isLoading && !resourcesQuery.error && resources.length === 0 ? <EmptyState icon="folder" title="No resources yet" body="Published resources will appear here." /> : null}
            {resourceGroups.map((group) => (
              <View key={group.id} style={{ marginBottom: 22 }} testID={`resource-group-${group.id}`}>
                <Text style={[styles.groupTitle, { color: colors.foreground }, font("heavy")]}>{group.title}</Text>
                <Text style={[styles.groupBody, { color: colors.mutedForeground }, font("regular")]}>{group.blurb}</Text>
                {group.items.map((item) => {
                  const architecture = item.architecture || item.contentArchitecture;
                  const version = item.lifecycle?.versionLabel || item.versionLabel;
                  return (
                    <LibraryRow
                      key={item.id}
                      title={item.title}
                      subtitle={architecture?.whenToUse || architecture?.expectedOutcome || item.description || "Field resource"}
                      meta={[version ? `Version ${version}` : null, item.lifecycle?.hasNewerVersion ? "Update available" : null].filter(Boolean).join(" · ")}
                      icon="file-text"
                      onPress={() => openExternal(item.fileUrl)}
                      testID={`resource-${item.id}`}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      ) : null}
    </View>
  );
}

function Loading({ compact = false }: { compact?: boolean }) {
  const colors = useColors();
  return <View style={{ paddingVertical: compact ? 18 : 44, alignItems: "center" }}><ActivityIndicator color={colors.primary} /></View>;
}

function LibraryRow({ title, subtitle, meta, icon, onPress, testID }: { title: string; subtitle?: string; meta?: string; icon: React.ComponentProps<typeof Feather>["name"]; onPress?: () => void; testID?: string }) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      testID={testID}
      accessibilityRole={onPress ? "button" : "text"}
      style={({ pressed }) => [styles.row, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.9 : 1 }]}
    >
      <View style={[styles.rowIcon, { backgroundColor: colors.primaryMuted }]}><Feather name={icon} size={18} color={colors.primary} /></View>
      <View style={{ flex: 1 }}>
        {meta ? <Text style={[styles.rowMeta, { color: colors.primary }, font("bold")]}>{meta.toUpperCase()}</Text> : null}
        <Text style={[styles.rowTitle, { color: colors.foreground }, font("bold")]}>{title}</Text>
        {subtitle ? <Text style={[styles.rowBody, { color: colors.mutedForeground }, font("regular")]} numberOfLines={3}>{subtitle}</Text> : null}
      </View>
      {onPress ? <Feather name="arrow-up-right" size={18} color={colors.mutedForeground} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  kicker: { fontSize: 10, letterSpacing: 2.2 },
  title: { fontSize: 36, letterSpacing: -1.1, marginTop: 6 },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 5, maxWidth: 350 },
  segmented: { flexDirection: "row", borderWidth: 1, borderRadius: 15, padding: 3, marginTop: 16 },
  segment: { flex: 1, minHeight: 42, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  segmentLabel: { fontSize: 13 },
  sectionEyebrow: { fontSize: 10, letterSpacing: 1.9, marginBottom: 7 },
  sectionTitle: { fontSize: 23, letterSpacing: -0.5 },
  sectionBody: { fontSize: 13, lineHeight: 19, marginTop: 5, marginBottom: 16 },
  methodGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  methodChip: { width: "48%", minHeight: 82, borderWidth: 1, borderRadius: 16, padding: 12, justifyContent: "space-between" },
  methodIcon: { width: 31, height: 31, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  methodLabel: { fontSize: 13 },
  featureCard: { borderWidth: 1, borderRadius: 22, padding: 21 },
  featureMeta: { fontSize: 10, letterSpacing: 1.5 },
  featureTitle: { fontSize: 25, lineHeight: 30, letterSpacing: -0.55, marginTop: 12 },
  featureBody: { fontSize: 14, lineHeight: 21, marginTop: 9 },
  featureAction: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 18 },
  row: { minHeight: 92, borderWidth: StyleSheet.hairlineWidth * 2, borderRadius: 17, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  rowIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  rowMeta: { fontSize: 9, letterSpacing: 1.25, marginBottom: 4 },
  rowTitle: { fontSize: 15, lineHeight: 20 },
  rowBody: { fontSize: 12, lineHeight: 17, marginTop: 4 },
  safetyCard: { borderWidth: 1, borderRadius: 18, padding: 15, flexDirection: "row", alignItems: "flex-start", gap: 12 },
  safetyTitle: { fontSize: 14 },
  safetyBody: { fontSize: 12, lineHeight: 18, marginTop: 4 },
  lockCard: { borderWidth: 1, borderRadius: 20, padding: 18, marginTop: 22 },
  lockTitle: { fontSize: 19, letterSpacing: -0.3 },
  lockBody: { fontSize: 13, lineHeight: 19, marginTop: 6 },
  groupTitle: { fontSize: 19, letterSpacing: -0.3 },
  groupBody: { fontSize: 12, lineHeight: 18, marginTop: 3, marginBottom: 10 },
});
