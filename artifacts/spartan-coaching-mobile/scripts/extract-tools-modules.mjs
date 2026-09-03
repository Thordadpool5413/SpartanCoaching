import fs from "fs";

const path = new URL("../app/(tabs)/tools.tsx", import.meta.url);
let s = fs.readFileSync(path, "utf8");

// --- 1) Replace top imports + tab constants ---
const importEnd = s.indexOf("const EMAIL_TYPES");
if (importEnd < 0) throw new Error("EMAIL_TYPES not found");

const newHead = `import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { apiPost, getWebSiteUrl } from "@/lib/api";
import { ReminderPicker } from "@/components/ReminderPicker";
import { useSavedResponses } from "@/hooks/useSavedResponses";
import { useAuth } from "@/lib/AuthContext";
import { router, useLocalSearchParams } from "expo-router";
import {
  FIELD_KIT_TOOLS,
  type FieldKitTool,
} from "@workspace/field-kit-catalog";
import { SpartanCard } from "@/components/ui/SpartanCard";
import { SectionKicker } from "@/components/ui/SectionKicker";
import { CitationsBlock, type CitationItem } from "@/components/ui/CitationsBlock";
import { FieldResultPanel } from "@/components/FieldResultPanel";
import { SavedResponsesSection } from "@/components/SavedResponsesSection";
import { RolePlayTool } from "@/components/RolePlayTool";
import { TOOL_TABS, VALID_TABS, type ToolTab } from "@/lib/toolTabs";

`;

s = newHead + s.slice(importEnd);

// --- 2) Drop ROLEPLAY_SCENARIOS … ScenarioStat (keep EMAIL_TYPES) ---
const afterEmail = s.indexOf("];", s.indexOf("const EMAIL_TYPES")) + 2;
const exportDef = s.indexOf("export default function ToolsScreen()");
if (afterEmail < 2 || exportDef < 0) throw new Error("bounds for strip");
s = s.slice(0, afterEmail) + "\n\n" + s.slice(exportDef);

// --- 3) Remove roleplaySaved hook ---
s = s.replace(/\n\s*const roleplaySaved = useSavedResponses\("roleplay"\);\n/, "\n");

// --- 4) Remove Role-Play state block ---
{
  const a = s.indexOf("  // Role-Play state");
  const b = s.indexOf("  const handleObjection = async ()");
  if (a > 0 && b > a) s = s.slice(0, a) + s.slice(b);
}

// --- 5) Remove roleplay handlers (save/share/start/send/end/reset) ---
{
  const saveRp = s.indexOf("  const handleSaveRoleplay");
  const startRp = s.indexOf("  const startRoleplay = async");
  const ret = s.indexOf("\n  return (\n", startRp > 0 ? startRp : 0);
  let cut = startRp > 0 ? startRp : -1;
  if (saveRp > 0 && (cut < 0 || saveRp < cut)) cut = saveRp;
  if (cut > 0 && ret > cut) s = s.slice(0, cut) + s.slice(ret + 1);
}

// --- 6) Replace tool body (active roleplay + scroll tools) ---
const activeMarker = "      {/* Active roleplay chat";
const activeIdx = s.indexOf(activeMarker);
if (activeIdx < 0) throw new Error("active roleplay marker missing");

const playbookMarker = "          {/* Playbooks */}";
const playbookIdx = s.indexOf(playbookMarker, activeIdx);
const roleplayScroll = s.indexOf("          {/* Role-Play */}", playbookIdx);
if (playbookIdx < 0 || roleplayScroll < 0) throw new Error("playbook/roleplay markers");

let middle = s.slice(playbookIdx, roleplayScroll);
// Normalize SavedSection → SavedResponsesSection
middle = middle.replace(
  /<SavedSection\s+items=\{(\w+)\.savedItems\}\s+onDelete=\{\1\.deleteResponse\}\s+colors=\{colors\}\s*\/>/g,
  "<SavedResponsesSection items={$1.savedItems} onDelete={$1.deleteResponse} />",
);
middle = middle.replace(
  /<SavedSection[\s\S]*?colors=\{colors\}\s*\/>/g,
  (m) => {
    const items = m.match(/items=\{(\w+)\.savedItems\}/);
    const del = m.match(/onDelete=\{(\w+)\.deleteResponse\}/);
    if (items && del) {
      return `<SavedResponsesSection items={${items[1]}.savedItems} onDelete={${del[1]}.deleteResponse} />`;
    }
    return m;
  },
);

// Replace playbook/email result cards with FieldResultPanel-ish is optional; keep share for now

const stylesIdx = s.indexOf("const styles = StyleSheet.create");
if (stylesIdx < 0) throw new Error("styles missing");
let stylesBlock = s.slice(stylesIdx);
// Drop roleplay-only style keys (optional cleanup)
stylesBlock = stylesBlock
  .replace(/\n  \/\/ Role-Play:[\s\S]*$/m, "\n});\n")
  .replace(/\n  roleplayIntroTitle:[\s\S]*$/m, "\n});\n");

// If the replace above mangled, re-read styles from original file
const original = fs.readFileSync(path, "utf8");
const origStylesIdx = original.indexOf("const styles = StyleSheet.create");
const origStyles = original.slice(origStylesIdx);
// Keep styles needed by non-roleplay tools; strip pure roleplay section from styles
const roleplayStylesStart = origStyles.indexOf("\n  // Role-Play: Scenario selection");
stylesBlock =
  roleplayStylesStart > 0
    ? origStyles.slice(0, roleplayStylesStart) + "\n});\n"
    : origStyles;

const head = s.slice(0, activeIdx);
const objectionBlock = `      {!browseMode && activeTab === "roleplay" ? (
        <RolePlayTool
          canUseFieldKit={canUseFieldKit}
          tabBarHeight={tabBarHeight}
          bottomPad={bottomPad}
        />
      ) : !browseMode && activeTab ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            contentContainerStyle={{ paddingBottom: bottomPad }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
        <View style={styles.content}>
          {/* Objection Handler */}
          {activeTab === "objection" && (
            <View>
              <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                What objection are you hearing?
              </Text>
              <TextInput
                style={[styles.textarea, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border, fontFamily: "Inter_400Regular" }]}
                placeholder="e.g. 'The patient is not ready for hospice yet...'"
                placeholderTextColor={colors.mutedForeground}
                value={objection}
                onChangeText={setObjection}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <Pressable
                onPress={handleObjection}
                disabled={objectionLoading || objection.trim().length < 5}
                style={({ pressed }) => [
                  styles.submitBtn,
                  { backgroundColor: colors.primary },
                  (objectionLoading || objection.trim().length < 5) && { opacity: 0.5 },
                  pressed && { opacity: 0.85 },
                ]}
              >
                {objectionLoading ? (
                  <ActivityIndicator color={colors.primaryForeground} size="small" />
                ) : (
                  <Text style={[styles.submitBtnText, { fontFamily: "Inter_700Bold", color: colors.primaryForeground }]}>Generate Response</Text>
                )}
              </Pressable>
              <FieldResultPanel
                title="Talk track"
                content={objectionResult || undefined}
                loading={objectionLoading && !objectionResult}
                error={objectionError}
                onSave={objectionResult ? handleSaveObjection : undefined}
                saved={!!objectionSavedId}
              >
                {objectionResult ? (
                  <CitationsBlock items={objectionCitations} title="Spartan Method sources" />
                ) : null}
              </FieldResultPanel>
              {!!objectionResult && (
                <ReminderPicker
                  title="Follow up after your visit"
                  body="You practiced handling an objection — set a reminder to follow up with your contact."
                  storageKey="objection"
                />
              )}
              <SavedResponsesSection
                items={objectionSaved.savedItems}
                onDelete={objectionSaved.deleteResponse}
              />
            </View>
          )}

`;

const tail = `
        </View>
          </ScrollView>
        </KeyboardAvoidingView>
      ) : null}
    </View>
  );
}

`;

s = head + objectionBlock + middle + tail + stylesBlock;

// Remove dangling refs
s = s.replace(/scrollRef/g, "/* scrollRef removed */ null");
// Don't leave broken comments in code - scrollRef should already be gone

// Ensure SectionKicker still used (browse mode)
if (!s.includes("SectionKicker") && s.includes("SpartanCard")) {
  // ok if unused - tsc may warn
}

fs.writeFileSync(path, s);
console.log("Wrote tools.tsx lines:", s.split("\n").length);
