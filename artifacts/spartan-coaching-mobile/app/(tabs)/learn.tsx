/**
 * Learn — Articles · Podcasts · Resources (grouped PDFs).
 * AI research lives under Tools → Research (not here).
 */
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { apiGet, getWebSiteUrl } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { font } from "@/lib/typography";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListRow } from "@/components/ui/ListRow";
import { SectionKicker } from "@/components/ui/SectionKicker";
import { SpartanButton } from "@/components/ui/SpartanButton";
import { groupResources, type ResourceLike } from "@/lib/resourceGroups";
import { openToolHref } from "@/lib/toolDeepLinks";

type LearnTab = "articles" | "podcasts" | "resources";

const WEB_LEARN_LINKS: { label: string; path: string; blurb: string }[] = [
  { label: "Spartan Method", path: "/method", blurb: "The system behind coaching" },
  { label: "Drills", path: "/drills", blurb: "Practice reps between sessions" },
  { label: "Quiz", path: "/quiz", blurb: "Knowledge check" },
  { label: "Manifesto", path: "/manifesto", blurb: "The Spartan Ethos" },
];

type Article = {
  id: number;
  title: string;
  summary?: string | null;
  content?: string | null;
  author?: string | null;
  publishedAt?: number | null;
  category?: string | null;
};

type Podcast = {
  id: number;
  title: string;
  description?: string | null;
  episode?: string | null;
  duration?: string | null;
  publishedAt?: number | null;
  host?: string | null;
};

const LEARN_TABS: { key: LearnTab; label: string; icon: "file-text" | "mic" | "folder" }[] = [
  { key: "articles", label: "Articles", icon: "file-text" },
  { key: "podcasts", label: "Podcasts", icon: "mic" },
  { key: "resources", label: "Resources", icon: "folder" },
];

function formatDate(ts?: number | null) {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function openResource(fileUrl: string) {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  const base = getWebSiteUrl();
  const url =
    fileUrl.startsWith("http://") || fileUrl.startsWith("https://")
      ? fileUrl
      : `${base}${fileUrl.startsWith("/") ? "" : "/"}${fileUrl}`;
  void Linking.openURL(url);
}

export default function LearnScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { canUseFieldKit, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<LearnTab>("articles");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 90;

  const {
    data: articlesData,
    isLoading: articlesLoading,
    error: articlesError,
    refetch: refetchArticles,
  } = useQuery<{ articles: Article[] }>({
    queryKey: ["articles"],
    queryFn: () => apiGet<{ articles: Article[] }>("/api/articles"),
    enabled: activeTab === "articles",
  });

  const {
    data: podcastsData,
    isLoading: podcastsLoading,
    error: podcastsError,
    refetch: refetchPodcasts,
  } = useQuery<{ podcasts: Podcast[] }>({
    queryKey: ["podcasts"],
    queryFn: () => apiGet<{ podcasts: Podcast[] }>("/api/podcasts"),
    enabled: activeTab === "podcasts",
  });

  const {
    data: resourcesData,
    isLoading: resourcesLoading,
    error: resourcesError,
    refetch: refetchResources,
  } = useQuery<{ resources: ResourceLike[] }>({
    queryKey: ["resources"],
    queryFn: () => apiGet<{ resources: ResourceLike[] }>("/api/resources"),
    enabled: activeTab === "resources",
  });

  const articles = articlesData?.articles ?? [];
  const podcasts = podcastsData?.podcasts ?? [];
  const resources = resourcesData?.resources ?? [];
  const resourceGroups = useMemo(() => groupResources(resources), [resources]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} testID="screen-learn">
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
        <Text style={[styles.headerTitle, { color: colors.foreground }, font("heavy")]}>Learn</Text>
        <Text style={[{ color: colors.mutedForeground, fontSize: 13, marginTop: 4 }, font("regular")]}>
          Get smarter between visits — articles, podcasts, field downloads
        </Text>
      </View>

      {/* Web parity chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, gap: 8 }}
      >
        {WEB_LEARN_LINKS.map((link) => (
          <Pressable
            key={link.path}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({
                pathname: "/tool-web",
                params: { path: link.path, toolId: "brand-video" },
              } as any);
            }}
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.card,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 10,
              minHeight: 44,
              justifyContent: "center",
            }}
          >
            <Text style={[{ color: colors.foreground, fontSize: 13 }, font("bold")]}>{link.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        {LEARN_TABS.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => {
              void Haptics.selectionAsync();
              setActiveTab(tab.key);
            }}
            style={[
              styles.tabBtn,
              activeTab === tab.key && { borderBottomColor: colors.primary },
            ]}
            testID={`learn-tab-${tab.key}`}
          >
            <Feather
              name={tab.icon}
              size={15}
              color={activeTab === tab.key ? colors.primary : colors.mutedForeground}
            />
            <Text
              style={[
                styles.tabLabel,
                { color: activeTab === tab.key ? colors.primary : colors.mutedForeground },
                font(activeTab === tab.key ? "semibold" : "regular"),
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Articles */}
      {activeTab === "articles" && (
        <>
          {articlesLoading && (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.primary} size="large" />
            </View>
          )}
          {!!articlesError && (
            <View style={styles.pad}>
              <EmptyState
                icon="alert-circle"
                title="Could not load articles"
                body="Check your connection and try again."
                ctaTitle="Retry"
                onCta={() => void refetchArticles()}
              />
            </View>
          )}
          {!articlesLoading && !articlesError && (
            <FlatList
              data={articles}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, paddingBottom: bottomPad }}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <View style={[styles.methodSection, { borderBottomColor: colors.border }]}>
                  <SectionKicker>The Spartan Method</SectionKicker>
                  <Text
                    style={[
                      { color: colors.mutedForeground, fontSize: 14, lineHeight: 20, marginTop: 8, marginBottom: 14 },
                      font("regular"),
                    ]}
                  >
                    Hospice sales is not a mystery — discipline, empathy, and strategy.
                  </Text>
                  {(
                    [
                      { name: "Discipline", desc: "The system that holds on Tuesday when caring isn't enough." },
                      { name: "Empathy", desc: "The skill that hears what's underneath 'not yet.'" },
                      { name: "Strategy", desc: "Knowing which five accounts actually refer." },
                    ] as const
                  ).map((pillar) => (
                    <View
                      key={pillar.name}
                      style={[styles.pillarCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    >
                      <View style={[styles.pillarAccent, { backgroundColor: colors.primary }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={[{ color: colors.foreground, fontSize: 15 }, font("bold")]}>
                          {pillar.name}
                        </Text>
                        <Text
                          style={[
                            { color: colors.mutedForeground, fontSize: 13, lineHeight: 18, marginTop: 3 },
                            font("regular"),
                          ]}
                        >
                          {pillar.desc}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              }
              ListEmptyComponent={
                <EmptyState icon="file-text" title="No articles yet" body="Check back soon for new field reading." />
              }
              renderItem={({ item }) => (
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {!!item.category && (
                    <View style={[styles.tag, { backgroundColor: colors.primaryMuted }]}>
                      <Text style={[{ color: colors.primary, fontSize: 11 }, font("semibold")]}>
                        {item.category}
                      </Text>
                    </View>
                  )}
                  <Text style={[{ color: colors.foreground, fontSize: 17, lineHeight: 22 }, font("bold")]}>
                    {item.title}
                  </Text>
                  {!!(item.summary || item.content) && (
                    <Text
                      style={[
                        { color: colors.mutedForeground, fontSize: 14, lineHeight: 20, marginTop: 6 },
                        font("regular"),
                      ]}
                      numberOfLines={3}
                    >
                      {item.summary || item.content}
                    </Text>
                  )}
                  <View style={styles.cardMeta}>
                    {!!item.author && (
                      <Text style={[{ color: colors.mutedForeground, fontSize: 12 }, font("regular")]}>
                        {item.author}
                      </Text>
                    )}
                    {!!item.publishedAt && (
                      <Text style={[{ color: colors.mutedForeground, fontSize: 12 }, font("regular")]}>
                        {formatDate(item.publishedAt)}
                      </Text>
                    )}
                  </View>
                </View>
              )}
            />
          )}
        </>
      )}

      {/* Podcasts */}
      {activeTab === "podcasts" && (
        <>
          {podcastsLoading && (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.primary} size="large" />
            </View>
          )}
          {!!podcastsError && (
            <View style={styles.pad}>
              <EmptyState
                icon="alert-circle"
                title="Could not load podcasts"
                ctaTitle="Retry"
                onCta={() => void refetchPodcasts()}
              />
            </View>
          )}
          {!podcastsLoading && !podcastsError && (
            <FlatList
              data={podcasts}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, paddingBottom: bottomPad }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <EmptyState icon="mic" title="No podcasts yet" body="Episodes will show up here when published." />
              }
              renderItem={({ item }) => (
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.podcastRow}>
                    <View style={[styles.podcastIcon, { backgroundColor: colors.primaryMuted }]}>
                      <Feather name="mic" size={20} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[{ color: colors.foreground, fontSize: 16 }, font("bold")]}>{item.title}</Text>
                      <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
                        {!!item.episode && (
                          <Text style={[{ color: colors.mutedForeground, fontSize: 12 }, font("regular")]}>
                            {item.episode}
                          </Text>
                        )}
                        {!!item.duration && (
                          <Text style={[{ color: colors.mutedForeground, fontSize: 12 }, font("regular")]}>
                            {item.duration}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                  {!!item.description && (
                    <Text
                      style={[
                        { color: colors.mutedForeground, fontSize: 13, lineHeight: 18, marginTop: 8 },
                        font("regular"),
                      ]}
                      numberOfLines={2}
                    >
                      {item.description}
                    </Text>
                  )}
                </View>
              )}
            />
          )}
        </>
      )}

      {/* Resources — grouped PDFs, no AI search */}
      {activeTab === "resources" && (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: bottomPad }}
          showsVerticalScrollIndicator={false}
          testID="learn-resources"
        >
          <Text style={[{ color: colors.mutedForeground, fontSize: 12, lineHeight: 17, marginBottom: 12 }, font("regular")]}>
            Field downloads only. Do not put patient identifiers into filled PDFs. For AI research, use Tools →
            Research.
          </Text>

          <ListRow
            title="AI Research (Tools)"
            subtitle="Territory and market questions — not a document library"
            icon="search"
            onPress={() => router.push(openToolHref("research") as any)}
            testID="learn-link-research-tool"
          />

          {!canUseFieldKit && (
            <View
              style={[
                styles.lockBanner,
                { borderColor: colors.primary, backgroundColor: colors.card, marginBottom: 14 },
              ]}
            >
              <Text style={[{ color: colors.foreground, fontSize: 14 }, font("bold")]}>
                {isAuthenticated ? "Unlock downloads with Hospice Sales Pro" : "Sign in for full resource library"}
              </Text>
              <SpartanButton
                title={isAuthenticated ? "Open Account" : "Client login"}
                onPress={() => router.push(isAuthenticated ? "/(tabs)/account" : "/login")}
                style={{ marginTop: 10 }}
              />
            </View>
          )}

          {resourcesLoading && (
            <View style={{ paddingVertical: 40, alignItems: "center" }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          )}
          {!!resourcesError && (
            <EmptyState
              icon="alert-circle"
              title="Could not load resources"
              ctaTitle="Retry"
              onCta={() => void refetchResources()}
            />
          )}
          {!resourcesLoading && !resourcesError && resources.length === 0 && (
            <EmptyState icon="folder" title="No resources yet" body="PDFs will appear here when published." />
          )}

          {resourceGroups.map((group) => (
            <View key={group.id} style={{ marginBottom: 18 }} testID={`resource-group-${group.id}`}>
              <Text style={[{ color: colors.primary, fontSize: 11, letterSpacing: 1.2, marginBottom: 4 }, font("bold")]}>
                {group.title.toUpperCase()}
              </Text>
              <Text style={[{ color: colors.mutedForeground, fontSize: 12, marginBottom: 8 }, font("regular")]}>
                {group.blurb}
              </Text>
              {group.items.map((item) => (
                <ListRow
                  key={item.id}
                  title={item.title}
                  subtitle={item.description || item.category || "PDF download"}
                  icon="file-text"
                  onPress={() => openResource(item.fileUrl)}
                  testID={`resource-${item.id}`}
                />
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 28, letterSpacing: -0.4 },
  tabBar: { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 12,
    minHeight: 44,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabLabel: { fontSize: 12 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60 },
  pad: { padding: 16 },
  card: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  tag: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  cardMeta: { flexDirection: "row", gap: 12, marginTop: 10 },
  podcastRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  podcastIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  methodSection: { borderBottomWidth: StyleSheet.hairlineWidth, paddingBottom: 16, marginBottom: 12 },
  pillarCard: {
    flexDirection: "row",
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  pillarAccent: { width: 3, height: 40, borderRadius: 2, marginTop: 2 },
  lockBanner: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
  },
});
