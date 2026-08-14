import React from "react";
import { Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { font } from "@/lib/typography";
import { SpartanCard } from "./SpartanCard";
import { SpartanButton } from "./SpartanButton";
import { SectionKicker } from "./SectionKicker";
import { MAX_FONT_SIZE_MULTIPLIER } from "@/lib/iosProductQuality";

type Props = {
  kicker?: string;
  title: string;
  subtitle?: string;
  ctaLabel: string;
  onCta: () => void;
  ctaDisabled?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
  testID?: string;
  ctaTestID?: string;
};

/**
 * Single emphasis mission card — only one above the fold on Home/Portal-aligned shells.
 */
export function MissionCard({
  kicker = "Next action",
  title,
  subtitle,
  ctaLabel,
  onCta,
  ctaDisabled,
  secondaryLabel,
  onSecondary,
  testID = "section-mission-next",
  ctaTestID = "button-mission-next",
}: Props) {
  const colors = useColors();

  return (
    <View testID={testID}>
      <SpartanCard variant="emphasis">
        <SectionKicker>{kicker}</SectionKicker>
        <Text
          maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
          accessibilityRole="header"
          style={[{ color: colors.foreground, fontSize: 20, marginTop: 8 }, font("heavy")]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
            style={[
              { color: colors.mutedForeground, fontSize: 13, marginTop: 6, lineHeight: 19 },
              font("regular"),
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
        <SpartanButton
          title={ctaLabel}
          onPress={onCta}
          disabled={ctaDisabled}
          style={{ marginTop: 14 }}
          testID={ctaTestID}
        />
        {secondaryLabel && onSecondary ? (
          <SpartanButton
            title={secondaryLabel}
            variant="ghost"
            onPress={onSecondary}
            style={{ marginTop: 8 }}
          />
        ) : null}
      </SpartanCard>
    </View>
  );
}
