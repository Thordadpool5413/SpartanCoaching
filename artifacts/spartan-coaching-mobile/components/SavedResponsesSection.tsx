import React, { useState } from "react";
import { Pressable, Share, StyleSheet, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { font } from "@/lib/typography";
import type { SavedResponse } from "@/hooks/useSavedResponses";

function formatSavedDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const TYPE_LABEL: Record<string, string> = {
  roleplay: "Role-Play",
  objection: "Objection",
  playbook: "Playbook",
  email: "Email",
};

export function SavedResponsesSection({
  items,
  onDelete,
}: {
  items: SavedResponse[];
  onDelete: (id: string) => Promise<void>;
}) {
  const colors = useColors();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (items.length === 0) return null;

  return (
    <View style={{ marginTop: 28 }}>
      <View style={styles.sectionHeader}>
        <Feather name="bookmark" size={14} color={colors.mutedForeground} />
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }, font("semibold")]}>
          Saved ({items.length})
        </Text>
      </View>
      {items.map((item) => {
        const isOpen = expanded === item.id;
        const isCopied = copiedId === item.id;
        const typeLabel = TYPE_LABEL[item.toolType] ?? item.toolType;
        return (
          <View
            key={item.id}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Pressable
              onPress={() => setExpanded(isOpen ? null : item.id)}
              style={({ pressed }) => [styles.cardHeader, { opacity: pressed ? 0.75 : 1 }]}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.cardTitle, { color: colors.foreground }, font("semibold")]}
                  numberOfLines={2}
                >
                  {item.title}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                  {typeLabel ? (
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor: `${colors.mutedForeground}18`,
                          borderColor: `${colors.mutedForeground}40`,
                        },
                      ]}
                    >
                      <Text style={[{ color: colors.mutedForeground, fontSize: 10 }, font("semibold")]}>
                        {typeLabel}
                      </Text>
                    </View>
                  ) : null}
                  <Text style={[{ color: colors.mutedForeground, fontSize: 12 }, font("regular")]}>
                    {formatSavedDate(item.savedAt)}
                  </Text>
                </View>
              </View>
              <View style={styles.cardActions}>
                <Pressable
                  onPress={() => onDelete(item.id)}
                  hitSlop={8}
                  style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                >
                  <Feather name="trash-2" size={15} color={colors.mutedForeground} />
                </Pressable>
                <Feather
                  name={isOpen ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={colors.mutedForeground}
                />
              </View>
            </Pressable>
            {isOpen && (
              <View style={[styles.cardBody, { borderTopColor: colors.border }]}>
                <Text style={[{ color: colors.foreground, fontSize: 14, lineHeight: 21 }, font("regular")]}>
                  {item.response}
                </Text>
                <View style={styles.bodyActions}>
                  <Pressable
                    onPress={async () => {
                      await Clipboard.setStringAsync(item.response);
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      setCopiedId(item.id);
                      setTimeout(
                        () => setCopiedId((prev) => (prev === item.id ? null : prev)),
                        2000,
                      );
                    }}
                    style={({ pressed }) => [
                      styles.actionBtn,
                      {
                        borderColor: isCopied ? colors.primary : colors.border,
                        backgroundColor: isCopied ? `${colors.primary}18` : "transparent",
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <Feather
                      name={isCopied ? "check" : "copy"}
                      size={14}
                      color={isCopied ? colors.primary : colors.mutedForeground}
                    />
                    <Text
                      style={[
                        { fontSize: 13 },
                        { color: isCopied ? colors.primary : colors.mutedForeground },
                        font("semibold"),
                      ]}
                    >
                      {isCopied ? "Copied!" : "Copy"}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={async () => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      await Share.share({ message: item.response, title: item.title });
                    }}
                    style={({ pressed }) => [
                      styles.actionBtn,
                      { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <Feather name="share" size={14} color={colors.mutedForeground} />
                    <Text style={[{ fontSize: 13, color: colors.mutedForeground }, font("semibold")]}>
                      Share
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  sectionTitle: { fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5 },
  card: { borderWidth: 1, borderRadius: 12, marginBottom: 10, overflow: "hidden" },
  cardHeader: { flexDirection: "row", alignItems: "center", padding: 14, gap: 10 },
  cardTitle: { fontSize: 14, marginBottom: 2 },
  cardActions: { flexDirection: "row", alignItems: "center", gap: 14 },
  cardBody: { borderTopWidth: 1, padding: 14 },
  bodyActions: { flexDirection: "row", gap: 8, marginTop: 12 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
});
