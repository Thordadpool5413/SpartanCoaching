import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState, type ReactNode } from "react";
import { Pressable, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { saveCalculatorReport, type CalculatorReportKind } from "@/lib/calculatorHistory";
import { font } from "@/lib/typography";

export function CalculatorHero({
  icon,
  eyebrow,
  title,
  body,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  eyebrow: string;
  title: string;
  body: string;
}) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.hero}>
      <View style={styles.heroTop}>
        <View style={styles.heroIcon}><Feather name={icon} size={23} color="#FFFFFF" /></View>
        <Text style={styles.heroEyebrow}>{eyebrow}</Text>
      </View>
      <Text accessibilityRole="header" style={styles.heroTitle}>{title}</Text>
      <Text style={styles.heroBody}>{body}</Text>
      <View style={styles.heroRule} />
      <Text style={styles.heroBoundary}>Private planning only. Never enter patient PHI.</Text>
    </View>
  );
}

export function CalculatorSection({
  eyebrow,
  title,
  body,
  children,
}: {
  eyebrow: string;
  title: string;
  body?: string;
  children: ReactNode;
}) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
      <Text accessibilityRole="header" style={styles.sectionTitle}>{title}</Text>
      {body ? <Text style={styles.sectionBody}>{body}</Text> : null}
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

export function CalculatorField({
  label,
  value,
  onChangeText,
  hint,
  prefix,
  suffix,
  testID,
  keyboardType = "decimal-pad",
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  hint?: string;
  prefix?: string;
  suffix?: string;
  testID?: string;
  keyboardType?: "default" | "decimal-pad" | "number-pad";
}) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.field}>
      <View style={styles.fieldLabelRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
      </View>
      <View style={styles.inputShell}>
        {prefix ? <Text style={styles.inputAffix}>{prefix}</Text> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          style={styles.input}
          placeholderTextColor={colors.mutedForeground}
          accessibilityLabel={label}
          testID={testID}
          selectTextOnFocus
        />
        {suffix ? <Text style={styles.inputAffix}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

export function CalculatorSegmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.segmented}>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => { void Haptics.selectionAsync(); onChange(option.value); }}
              style={[styles.segment, selected && styles.segmentSelected]}
            >
              <Text style={[styles.segmentLabel, selected && styles.segmentLabelSelected]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function MetricGrid({
  metrics,
}: {
  metrics: Array<{ label: string; value: string; emphasis?: boolean; detail?: string }>;
}) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.metricGrid} accessibilityLiveRegion="polite">
      {metrics.map((metric) => (
        <View key={metric.label} style={[styles.metric, metric.emphasis && styles.metricEmphasis]}>
          <Text style={[styles.metricLabel, metric.emphasis && styles.metricLabelEmphasis]}>{metric.label}</Text>
          <Text adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.7} style={[styles.metricValue, metric.emphasis && styles.metricValueEmphasis]}>{metric.value}</Text>
          {metric.detail ? <Text style={[styles.metricDetail, metric.emphasis && styles.metricDetailEmphasis]}>{metric.detail}</Text> : null}
        </View>
      ))}
    </View>
  );
}

export function VisualScale({ label, value, max, caption }: { label: string; value: number; max: number; caption: string }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const width = `${Math.max(4, Math.min(100, max > 0 ? (value / max) * 100 : 0))}%` as const;
  return (
    <View style={styles.scale}>
      <View style={styles.scaleLabels}><Text style={styles.scaleLabel}>{label}</Text><Text style={styles.scaleCaption}>{caption}</Text></View>
      <View style={styles.scaleTrack}><View style={[styles.scaleFill, { width }]} /></View>
    </View>
  );
}

export function DecisionBrief({
  title,
  interpretation,
  actions,
  caution,
}: {
  title: string;
  interpretation: string;
  actions: string[];
  caution: string;
}) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.brief}>
      <View style={styles.briefHeader}><Feather name="compass" size={20} color={colors.primary} /><Text style={styles.briefTitle}>{title}</Text></View>
      <Text style={styles.briefBody}>{interpretation}</Text>
      <Text style={styles.nextLabel}>NEXT DECISIONS</Text>
      {actions.map((action, index) => (
        <View key={`${index}:${action}`} style={styles.actionLine}><Text style={styles.actionNumber}>{String(index + 1).padStart(2, "0")}</Text><Text style={styles.actionText}>{action}</Text></View>
      ))}
      <View style={styles.caution}><Feather name="shield" size={15} color={colors.primary} /><Text style={styles.cautionText}>{caution}</Text></View>
    </View>
  );
}

export function CalculatorReportActions({
  kind,
  title,
  summary,
  report,
}: {
  kind: CalculatorReportKind;
  title: string;
  summary: string;
  report: string;
}) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [saved, setSaved] = useState(false);
  const save = async () => {
    await saveCalculatorReport({ kind, title, summary, report });
    setSaved(true);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };
  return (
    <View style={styles.reportActions}>
      <Pressable accessibilityRole="button" accessibilityLabel={saved ? "Report saved" : "Save report"} disabled={saved} onPress={() => void save()} style={({ pressed }) => [styles.actionButton, styles.actionButtonPrimary, pressed && styles.pressed, saved && styles.actionButtonSaved]}>
        <Feather name={saved ? "check" : "bookmark"} size={18} color="#FFFFFF" />
        <Text style={styles.actionButtonPrimaryText}>{saved ? "Saved to My Work" : "Save to My Work"}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Share report" onPress={() => void Share.share({ title, message: report })} style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}>
        <Feather name="share" size={18} color={colors.primary} />
        <Text style={styles.actionButtonText}>Share report</Text>
      </Pressable>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    hero: { backgroundColor: colors.heroBackground, borderRadius: 28, borderCurve: "continuous", padding: 22, overflow: "hidden" },
    heroTop: { flexDirection: "row", alignItems: "center", gap: 10 },
    heroIcon: { width: 46, height: 46, borderRadius: 15, borderCurve: "continuous", backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
    heroEyebrow: { color: colors.primary, fontSize: 10, letterSpacing: 1.8, ...font("bold") },
    heroTitle: { color: colors.heroForeground, fontSize: 30, lineHeight: 35, letterSpacing: -0.8, marginTop: 22, ...font("heavy") },
    heroBody: { color: colors.heroMuted, fontSize: 14, lineHeight: 21, marginTop: 9, ...font("regular") },
    heroRule: { height: 1, backgroundColor: "rgba(255,255,255,0.16)", marginTop: 20 },
    heroBoundary: { color: colors.heroMuted, fontSize: 10, lineHeight: 15, marginTop: 12, ...font("medium") },
    section: { marginTop: 28 },
    sectionEyebrow: { color: colors.primary, fontSize: 10, letterSpacing: 1.8, ...font("bold") },
    sectionTitle: { color: colors.foreground, fontSize: 23, lineHeight: 28, letterSpacing: -0.5, marginTop: 6, ...font("heavy") },
    sectionBody: { color: colors.mutedForeground, fontSize: 13, lineHeight: 19, marginTop: 5, ...font("regular") },
    sectionCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 22, borderCurve: "continuous", padding: 18, marginTop: 14 },
    field: { marginBottom: 16 },
    fieldLabelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
    fieldLabel: { color: colors.foreground, fontSize: 13, marginBottom: 7, ...font("bold") },
    fieldHint: { color: colors.mutedForeground, fontSize: 10, marginBottom: 7, ...font("regular") },
    inputShell: { minHeight: 54, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 16, borderCurve: "continuous", backgroundColor: colors.input, paddingHorizontal: 14 },
    input: { flex: 1, minHeight: 52, color: colors.foreground, fontSize: 17, fontVariant: ["tabular-nums"], ...font("semibold") },
    inputAffix: { color: colors.mutedForeground, fontSize: 13, ...font("semibold") },
    segmented: { flexDirection: "row", borderRadius: 16, borderCurve: "continuous", padding: 3, backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border },
    segment: { flex: 1, minHeight: 46, borderRadius: 13, borderCurve: "continuous", alignItems: "center", justifyContent: "center" },
    segmentSelected: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderStrong },
    segmentLabel: { color: colors.mutedForeground, fontSize: 13, ...font("semibold") },
    segmentLabelSelected: { color: colors.foreground, ...font("bold") },
    metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    metric: { width: "48%", minHeight: 118, backgroundColor: colors.secondary, borderRadius: 18, borderCurve: "continuous", padding: 14, justifyContent: "space-between" },
    metricEmphasis: { width: "100%", backgroundColor: colors.heroBackground, minHeight: 132 },
    metricLabel: { color: colors.mutedForeground, fontSize: 10, lineHeight: 14, letterSpacing: 0.6, textTransform: "uppercase", ...font("bold") },
    metricLabelEmphasis: { color: colors.heroMuted },
    metricValue: { color: colors.foreground, fontSize: 25, letterSpacing: -0.7, fontVariant: ["tabular-nums"], ...font("heavy") },
    metricValueEmphasis: { color: colors.heroForeground, fontSize: 33 },
    metricDetail: { color: colors.mutedForeground, fontSize: 10, lineHeight: 14, ...font("regular") },
    metricDetailEmphasis: { color: colors.heroMuted },
    scale: { marginTop: 15 },
    scaleLabels: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
    scaleLabel: { color: colors.foreground, fontSize: 12, ...font("bold") },
    scaleCaption: { color: colors.mutedForeground, fontSize: 10, ...font("regular") },
    scaleTrack: { height: 10, borderRadius: 5, backgroundColor: colors.muted, overflow: "hidden", marginTop: 7 },
    scaleFill: { height: "100%", borderRadius: 5, backgroundColor: colors.primary },
    brief: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 22, borderCurve: "continuous", padding: 18, marginTop: 16 },
    briefHeader: { flexDirection: "row", alignItems: "center", gap: 9 },
    briefTitle: { color: colors.foreground, fontSize: 18, ...font("heavy") },
    briefBody: { color: colors.mutedForeground, fontSize: 13, lineHeight: 20, marginTop: 10, ...font("regular") },
    nextLabel: { color: colors.primary, fontSize: 9, letterSpacing: 1.6, marginTop: 20, marginBottom: 5, ...font("bold") },
    actionLine: { flexDirection: "row", gap: 11, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
    actionNumber: { color: colors.primary, fontSize: 10, ...font("heavy") },
    actionText: { flex: 1, color: colors.foreground, fontSize: 12, lineHeight: 18, ...font("semibold") },
    caution: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: colors.primaryMuted, borderRadius: 14, padding: 12, marginTop: 10 },
    cautionText: { flex: 1, color: colors.mutedForeground, fontSize: 10, lineHeight: 16, ...font("regular") },
    reportActions: { gap: 10, marginTop: 18 },
    actionButton: { minHeight: 54, borderRadius: 17, borderCurve: "continuous", borderWidth: 1, borderColor: colors.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9 },
    actionButtonPrimary: { backgroundColor: colors.primary },
    actionButtonSaved: { backgroundColor: colors.success, borderColor: colors.success },
    actionButtonText: { color: colors.primary, fontSize: 14, ...font("bold") },
    actionButtonPrimaryText: { color: "#FFFFFF", fontSize: 14, ...font("bold") },
    pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
  });
}
