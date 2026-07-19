import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { runEngine, type BranchInputs } from "@workspace/branch-engine/engine";
import {
  DEFAULT_INPUTS,
  PRESET_CONFIGS,
  STAFF_ROLES,
} from "@workspace/branch-engine/presets";
import { CONTENT_VERSION } from "@workspace/branch-engine/content";
import { StaffingTable } from "@/components/StaffingTable";
import { useColors } from "@/hooks/useColors";

export function buildInputs(presetKey: string, targetADC: number): BranchInputs {
  const preset = PRESET_CONFIGS[presetKey];
  return {
    ...DEFAULT_INPUTS,
    ...(preset ? preset.inputs : {}),
    scenarioPreset: presetKey,
    targetADC,
  };
}

export default function StaffingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [presetKey, setPresetKey] = useState<string>(DEFAULT_INPUTS.scenarioPreset);
  const [adcText, setAdcText] = useState<string>(String(DEFAULT_INPUTS.targetADC));

  const targetADC = useMemo(() => {
    const parsed = Number(adcText);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_INPUTS.targetADC;
  }, [adcText]);

  const results = useMemo(
    () => runEngine(buildInputs(presetKey, targetADC), STAFF_ROLES, CONTENT_VERSION),
    [presetKey, targetADC],
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: "Branch Staffing",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
        }}
      />
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
      >
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          Scenario
        </Text>
        <View style={styles.presetRow}>
          {Object.entries(PRESET_CONFIGS).map(([key, preset]) => {
            const active = key === presetKey;
            return (
              <Pressable
                key={key}
                onPress={() => setPresetKey(key)}
                style={[
                  styles.presetButton,
                  {
                    backgroundColor: active ? colors.primary : colors.secondary,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
                testID={`button-scenario-${key}`}
              >
                <Text
                  style={[
                    styles.presetLabel,
                    { color: active ? colors.primaryForeground : colors.secondaryForeground },
                  ]}
                >
                  {preset.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          Target ADC (average daily census)
        </Text>
        <TextInput
          value={adcText}
          onChangeText={setAdcText}
          keyboardType="number-pad"
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              borderColor: colors.input,
              color: colors.foreground,
            },
          ]}
          testID="input-adc"
        />

        <StaffingTable results={results} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  presetRow: {
    flexDirection: "row",
    gap: 8,
  },
  presetButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  presetLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
});
