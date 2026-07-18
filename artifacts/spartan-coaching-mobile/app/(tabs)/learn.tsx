import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import { apiGet } from "@/lib/api";

type LearnTab = "articles" | "podcasts";

type Article = {
  id: number;
  title: string;
  summary?: string;
  content?: string;
  author?: string;
  publishedAt?: number;
  category?: string;
};

type Podcast = {
  id: number;
  title: string;
  description?: string;
  episode?: string;
  duration?: string;
  publishedAt?: number;
  host?: string;
};

export default function LearnScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<LearnTab>("articles");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 90;

  const { data: articles, isLoading: articlesLoading, error: articlesError, refetch: refetchArticles } =
    useQuery<Article[]>({
      queryKey: ["articles"],
      queryFn: () => apiGet<Article[]>("/api/articles"),
      enabled: activeTab === "articles",
    });

  const { data: podcasts, isLoading: podcastsLoading, error: podcastsError, refetch: refetchPodcasts } =
    useQuery<Podcast[]>({
      queryKey: ["podcasts"],
      queryFn: () => apiGet<Podcast[]>("/api/podcasts"),
      enabled: activeTab === "podcasts",
    });

  const formatDate = (ts?: number) => {
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
          Articles, podcasts & resources
        </Text>
      </View>

      {/* Tab bar */}
      <View style={[styles.tabBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        {(["articles", "podcasts"] as LearnTab[]).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={({ pressed }) => [
              styles.tabBtn,
              activeTab === tab && { borderBottomColor: colors.primary },
              { opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <Feather
              name={tab === "articles" ? "file-text" : "mic"}
              size={16}
              color={activeTab === tab ? colors.primary : colors.mutedForeground}
            />
            <Text
              style={[
                styles.tabLabel,
                { color: activeTab === tab ? colors.primary : colors.mutedForeground },
                { fontFamily: activeTab === tab ? "Inter_600SemiBold" : "Inter_400Regular" },
                { textTransform: "capitalize" },
              ]}
            >
              {tab}
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
            <View style={styles.centered}>
              <Feather name="alert-circle" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Could not load articles
              </Text>
              <Pressable
                onPress={() => refetchArticles()}
                style={({ pressed }) => [styles.retryBtn, { backgroundColor: colors.muted, opacity: pressed ? 0.75 : 1 }]}
              >
                <Text style={[{ color: colors.foreground, fontFamily: "Inter_500Medium" }]}>Retry</Text>
              </Pressable>
            </View>
          )}
          {!articlesLoading && !articlesError && (
            <FlatList
              data={articles ?? []}
              keyExtractor={(item) => String(item.id)}
              scrollEnabled={!!(articles && articles.length > 0)}
              contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16, paddingBottom: bottomPad }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.centered}>
                  <Feather name="file-text" size={32} color={colors.mutedForeground} />
                  <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    No articles yet
                  </Text>
                </View>
              }
              renderItem={({ item }) => (
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {!!item.category && (
                    <View style={[styles.tag, { backgroundColor: colors.accent }]}>
                      <Text style={[styles.tagText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                        {item.category}
                      </Text>
                    </View>
                  )}
                  <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                    {item.title}
                  </Text>
                  {!!(item.summary || item.content) && (
                    <Text
                      style={[styles.cardBody, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}
                      numberOfLines={3}
                    >
                      {item.summary || item.content}
                    </Text>
                  )}
                  <View style={styles.cardMeta}>
                    {!!item.author && (
                      <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                        {item.author}
                      </Text>
                    )}
                    {!!item.publishedAt && (
                      <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
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
            <View style={styles.centered}>
              <Feather name="alert-circle" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Could not load podcasts
              </Text>
              <Pressable
                onPress={() => refetchPodcasts()}
                style={({ pressed }) => [styles.retryBtn, { backgroundColor: colors.muted, opacity: pressed ? 0.75 : 1 }]}
              >
                <Text style={[{ color: colors.foreground, fontFamily: "Inter_500Medium" }]}>Retry</Text>
              </Pressable>
            </View>
          )}
          {!podcastsLoading && !podcastsError && (
            <FlatList
              data={podcasts ?? []}
              keyExtractor={(item) => String(item.id)}
              scrollEnabled={!!(podcasts && podcasts.length > 0)}
              contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16, paddingBottom: bottomPad }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.centered}>
                  <Feather name="mic" size={32} color={colors.mutedForeground} />
                  <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    No podcasts yet
                  </Text>
                </View>
              }
              renderItem={({ item }) => (
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.podcastRow}>
                    <View style={[styles.podcastIcon, { backgroundColor: colors.accent }]}>
                      <Feather name="mic" size={20} color={colors.primary} />
                    </View>
                    <View style={styles.podcastInfo}>
                      <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                        {item.title}
                      </Text>
                      {!!(item.episode || item.duration) && (
                        <View style={styles.podcastMeta}>
                          {!!item.episode && (
                            <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                              {item.episode}
                            </Text>
                          )}
                          {!!item.duration && (
                            <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                              {item.duration}
                            </Text>
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                  {!!item.description && (
                    <Text
                      style={[styles.cardBody, { color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 8 }]}
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
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabLabel: { fontSize: 14 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    gap: 12,
  },
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
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  podcastInfo: { flex: 1 },
  podcastMeta: { flexDirection: "row", gap: 8, marginTop: 4 },
});
