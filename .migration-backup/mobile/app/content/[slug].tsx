import { useMemo } from "react";
import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

import { sharePdfDocument } from "@/components/export-document";
import { Card, EmptyState, Pill, PrimaryButton, PressableCard, ScreenScrollView, SectionHeader, SecondaryButton } from "@/components/ui";
import { CONTENT_PAGES } from "@/lib/catalog";
import { formatDate, slugToLabel } from "@/lib/format";
import { FavoriteItem, recordActivity, STORAGE_KEYS, toggleFavorite, useStoredJson } from "@/lib/storage";
import { colors, spacing } from "@/lib/theme";

export default function ContentPageScreen() {
  const params = useLocalSearchParams<{ slug?: string }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug ?? "";
  const page = CONTENT_PAGES[slug];
  const [favorites] = useStoredJson<FavoriteItem[]>(STORAGE_KEYS.favorites, []);

  const favoriteId = `content-${slug}`;
  const isFavorite = favorites.some((favorite) => favorite.id === favoriteId);

  const sections = useMemo(
    () => page?.sections ?? [],
    [page]
  );

  if (!page) {
    return (
      <ScreenScrollView>
        <View style={{ paddingTop: 16 }}>
          <EmptyState
            title="Page not found"
            body={`We do not have a content page for "${slugToLabel(slug)}" yet.`}
          />
        </View>
      </ScreenScrollView>
    );
  }

  async function handleShare() {
    await sharePdfDocument({
      title: page.title,
      subtitle: page.summary,
      sections: [
        {
          heading: "Highlights",
          body: page.highlights,
        },
        ...page.sections,
      ],
    });
    recordActivity({
      title: "Shared knowledge page",
      subtitle: page.title,
      kind: "content",
    });
  }

  function handleFavoriteToggle() {
    toggleFavorite({
      id: favoriteId,
      type: "content",
      title: page.title,
      subtitle: page.summary,
      href: `/content/${page.slug}`,
    });
    recordActivity({
      title: isFavorite ? "Removed content favorite" : "Saved content favorite",
      subtitle: page.title,
      kind: "content",
    });
  }

  return (
    <ScreenScrollView contentContainerStyle={{ gap: spacing.lg }}>
      <View style={{ gap: 10, paddingTop: 8 }}>
        <Pill tone="warning">{page.kicker}</Pill>
        <Text style={{ color: colors.text, fontSize: 30, lineHeight: 34, fontWeight: "900" }}>
          {page.title}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 22 }}>
          {page.summary}
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          <Pill tone="neutral">{page.slug}</Pill>
          <Pill tone="neutral">Updated {formatDate(new Date())}</Pill>
        </View>
      </View>

      <Card>
        <SectionHeader title="Highlights" subtitle="Quick takeaways from this page." />
        <View style={{ gap: spacing.sm }}>
          {page.highlights.map((item) => (
            <PressableCard key={item} disabled>
              <Text style={{ color: colors.text, fontSize: 14, lineHeight: 20 }}>{item}</Text>
            </PressableCard>
          ))}
        </View>
      </Card>

      <View style={{ gap: spacing.sm }}>
        {sections.map((section) => (
          <Card key={section.heading}>
            <SectionHeader title={section.heading} />
            <View style={{ gap: spacing.sm }}>
              {section.body.map((line) => (
                <Text key={line} selectable style={{ color: colors.text, fontSize: 14, lineHeight: 21 }}>
                  {line}
                </Text>
              ))}
            </View>
          </Card>
        ))}
      </View>

      <Card>
        <SectionHeader title="Actions" subtitle="Save it for later or share a clean PDF summary." />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          <PrimaryButton title={isFavorite ? "Saved" : "Save page"} onPress={handleFavoriteToggle} />
          <SecondaryButton title="Share PDF" onPress={handleShare} />
        </View>
      </Card>
    </ScreenScrollView>
  );
}
