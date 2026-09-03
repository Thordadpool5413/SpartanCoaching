/**
 * Role-play uses existing RolePlayTool body inside ToolShell chrome.
 */
import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/lib/AuthContext";
import { RolePlayTool } from "@/components/RolePlayTool";
import { ToolShell } from "./ToolShell";

export function RolePlayToolScreen() {
  const { canUseFieldKit } = useAuth();
  const insets = useSafeAreaInsets();
  const tabBarHeight = insets.bottom + 49;
  const bottomPad = insets.bottom + 24;

  return (
    <ToolShell
      title="Role-Play Practice"
      subtitle="Simulate hard conversations before you're in the room."
      category="Practice"
      catalogToolId="role-play"
      stickyCta={false}
      testID="tool-roleplay"
    >
      <View style={{ marginHorizontal: -16 }}>
        <RolePlayTool
          canUseFieldKit={canUseFieldKit}
          tabBarHeight={tabBarHeight}
          bottomPad={bottomPad}
        />
      </View>
    </ToolShell>
  );
}
