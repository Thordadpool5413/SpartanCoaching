import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

export type CitationItem = {
  id: string;
  title: string;
  category: string;
  excerpt?: string;
};

/** Matches web “Spartan sources” result chrome. */
export function CitationsBlock({
  title = "Spartan sources",
  items,
}: {
  title?: string;
  items: CitationItem[];
}) {
  const colors = useColors();
  if (!items?.length) return null;

  return (
    <View
      style={[
        styles.box,
        { borderColor: colors.primary + "40", backgroundColor: colors.primary + "14" },
      ]}
      testID="spartan-citations"
    >
      <Text style={[styles.kicker, { color: colors.primary }]}>{title}</Text>
      {items.map((c) => (
        <View key={c.id} style={styles.row}>
          <Text style={[styles.itemTitle, { color: colors.foreground }]}>{c.title}</Text>
          <Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>{c.category}</Text>
          {c.excerpt ? (
            <Text style={[styles.excerpt, { color: colors.mutedForeground }]} numberOfLines={2}>
              {c.excerpt}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  kicker: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    fontFamily: "Inter_700Bold",
  },
  row: { gap: 2 },
  itemTitle: { fontSize: 13, fontWeight: "700", fontFamily: "Inter_600SemiBold" },
  itemMeta: { fontSize: 11, fontFamily: "Inter_400Regular" },
  excerpt: { fontSize: 12, lineHeight: 16, marginTop: 2, fontFamily: "Inter_400Regular" },
});
