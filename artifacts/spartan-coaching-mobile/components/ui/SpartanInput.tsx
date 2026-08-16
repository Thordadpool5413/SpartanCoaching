import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { useColors } from "@/hooks/useColors";
import { font } from "@/lib/typography";
import { MAX_FONT_SIZE_MULTIPLIER, MIN_TOUCH_TARGET } from "@/lib/iosProductQuality";

export function SpartanInput({
  label,
  error,
  secureTextEntry,
  style,
  ...props
}: TextInputProps & { label?: string; error?: string | null }) {
  const colors = useColors();
  const [revealed, setRevealed] = useState(false);
  const isPassword = Boolean(secureTextEntry);
  return (
    <View style={styles.wrap}>
      {label ? (
        <Text
          maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
          style={[styles.label, { color: colors.mutedForeground }]}
          accessibilityRole="text"
        >
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.inputShell,
          {
            borderColor: error ? colors.destructive : colors.border,
            backgroundColor: colors.card,
            minHeight: MIN_TOUCH_TARGET,
          },
        ]}
      >
        <TextInput
          placeholderTextColor={colors.mutedForeground}
          accessibilityLabel={label ?? props.placeholder ?? "Text field"}
          maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
          secureTextEntry={isPassword && !revealed}
          style={[
            styles.input,
            { color: colors.foreground },
            style,
          ]}
          {...props}
        />
        {isPassword ? (
          <Pressable
            onPress={() => setRevealed((value) => !value)}
            accessibilityRole="button"
            accessibilityLabel={revealed ? "Hide password" : "Show password"}
            accessibilityState={{ expanded: revealed }}
            hitSlop={4}
            style={styles.revealButton}
          >
            <Feather
              name={revealed ? "eye-off" : "eye"}
              size={19}
              color={colors.mutedForeground}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text
          maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
          accessibilityRole="alert"
          style={[styles.error, { color: colors.destructive }]}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 4 },
  label: {
    fontSize: 12,
    marginBottom: 6,
    marginTop: 12,
    ...font("semibold"),
  },
  inputShell: {
    borderWidth: 1,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    ...font("regular"),
  },
  revealButton: {
    width: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: "center",
    justifyContent: "center",
  },
  error: { marginTop: 8, fontSize: 13, ...font("regular") },
});
