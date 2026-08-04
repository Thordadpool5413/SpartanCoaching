import React from "react";
import { Stack, useLocalSearchParams, Redirect } from "expo-router";
import { View, Text } from "react-native";
import { useColors } from "@/hooks/useColors";
import { font } from "@/lib/typography";
import type { ToolTab } from "@/lib/toolTabs";
import { isToolTab } from "@/lib/toolDeepLinks";
import { ObjectionTool } from "@/components/tools/ObjectionTool";
import { PlaybookTool } from "@/components/tools/PlaybookTool";
import { EmailTool } from "@/components/tools/EmailTool";
import { ResearchTool } from "@/components/tools/ResearchTool";
import { WeeklyTool } from "@/components/tools/WeeklyTool";
import { ColdCallTool } from "@/components/tools/ColdCallTool";
import { RolePlayToolScreen } from "@/components/tools/RolePlayToolScreen";

/**
 * Dedicated tool run screens — catalog lives on Tools tab.
 * Deep links: /tool/objection etc. Legacy tools?tab= redirects here.
 */
export default function ToolRunScreen() {
  const colors = useColors();
  const raw = useLocalSearchParams<{ tab?: string | string[] }>().tab;
  const tab = Array.isArray(raw) ? raw[0] : raw;

  if (!isToolTab(tab)) {
    return <Redirect href="/(tabs)/tools" />;
  }

  const titles: Record<ToolTab, string> = {
    objection: "Objection Handler",
    playbook: "Playbook Generator",
    email: "Email Templates",
    roleplay: "Role-Play",
    research: "Research",
    weekly: "Weekly Plan",
    cold: "Cold Call",
  };

  let body: React.ReactNode = null;
  switch (tab) {
    case "objection":
      body = <ObjectionTool />;
      break;
    case "playbook":
      body = <PlaybookTool />;
      break;
    case "email":
      body = <EmailTool />;
      break;
    case "roleplay":
      body = <RolePlayToolScreen />;
      break;
    case "research":
      body = <ResearchTool />;
      break;
    case "weekly":
      body = <WeeklyTool />;
      break;
    case "cold":
      body = <ColdCallTool />;
      break;
    default:
      body = (
        <View style={{ flex: 1, padding: 24, backgroundColor: colors.background }}>
          <Text style={[{ color: colors.foreground }, font("bold")]}>Unknown tool</Text>
        </View>
      );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false, title: titles[tab] }} />
      {body}
    </>
  );
}
