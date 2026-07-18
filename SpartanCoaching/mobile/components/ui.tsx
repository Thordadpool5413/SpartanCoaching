import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { colors, gradients, radius, shadows, spacing } from "@/lib/theme";

type ScreenScrollViewProps = React.ComponentProps<typeof ScrollView> & {
  fullBleed?: boolean;
};

export const ScreenScrollView = React.forwardRef<ScrollView, ScreenScrollViewProps>(
  function ScreenScrollView(
    { children, style, contentContainerStyle, fullBleed = false, ...props },
    ref
  ) {
    return (
      <View style={styles.screen}>
        <LinearGradient colors={gradients.hero} style={StyleSheet.absoluteFillObject} />
        <View style={styles.overlay} />
        <ScrollView
          {...props}
          ref={ref}
          style={[styles.scroll, style]}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={[
            styles.content,
            !fullBleed && styles.padded,
            contentContainerStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </View>
    );
  }
);

type CardProps = React.PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
}>;

export function Card({ children, style }: CardProps) {
  return <View style={[styles.card, shadows.card as object, style]}>{children}</View>;
}

type PressableCardProps = React.PropsWithChildren<
  CardProps & {
    onPress?: () => void;
    disabled?: boolean;
  }
>;

export function PressableCard({ children, onPress, disabled, style }: PressableCardProps) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [pressed && onPress ? styles.pressed : null]}>
      <Card style={style}>{children}</Card>
    </Pressable>
  );
}

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
};

export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1, gap: 6 }}>
        <Text selectable style={styles.sectionTitle}>
          {title}
        </Text>
        {subtitle ? (
          <Text selectable style={styles.sectionSubtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {action}
    </View>
  );
}

type BadgeProps = {
  tone?: "neutral" | "accent" | "good" | "warning" | "danger";
  children: React.ReactNode;
};

export function Pill({ tone = "neutral", children }: BadgeProps) {
  return (
    <View style={[styles.pill, styles[`pill_${tone}` as const]]}>
      <Text selectable style={[styles.pillText, styles[`pillText_${tone}` as const]]}>
        {children}
      </Text>
    </View>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
  tone?: "neutral" | "accent" | "good" | "warning" | "danger";
  caption?: string;
};

export function MetricCard({ label, value, tone = "neutral", caption }: MetricCardProps) {
  return (
    <Card style={styles.metricCard}>
      <Text selectable style={styles.metricLabel}>
        {label}
      </Text>
      <Text selectable style={[styles.metricValue, styles[`metricValue_${tone}` as const]]}>
        {value}
      </Text>
      {caption ? (
        <Text selectable style={styles.metricCaption}>
          {caption}
        </Text>
      ) : null}
    </Card>
  );
}

type FieldProps = TextInputProps & {
  label?: string;
  helper?: string;
  labelStyle?: StyleProp<TextStyle>;
  inputStyle?: StyleProp<ViewStyle>;
};

export function Field({
  label,
  helper,
  style,
  labelStyle,
  inputStyle,
  multiline,
  ...props
}: FieldProps) {
  return (
    <View style={{ gap: 8 }}>
      {label ? <Text style={[styles.fieldLabel, labelStyle]}>{label}</Text> : null}
      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor={colors.muted}
        style={[styles.fieldInput, multiline && styles.fieldMultiline, inputStyle, style]}
      />
      {helper ? <Text style={styles.fieldHelper}>{helper}</Text> : null}
    </View>
  );
}

type PrimaryButtonProps = {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
};

export function PrimaryButton({ title, onPress, disabled, loading, icon }: PrimaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        styles.primaryButton,
        (disabled || loading) && styles.buttonDisabled,
        pressed && !disabled && !loading ? styles.buttonPressed : null,
      ]}
    >
      <View style={styles.buttonContent}>
        {loading ? <ActivityIndicator color={colors.text} /> : icon}
        <Text style={styles.primaryButtonText}>{title}</Text>
      </View>
    </Pressable>
  );
}

type SecondaryButtonProps = {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
};

export function SecondaryButton({ title, onPress, disabled, icon }: SecondaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        styles.secondaryButton,
        disabled && styles.buttonDisabled,
        pressed && !disabled ? styles.buttonPressed : null,
      ]}
    >
      <View style={styles.buttonContent}>
        {icon}
        <Text style={styles.secondaryButtonText}>{title}</Text>
      </View>
    </Pressable>
  );
}

type EmptyStateProps = {
  title: string;
  body: string;
  action?: React.ReactNode;
};

export function EmptyState({ title, body, action }: EmptyStateProps) {
  return (
    <Card style={styles.emptyState}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
      {action ? <View style={{ marginTop: spacing.md }}>{action}</View> : null}
    </Card>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

type RowProps = {
  label: string;
  value: string;
  tone?: "neutral" | "accent" | "good" | "warning" | "danger";
  detail?: string;
};

export function RowItem({ label, value, tone = "neutral", detail }: RowProps) {
  return (
    <View style={styles.rowItem}>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {detail ? <Text style={styles.rowDetail}>{detail}</Text> : null}
      </View>
      <Text style={[styles.rowValue, styles[`rowValue_${tone}` as const]]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(7, 17, 30, 0.6)",
  },
  scroll: {
    flex: 1,
  },
  content: {
    gap: spacing.lg,
  },
  padded: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    ...((shadows.card as object) || {}),
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "800",
  },
  sectionSubtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  pill: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  pill_neutral: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.border,
  },
  pill_accent: {
    backgroundColor: "rgba(255, 90, 79, 0.14)",
    borderColor: "rgba(255, 90, 79, 0.28)",
  },
  pill_good: {
    backgroundColor: "rgba(64, 211, 154, 0.14)",
    borderColor: "rgba(64, 211, 154, 0.28)",
  },
  pill_warning: {
    backgroundColor: "rgba(244, 184, 58, 0.14)",
    borderColor: "rgba(244, 184, 58, 0.28)",
  },
  pill_danger: {
    backgroundColor: "rgba(255, 107, 107, 0.14)",
    borderColor: "rgba(255, 107, 107, 0.28)",
  },
  pillText: {
    fontSize: 12,
    fontWeight: "700",
  },
  pillText_neutral: {
    color: colors.text,
  },
  pillText_accent: {
    color: colors.accent,
  },
  pillText_good: {
    color: colors.good,
  },
  pillText_warning: {
    color: colors.warning,
  },
  pillText_danger: {
    color: colors.danger,
  },
  metricCard: {
    flex: 1,
    minWidth: 120,
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  metricValue: {
    color: colors.text,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  metricValue_accent: {
    color: colors.accent,
  },
  metricValue_good: {
    color: colors.good,
  },
  metricValue_warning: {
    color: colors.warning,
  },
  metricValue_danger: {
    color: colors.danger,
  },
  metricValue_neutral: {
    color: colors.text,
  },
  metricCaption: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  fieldLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  fieldInput: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
  },
  fieldMultiline: {
    minHeight: 110,
    textAlignVertical: "top",
  },
  fieldHelper: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  button: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 13,
    borderWidth: 1,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderColor: "rgba(255,255,255,0.04)",
  },
  secondaryButton: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonPressed: {
    opacity: 0.88,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "flex-start",
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "800",
  },
  emptyBody: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  rowItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  rowDetail: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  rowValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "right",
  },
  rowValue_accent: {
    color: colors.accent,
  },
  rowValue_good: {
    color: colors.good,
  },
  rowValue_warning: {
    color: colors.warning,
  },
  rowValue_danger: {
    color: colors.danger,
  },
  rowValue_neutral: {
    color: colors.text,
  },
});
