import React, { useMemo, useState, type ReactNode } from "react";
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
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { font } from "@/lib/typography";
import { trackMobileEvent } from "@/lib/analytics";

type ResultBlock =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "item"; text: string; number?: string };

export function cleanFieldCopy(value: string): string {
  return value
    .replace(/^\s*#{1,6}\s*/gm, "")
    .replace(/^\s*(?:\*{3,}|_{3,}|[\u2010-\u2015-]{3,})\s*$/gm, "")
    .replace(/^\s*[*+]\s+/gm, "• ")
    .replace(/^\s*[\u2010-\u2015-]\s+/gm, "• ")
    .replace(/[\u2010-\u2015-]/g, " ")
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/`/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseFieldCopy(value: string): ResultBlock[] {
  const clean = cleanFieldCopy(value);
  const blocks: ResultBlock[] = [];
  const paragraphs: string[] = [];

  const flushParagraph = () => {
    const text = paragraphs.join(" ").trim();
    if (text) blocks.push({ kind: "paragraph", text });
    paragraphs.length = 0;
  };

  for (const rawLine of clean.split("\n")) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      continue;
    }

    const numbered = line.match(/^(\d+)[.)]\s+(.+)$/);
    if (numbered) {
      flushParagraph();
      blocks.push({ kind: "item", number: numbered[1], text: numbered[2] });
      continue;
    }

    if (line.startsWith("• ")) {
      flushParagraph();
      blocks.push({ kind: "item", text: line.slice(2).trim() });
      continue;
    }

    const isHeading =
      line.length <= 64 &&
      (/^[A-Z0-9 &:'’]+$/.test(line) || /^(Subject|Message):?$/i.test(line));

    if (isHeading) {
      flushParagraph();
      blocks.push({ kind: "heading", text: line.replace(/:$/, "") });
      continue;
    }

    paragraphs.push(line);
  }

  flushParagraph();
  return blocks;
}

function ResultBody({ content }: { content: string }) {
  const colors = useColors();
  const blocks = useMemo(() => parseFieldCopy(content), [content]);

  return (
    <View style={styles.resultBody}>
      {blocks.map((block, index) => {
        if (block.kind === "heading") {
          return (
            <View key={`heading:${index}`} style={styles.sectionHeader}>
              <View style={[styles.sectionRule, { backgroundColor: colors.primary }]} />
              <Text
                accessibilityRole="header"
                style={[styles.sectionTitle, { color: colors.foreground }, font("bold")]}
              >
                {block.text}
              </Text>
            </View>
          );
        }

        if (block.kind === "item") {
          return (
            <View
              key={`item:${index}`}
              style={[styles.itemCard, { backgroundColor: colors.background, borderColor: colors.border }]}
            >
              <View style={[styles.itemMarker, { backgroundColor: colors.primaryMuted }]}>
                <Text style={[styles.itemMarkerText, { color: colors.primary }, font("bold")]}>
                  {block.number ?? "•"}
                </Text>
              </View>
              <Text selectable style={[styles.itemText, { color: colors.foreground }, font("regular")]}>
                {block.text}
              </Text>
            </View>
          );
        }

        return (
          <Text
            key={`paragraph:${index}`}
            selectable
            style={[styles.paragraph, { color: colors.foreground }, font("regular")]}
          >
            {block.text}
          </Text>
        );
      })}
    </View>
  );
}

/**
 * Premium field result with immediate actions, clear hierarchy, and trust cues.
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
  showCommandHandoff = true,
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
  showCommandHandoff?: boolean;
}) {
  const colors = useColors();
  const [copied, setCopied] = useState(false);
  const cleanContent = useMemo(() => (content ? cleanFieldCopy(content) : ""), [content]);
  const hasBody = Boolean(cleanContent) || Boolean(children);

  const handleCopy = async () => {
    if (!cleanContent) return;
    await Clipboard.setStringAsync(cleanContent);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!cleanContent) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Share.share({ message: cleanContent, title });
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
            Building a focused field answer…
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
        accessibilityLabel="No result yet. Run the tool to get a field ready result."
      >
        <Feather name="file-text" size={20} color={colors.mutedForeground} />
        <Text style={[styles.emptyText, { color: colors.mutedForeground }, font("regular")]}>
          Run the tool to get a field ready result.
        </Text>
      </View>
    );
  }

  if (!hasBody) return null;

  return (
    <View
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderStrong }]}
      accessibilityRole="summary"
      accessibilityLabel={title}
      accessibilityLiveRegion="polite"
    >
      <View style={[styles.hero, { backgroundColor: colors.primaryMuted }]}>
        <Text style={[styles.kicker, { color: colors.primary }, font("bold")]}>FIELD READY</Text>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }, font("heavy")]}>
          {title}
        </Text>
        <View style={styles.trustRow}>
          <Feather name="shield" size={15} color={colors.primary} />
          <View style={styles.trustCopy}>
            <Text style={[styles.trustTitle, { color: colors.foreground }, font("semibold")]}>
              Built from your context
            </Text>
            <Text style={[styles.trustBody, { color: colors.mutedForeground }, font("regular")]}>
              Review names and details before using it in the field.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        {cleanContent ? (
          <Pressable
            onPress={handleCopy}
            style={({ pressed }) => [
              styles.primaryAction,
              { backgroundColor: colors.primary, opacity: pressed ? 0.82 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={copied ? "Copied" : "Copy result"}
          >
            <Feather name={copied ? "check" : "copy"} size={16} color="#FFFFFF" />
            <Text style={[styles.primaryActionText, font("bold")]}>{copied ? "Copied" : "Copy"}</Text>
          </Pressable>
        ) : null}
        {cleanContent ? (
          <Pressable
            onPress={handleShare}
            style={({ pressed }) => [
              styles.secondaryAction,
              { borderColor: colors.border, opacity: pressed ? 0.75 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Share result"
          >
            <Feather name="share" size={15} color={colors.foreground} />
            <Text style={[styles.secondaryActionText, { color: colors.foreground }, font("semibold")]}>Share</Text>
          </Pressable>
        ) : null}
        {onSave ? (
          <Pressable
            onPress={() => void onSave()}
            disabled={saved}
            style={({ pressed }) => [
              styles.secondaryAction,
              { borderColor: colors.border, opacity: saved ? 0.5 : pressed ? 0.75 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={saved ? "Saved" : "Save result"}
          >
            <Feather name={saved ? "check" : "bookmark"} size={15} color={colors.foreground} />
            <Text style={[styles.secondaryActionText, { color: colors.foreground }, font("semibold")]}>
              {saved ? "Saved" : "Save"}
            </Text>
          </Pressable>
        ) : null}
        {showCommandHandoff ? (
          <Pressable
            onPress={() => {
              void trackMobileEvent("craft", "web_handoff_tap", {
                metadata: { surface: "result", platform: "ios", source: "command" },
              });
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/tool/playbook" as never);
            }}
            style={({ pressed }) => [
              styles.secondaryAction,
              { borderColor: colors.border, opacity: pressed ? 0.75 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Open Field Planner"
          >
            <Feather name="target" size={15} color={colors.foreground} />
            <Text style={[styles.secondaryActionText, { color: colors.foreground }, font("semibold")]}>Plan</Text>
          </Pressable>
        ) : null}
      </View>

      {cleanContent ? <ResultBody content={cleanContent} /> : null}
      {children}

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Text style={[styles.disclaimer, { color: colors.mutedForeground }, font("regular")]}>{disclaimer}</Text>
        <Text style={[styles.disclaimer, { color: colors.mutedForeground }, font("regular")]}>
          Saved to your Spartan account · ready for the next visit
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 18,
    borderWidth: 1,
    borderRadius: 20,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  hero: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 16 },
  kicker: { fontSize: 9, letterSpacing: 1.8, marginBottom: 7 },
  title: { fontSize: 23, lineHeight: 28, letterSpacing: -0.35 },
  trustRow: { flexDirection: "row", alignItems: "flex-start", gap: 9, marginTop: 14 },
  trustCopy: { flex: 1 },
  trustTitle: { fontSize: 12, lineHeight: 16 },
  trustBody: { fontSize: 11, lineHeight: 16, marginTop: 1 },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  primaryAction: {
    minHeight: 42,
    borderRadius: 12,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  primaryActionText: { color: "#FFFFFF", fontSize: 13 },
  secondaryAction: {
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  secondaryActionText: { fontSize: 13 },
  resultBody: { padding: 18, gap: 11 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 9, marginTop: 8 },
  sectionRule: { width: 4, height: 22, borderRadius: 2 },
  sectionTitle: { flex: 1, fontSize: 15, lineHeight: 20, letterSpacing: 0.2 },
  paragraph: { fontSize: 15, lineHeight: 23 },
  itemCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 12,
  },
  itemMarker: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  itemMarkerText: { fontSize: 11 },
  itemText: { flex: 1, fontSize: 14, lineHeight: 21 },
  footer: { marginHorizontal: 18, borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 14, gap: 4 },
  disclaimer: { fontSize: 10, lineHeight: 15 },
  empty: { alignItems: "center", paddingVertical: 28 },
  emptyText: { fontSize: 13, lineHeight: 19, marginTop: 8, textAlign: "center" },
  error: { fontSize: 14, lineHeight: 20 },
  skeletonRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  skeletonText: { fontSize: 14 },
  skelBar: { height: 10, borderRadius: 6, marginBottom: 8, opacity: 0.55 },
});
