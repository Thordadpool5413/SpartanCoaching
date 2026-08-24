import React from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Svg, Circle, Path, Rect, Line, G } from "react-native-svg";
import { useColors } from "@/hooks/useColors";
import { font } from "@/lib/typography";
import { SpartanButton } from "./SpartanButton";
import { radius } from "@/lib/spacing";
import { MAX_FONT_SIZE_MULTIPLIER } from "@/lib/iosProductQuality";

type EmptyVariant =
  | "saved-outputs"
  | "upcoming-visits"
  | "offline"
  | "locked"
  | "no-results"
  | "generic";

type Props = {
  title: string;
  body?: string;
  icon?: React.ComponentProps<typeof Feather>["name"];
  variant?: EmptyVariant;
  ctaTitle?: string;
  onCta?: () => void;
  testID?: string;
  style?: ViewStyle;
};

function SavedOutputsIllustration({ primary, muted }: { primary: string; muted: string }) {
  return (
    <Svg width={48} height={48} viewBox="0 0 48 48">
      <Rect x="6" y="10" width="36" height="28" rx="4" fill={muted} />
      <Rect x="10" y="16" width="20" height="2.5" rx="1.25" fill={primary} opacity={0.7} />
      <Rect x="10" y="21" width="28" height="2" rx="1" fill={primary} opacity={0.3} />
      <Rect x="10" y="26" width="22" height="2" rx="1" fill={primary} opacity={0.3} />
      <Circle cx="36" cy="34" r="7" fill={primary} />
      <Path d="M33 34l2 2 4-4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function UpcomingVisitsIllustration({ primary, muted }: { primary: string; muted: string }) {
  return (
    <Svg width={48} height={48} viewBox="0 0 48 48">
      <Rect x="6" y="12" width="36" height="28" rx="4" fill={muted} />
      <Rect x="6" y="12" width="36" height="9" rx="4" fill={primary} opacity={0.18} />
      <Rect x="14" y="8" width="3" height="8" rx="1.5" fill={primary} />
      <Rect x="31" y="8" width="3" height="8" rx="1.5" fill={primary} />
      <Circle cx="17" cy="28" r="2" fill={primary} opacity={0.4} />
      <Circle cx="24" cy="28" r="2" fill={primary} opacity={0.4} />
      <Circle cx="31" cy="28" r="2" fill={primary} />
      <Path d="M10 38 Q24 30 38 38" stroke={primary} strokeWidth="1.5" strokeLinecap="round" opacity={0.3} />
    </Svg>
  );
}

function OfflineIllustration({ primary, muted }: { primary: string; muted: string }) {
  return (
    <Svg width={48} height={48} viewBox="0 0 48 48">
      <Rect x="20" y="34" width="8" height="8" rx="2" fill={primary} opacity={0.5} />
      <Rect x="14" y="26" width="20" height="6" rx="2" fill={muted} />
      <Rect x="8" y="18" width="32" height="6" rx="2" fill={muted} opacity={0.6} />
      <Rect x="2" y="10" width="44" height="6" rx="2" fill={muted} opacity={0.3} />
      <Line x1="6" y1="42" x2="42" y2="6" stroke={primary} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

function LockedIllustration({ primary, muted }: { primary: string; muted: string }) {
  return (
    <Svg width={48} height={48} viewBox="0 0 48 48">
      <Path d="M16 22v-6a8 8 0 0 1 16 0v6" stroke={primary} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity={0.5} />
      <Rect x="10" y="22" width="28" height="20" rx="5" fill={muted} />
      <Circle cx="24" cy="32" r="3.5" fill={primary} />
      <Rect x="22.5" y="32" width="3" height="5" rx="1.5" fill={primary} />
    </Svg>
  );
}

function NoResultsIllustration({ primary, muted }: { primary: string; muted: string }) {
  return (
    <Svg width={48} height={48} viewBox="0 0 48 48">
      <Circle cx="22" cy="22" r="13" stroke={primary} strokeWidth="2.5" fill={muted} />
      <Line x1="31" y1="31" x2="42" y2="42" stroke={primary} strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M18 19 Q22 15 26 19" stroke={primary} strokeWidth="2" strokeLinecap="round" fill="none" opacity={0.5} />
      <Circle cx="22" cy="26" r="1.5" fill={primary} opacity={0.6} />
    </Svg>
  );
}

function GenericIllustration({ primary, muted }: { primary: string; muted: string }) {
  return (
    <Svg width={48} height={48} viewBox="0 0 48 48">
      <Circle cx="24" cy="24" r="18" fill={muted} />
      <Path d="M24 16v8l5 3" stroke={primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

function Illustration({ variant, primary, muted }: { variant: EmptyVariant; primary: string; muted: string }) {
  switch (variant) {
    case "saved-outputs": return <SavedOutputsIllustration primary={primary} muted={muted} />;
    case "upcoming-visits": return <UpcomingVisitsIllustration primary={primary} muted={muted} />;
    case "offline": return <OfflineIllustration primary={primary} muted={muted} />;
    case "locked": return <LockedIllustration primary={primary} muted={muted} />;
    case "no-results": return <NoResultsIllustration primary={primary} muted={muted} />;
    default: return <GenericIllustration primary={primary} muted={muted} />;
  }
}

export function EmptyState({ title, body, icon = "inbox", variant = "generic", ctaTitle, onCta, testID, style }: Props) {
  const colors = useColors();
  return (
    <View
      testID={testID}
      accessibilityRole="summary"
      accessibilityLabel={body ? `${title}. ${body}` : title}
      style={[
        styles.box,
        { backgroundColor: colors.card, borderColor: colors.border },
        style,
      ]}
    >
      <View
        style={[styles.iconCircle, { backgroundColor: colors.primaryMuted ?? "rgba(255,45,32,0.12)" }]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {variant !== "generic" ? (
          <Illustration variant={variant} primary={colors.primary} muted={colors.muted} />
        ) : (
          <Feather name={icon} size={22} color={colors.primary} />
        )}
      </View>
      <Text
        maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
        style={[{ color: colors.foreground, fontSize: 17, marginTop: 14, textAlign: "center" }, font("bold")]}
      >
        {title}
      </Text>
      {body ? (
        <Text
          maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
          style={[
            { color: colors.mutedForeground, fontSize: 13, marginTop: 8, textAlign: "center", lineHeight: 19 },
            font("regular"),
          ]}
        >
          {body}
        </Text>
      ) : null}
      {ctaTitle && onCta ? (
        <SpartanButton title={ctaTitle} onPress={onCta} style={{ marginTop: 16, alignSelf: "stretch" }} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: radius.lg,
    padding: 24,
    alignItems: "center",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
