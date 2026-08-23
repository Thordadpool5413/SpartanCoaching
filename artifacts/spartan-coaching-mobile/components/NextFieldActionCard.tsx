import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { trackProductOutcome } from "@/lib/analytics";
import { useColors } from "@/hooks/useColors";
import { font } from "@/lib/typography";

export type NextFieldAction = {
  toolId: string;
  actionId: string;
  label: string;
  description: string;
  href: string;
  persistenceNote: string;
};

export function NextFieldActionCard({
  action,
  testID,
}: {
  action: NextFieldAction;
  testID?: string;
}) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const openNextAction = () => {
    void trackProductOutcome("next_action_confirmation", {
      toolId: action.toolId,
      platform: "ios",
      stepId: action.actionId,
    });
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(action.href as never);
  };

  return (
    <View
      style={styles.card}
      accessibilityLabel="Next field action"
      testID={testID ?? `next-field-action-${action.toolId}`}
    >
      <Text style={styles.kicker}>NEXT FIELD ACTION</Text>
      <Text style={styles.description}>{action.description}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={action.label}
        onPress={openNextAction}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        testID={`${testID ?? `next-field-action-${action.toolId}`}-button`}
      >
        <Text style={styles.buttonText}>{action.label}</Text>
        <Feather name="arrow-right" size={18} color="#FFFFFF" />
      </Pressable>
      <Text style={styles.note}>{action.persistenceNote}</Text>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    card: {
      marginHorizontal: 22,
      marginTop: 2,
      borderWidth: 1,
      borderColor: `${colors.primary}40`,
      borderRadius: 16,
      backgroundColor: `${colors.primary}12`,
      padding: 16,
    },
    kicker: {
      color: colors.primary,
      fontSize: 9,
      letterSpacing: 1.5,
      ...font("bold"),
    },
    description: {
      color: colors.foreground,
      fontSize: 13,
      lineHeight: 19,
      marginTop: 6,
      ...font("regular"),
    },
    button: {
      minHeight: 46,
      marginTop: 14,
      borderRadius: 13,
      backgroundColor: colors.primary,
      paddingHorizontal: 15,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    buttonText: { color: "#FFFFFF", fontSize: 13, ...font("bold") },
    note: {
      color: colors.mutedForeground,
      fontSize: 10,
      lineHeight: 15,
      marginTop: 12,
      ...font("regular"),
    },
    pressed: { opacity: 0.78 },
  });
}