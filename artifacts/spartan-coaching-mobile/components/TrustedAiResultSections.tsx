/**
 * Semantic sections for Trusted AI Result envelopes (HSP-21).
 * Platform-native presentation; same field semantics as web.
 */
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { font } from "@/lib/typography";

export type TrustedSourceBasis = {
  id: string;
  title: string;
  authority: string;
  kind?: string;
  disclaimer?: string;
};

export type TrustedAiResult = {
  schemaVersion: string;
  toolId: string;
  recommendation?: string;
  suggestedWording?: string;
  whyThisFits?: string;
  nextMove?: string;
  professionalBoundary?: string;
  sourceBasis?: TrustedSourceBasis[];
  spartanMethodologyBasis?: string[];
  providerGuidance?: string;
  uncertainty?: string;
  relatedToolIds?: string[];
  relatedResourceIds?: string[];
  feedback?: { enabled: boolean; hint?: string };
  trustNotice?: string;
  plainText?: string;
  actions?: { canSave: boolean; canCopy: boolean; canShare: boolean };
};

const AUTHORITY_LABEL: Record<string, string> = {
  spartan_methodology: "Spartan methodology",
  provider_approved: "Provider-approved",
  cms_policy_snapshot: "Policy snapshot",
  user_supplied_context: "Your context",
  model_generated: "Model-generated",
  unknown: "Unverified",
};

function Section({
  label,
  children,
  tone = "default",
}: {
  label: string;
  children: React.ReactNode;
  tone?: "default" | "primary" | "muted" | "warn";
}) {
  const colors = useColors();
  const bg =
    tone === "primary"
      ? `${colors.primary}12`
      : tone === "warn"
        ? "rgba(245, 158, 11, 0.08)"
        : tone === "muted"
          ? colors.muted
          : colors.card;
  const border =
    tone === "primary"
      ? `${colors.primary}40`
      : tone === "warn"
        ? "rgba(245, 158, 11, 0.35)"
        : colors.border;

  return (
    <View
      style={[styles.section, { backgroundColor: bg, borderColor: border }]}
      accessibilityRole="summary"
      accessibilityLabel={label}
    >
      <Text
        style={[styles.sectionLabel, { color: colors.mutedForeground }, font("bold")]}
      >
        {label}
      </Text>
      {children}
    </View>
  );
}

export function TrustedAiResultSections({
  result,
  omitWording = false,
}: {
  result?: TrustedAiResult | null;
  /** When parent already shows primary talk track. */
  omitWording?: boolean;
}) {
  const colors = useColors();
  if (!result) return null;

  const sources = result.sourceBasis ?? [];
  const method = result.spartanMethodologyBasis ?? [];
  const relatedTools = result.relatedToolIds ?? [];
  const relatedResources = result.relatedResourceIds ?? [];

  return (
    <View style={styles.wrap} accessibilityLabel="Trusted AI result details">
      {result.recommendation ? (
        <Section label="Recommendation" tone="primary">
          <Text style={[styles.body, { color: colors.foreground }, font("regular")]}>
            {result.recommendation}
          </Text>
        </Section>
      ) : null}

      {!omitWording && result.suggestedWording ? (
        <Section label="Suggested wording" tone="primary">
          <ScrollView style={styles.longScroll} nestedScrollEnabled>
            <Text style={[styles.body, { color: colors.foreground }, font("regular")]}>
              {result.suggestedWording}
            </Text>
          </ScrollView>
        </Section>
      ) : null}

      {result.whyThisFits ? (
        <Section label="Why this approach fits">
          <Text style={[styles.body, { color: colors.foreground }, font("regular")]}>
            {result.whyThisFits}
          </Text>
        </Section>
      ) : null}

      {result.nextMove ? (
        <Section label="Next move">
          <Text style={[styles.body, { color: colors.foreground }, font("regular")]}>
            {result.nextMove}
          </Text>
        </Section>
      ) : null}

      {result.providerGuidance ? (
        <Section label="Provider guidance">
          <Text style={[styles.body, { color: colors.foreground }, font("regular")]}>
            {result.providerGuidance}
          </Text>
        </Section>
      ) : null}

      {method.length > 0 ? (
        <Section label="Spartan methodology basis" tone="muted">
          {method.map((m) => (
            <Text
              key={m}
              style={[styles.bullet, { color: colors.foreground }, font("regular")]}
            >
              • {m}
            </Text>
          ))}
        </Section>
      ) : null}

      {sources.length > 0 ? (
        <Section label="Source basis" tone="muted">
          {sources.map((s) => (
            <View key={s.id} style={styles.sourceRow}>
              <Text style={[styles.sourceTitle, { color: colors.foreground }, font("semibold")]}>
                {s.title}
              </Text>
              <Text style={[styles.sourceMeta, { color: colors.mutedForeground }, font("regular")]}>
                {AUTHORITY_LABEL[s.authority] ?? s.authority}
              </Text>
              {s.disclaimer ? (
                <Text
                  style={[styles.sourceMeta, { color: colors.mutedForeground }, font("regular")]}
                >
                  {s.disclaimer}
                </Text>
              ) : null}
            </View>
          ))}
        </Section>
      ) : null}

      {result.uncertainty ? (
        <Section label="Uncertainty" tone="warn">
          <Text style={[styles.body, { color: colors.foreground }, font("regular")]}>
            {result.uncertainty}
          </Text>
        </Section>
      ) : null}

      {result.professionalBoundary ? (
        <Section label="Professional boundary" tone="muted">
          <Text style={[styles.small, { color: colors.mutedForeground }, font("regular")]}>
            {result.professionalBoundary}
          </Text>
        </Section>
      ) : null}

      {relatedTools.length > 0 || relatedResources.length > 0 ? (
        <Section label="Related">
          {relatedTools.map((id) => (
            <Text
              key={`t-${id}`}
              style={[styles.bullet, { color: colors.mutedForeground }, font("regular")]}
            >
              Tool: {id}
            </Text>
          ))}
          {relatedResources.map((id) => (
            <Text
              key={`r-${id}`}
              style={[styles.bullet, { color: colors.mutedForeground }, font("regular")]}
            >
              Resource: {id}
            </Text>
          ))}
        </Section>
      ) : null}

      {result.feedback?.enabled && result.feedback.hint ? (
        <Text style={[styles.small, { color: colors.mutedForeground }, font("regular")]}>
          Feedback: {result.feedback.hint}
        </Text>
      ) : null}

      {result.trustNotice ? (
        <Text style={[styles.small, { color: colors.mutedForeground, marginTop: 4 }, font("regular")]}>
          {result.trustNotice}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 10, gap: 10 },
  section: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sectionLabel: {
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  body: { fontSize: 14, lineHeight: 21 },
  small: { fontSize: 12, lineHeight: 17 },
  bullet: { fontSize: 13, lineHeight: 19, marginBottom: 2 },
  sourceRow: { marginBottom: 8 },
  sourceTitle: { fontSize: 13, lineHeight: 18 },
  sourceMeta: { fontSize: 11, lineHeight: 16, marginTop: 2 },
  longScroll: { maxHeight: 280 },
});
