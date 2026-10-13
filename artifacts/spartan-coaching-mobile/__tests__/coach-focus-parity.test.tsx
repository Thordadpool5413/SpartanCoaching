import fs from "node:fs";
import path from "node:path";

const screen = fs.readFileSync(
  path.resolve(__dirname, "../app/(tabs)/coach.tsx"),
  "utf8",
);

describe("native Coach cross-device freshness", () => {
  it("loads server history whenever Coach regains navigation focus", () => {
    expect(screen).toContain('import { router, useFocusEffect } from "expo-router"');
    expect(screen).toContain("useFocusEffect(");
    expect(screen).toContain("listCoachConversations(), getCoachPreferences()");
    expect(screen).toContain("[canUseElite, memberId]");
  });

  it("ignores a late history response from a prior focus or member", () => {
    expect(screen).toContain("let active = true");
    expect(screen).toContain("if (!active) return");
    expect(screen).toContain("return () => { active = false; }");
  });

  it("clears private conversation state when a different account gains the tab", () => {
    expect(screen).toContain("previousAccountAccessKey.current === accountAccessKey");
    expect(screen).toContain('const memberId = user?.member?.id ?? null');
    expect(screen).toContain("setMessages([])");
    expect(screen).toContain("setConversationId(null)");
    expect(screen).toContain("setConversations([])");
    expect(screen).toContain("setPreference(defaultPreference)");
    expect(screen).toContain("setHistoryOpen(false)");
  });
});
