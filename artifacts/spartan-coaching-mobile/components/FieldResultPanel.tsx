import React, { useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { font } from "@/lib/typography";

/**
 * Field-ready result card — copy, share, optional save, loading skeleton, empty.
 * Mirrors web ToolResultPanel craft for mobile satellite tools.
 */
export function FieldResultPanel({
  title = "Result",
  content,
  loading,
  empty,
  error,
  disclaimer = "Do not enter PHI · Coaching aid only",
  onSave,
  saved,
  children,
}: {
  title?: string;
  content?: string;
  loading?: boolean;
  empty?: boolean;
  error?: string | null;
  disclaimer?: string;
  onSave?: () => void | Promise<void>;
  saved?: boolean;
  children?: ReactNode;
}) {
  const colors = useColors();
  const [copied, setCopied] = useState(false);
  const hasBody = Boolean(content?.trim()) || Boolean(children);

  const handleCopy = async () => {
    if (!content?.trim()) return;
    await Clipboard.setStringAsync(content);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!content?.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Share.share({ message: content, title });
  };

  if (loading) {
    return (
      <View
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        accessibilityRole="progressbar"
        accessibilityLabel="Loading result"
        accessibilityState={{ busy: true }}
      >
        <View style={styles.skeletonRow}>
          <ActivityIndicator color={colors.primary} size="small" />
          <Text style={[styles.skeletonText, { color: colors.mutedForeground }, font("regular")]}>
            Building your field-ready answer…
          </Text>
        </View>
        <View style={[styles.skelBar, { backgroundColor: colors.muted, width: "92%" }]} />
        <View style={[styles.skelBar, { backgroundColor: colors.muted, width: "78%" }]} />
        <View style={[styles.skelBar, { backgroundColor: colors.muted, width: "64%" }]} />
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        accessibilityRole="alert"
        accessibilityLiveRegion="assertive"
      >
        <Text style={[styles.error, { color: colors.primary }, font("regular")]}>{error}</Text>
      </View>
    );
  }

  if (empty && !hasBody) {
    return (
      <View
        style={[styles.card, styles.empty, { backgroundColor: colors.muted, borderColor: colors.border }]}
        accessibilityRole="summary"
        accessibilityLabel="No result yet. Run the tool to get a copy-ready result for the field."
      >
        <Feather name="file-text" size={20} color={colors.mutedForeground} />
        <Text style={[{ color: colors.mutedForeground, marginTop: 8, textAlign: "center" }, font("regular")]}>
          Run the tool to get a copy-ready result for the field.
        </Text>
      </View>
    );
  }

  if (!hasBody) return null;

  return (
    <View
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      accessibilityRole="summary"
      accessibilityLabel={title}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.topRail} accessibilityElementsHidden>
        <View style={[styles.railLine, { backgroundColor: colors.primary }]} />
      </View>
      <Text
        accessibilityRole="header"
        style={[styles.kicker, { color: colors.primary }, font("bold")]}
      >
        {title}
      </Text>
      {content ? (
        <Text style={[styles.body, { color: colors.foreground }, font("regular")]}>{content}</Text>
      ) : null}
      {children}
      <View style={styles.actions}>
        {content ? (
          <Pressable
            onPress={handleCopy}
            style={({ pressed }) => [
              styles.btn,
              {
                borderColor: copied ? colors.primary : colors.border,
                backgroundColor: copied ? `${colors.primary}18` : "transparent",
                opacity: pressed ? 0.75 : 1,
              },
            ]}
            accessibilityLabel={copied ? "Copied" : "Copy result"}
          >
            <Feather
              name={copied ? "check" : "copy"}
              size={15}
              color={copied ? colors.primary : colors.mutedForeground}
            />
            <Text
              style={[
                styles.btnText,
                { color: copied ? colors.primary : colors.mutedForeground },
                font("semibold"),
              ]}
            >
              {copied ? "Copied" : "Copy"}
            </Text>
          </Pressable>
        ) : null}
        {content ? (
          <Pressable
            onPress={handleShare}
            style={({ pressed }) => [
              styles.btn,
              { borderColor: colors.border, opacity: pressed ? 0.75 : 1 },
            ]}
            accessibilityLabel="Share result"
          >
            <Feather name="share" size={15} color={colors.mutedForeground} />
            <Text style={[styles.btnText, { color: colors.mutedForeground }, font("semibold")]}>
              Share
            </Text>
          </Pressable>
        ) : null}
        {onSave ? (
          <Pressable
            onPress={() => {
              void onSave();
            }}
            disabled={saved}
            style={({ pressed }) => [
              styles.btn,
              {
                borderColor: colors.primary,
                opacity: saved ? 0.5 : pressed ? 0.75 : 1,
              },
            ]}
            accessibilityLabel={saved ? "Saved" : "Save result"}
          >
            <Feather name={saved ? "check" : "bookmark"} size={15} color={colors.primary} />
            <Text style={[styles.btnText, { color: colors.primary }, font("semibold")]}>
              {saved ? "Saved" : "Save"}
            </Text>
          </Pressable>
        ) : null}
      </View>
      <Text style={[styles.disclaimer, { color: colors.mutedForeground }, font("regular")]}>
        {disclaimer}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    overflow: "hidden",
  },
  empty: {
    alignItems: "center",
    paddingVertical: 28,
  },
  topRail: {
    position: "absolute",
    top: 0,
    left: "12%",
    right: "12%",
    height: 2,
    alignItems: "center",
  },
  railLine: {
    height: 2,
    width: "100%",
    borderRadius: 999,
    opacity: 0.85,
  },
  kicker: {
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    marginBottom: 10,
    marginTop: 4,
  },
  body: { fontSize: 15, lineHeight: 23 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  btnText: { fontSize: 13 },
  disclaimer: { fontSize: 11, marginTop: 12, lineHeight: 16 },
  error: { fontSize: 14, lineHeight: 20 },
  skeletonRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  skeletonText: { fontSize: 14 },
  skelBar: { height: 10, borderRadius: 6, marginBottom: 8, opacity: 0.55 },
});
