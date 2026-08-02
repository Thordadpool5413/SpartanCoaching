import React from "react";
import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { useColors } from "@/hooks/useColors";
import { font } from "@/lib/typography";

export function SpartanInput({
  label,
  error,
  style,
  ...props
}: TextInputProps & { label?: string; error?: string | null }) {
  const colors = useColors();
  return (
    <View style={styles.wrap}>
      {label ? (
        <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
      ) : null}
      <TextInput
        placeholderTextColor={colors.mutedForeground}
        style={[
          styles.input,
          {
            borderColor: error ? colors.destructive : colors.border,
            color: colors.foreground,
            backgroundColor: colors.card,
          },
          style,
        ]}
        {...props}
      />
      {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
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
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    ...font("regular"),
  },
  error: { marginTop: 8, fontSize: 13, ...font("regular") },
});
