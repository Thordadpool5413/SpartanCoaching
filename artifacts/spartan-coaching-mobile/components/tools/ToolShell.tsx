import React, { type ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { goBackOrReplace } from "@/lib/navigation";
import { font } from "@/lib/typography";
import { layout } from "@/lib/spacing";
import { StickyCTA } from "@/components/ui/StickyCTA";
import { MAX_FONT_SIZE_MULTIPLIER } from "@/lib/iosProductQuality";

type Props = {
  title: string;
  subtitle?: string;
  category?: string;
  /** Collapsible how body */
  howSteps?: string[];
  whenToUse?: string;
  children: ReactNode;
  /** Sticky primary (omit when stickyCta is false) */
  ctaTitle?: string;
  onCta?: () => void;
  ctaLoading?: boolean;
  ctaDisabled?: boolean;
  /** Extra bottom pad when sticky CTA shown */
  stickyCta?: boolean;
  testID?: string;
};

/**
 * Shared tool run shell — back, title, collapsible how, sticky thumb-zone CTA.
 */
export function ToolShell({
  title,
  subtitle,
  category = "Practice",
  howSteps,
  whenToUse,
  children,
  ctaTitle,
  onCta,
  ctaLoading,
  ctaDisabled,
  stickyCta = true,
  testID,
}: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [howOpen, setHowOpen] = React.useState(false);
  const bottomClear =
    (stickyCta ? layout.stickyCtaHeight + 28 + insets.bottom : 16) + 24;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID={testID}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => goBackOrReplace("/(tabs)/tools")}
          style={styles.backBtn}
          hitSlop={8}
          testID="tool-back"
          accessibilityRole="button"
          accessibilityLabel="Back to Explore"
        >
          <Feather name="chevron-left" size={22} color={colors.primary} />
          <Text style={[{ color: colors.primary, fontSize: 15 }, font("bold")]}>Explore</Text>
        </Pressable>
        <Text style={[{ color: colors.mutedForeground, fontSize: 10, letterSpacing: 1.2 }, font("bold")]}>
          HOSPICE SALES PRO · {category.toUpperCase()}
        </Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: layout.screenX,
            paddingTop: 22,
            paddingBottom: bottomClear,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text
            accessibilityRole="header"
            maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
            style={[{ color: colors.foreground, fontSize: 24, letterSpacing: -0.3 }, font("heavy")]}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
              style={[
                { color: colors.mutedForeground, fontSize: 14, marginTop: 8, lineHeight: 21 },
                font("regular"),
              ]}
            >
              {subtitle}
            </Text>
          ) : null}

          {(whenToUse || howSteps?.length) && (
            <Pressable
              onPress={() => setHowOpen((o) => !o)}
              style={[
                styles.howToggle,
                { borderColor: colors.border, backgroundColor: colors.card },
              ]}
            >
              <Text style={[{ color: colors.primary, fontSize: 12 }, font("bold")]}>
                {howOpen ? "Hide how it works" : "How it works"}
              </Text>
              <Feather
                name={howOpen ? "chevron-up" : "chevron-down"}
                size={16}
                color={colors.primary}
              />
            </Pressable>
          )}
          {howOpen && (
            <View
              style={[
                styles.howBox,
                { borderColor: colors.border, backgroundColor: colors.card },
              ]}
            >
              {whenToUse ? (
                <>
                  <Text style={[{ color: colors.primary, fontSize: 10, letterSpacing: 1.2 }, font("bold")]}>
                    WHEN
                  </Text>
                  <Text
                    style={[
                      { color: colors.foreground, fontSize: 13, marginTop: 4, lineHeight: 18 },
                      font("regular"),
                    ]}
                  >
                    {whenToUse}
                  </Text>
                </>
              ) : null}
              {howSteps?.map((step, i) => (
                <Text
                  key={i}
                  style={[
                    {
                      color: colors.mutedForeground,
                      fontSize: 13,
                      marginTop: i === 0 && !whenToUse ? 0 : 8,
                      lineHeight: 18,
                    },
                    font("regular"),
                  ]}
                >
                  {i + 1}. {step}
                </Text>
              ))}
            </View>
          )}

          <Text
            style={[
              {
                color: colors.mutedForeground,
                fontSize: 11,
                marginTop: 20,
                marginBottom: 16,
                textAlign: "center",
              },
              font("regular"),
            ]}
          >
            Field mode · Do not enter PHI · Coaching aid only
          </Text>

          {children}
        </ScrollView>
      </KeyboardAvoidingView>

      {stickyCta && ctaTitle && onCta ? (
        <StickyCTA
          title={ctaTitle}
          onPress={onCta}
          loading={ctaLoading}
          disabled={ctaDisabled}
          testID="tool-sticky-cta"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
    marginLeft: -4,
    gap: 2,
  },
  howToggle: {
    marginTop: 22,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 44,
  },
  howBox: {
    marginTop: 12,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: 16,
    padding: 18,
  },
});
