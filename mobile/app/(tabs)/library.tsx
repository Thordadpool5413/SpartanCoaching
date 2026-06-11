import { useEffect, useMemo, useState } from "react";
import { router } from "expo-router";
import { Linking, Text, View } from "react-native";
import { Image } from "expo-image";

import { Card, Pill, PressableCard, ScreenScrollView, SectionHeader, SecondaryButton } from "@/components/ui";
import { CONTENT_PAGES_LIST } from "@/lib/catalog";
import { api, apiErrorMessage } from "@/lib/api";
import { formatDate, formatRelativeTime } from "@/lib/format";
import { FavoriteItem, STORAGE_KEYS, toggleFavorite, useStoredJson } from "@/lib/storage";
import { colors, radius, spacing } from "@/lib/theme";

type SectionKey = "articles" | "resources" | "podcasts" | "knowledge";

type Article = {
  id: number;
  title: string;
  description: string;
  linkedinUrl: string;
  publishDate: number;
  featured?: boolean;
  pdfUrl?: string | null;
};

type Resource = {
  id: number;
  title: string;
  description?: string | null;
  fileUrl: string;
  category: string;
};

type Podcast = {
  id: number;
  title: string;
  description?: string | null;
  audioUrl?: string | null;
  episodeNumber?: number | null;
  duration?: string | null;
  publishDate?: string | number | null;
};

const sections: Array<{ key: SectionKey; label: string }> = [
  { key: "articles", label: "Articles" },
  { key: "resources", label: "Resources" },
  { key: "podcasts", label: "Podcasts" },
  { key: "knowledge", label: "Knowledge base" },
];

export default function LibraryScreen() {
  const [section, setSection] = useState<SectionKey>("articles");
  const [favorites] = useStoredJson<FavoriteItem[]>(STORAGE_KEYS.favorites, []);
  const [articles, setArticles] = useState<Article[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.allSettled([api.getArticles(), api.getResources(), api.getPodcasts()]).then((results) => {
      if (!mounted) return;
      const [articlesResult, resourcesResult, podcastsResult] = results;
      if (articlesResult.status === "fulfilled") setArticles(articlesResult.value.articles as Article[]);
      if (resourcesResult.status === "fulfilled") setResources(resourcesResult.value.resources as Resource[]);
      if (podcastsResult.status === "fulfilled") setPodcasts(podcastsResult.value.podcasts as Podcast[]);
      const failed = [articlesResult, resourcesResult, podcastsResult].find((result) => result.status === "rejected");
      if (failed?.status === "rejected") {
        setError(apiErrorMessage(failed.reason, "Unable to load the live library right now."));
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const favoritesById = useMemo(() => new Set(favorites.map((favorite) => favorite.id)), [favorites]);

  return (
    <ScreenScrollView contentContainerStyle={{ gap: spacing.lg }}>
      <View style={{ gap: 10, paddingTop: 8 }}>
        <Pill tone="warning">Library</Pill>
        <Text style={{ color: colors.text, fontSize: 30, lineHeight: 34, fontWeight: "900" }}>
          Knowledge, references, and proof points.
        </Text>
        <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 22 }}>
          Keep the useful stuff close: articles, resources, podcasts, and static content pages all live in one mobile library.
        </Text>
      </View>

      <Card>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          {sections.map((item) => (
            <SecondaryButton
              key={item.key}
              title={item.label}
              onPress={() => setSection(item.key)}
            />
          ))}
        </View>
      </Card>

      <Card>
        <SectionHeader
          title="Favorites"
          subtitle="Saved items from the mobile library."
          action={<SecondaryButton title="View all" onPress={() => setSection("knowledge")} />}
        />
        {favorites.length === 0 ? (
          <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
            Favorite an article, resource, or content page to bring it back quickly later.
          </Text>
        ) : (
          <View style={{ gap: spacing.sm }}>
            {favorites.slice(0, 3).map((favorite) => (
              <PressableCard
                key={favorite.id}
                onPress={() => favorite.href && router.push(favorite.href)}
              >
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: "800" }}>{favorite.title}</Text>
                {favorite.subtitle ? (
                  <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 4 }}>{favorite.subtitle}</Text>
                ) : null}
              </PressableCard>
            ))}
          </View>
        )}
      </Card>

      {section === "articles" ? (
        <Card>
          <SectionHeader title="Articles" subtitle="Published thought leadership and field notes." />
          {loading ? (
            <Text style={{ color: colors.muted }}>Loading...</Text>
          ) : error ? (
            <Text style={{ color: colors.danger }}>{error}</Text>
          ) : articles.length === 0 ? (
            <Text style={{ color: colors.muted }}>No articles available yet.</Text>
          ) : (
            <View style={{ gap: spacing.sm }}>
              {articles.map((article) => (
                <PressableCard
                  key={article.id}
                  onPress={() => router.push(`/articles/${article.id}`)}
                >
                  <View style={{ gap: 6 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing.sm }}>
                      <Text style={{ color: colors.text, fontSize: 15, fontWeight: "800", flex: 1 }}>
                        {article.title}
                      </Text>
                      {article.featured ? <Pill tone="accent">Featured</Pill> : null}
                    </View>
                    <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 17 }}>{article.description}</Text>
                    <Text style={{ color: colors.muted, fontSize: 11 }}>{formatDate(article.publishDate)}</Text>
                  </View>
                </PressableCard>
              ))}
            </View>
          )}
        </Card>
      ) : null}

      {section === "resources" ? (
        <Card>
          <SectionHeader title="Resources" subtitle="Guides, PDFs, and file-based references." />
          {loading ? (
            <Text style={{ color: colors.muted }}>Loading...</Text>
          ) : resources.length === 0 ? (
            <Text style={{ color: colors.muted }}>No resources available yet.</Text>
          ) : (
            <View style={{ gap: spacing.sm }}>
              {resources.map((resource) => {
                const href = `/resources/${resource.id}`;
                const favoriteId = `resource-${resource.id}`;
                const isImage = /\.(png|jpe?g|webp|gif|avif)$/i.test(resource.fileUrl);
                return (
                  <PressableCard
                    key={resource.id}
                    onPress={() => router.push(href)}
                    style={{
                      borderColor: favoritesById.has(favoriteId) ? colors.accent : colors.border,
                    }}
                  >
                    <View style={{ flexDirection: "row", gap: spacing.md }}>
                      <View
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: radius.md,
                          backgroundColor: colors.surfaceAlt,
                          overflow: "hidden",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {isImage ? (
                          <Image
                            source={{ uri: resource.fileUrl }}
                            style={{ width: "100%", height: "100%" }}
                            contentFit="cover"
                          />
                        ) : (
                          <Text style={{ color: colors.text, fontSize: 11, fontWeight: "800" }}>
                            {resource.category.slice(0, 3).toUpperCase()}
                          </Text>
                        )}
                      </View>
                      <View style={{ flex: 1, gap: 6 }}>
                        <Text style={{ color: colors.text, fontSize: 15, fontWeight: "800" }}>
                          {resource.title}
                        </Text>
                        <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 17 }}>
                          {resource.description ?? "Reference material from the coaching library."}
                        </Text>
                        <Pill tone="neutral">{resource.category}</Pill>
                      </View>
                    </View>
                  </PressableCard>
                );
              })}
            </View>
          )}
        </Card>
      ) : null}

      {section === "podcasts" ? (
        <Card>
          <SectionHeader title="Podcasts" subtitle="Long-form reinforcement for travel and downtime." />
          {loading ? (
            <Text style={{ color: colors.muted }}>Loading...</Text>
          ) : podcasts.length === 0 ? (
            <Text style={{ color: colors.muted }}>No podcasts available yet.</Text>
          ) : (
            <View style={{ gap: spacing.sm }}>
              {podcasts.map((podcast) => (
                <PressableCard
                  key={podcast.id}
                  onPress={() => podcast.audioUrl && Linking.openURL(podcast.audioUrl)}
                >
                  <View style={{ gap: 6 }}>
                    <Text style={{ color: colors.text, fontSize: 15, fontWeight: "800" }}>{podcast.title}</Text>
                    <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 17 }}>
                      {podcast.description ?? "Podcast episode"}
                    </Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                      {podcast.episodeNumber ? <Pill tone="neutral">Ep {podcast.episodeNumber}</Pill> : null}
                      {podcast.duration ? <Pill tone="neutral">{podcast.duration}</Pill> : null}
                      {podcast.publishDate ? (
                        <Pill tone="neutral">{formatRelativeTime(podcast.publishDate)}</Pill>
                      ) : null}
                    </View>
                  </View>
                </PressableCard>
              ))}
            </View>
          )}
        </Card>
      ) : null}

      {section === "knowledge" ? (
        <Card>
          <SectionHeader title="Knowledge base" subtitle="Static pages and explainers from the product library." />
          <View style={{ gap: spacing.sm }}>
            {CONTENT_PAGES_LIST.map((page) => (
              <PressableCard key={page.slug} onPress={() => router.push(`/content/${page.slug}`)}>
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: "800" }}>{page.title}</Text>
                <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 4 }}>{page.summary}</Text>
              </PressableCard>
            ))}
          </View>
        </Card>
      ) : null}
    </ScreenScrollView>
  );
}
