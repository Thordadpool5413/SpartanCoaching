import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { apiPost } from "@/lib/api";
import { ResearchTool } from "../components/tools/ResearchTool";
import CoachScreen from "../app/(tabs)/coach";
import { listCoachConversations, getCoachPreferences } from "@/lib/coachApi";

jest.mock("@/lib/api", () => ({ apiPost: jest.fn(), apiGet: jest.fn() }));
jest.mock("@/lib/offlineQueue", () => ({
  shouldEnqueueOnError: () => true,
  userFacingApiError: () => "Research service unavailable.",
}));
jest.mock("@/lib/coachApi", () => ({
  listCoachConversations: jest.fn(),
  getCoachPreferences: jest.fn(),
  loadCoachConversation: jest.fn(),
  createCoachConversation: jest.fn(),
  sendCoachMessage: jest.fn(),
  deleteCoachConversation: jest.fn(),
  saveCoachMemory: jest.fn(),
  saveCoachPreferences: jest.fn(),
}));
jest.mock("@/lib/AuthContext", () => ({
  useAuth: () => ({ canUseFieldKit: true, canUseElite: true, isAuthenticated: true, user: { member: { name: "Test User" } } }),
}));
jest.mock("@/hooks/useColors", () => ({
  useColors: () => ({
    background: "#fff", border: "#ddd", borderStrong: "#bbb", card: "#fff",
    destructive: "#b00", foreground: "#111", mutedForeground: "#666",
    primary: "#c00", primaryForeground: "#fff", primaryMuted: "#fee",
    readablePrimary: "#900", heroBackground: "#111", heroForeground: "#fff",
    heroMuted: "#ccc", accent: "#c00", input: "#fff", secondary: "#eee",
  }),
}));
jest.mock("@/hooks/useAccessibilityPrefs", () => ({ useAccessibilityPrefs: () => ({ reduceMotion: false }) }));
jest.mock("@/lib/AppearanceContext", () => ({ useAppearancePreference: () => ({}) }));
jest.mock("@/lib/CoachSessionContext", () => ({ useCoachSession: () => ({ setVoiceActive: jest.fn() }) }));
jest.mock("@/lib/commitmentCache", () => ({ cacheCommitment: jest.fn(), loadCachedCommitment: jest.fn() }));
jest.mock("@/lib/coachHandoff", () => ({ consumeCoachHandoff: jest.fn(async () => null) }));
jest.mock("@/lib/analytics", () => ({ trackProductOutcome: jest.fn() }));
jest.mock("expo-haptics", () => ({ impactAsync: jest.fn(), selectionAsync: jest.fn(), ImpactFeedbackStyle: { Light: "light" } }));
jest.mock("expo-crypto", () => ({ randomUUID: () => "request-id" }));
jest.mock("expo-audio", () => ({
  AudioModule: { requestRecordingPermissionsAsync: jest.fn() },
  RecordingPresets: { HIGH_QUALITY: {} },
  setAudioModeAsync: jest.fn(),
  useAudioRecorder: () => ({}),
  useAudioRecorderState: () => ({ isRecording: false }),
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children, ...props }: any) => <>{children}</>,
}));
jest.mock("@expo/vector-icons", () => ({ Feather: () => null }));
jest.mock("../components/brand/BrandBackdrop", () => ({ BrandBackdrop: () => null }));
jest.mock("../components/coach/CoachShell", () => ({
  CoachShell: ({ children }: any) => <>{children}</>,
}));
jest.mock("../components/coach/CoachEliteGate", () => ({ CoachEliteGate: () => null }));
jest.mock("../components/coach/CoachSettingsPanel", () => ({ CoachSettingsPanel: () => null }));
jest.mock("../components/coach/CoachMessageThread", () => ({ CoachMessageThread: ({ children }: any) => <>{children}</> }));
jest.mock("../components/coach/CoachInputBar", () => ({ CoachInputBar: () => null }));
jest.mock("../components/ui/CitationsBlock", () => ({ CitationsBlock: () => null }));
jest.mock("../components/FieldResultPanel", () => ({
  FieldResultPanel: ({ error, children }: any) => {
    const React = require("react");
    const { Text } = require("react-native");
    return error ? React.createElement(Text, null, error) : children;
  },
}));
jest.mock("../components/tools/ToolShell", () => ({
  ToolShell: ({ children, onCta, ctaDisabled }: any) => {
    const React = require("react");
    const { Pressable, Text } = require("react-native");
    return React.createElement(React.Fragment, null, children,
      React.createElement(Pressable, { accessibilityRole: "button", accessibilityLabel: "Research", disabled: ctaDisabled, onPress: onCta },
        React.createElement(Text, null, "Research")));
  },
}));
jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));

describe("rendered native recovery", () => {
  afterEach(() => jest.clearAllMocks());

  it("shows Research API failures and offline recovery guidance", async () => {
    (apiPost as jest.Mock).mockRejectedValueOnce(new Error("offline"));
    const view = render(<ResearchTool />);
    fireEvent.changeText(screen.getByPlaceholderText(/Latest Medicare/), "What changed in hospice regulations?");
    fireEvent.press(screen.getByLabelText("Research"));
    await waitFor(() => expect(view.getByText(/offline|unavailable|failed/i)).toBeTruthy());
  });

  it("turns Coach history failure into a retry that recovers", async () => {
    (listCoachConversations as jest.Mock)
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce([]);
    (getCoachPreferences as jest.Mock).mockResolvedValue({ memoryEnabled: false, responseStyle: "balanced" });
    const view = render(<CoachScreen />);
    await waitFor(() => expect(view.getByText("History unavailable")).toBeTruthy());
    fireEvent.press(view.getByTestId("coach-resume-private-conversation"));
    await waitFor(() => expect(view.getByText("Start your first private conversation")).toBeTruthy());
    expect(listCoachConversations).toHaveBeenCalledTimes(2);
  });
});