/**
 * Reusable Hospice Sales Pro tool anatomy (HSP-30) — iOS.
 * Compose only sections that add value; unique tool interaction stays in the tool.
 */
import React, { type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { font } from "@/lib/typography";
import { FieldResultPanel } from "@/components/FieldResultPanel";
import { EmptyState } from "@/components/ui/EmptyState";

function SectionLabel({ label }: { label: string }) {
  const colors = useColors();
  return (
    <Text
      style={[
        {
          color: colors.primary,
          fontSize: 10,
          letterSpacing: 1.4,
          textTransform: "uppercase",
          marginBottom: 6,
        },
        font("bold"),
      ]}
    >
      {label}
    </Text>
  );
}

function BodyOrNode({
  children,
  color,
}: {
  children: ReactNode;
  color: string;
}) {
  if (typeof children === "string" || typeof children === "number") {
    return (
      <Text style={[{ color, fontSize: 14, lineHeight: 20 }, font("regular")]}>
        {children}
      </Text>
    );
  }
  return <>{children}</>;
}

export function ToolAnatomyWhy({ children }: { children: ReactNode }) {
  const colors = useColors();
  if (!children) return null;
  return (
    <View style={styles.block} accessibilityLabel="Why this approach">
      <SectionLabel label="Why this approach" />
      <View
        style={[
          styles.card,
          { backgroundColor: colors.muted, borderColor: colors.border },
        ]}
      >
        <BodyOrNode color={colors.foreground}>{children}</BodyOrNode>
      </View>
    </View>
  );
}

export function ToolAnatomyNextMove({ children }: { children: ReactNode }) {
  const colors = useColors();
  if (!children) return null;
  return (
    <View style={styles.block} accessibilityLabel="Next move">
      <SectionLabel label="Next move" />
      <View
        style={[
          styles.card,
          {
            backgroundColor: `${colors.primary}12`,
            borderColor: `${colors.primary}40`,
          },
        ]}
      >
        <BodyOrNode color={colors.foreground}>{children}</BodyOrNode>
      </View>
    </View>
  );
}

export function ToolAnatomyRelated({
  items,
}: {
  items: { label: string; href: string; kind?: string }[];
}) {
  const colors = useColors();
  if (!items.length) return null;
  return (
    <View style={styles.block} accessibilityLabel="Related">
      <SectionLabel label="Related" />
      {items.map((item) => (
        <Pressable
          key={`${item.href}:${item.label}:${item.kind || "related"}`}
          onPress={() => {
            if (item.href.startsWith("/")) {
              router.push(item.href as any);
            }
          }}
          style={[
            styles.relatedRow,
            { borderColor: colors.border, backgroundColor: colors.card },
          ]}
          accessibilityRole="button"
          accessibilityLabel={item.label}
        >
          <Text style={[{ color: colors.primary, fontSize: 13 }, font("semibold")]}>
            {item.label}
          </Text>
          {item.kind ? (
            <Text style={[{ color: colors.mutedForeground, fontSize: 11 }, font("regular")]}>
              {item.kind}
            </Text>
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}

export function ToolAnatomyEvidence({ children }: { children: ReactNode }) {
  const colors = useColors();
  if (!children) return null;
  return (
    <View style={styles.block} accessibilityLabel="Evidence">
      <SectionLabel label="Evidence" />
      {typeof children === "string" || typeof children === "number" ? (
        <Text
          style={[
            { color: colors.mutedForeground, fontSize: 12, lineHeight: 17 },
            font("regular"),
          ]}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}

/** Result wrapper — prefers FieldResultPanel for field tools. */
export function ToolAnatomyResult(
  props: React.ComponentProps<typeof FieldResultPanel>,
) {
  return (
    <View accessibilityLabel="Result">
      <SectionLabel label="Result" />
      <FieldResultPanel {...props} />
    </View>
  );
}

export function ToolAnatomyFeedback({
  title,
  body,
  ctaTitle,
  onCta,
}: {
  title: string;
  body?: string;
  ctaTitle?: string;
  onCta?: () => void;
}) {
  return (
    <View style={styles.block} accessibilityLabel="Feedback">
      <SectionLabel label="Feedback" />
      <EmptyState title={title} body={body} ctaTitle={ctaTitle} onCta={onCta} />
    </View>
  );
}

const styles = StyleSheet.create({
  block: { marginTop: 14 },
  card: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: 12,
    padding: 12,
  },
  relatedRow: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
});
