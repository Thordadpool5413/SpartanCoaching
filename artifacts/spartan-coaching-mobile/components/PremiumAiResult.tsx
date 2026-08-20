import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { font } from "@/lib/typography";

type SectionTone = "answer" | "language" | "actions" | "reasoning" | "evidence" | "detail";

type SectionMeta = {
  title: string;
  tone: SectionTone;
  icon: React.ComponentProps<typeof Feather>["name"];
  order: number;
};

const SECTION_META: Array<{ pattern: RegExp; meta: SectionMeta }> = [
  { pattern: /(eligibilityAssessment|assessment|summary|decision|conclusion|recommendation|recommendedApproach|overview|answer)$/i, meta: { title: "Executive answer", tone: "answer", icon: "compass", order: 10 } },
  { pattern: /(template|templates|script|scripts|body|message|draft|subject|talkingPoints|language|email|content)$/i, meta: { title: "Field ready language", tone: "language", icon: "message-square", order: 20 } },
  { pattern: /(recommendedActions|nextSteps|actions|actionPlan|sequence|followUp|followUps|priorities)$/i, meta: { title: "Next actions", tone: "actions", icon: "arrow-right-circle", order: 30 } },
  { pattern: /(rationale|reasoning|analysis|criteriaAnalysis|why|considerations|personalizationElements)$/i, meta: { title: "Why it matters", tone: "reasoning", icon: "target", order: 40 } },
  { pattern: /(citations|evidence|confidence|missingEvidence|missingDocumentation|compliance|complianceNotes|complianceReview|review|humanReviewRequired|simulationNotice|simulatedMetrics|prognosisGuidance)$/i, meta: { title: "Evidence & review", tone: "evidence", icon: "shield", order: 80 } },
];

function humanize(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function sectionMeta(key: string): SectionMeta {
  const match = SECTION_META.find((entry) => entry.pattern.test(key));
  return match ? { ...match.meta, title: match.meta.title } : { title: humanize(key), tone: "detail", icon: "file-text", order: 60 };
}

function cleanPresentationText(value: string): string {
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

function scalar(value: unknown): string {
  if (value == null) return "Not provided";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return cleanPresentationText(String(value));
}

function ValueBlock({ value, depth = 0 }: { value: unknown; depth?: number }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (value == null || typeof value !== "object") {
    return <Text selectable style={styles.valueText}>{scalar(value)}</Text>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return <Text style={styles.emptyText}>None noted.</Text>;
    const simple = value.every((item) => item == null || typeof item !== "object");
    if (simple) {
      return (
        <View style={styles.bulletStack}>
          {value.map((item, index) => (
            <View key={`${scalar(item)}-${index}`} style={styles.bulletRow}>
              <View style={styles.bullet} />
              <Text selectable style={styles.bulletText}>{scalar(item)}</Text>
            </View>
          ))}
        </View>
      );
    }
    return (
      <View style={styles.objectStack}>
        {value.map((item, index) => (
          <View key={index} style={styles.subCard}>
            <ValueBlock value={item} depth={depth + 1} />
          </View>
        ))}
      </View>
    );
  }

  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) return <Text style={styles.emptyText}>No additional detail.</Text>;
  return (
    <View style={styles.objectStack}>
      {entries.map(([key, child]) => (
        <View key={key} style={depth > 1 ? styles.deepRow : undefined}>
          <Text style={styles.childLabel}>{humanize(key)}</Text>
          <ValueBlock value={child} depth={depth + 1} />
        </View>
      ))}
    </View>
  );
}

export function PremiumAiResult({ output, watermark, reviewStatus }: { output: unknown; watermark?: string; reviewStatus?: string }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (output == null) return null;
  if (typeof output !== "object" || Array.isArray(output)) {
    return <View style={styles.singleResult}><ValueBlock value={output} /></View>;
  }

  const sections = Object.entries(output as Record<string, unknown>)
    .map(([key, value], index) => ({ key, value, meta: sectionMeta(key), index }))
    .sort((a, b) => a.meta.order - b.meta.order || a.index - b.index);

  return (
    <View style={styles.resultStack} testID="premium-ai-result">
      {watermark ? (
        <View style={styles.reviewBanner}>
          <Feather name="shield" size={18} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.reviewTitle}>{cleanPresentationText(watermark)}</Text>
            <Text style={styles.reviewBody}>{reviewStatus ? `Review status: ${humanize(reviewStatus)}.` : "Human review is required where indicated before external or clinical use."}</Text>
          </View>
        </View>
      ) : null}

      {sections.map(({ key, value, meta }) => (
        <View key={key} style={[styles.section, meta.tone === "answer" && styles.answerSection]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.icon, meta.tone === "answer" && styles.answerIcon]}>
              <Feather name={meta.icon} size={17} color={meta.tone === "answer" ? "#FFFFFF" : colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionEyebrow}>{meta.tone === "detail" ? "DETAIL" : meta.title.toUpperCase()}</Text>
              <Text style={styles.sectionTitle}>{meta.tone === "detail" ? humanize(key) : meta.title}</Text>
            </View>
          </View>
          <ValueBlock value={value} />
        </View>
      ))}
    </View>
  );
}

export function formatAiResultForSharing(toolName: string, output: unknown, watermark?: string) {
  const lines: string[] = [toolName, ""];
  if (watermark) lines.push(watermark, "");

  const walk = (value: unknown, depth: number, label?: string) => {
    const indent = "  ".repeat(depth);
    if (label) lines.push(`${indent}${humanize(label)}:`);
    if (value == null || typeof value !== "object") {
      lines.push(`${indent}${label ? "  " : ""}${scalar(value)}`);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item == null || typeof item !== "object") lines.push(`${indent}${label ? "  " : ""}• ${scalar(item)}`);
        else walk(item, depth + (label ? 1 : 0));
      });
      return;
    }
    Object.entries(value as Record<string, unknown>).forEach(([key, child]) => walk(child, depth + (label ? 1 : 0), key));
  };

  walk(output, 0);
  lines.push("", "Suggested guidance from Spartan Coaching. Review and adapt before use.");
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    resultStack: { gap: 14 },
    singleResult: { borderRadius: 18, borderCurve: "continuous", backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderStrong, padding: 16 },
    reviewBanner: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 16, borderCurve: "continuous", backgroundColor: colors.primaryMuted, borderWidth: 1, borderColor: colors.primary, padding: 13 },
    reviewTitle: { color: colors.foreground, fontSize: 12, lineHeight: 17, ...font("bold") },
    reviewBody: { color: colors.mutedForeground, fontSize: 10, lineHeight: 15, marginTop: 2, ...font("regular") },
    section: { borderRadius: 18, borderCurve: "continuous", borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.card, padding: 15, gap: 12 },
    answerSection: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
    sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
    icon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.primaryMuted, alignItems: "center", justifyContent: "center" },
    answerIcon: { backgroundColor: colors.primary },
    sectionEyebrow: { color: colors.primary, fontSize: 8, letterSpacing: 1.3, ...font("bold") },
    sectionTitle: { color: colors.foreground, fontSize: 16, lineHeight: 20, marginTop: 2, ...font("heavy") },
    valueText: { color: colors.foreground, fontSize: 14, lineHeight: 21, ...font("regular") },
    emptyText: { color: colors.mutedForeground, fontSize: 12, lineHeight: 18, ...font("regular") },
    bulletStack: { gap: 8 },
    bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 9 },
    bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginTop: 7 },
    bulletText: { flex: 1, color: colors.foreground, fontSize: 13, lineHeight: 19, ...font("regular") },
    objectStack: { gap: 12 },
    subCard: { borderRadius: 14, borderCurve: "continuous", backgroundColor: colors.background, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, padding: 12 },
    deepRow: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: 9 },
    childLabel: { color: colors.mutedForeground, fontSize: 9, letterSpacing: 0.7, textTransform: "uppercase", marginBottom: 5, ...font("bold") },
  });
}
