import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EmptyState } from "@/components/ui/EmptyState";
import { SpartanButton } from "@/components/ui/SpartanButton";
import { SpartanHeader } from "@/components/ui/SpartanHeader";
import { useColors } from "@/hooks/useColors";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { groupResources, type ResourceLike } from "@/lib/resourceGroups";
import { openToolHref } from "@/lib/toolDeepLinks";
import { font } from "@/lib/typography";
import {
  getResourceWorkGuide,
  getToolById,
  type FieldKitResourceWorkflowCustomization,
} from "@workspace/field-kit-catalog";

type LearnTab = "articles" | "podcasts" | "resources";

type Article = {
  id: number;
  title: string;
  description: string;
  content?: string | null;
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

function openLibraryItem(input: {
  title: string;
  url?: string | null;
  sourceUrl?: string | null;
  kind: "article" | "audio" | "resource";
  description?: string | null;
  articleId?: number;
  whenToUse?: string;
  whyItMatters?: string;
  expectedOutcome?: string;
  version?: string;
}) {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  router.push({
    pathname: "/library-item",
    params: {
      title: input.title,
      url: input.url,
      kind: input.kind,
      description: input.description || "",
      sourceUrl: input.sourceUrl || "",
      articleId: input.articleId ? String(input.articleId) : "",
      whenToUse: input.whenToUse || "",
      whyItMatters: input.whyItMatters || "",
      expectedOutcome: input.expectedOutcome || "",
      version: input.version || "",
    },
  } as any);
}

export default function LearnScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { canUseFieldKit } = useAuth();
  const [activeTab, setActiveTab] = useState<LearnTab>("articles");
  const [query, setQuery] = useState("");

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
    items: Array<{
      id: number;
      title: string;
      description?: string | null;
      fileUrl: string;
      kind: string;
      meta?: { workflow?: FieldKitResourceWorkflowCustomization | null } | null;
    }>;
  }>({
    queryKey: ["provider-resources"],
    queryFn: () => apiGet("/api/v1/provider-resources"),
    enabled: activeTab === "resources" && canUseFieldKit,
  });

  const search = query.trim().toLowerCase();
  const matches = (values: Array<string | null | undefined>) => !search || values.join(" ").toLowerCase().includes(search);
  const articles = (articlesQuery.data?.articles ?? []).filter((item) => matches([item.title, item.description]));
  const featured = articles.find((article) => article.featured) ?? articles[0];
  const remainingArticles = featured ? articles.filter((article) => article.id !== featured.id) : [];
  const podcasts = (podcastsQuery.data?.podcasts ?? []).filter((item) => Boolean(item.audioUrl) && matches([item.title, item.description]));
  const resources = (resourcesQuery.data?.resources ?? []).filter((item) => matches([item.title, item.description, item.category]));
  const resourceGroups = useMemo(() => groupResources(resources), [resources]);
  const providerItems = (providerQuery.data?.items ?? []).filter((item) => matches([item.title, item.description, item.kind]));

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]} testID="screen-learn">
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <SpartanHeader title="Library" />
        <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.borderStrong }]}>
          <Feather name="search" size={19} color={colors.mutedForeground} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search the Library"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }, font("regular")]}
            returnKeyType="search"
            clearButtonMode="while-editing"
            accessibilityLabel="Search Library"
          />
        </View>

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
          <LibraryModeIntro icon="file-text" title="Read" body="Open complete field notes in the native reader, capture one useful move, and save selected items for offline use." access="STANDARD" />
          <Text style={[styles.sectionEyebrow, { color: colors.primary }, font("bold")]}>FIELD INTELLIGENCE</Text>
          <Text style={[styles.libraryTitle, { color: colors.foreground }, font("heavy")]}>Read less. Use more.</Text>
          {articlesQuery.isLoading ? <Loading /> : null}
          {articlesQuery.error ? (
            <EmptyState icon="alert-circle" title="Could not load the library" body="Check your connection and try again." ctaTitle="Retry" onCta={() => void articlesQuery.refetch()} />
          ) : null}

          {!articlesQuery.isLoading && !articlesQuery.error && featured ? (
            <>
              <Pressable
                onPress={() => openLibraryItem({ articleId: featured.id, title: featured.title, description: featured.description, url: featured.pdfUrl, sourceUrl: featured.linkedinUrl, kind: "article" })}
                style={({ pressed }) => [styles.featureCard, { backgroundColor: colors.card, borderColor: colors.borderStrong, opacity: pressed ? 0.94 : 1 }]}
                accessibilityRole="link"
              >
                <View style={styles.featureHeader}>
                  <View style={[styles.featureIcon, { backgroundColor: colors.primaryMuted }]}><Feather name="file-text" size={22} color={colors.primary} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.featureTitle, { color: colors.foreground }, font("heavy")]}>{featured.title}</Text>
                    <Text style={[styles.featureBody, { color: colors.mutedForeground }, font("regular")]} numberOfLines={4}>{featured.description}</Text>
                  </View>
                </View>
                <View style={styles.featureAction}>
                  <View style={[styles.availableBadge, { backgroundColor: colors.secondary }]}><Text style={[styles.availableText, { color: colors.primary }, font("bold")]}>AVAILABLE</Text></View>
                  <Text style={[styles.featureDate, { color: colors.mutedForeground }, font("medium")]}>{formatDate(featured.publishDate)}</Text>
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
                      onPress={() => openLibraryItem({ articleId: article.id, title: article.title, description: article.description, url: article.pdfUrl, sourceUrl: article.linkedinUrl, kind: "article" })}
                    />
                  ))}
                </View>
              ) : null}
            </>
          ) : null}

          {!articlesQuery.isLoading && !articlesQuery.error && articles.length === 0 ? (
            <EmptyState icon="file-text" title={search ? "No matching field notes" : "No field notes yet"} body={search ? "Try a different Library search." : "New reading will appear here when it is published."} />
          ) : null}

          {!search ? (
            <View style={{ marginTop: 26 }}>
              <Text style={[styles.sectionEyebrow, { color: colors.primary }, font("bold")]}>THE SPARTAN METHOD</Text>
              {METHOD_LINKS.map((item) => (
                <LibraryRow
                  key={item.path}
                  title={item.label === "Method" ? "The Spartan Method" : item.label}
                  subtitle={item.label === "Method" ? "Discipline, empathy, and strategy for the field." : "Open a focused practice experience inside the app."}
                  meta="Native"
                  icon={item.icon}
                  onPress={() => router.push({ pathname: "/method-guide", params: { section: item.path.replace("/", "") } } as any)}
                />
              ))}
            </View>
          ) : null}
        </ScrollView>
      ) : null}

      {activeTab === "podcasts" ? (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: bottomPad + 24 }} showsVerticalScrollIndicator={false}>
          <LibraryModeIntro icon="headphones" title="Listen" body="Play complete audio briefings without leaving Spartan Coaching. Only episodes with working audio appear here." access="STANDARD" />
          <Text style={[styles.sectionEyebrow, { color: colors.primary }, font("bold")]}>LISTEN IN THE FIELD</Text>
          <Text style={[styles.sectionTitle, { color: colors.foreground }, font("heavy")]}>Briefings worth the drive</Text>
          <Text style={[styles.sectionBody, { color: colors.mutedForeground }, font("regular")]}>Practical conversations for the route between accounts.</Text>
          {podcastsQuery.isLoading ? <Loading /> : null}
          {podcastsQuery.error ? <EmptyState icon="alert-circle" title="Could not load episodes" ctaTitle="Retry" onCta={() => void podcastsQuery.refetch()} /> : null}
          {!podcastsQuery.isLoading && !podcastsQuery.error && podcasts.length === 0 ? <EmptyState icon="headphones" title="Audio briefings are being prepared" body="Only complete, playable episodes appear here. Nothing unfinished is presented as available." /> : null}
          {podcasts.map((podcast) => (
            <LibraryRow
              key={podcast.id}
              title={podcast.title}
              subtitle={podcast.description || "Spartan Coaching audio briefing"}
              meta={[podcast.episodeNumber ? `Episode ${podcast.episodeNumber}` : null, podcast.duration, formatDate(podcast.publishDate)].filter(Boolean).join(" · ")}
              icon={podcast.audioUrl ? "play" : "headphones"}
              onPress={podcast.audioUrl ? () => openLibraryItem({ title: podcast.title, description: podcast.description, url: podcast.audioUrl, kind: "audio" }) : undefined}
            />
          ))}
        </ScrollView>
      ) : null}

      {activeTab === "resources" ? (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: bottomPad + 24 }} showsVerticalScrollIndicator={false} testID="learn-resources">
          <LibraryModeIntro icon="folder" title="Use" body="Open approved field guides and company material. Download selected nonclinical items for offline use." access="STANDARD" />
          <View style={[styles.safetyCard, { backgroundColor: colors.primaryMuted, borderColor: colors.primary }]}>
            <Feather name="shield" size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.safetyTitle, { color: colors.foreground }, font("bold")]}>Keep every resource deidentified</Text>
              <Text style={[styles.safetyBody, { color: colors.mutedForeground }, font("regular")]}>Never enter patient names, dates of birth, medical record numbers, or other patient identifiers.</Text>
            </View>
          </View>

          <Text style={[styles.sectionBody, { color: colors.mutedForeground, marginTop: 18 }, font("regular")]}>
            Need an interactive workspace? Open Explore. The Library keeps reference material, downloadable aids, and organization resources together.
          </Text>

          {!canUseFieldKit ? (
            <View style={[styles.lockCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.lockTitle, { color: colors.foreground }, font("heavy")]}>Unlock the complete field library</Text>
              <Text style={[styles.lockBody, { color: colors.mutedForeground }, font("regular")]}>Membership includes current worksheets, field guides, and saved work.</Text>
              <SpartanButton title="Compare memberships" onPress={() => router.push("/membership" as any)} style={{ marginTop: 14 }} />
            </View>
          ) : null}

          {canUseFieldKit ? (
            <View style={{ marginTop: 24 }} testID="provider-resource-library">
              <Text style={[styles.sectionEyebrow, { color: colors.primary }, font("bold")]}>YOUR ORGANIZATION</Text>
              {providerQuery.isLoading ? <Loading compact /> : null}
              {!providerQuery.isLoading && providerItems.length === 0 ? <Text style={[styles.sectionBody, { color: colors.mutedForeground }, font("regular")]}>No private organization resources have been published.</Text> : null}
              {providerItems.map((item) => (
                <View key={item.id}>
                  <LibraryRow title={item.title} subtitle={item.description || "Private organization resource"} meta={item.kind} icon="briefcase" onPress={() => openLibraryItem({ title: item.title, description: item.description, url: item.fileUrl, kind: "resource" })} testID={`provider-resource-${item.id}`} />
                  <ResourceWorkflowNote
                    category={item.kind}
                    workflow={item.meta?.workflow}
                    testID={`provider-resource-workflow-${item.id}`}
                  />
                </View>
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
                    <View key={item.id}>
                      <LibraryRow
                        title={item.title}
                        subtitle={architecture?.whenToUse || architecture?.expectedOutcome || item.description || "Field resource"}
                        meta={[version ? `Version ${version}` : null, item.lifecycle?.hasNewerVersion ? "Update available" : null].filter(Boolean).join(" · ")}
                        icon="file-text"
                        onPress={() => openLibraryItem({
                          title: item.title,
                          description: item.description,
                          url: item.fileUrl,
                          kind: "resource",
                          whenToUse: architecture?.whenToUse,
                          whyItMatters: architecture?.whyItMatters,
                          expectedOutcome: architecture?.expectedOutcome,
                          version: version || undefined,
                        })}
                        testID={`resource-${item.id}`}
                      />
                      <ResourceWorkflowNote
                        category={item.category}
                        relatedToolIds={architecture?.relatedToolIds}
                        testID={`resource-workflow-${item.id}`}
                      />
                    </View>
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

function LibraryModeIntro({ icon, title, body, access }: { icon: React.ComponentProps<typeof Feather>["name"]; title: string; body: string; access: string }) {
  const colors = useColors();
  return (
    <View style={[styles.modeIntro, { backgroundColor: colors.heroBackground }]} testID={`library-mode-${title.toLowerCase()}`}>
      <View style={[styles.modeIcon, { backgroundColor: colors.primary }]}><Feather name={icon} size={19} color="#FFFFFF" /></View>
      <View style={{ flex: 1 }}><View style={styles.modeTitleRow}><Text style={[styles.modeTitle, { color: colors.heroForeground }, font("heavy")]}>{title}</Text><Text style={[styles.modeAccess, { color: colors.heroMuted }, font("bold")]}>{access}</Text></View><Text style={[styles.modeBody, { color: colors.heroMuted }, font("regular")]}>{body}</Text></View>
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

function ResourceWorkflowNote({
  category,
  relatedToolIds,
  workflow: customWorkflow,
  testID,
}: {
  category?: string | null;
  relatedToolIds?: string[];
  workflow?: FieldKitResourceWorkflowCustomization | null;
  testID: string;
}) {
  const colors = useColors();
  const workflow = getResourceWorkGuide({
    category,
    relatedToolIds,
    workflow: customWorkflow,
  });
  const nextTool = workflow.nextToolId ? getToolById(workflow.nextToolId) : undefined;
  const openNextTool = () => {
    if (!nextTool) return;
    if (nextTool.mobileToolTab) {
      router.push(openToolHref(nextTool.mobileToolTab as any) as any);
      return;
    }
    router.push((nextTool.mobileRoute || "/(tabs)/tools") as any);
  };
  return (
    <View style={[styles.resourceWorkflow, { backgroundColor: colors.primaryMuted, borderColor: colors.borderStrong }]} testID={testID}>
      <Text style={[styles.resourceWorkflowMeta, { color: colors.primary }, font("bold")]}>{workflow.phase.toUpperCase()} · FIELD WORKFLOW</Text>
      <Text style={[styles.resourceWorkflowTitle, { color: colors.foreground }, font("bold")]}>Job: {workflow.job}</Text>
      <Text style={[styles.resourceWorkflowBody, { color: colors.mutedForeground }, font("regular")]}>Safe use: {workflow.inputHint}</Text>
      <Text style={[styles.resourceWorkflowBody, { color: colors.mutedForeground }, font("regular")]}>Expected output: {workflow.outputPreview}</Text>
      <Text style={[styles.resourceWorkflowBody, { color: colors.mutedForeground }, font("regular")]}>Saved: {workflow.persistence}</Text>
      <Text style={[styles.resourceWorkflowBody, { color: colors.mutedForeground }, font("regular")]}>Review: {workflow.reviewCheckpoint}</Text>
      {nextTool ? (
        <Pressable onPress={openNextTool} accessibilityRole="button" accessibilityLabel={`Next: open ${nextTool.title}`} style={styles.resourceWorkflowNext}>
          <Text style={[{ color: colors.primary, fontSize: 12 }, font("bold")]}>Next: open {nextTool.title}</Text>
          <Feather name="arrow-right" size={15} color={colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  kicker: { fontSize: 10, letterSpacing: 2.2 },
  title: { fontSize: 36, letterSpacing: -1.1, marginTop: 6 },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 5, maxWidth: 350 },
  libraryTitle: { fontSize: 30, lineHeight: 36, letterSpacing: -0.9, marginTop: 8, marginBottom: 20 },
  segmented: { flexDirection: "row", borderWidth: 1, borderRadius: 15, padding: 3, marginTop: 16 },
  search: { minHeight: 54, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 17, paddingHorizontal: 15, marginTop: 18 },
  searchInput: { flex: 1, minHeight: 52, fontSize: 15 },
  segment: { flex: 1, minHeight: 42, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  segmentLabel: { fontSize: 13 },
  sectionEyebrow: { fontSize: 10, letterSpacing: 1.9, marginBottom: 7 },
  sectionTitle: { fontSize: 23, letterSpacing: -0.5 },
  sectionBody: { fontSize: 13, lineHeight: 19, marginTop: 5, marginBottom: 16 },
  methodGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  methodChip: { width: "48%", minHeight: 82, borderWidth: 1, borderRadius: 16, padding: 12, justifyContent: "space-between" },
  methodIcon: { width: 31, height: 31, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  methodLabel: { fontSize: 13 },
  featureCard: { minHeight: 212, borderWidth: 1, borderRadius: 22, padding: 20, justifyContent: "space-between" },
  featureHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  featureIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  featureMeta: { fontSize: 10, letterSpacing: 1.5 },
  featureTitle: { fontSize: 19, lineHeight: 25, letterSpacing: -0.3 },
  featureBody: { fontSize: 13, lineHeight: 19, marginTop: 8 },
  featureAction: { minHeight: 30, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 18 },
  availableBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  availableText: { fontSize: 9, letterSpacing: 0.8 },
  featureDate: { fontSize: 10 },
  row: { minHeight: 132, borderWidth: StyleSheet.hairlineWidth * 2, borderRadius: 20, padding: 18, flexDirection: "row", alignItems: "flex-start", gap: 13, marginBottom: 12 },
  rowIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  rowMeta: { fontSize: 9, letterSpacing: 1.25, marginBottom: 4 },
  rowTitle: { fontSize: 15, lineHeight: 20 },
  rowBody: { fontSize: 12, lineHeight: 17, marginTop: 4 },
  resourceWorkflow: { marginTop: -4, marginBottom: 16, borderWidth: StyleSheet.hairlineWidth * 2, borderRadius: 16, padding: 13 },
  resourceWorkflowMeta: { fontSize: 9, letterSpacing: 1.1 },
  resourceWorkflowTitle: { fontSize: 12, lineHeight: 17, marginTop: 5 },
  resourceWorkflowBody: { fontSize: 10, lineHeight: 15, marginTop: 5 },
  resourceWorkflowNext: { minHeight: 36, marginTop: 7, flexDirection: "row", alignItems: "center", gap: 5 },
  modeIntro: { minHeight: 112, borderRadius: 22, borderCurve: "continuous", padding: 17, flexDirection: "row", alignItems: "flex-start", gap: 13, marginBottom: 24 },
  modeIcon: { width: 42, height: 42, borderRadius: 13, borderCurve: "continuous", alignItems: "center", justifyContent: "center" },
  modeTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  modeTitle: { fontSize: 19, lineHeight: 23 },
  modeAccess: { fontSize: 8, letterSpacing: 1.2 },
  modeBody: { fontSize: 12, lineHeight: 18, marginTop: 6 },
  safetyCard: { borderWidth: 1, borderRadius: 18, padding: 15, flexDirection: "row", alignItems: "flex-start", gap: 12 },
  safetyTitle: { fontSize: 14 },
  safetyBody: { fontSize: 12, lineHeight: 18, marginTop: 4 },
  lockCard: { borderWidth: 1, borderRadius: 20, padding: 18, marginTop: 22 },
  lockTitle: { fontSize: 19, letterSpacing: -0.3 },
  lockBody: { fontSize: 13, lineHeight: 19, marginTop: 6 },
  groupTitle: { fontSize: 19, letterSpacing: -0.3 },
  groupBody: { fontSize: 12, lineHeight: 18, marginTop: 3, marginBottom: 10 },
});
