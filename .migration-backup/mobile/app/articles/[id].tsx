import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { Linking, Text, View } from "react-native";

import { sharePdfDocument } from "@/components/export-document";
import { Card, EmptyState, Pill, PrimaryButton, ScreenScrollView, SectionHeader, SecondaryButton } from "@/components/ui";
import { api, apiErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { FavoriteItem, recordActivity, STORAGE_KEYS, toggleFavorite, useStoredJson } from "@/lib/storage";
import { colors, spacing } from "@/lib/theme";

type Article = {
  id: number;
  title: string;
  description: string;
  linkedinUrl: string;
  publishDate: number;
  featured?: boolean;
  pdfUrl?: string | null;
};

export default function ArticleScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const idValue = Array.isArray(params.id) ? params.id[0] : params.id ?? "";
  const articleId = Number(idValue);
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites] = useStoredJson<FavoriteItem[]>(STORAGE_KEYS.favorites, []);

  const favoriteId = `article-${articleId}`;
  const isFavorite = favorites.some((favorite) => favorite.id === favoriteId);

  useEffect(() => {
    if (!Number.isFinite(articleId)) {
      setError("That article ID is not valid.");
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    api
      .getArticle(articleId)
      .then((response) => {
        if (!mounted) return;
        setArticle(response.article as Article);
      })
      .catch((fetchError) => {
        if (!mounted) return;
        setError(apiErrorMessage(fetchError, "Unable to load the article right now."));
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [articleId]);

  const sections = useMemo(
    () =>
      article
        ? [
            {
              heading: "Summary",
              body: [article.description],
            },
            {
              heading: "Source links",
              body: [article.linkedinUrl, article.pdfUrl ?? "No PDF attached."].filter(Boolean),
            },
          ]
        : [],
    [article]
  );

  async function handleShare() {
    if (!article) return;
    await sharePdfDocument({
      title: article.title,
      subtitle: article.description,
      sections: [
        { heading: "Article details", body: [`Published ${formatDate(article.publishDate)}`, article.linkedinUrl] },
        ...(article.pdfUrl ? [{ heading: "PDF", body: article.pdfUrl }] : []),
      ],
    });
    recordActivity({
      title: "Shared article",
      subtitle: article.title,
      kind: "article",
    });
  }

  function handleFavoriteToggle() {
    if (!article) return;
    toggleFavorite({
      id: favoriteId,
      type: "article",
      title: article.title,
      subtitle: article.description,
      href: `/articles/${article.id}`,
    });
    recordActivity({
      title: isFavorite ? "Removed article favorite" : "Saved article favorite",
      subtitle: article.title,
      kind: "article",
    });
  }

  if (!Number.isFinite(articleId)) {
    return (
      <ScreenScrollView>
        <View style={{ paddingTop: 16 }}>
          <EmptyState title="Invalid article" body="The article route needs a numeric ID." />
        </View>
      </ScreenScrollView>
    );
  }

  if (loading) {
    return (
      <ScreenScrollView>
        <View style={{ paddingTop: 16 }}>
          <Card>
            <Text style={{ color: colors.muted }}>Loading article...</Text>
          </Card>
        </View>
      </ScreenScrollView>
    );
  }

  if (error || !article) {
    return (
      <ScreenScrollView>
        <View style={{ paddingTop: 16 }}>
          <EmptyState title="Article unavailable" body={error ?? "We could not load the article from the backend."} />
        </View>
      </ScreenScrollView>
    );
  }

  return (
    <ScreenScrollView contentContainerStyle={{ gap: spacing.lg }}>
      <View style={{ gap: 10, paddingTop: 8 }}>
        <Pill tone={article.featured ? "accent" : "neutral"}>{article.featured ? "Featured" : "Article"}</Pill>
        <Text style={{ color: colors.text, fontSize: 30, lineHeight: 34, fontWeight: "900" }}>
          {article.title}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 22 }}>
          {article.description}
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          <Pill tone="neutral">{formatDate(article.publishDate)}</Pill>
          <Pill tone="neutral">{articleId}</Pill>
        </View>
      </View>

      <Card>
        <SectionHeader title="Content" subtitle="A mobile-friendly view of the article metadata." />
        <View style={{ gap: spacing.sm }}>
          {sections.map((section) => (
            <View key={section.heading} style={{ gap: 8 }}>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: "800" }}>{section.heading}</Text>
              {section.body.map((line) => (
                <Text key={line} selectable style={{ color: colors.text, fontSize: 14, lineHeight: 21 }}>
                  {line}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <SectionHeader title="Actions" subtitle="Open the live links, save the page, or share a clean PDF." />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          <PrimaryButton title={isFavorite ? "Saved" : "Save article"} onPress={handleFavoriteToggle} />
          <SecondaryButton title="Open LinkedIn" onPress={() => Linking.openURL(article.linkedinUrl)} />
          {article.pdfUrl ? <SecondaryButton title="Open PDF" onPress={() => Linking.openURL(article.pdfUrl!)} /> : null}
          <SecondaryButton title="Share PDF" onPress={handleShare} />
        </View>
      </Card>
    </ScreenScrollView>
  );
}
