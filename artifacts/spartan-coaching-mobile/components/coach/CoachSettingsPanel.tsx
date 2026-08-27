import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { type AppearancePreference } from "@/lib/AppearanceContext";
import { type CoachPreference } from "@/lib/coachApi";
import { font } from "@/lib/typography";

export type { CoachPreference };

function PrivacyBar({
  styles,
  colors,
}: {
  styles: ReturnType<typeof makeStyles>;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.privacyBar}>
      <Feather name="lock" size={17} color={colors.success} />
      <Text style={styles.privacyText}>
        Raw conversations stay private for 90 days. Only summaries and
        commitments you explicitly share can leave Coach.
      </Text>
    </View>
  );
}

interface CoachSettingsPanelProps {
  visible: boolean;
  preference: CoachPreference;
  appearance: AppearancePreference;
  initials: string;
  onClose: () => void;
  onPreference: (next: CoachPreference) => Promise<void>;
  onAppearance: (next: AppearancePreference) => Promise<void>;
}

export function CoachSettingsPanel({
  visible,
  preference,
  appearance,
  initials,
  onClose,
  onPreference,
  onAppearance,
}: CoachSettingsPanelProps) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.sheet} edges={["top", "bottom"]}>
        <View style={styles.sheetHeader}>
          <View>
            <Text style={styles.sheetKicker}>SPARTAN COACH</Text>
            <Text style={styles.sheetTitle}>Preferences</Text>
          </View>
          <Pressable
            onPress={onClose}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel="Close Coach preferences"
          >
            <Feather name="x" size={20} color={colors.foreground} />
          </Pressable>
        </View>
        <ScrollView
          contentContainerStyle={styles.settingsContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileStrip}>
            <View style={styles.initials}>
              <Text style={styles.initialsText}>{initials}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.profileTitle}>Private coaching space</Text>
              <Text style={styles.profileBody}>
                Raw conversations are visible only to you.
              </Text>
            </View>
          </View>

          <Text style={styles.settingsLabel}>MEMORY</Text>
          <View style={styles.settingCard}>
            <View style={styles.flex}>
              <Text style={styles.settingTitle}>Personal memory</Text>
              <Text style={styles.settingBody}>
                Off by default. Coach uses only the items you explicitly save.
              </Text>
            </View>
            <Switch
              value={preference.memoryEnabled}
              accessibilityLabel="Personal memory"
              onValueChange={(memoryEnabled) =>
                void onPreference({ ...preference, memoryEnabled })
              }
              trackColor={{ false: colors.borderStrong, true: colors.primary }}
            />
          </View>

          <Text style={styles.settingsLabel}>RESPONSE STYLE</Text>
          <View style={styles.optionGroup}>
            {(["concise", "balanced", "detailed"] as const).map(
              (responseStyle) => (
                <Pressable
                  key={responseStyle}
                  onPress={() =>
                    void onPreference({ ...preference, responseStyle })
                  }
                  style={styles.optionRow}
                  accessibilityRole="radio"
                  accessibilityState={{
                    checked: preference.responseStyle === responseStyle,
                  }}
                >
                  <Text style={styles.optionText}>
                    {responseStyle[0].toUpperCase() + responseStyle.slice(1)}
                  </Text>
                  {preference.responseStyle === responseStyle ? (
                    <View style={styles.selectedCheck}>
                      <Feather name="check" size={14} color="#FFFFFF" />
                    </View>
                  ) : null}
                </Pressable>
              ),
            )}
          </View>

          <Text style={styles.settingsLabel}>APPEARANCE</Text>
          <View style={styles.appearanceRow}>
            {(["system", "light", "dark"] as const).map((choice) => (
              <Pressable
                key={choice}
                onPress={() => void onAppearance(choice)}
                style={[
                  styles.appearanceChoice,
                  appearance === choice && styles.appearanceChoiceSelected,
                ]}
                accessibilityRole="radio"
                accessibilityState={{ checked: appearance === choice }}
              >
                <Feather
                  name={
                    choice === "system"
                      ? "smartphone"
                      : choice === "light"
                        ? "sun"
                        : "moon"
                  }
                  size={19}
                  color={appearance === choice ? "#FFFFFF" : colors.foreground}
                />
                <Text
                  style={[
                    styles.appearanceText,
                    appearance === choice && styles.appearanceTextSelected,
                  ]}
                >
                  {choice[0].toUpperCase() + choice.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          <PrivacyBar styles={styles} colors={colors} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    flex: { flex: 1 },
    sheet: { flex: 1, backgroundColor: colors.background },
    sheetHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 15,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    sheetKicker: {
      color: colors.primary,
      fontSize: 10,
      letterSpacing: 1.6,
      ...font("bold"),
    },
    sheetTitle: {
      color: colors.foreground,
      fontSize: 27,
      marginTop: 3,
      ...font("heavy"),
    },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    settingsContent: { padding: 20, paddingBottom: 42 },
    profileStrip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 13,
      paddingBottom: 22,
    },
    initials: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    initialsText: { color: "#FFFFFF", fontSize: 15, ...font("bold") },
    profileTitle: { color: colors.foreground, fontSize: 16, ...font("bold") },
    profileBody: {
      color: colors.mutedForeground,
      fontSize: 12,
      marginTop: 3,
      ...font("regular"),
    },
    settingsLabel: {
      color: colors.primary,
      fontSize: 10,
      letterSpacing: 1.6,
      marginTop: 22,
      marginBottom: 9,
      ...font("bold"),
    },
    settingCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      padding: 16,
    },
    settingTitle: { color: colors.foreground, fontSize: 16, ...font("semibold") },
    settingBody: {
      color: colors.mutedForeground,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 4,
      ...font("regular"),
    },
    optionGroup: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      overflow: "hidden",
    },
    optionRow: {
      minHeight: 54,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    optionText: { color: colors.foreground, fontSize: 15, ...font("medium") },
    selectedCheck: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    appearanceRow: { flexDirection: "row", gap: 8 },
    appearanceChoice: {
      flex: 1,
      minHeight: 64,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
    },
    appearanceChoiceSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    appearanceText: { color: colors.foreground, fontSize: 12, ...font("semibold") },
    appearanceTextSelected: { color: "#FFFFFF" },
    privacyBar: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      borderRadius: 14,
      padding: 13,
      marginTop: 18,
      backgroundColor: colors.secondary,
    },
    privacyText: {
      flex: 1,
      color: colors.mutedForeground,
      fontSize: 12,
      lineHeight: 18,
      ...font("regular"),
    },
  });
}
