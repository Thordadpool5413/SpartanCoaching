import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { Linking, Text, View } from "react-native";

import { sharePdfDocument } from "@/components/export-document";
import { Card, EmptyState, Pill, PrimaryButton, ScreenScrollView, SectionHeader, SecondaryButton } from "@/components/ui";
import { api, apiErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { FavoriteItem, recordActivity, STORAGE_KEYS, toggleFavorite, useStoredJson } from "@/lib/storage";
import { colors, spacing } from "@/lib/theme";

type Resource = {
  id: number;
  title: string;
  description?: string | null;
  fileUrl: string;
  category: string;
};

export default function ResourceScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const idValue = Array.isArray(params.id) ? params.id[0] : params.id ?? "";
  const resourceId = Number(idValue);
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites] = useStoredJson<FavoriteItem[]>(STORAGE_KEYS.favorites, []);

  const favoriteId = `resource-${resourceId}`;
  const isFavorite = favorites.some((favorite) => favorite.id === favoriteId);

  useEffect(() => {
    if (!Number.isFinite(resourceId)) {
      setError("That resource ID is not valid.");
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    api
      .getResource(resourceId)
      .then((response) => {
        if (!mounted) return;
        setResource(response.resource as Resource);
      })
      .catch((fetchError) => {
        if (!mounted) return;
        setError(apiErrorMessage(fetchError, "Unable to load the resource right now."));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [resourceId]);

  const notes = useMemo(
    () =>
      resource
        ? [
            `Category: ${resource.category}`,
            resource.description ?? "Reference material from the coaching library.",
            `File: ${resource.fileUrl}`,
          ]
        : [],
    [resource]
  );

  async function handleShare() {
    if (!resource) return;
    await sharePdfDocument({
      title: resource.title,
      subtitle: resource.description ?? resource.category,
      sections: [
        {
          heading: "Resource details",
          body: notes,
        },
      ],
    });
    recordActivity({
      title: "Shared resource",
      subtitle: resource.title,
      kind: "resource",
    });
  }

  function handleFavoriteToggle() {
    if (!resource) return;
    toggleFavorite({
      id: favoriteId,
      type: "resource",
      title: resource.title,
      subtitle: resource.description ?? resource.category,
      href: `/resources/${resource.id}`,
    });
    recordActivity({
      title: isFavorite ? "Removed resource favorite" : "Saved resource favorite",
      subtitle: resource.title,
      kind: "resource",
    });
  }

  if (!Number.isFinite(resourceId)) {
    return (
      <ScreenScrollView>
        <View style={{ paddingTop: 16 }}>
          <EmptyState title="Invalid resource" body="The resource route needs a numeric ID." />
        </View>
      </ScreenScrollView>
    );
  }

  if (loading) {
    return (
      <ScreenScrollView>
        <View style={{ paddingTop: 16 }}>
          <Card>
            <Text style={{ color: colors.muted }}>Loading resource...</Text>
          </Card>
        </View>
      </ScreenScrollView>
    );
  }

  if (error || !resource) {
    return (
      <ScreenScrollView>
        <View style={{ paddingTop: 16 }}>
          <EmptyState title="Resource unavailable" body={error ?? "We could not load the resource from the backend."} />
        </View>
      </ScreenScrollView>
    );
  }

  return (
    <ScreenScrollView contentContainerStyle={{ gap: spacing.lg }}>
      <View style={{ gap: 10, paddingTop: 8 }}>
        <Pill tone="warning">{resource.category}</Pill>
        <Text style={{ color: colors.text, fontSize: 30, lineHeight: 34, fontWeight: "900" }}>
          {resource.title}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 22 }}>
          {resource.description ?? "Reference material from the coaching library."}
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          <Pill tone="neutral">Updated {formatDate(new Date())}</Pill>
          <Pill tone="neutral">#{resourceId}</Pill>
        </View>
      </View>

      <Card>
        <SectionHeader title="Preview" subtitle="Open the file, or inspect it inline if it is a video." />
        <View style={{ gap: 8 }}>
          <Pill tone="neutral">Open file for the native preview experience</Pill>
          <Text selectable style={{ color: colors.text, fontSize: 14, lineHeight: 21 }}>
            {resource.fileUrl}
          </Text>
        </View>
        <View style={{ gap: 8 }}>
          {notes.map((line) => (
            <Text key={line} selectable style={{ color: colors.text, fontSize: 14, lineHeight: 21 }}>
              {line}
            </Text>
          ))}
        </View>
      </Card>

      <Card>
        <SectionHeader title="Actions" subtitle="Save it, open the file, or share a mobile-ready PDF summary." />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          <PrimaryButton title={isFavorite ? "Saved" : "Save resource"} onPress={handleFavoriteToggle} />
          <SecondaryButton title="Open file" onPress={() => Linking.openURL(resource.fileUrl)} />
          <SecondaryButton title="Share PDF" onPress={handleShare} />
        </View>
      </Card>
    </ScreenScrollView>
  );
}
