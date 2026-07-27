import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { apiGet, apiPost } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

type LearnTab = "articles" | "podcasts" | "resources";

/** Web surfaces that complete mobile ↔ website Learn parity */
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

type Resource = {
  id: number;
  title: string;
  description?: string | null;
  fileUrl: string;
  category?: string | null;
};

const LEARN_TABS: { key: LearnTab; label: string; icon: "file-text" | "mic" | "search" }[] = [
  { key: "articles", label: "Articles", icon: "file-text" },
  { key: "podcasts", label: "Podcasts", icon: "mic" },
  { key: "resources", label: "Knowledge Base", icon: "search" },
];

export default function LearnScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { canUseFieldKit } = useAuth();
  const [activeTab, setActiveTab] = useState<LearnTab>("articles");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 90;

  // Knowledge Base search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const { data: articlesData, isLoading: articlesLoading, error: articlesError, refetch: refetchArticles } =
    useQuery<{ articles: Article[] }>({
      queryKey: ["articles"],
      queryFn: () => apiGet<{ articles: Article[] }>("/api/articles"),
      enabled: activeTab === "articles",
    });

  const { data: podcastsData, isLoading: podcastsLoading, error: podcastsError, refetch: refetchPodcasts } =
    useQuery<{ podcasts: Podcast[] }>({
      queryKey: ["podcasts"],
      queryFn: () => apiGet<{ podcasts: Podcast[] }>("/api/podcasts"),
      enabled: activeTab === "podcasts",
    });

  const articles = articlesData?.articles ?? [];
  const podcasts = podcastsData?.podcasts ?? [];

  const { data: resourcesData, isLoading: resourcesLoading, error: resourcesError, refetch: refetchResources } =
    useQuery<{ resources: Resource[] }>({
      queryKey: ["resources"],
      queryFn: () => apiGet<{ resources: Resource[] }>("/api/resources"),
      enabled: activeTab === "resources",
    });

  const resources = resourcesData?.resources ?? [];

  const handleSearch = async () => {
    if (searchQuery.trim().length < 5) return;
    if (!canUseFieldKit) {
      setSearchError("Field Kit access required for AI research. Sign in from Home.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchLoading(true);
    setSearchResult("");
    setSearchError(null);
    try {
      const data = await apiPost<{ response: string }>("/api/research", {
        query: searchQuery,
        useGrounding: true,
      });
      setSearchResult(data.response);
    } catch (e: any) {
      const msg = String(e?.message || "");
      if (msg.startsWith("401") || msg.startsWith("403")) {
        setSearchError("Field Kit access required. Sign in from Home.");
      } else {
        setSearchError("Could not complete the search. Please try again.");
      }
    } finally {
      setSearchLoading(false);
    }
  };

  const formatDate = (ts?: number | null) => {
    if (!ts) return "";
    return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          Learn
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          Same content as the website — articles, podcasts, drills, method
        </Text>
      </View>

      {/* Website parity shortcuts */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {WEB_LEARN_LINKS.map((link) => (
          <Pressable
            key={link.path}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({
                pathname: "/tool-web",
                params: { path: link.path, toolId: "brand-video" },
              } as any);
            }}
            style={({ pressed }) => ({
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.card,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 10,
              opacity: pressed ? 0.85 : 1,
              minWidth: "46%" as any,
              flexGrow: 1,
            })}
          >
            <Text style={{ color: colors.foreground, fontWeight: "800", fontSize: 13, fontFamily: "Inter_700Bold" }}>
              {link.label}
            </Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 2, fontFamily: "Inter_400Regular" }}>
              {link.blurb}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Tab bar */}
      <View style={[styles.tabBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        {LEARN_TABS.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={({ pressed }) => [
              styles.tabBtn,
              activeTab === tab.key && { borderBottomColor: colors.primary },
              { opacity: pressed ? 0.75 : 1 },
            ]}
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
                { fontFamily: activeTab === tab.key ? "Inter_600SemiBold" : "Inter_400Regular" },
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
          {articlesLoading && <View style={styles.centered}><ActivityIndicator color={colors.primary} size="large" /></View>}
          {!!articlesError && (
            <View style={styles.centered}>
              <Feather name="alert-circle" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Could not load articles</Text>
              <Pressable onPress={() => refetchArticles()} style={({ pressed }) => [styles.retryBtn, { backgroundColor: colors.muted, opacity: pressed ? 0.75 : 1 }]}>
                <Text style={{ color: colors.foreground, fontFamily: "Inter_500Medium" }}>Retry</Text>
              </Pressable>
            </View>
          )}
          {!articlesLoading && !articlesError && (
            <FlatList
              data={articles}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16, paddingBottom: bottomPad }}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <View style={[styles.methodSection, { borderColor: colors.border }]}>
                  <Text style={[styles.methodOverline, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                    THE SPARTAN METHOD
                  </Text>
                  <Text style={[styles.methodIntro, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    Hospice sales is not a mystery. It is a promise — built on three things.
                  </Text>
                  {[
                    {
                      name: "Discipline",
                      desc: "The system that holds on Tuesday when caring isn't enough.",
                    },
                    {
                      name: "Empathy",
                      desc: "The skill that hears what's underneath 'not yet.'",
                    },
                    {
                      name: "Strategy",
                      desc: "Knowing which five accounts in your territory actually refer.",
                    },
                  ].map((pillar) => (
                    <View
                      key={pillar.name}
                      style={[styles.methodPillarCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    >
                      <View style={[styles.methodPillarAccent, { backgroundColor: colors.primary }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.methodPillarName, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                          {pillar.name}
                        </Text>
                        <Text style={[styles.methodPillarDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                          {pillar.desc}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              }
              ListEmptyComponent={
                <View style={styles.centered}>
                  <Feather name="file-text" size={32} color={colors.mutedForeground} />
                  <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>No articles yet</Text>
                </View>
              }
              renderItem={({ item }) => (
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {!!item.category && (
                    <View style={[styles.tag, { backgroundColor: colors.accent }]}>
                      <Text style={[styles.tagText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>{item.category}</Text>
                    </View>
                  )}
                  <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{item.title}</Text>
                  {!!(item.summary || item.content) && (
                    <Text style={[styles.cardBody, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]} numberOfLines={3}>
                      {item.summary || item.content}
                    </Text>
                  )}
                  <View style={styles.cardMeta}>
                    {!!item.author && <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{item.author}</Text>}
                    {!!item.publishedAt && <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{formatDate(item.publishedAt)}</Text>}
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
          {podcastsLoading && <View style={styles.centered}><ActivityIndicator color={colors.primary} size="large" /></View>}
          {!!podcastsError && (
            <View style={styles.centered}>
              <Feather name="alert-circle" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Could not load podcasts</Text>
              <Pressable onPress={() => refetchPodcasts()} style={({ pressed }) => [styles.retryBtn, { backgroundColor: colors.muted, opacity: pressed ? 0.75 : 1 }]}>
                <Text style={{ color: colors.foreground, fontFamily: "Inter_500Medium" }}>Retry</Text>
              </Pressable>
            </View>
          )}
          {!podcastsLoading && !podcastsError && (
            <FlatList
              data={podcasts}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16, paddingBottom: bottomPad }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.centered}>
                  <Feather name="mic" size={32} color={colors.mutedForeground} />
                  <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>No podcasts yet</Text>
                </View>
              }
              renderItem={({ item }) => (
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.podcastRow}>
                    <View style={[styles.podcastIcon, { backgroundColor: colors.accent }]}>
                      <Feather name="mic" size={20} color={colors.primary} />
                    </View>
                    <View style={styles.podcastInfo}>
                      <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{item.title}</Text>
                      {!!(item.episode || item.duration) && (
                        <View style={styles.podcastMeta}>
                          {!!item.episode && <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{item.episode}</Text>}
                          {!!item.duration && <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{item.duration}</Text>}
                        </View>
                      )}
                    </View>
                  </View>
                  {!!item.description && (
                    <Text style={[styles.cardBody, { color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 8 }]} numberOfLines={2}>
                      {item.description}
                    </Text>
                  )}
                </View>
              )}
            />
          )}
        </>
      )}

      {/* Knowledge Base */}
      {activeTab === "resources" && (
        <FlatList
          data={resourcesLoading ? [] : resources}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: bottomPad }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View>
              {/* AI Search */}
              <View style={[styles.searchSection, { borderBottomColor: colors.border }]}>
                <Text style={[styles.searchTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                  AI Knowledge Search
                </Text>
                <Text style={[styles.searchSubtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  Ask any question about hospice sales, regulations, or strategy
                </Text>
                <View style={[styles.searchRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
                  <Feather name="search" size={18} color={colors.mutedForeground} />
                  <TextInput
                    style={[styles.searchInput, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
                    placeholder="e.g. What are the six month prognosis criteria?"
                    placeholderTextColor={colors.mutedForeground}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                  />
                  {searchQuery.trim().length >= 5 && (
                    <Pressable
                      onPress={handleSearch}
                      style={({ pressed }) => [
                        styles.searchBtn,
                        { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
                      ]}
                    >
                      <Feather name="arrow-right" size={16} color={colors.primaryForeground} />
                    </Pressable>
                  )}
                </View>
                {searchLoading && (
                  <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <ActivityIndicator color={colors.primary} size="small" />
                    <Text style={[{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 14, marginLeft: 8 }]}>
                      Searching knowledge base...
                    </Text>
                  </View>
                )}
                {!!searchError && (
                  <View style={[styles.resultCard, { backgroundColor: colors.accent, borderColor: colors.border }]}>
                    <Text style={[{ color: colors.primary, fontFamily: "Inter_400Regular", fontSize: 14 }]}>{searchError}</Text>
                  </View>
                )}
                {!!searchResult && !searchLoading && (
                  <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[{ color: colors.foreground, fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 22 }]}>
                      {searchResult}
                    </Text>
                    <Pressable
                      onPress={() => { setSearchQuery(""); setSearchResult(""); setSearchError(null); }}
                      style={({ pressed }) => [{ marginTop: 10, alignSelf: "flex-start", borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderColor: colors.border, opacity: pressed ? 0.75 : 1 }]}
                    >
                      <Text style={[{ color: colors.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 13 }]}>New search</Text>
                    </Pressable>
                  </View>
                )}
              </View>

              {/* Resources header */}
              <View style={styles.resourcesHeader}>
                <Text style={[styles.searchTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                  Training Resources
                </Text>
                {resourcesLoading && <ActivityIndicator color={colors.primary} size="small" />}
                {!!resourcesError && (
                  <Pressable onPress={() => refetchResources()} style={({ pressed }) => [styles.retryBtn, { backgroundColor: colors.muted, opacity: pressed ? 0.75 : 1 }]}>
                    <Text style={{ color: colors.foreground, fontFamily: "Inter_500Medium" }}>Retry</Text>
                  </Pressable>
                )}
              </View>
            </View>
          }
          ListEmptyComponent={
            !resourcesLoading && !resourcesError ? (
              <View style={styles.centeredInline}>
                <Feather name="folder" size={32} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>No resources yet</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <View style={[styles.resourceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.resourceIcon, { backgroundColor: colors.accent }]}>
                <Feather name="file-text" size={18} color={colors.primary} />
              </View>
              <View style={styles.resourceInfo}>
                <Text style={[styles.resourceTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                  {item.title}
                </Text>
                {!!item.description && (
                  <Text style={[styles.resourceDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]} numberOfLines={2}>
                    {item.description}
                  </Text>
                )}
                {!!item.category && (
                  <Text style={[styles.resourceCategory, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>
                    {item.category}
                  </Text>
                )}
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 28, fontWeight: "700" },
  headerSubtitle: { fontSize: 14, marginTop: 2 },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabLabel: { fontSize: 12 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    gap: 12,
  },
  centeredInline: { alignItems: "center", paddingVertical: 32, gap: 12 },
  emptyText: { fontSize: 15, textAlign: "center" },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, marginTop: 4 },
  card: {
    borderWidth: 1,
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
  tagText: { fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 },
  cardTitle: { fontSize: 17, fontWeight: "700", lineHeight: 22, marginBottom: 6 },
  cardBody: { fontSize: 14, lineHeight: 20 },
  cardMeta: { flexDirection: "row", gap: 12, marginTop: 10 },
  metaText: { fontSize: 12 },
  podcastRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  podcastIcon: {
    width: 44, height: 44, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  podcastInfo: { flex: 1 },
  podcastMeta: { flexDirection: "row", gap: 8, marginTop: 4 },
  searchSection: { paddingVertical: 20, borderBottomWidth: 1, marginBottom: 20 },
  searchTitle: { fontSize: 18, fontWeight: "700", marginBottom: 4 },
  searchSubtitle: { fontSize: 14, marginBottom: 12 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, minHeight: 24 },
  searchBtn: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
  },
  resultCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  resourcesHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  resourceCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  resourceIcon: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  resourceInfo: { flex: 1 },
  resourceTitle: { fontSize: 15, fontWeight: "600" },
  resourceDesc: { fontSize: 13, lineHeight: 18, marginTop: 3 },
  resourceCategory: { fontSize: 12, marginTop: 4 },
  methodSection: {
    borderBottomWidth: 1,
    paddingBottom: 20,
    marginBottom: 8,
  },
  methodOverline: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  methodIntro: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  methodPillarCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  methodPillarAccent: {
    width: 3,
    height: 40,
    borderRadius: 2,
    marginTop: 2,
    flexShrink: 0,
  },
  methodPillarName: { fontSize: 16, fontWeight: "800", marginBottom: 3 },
  methodPillarDesc: { fontSize: 13, lineHeight: 19 },
});
