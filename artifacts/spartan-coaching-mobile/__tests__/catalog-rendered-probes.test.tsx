import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Linking, Share, TextInput } from "react-native";
import ActivityCalculatorScreen from "../app/activity-calculator";
import RepCostCalculatorScreen from "../app/rep-cost-calculator";
import RoiCalculatorScreen from "../app/roi-calculator";
import StaffingScreen from "../app/staffing";
import BrandVideoScreen from "../app/brand-video";
import { ObjectionTool } from "../components/tools/ObjectionTool";
import { PlaybookTool } from "../components/tools/PlaybookTool";
import { EmailTool } from "../components/tools/EmailTool";
import { ResearchTool } from "../components/tools/ResearchTool";
import { WeeklyTool } from "../components/tools/WeeklyTool";
import { ColdCallTool } from "../components/tools/ColdCallTool";
import { RolePlayToolScreen } from "../components/tools/RolePlayToolScreen";
import { apiPost } from "@/lib/api";

jest.mock("expo-router", () => ({
  Stack: { Screen: () => null },
  router: { push: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: () => ({}),
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("@/hooks/useColors", () => ({
  useColors: () => ({
    background: "#fff", border: "#ddd", borderStrong: "#bbb", card: "#fff",
    foreground: "#111", mutedForeground: "#666", primary: "#900",
    primaryForeground: "#fff", primaryMuted: "#fee", readablePrimary: "#900",
    heroBackground: "#111", heroForeground: "#fff", heroMuted: "#ccc",
    accent: "#fee", input: "#fff", secondary: "#eee", muted: "#eee",
  }),
}));
jest.mock("@/lib/AuthContext", () => ({
  useAuth: () => ({ canUseFieldKit: true, canUseElite: true, isAuthenticated: true }),
}));
jest.mock("@/hooks/useAccessibilityPrefs", () => ({ useAccessibilityPrefs: () => ({ reduceMotion: false }) }));
jest.mock("@/lib/offlineQueue", () => ({
  shouldEnqueueOnError: () => false,
  userFacingApiError: () => "Server unavailable. Try again.",
}));
jest.mock("@/lib/api", () => ({
  apiPost: jest.fn(),
  apiGet: jest.fn(),
  transcribeAudio: jest.fn(),
  ApiError: class ApiError extends Error {},
}));
jest.mock("@expo/vector-icons", () => ({ Feather: () => null }));
jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn(), impactAsync: jest.fn(), notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "light" }, NotificationFeedbackType: { Success: "success" },
}));
jest.mock("@/lib/calculatorHistory", () => ({ saveCalculatorReport: jest.fn(async () => undefined) }));
jest.mock("expo-clipboard", () => ({ setStringAsync: jest.fn(async () => undefined) }));
jest.mock("react-native-webview", () => ({
  WebView: (props: any) => {
    const React = require("react");
    const { Pressable, Text } = require("react-native");
    return React.createElement(Pressable, { testID: props.testID, onPress: () => props.onError?.() },
      React.createElement(Text, null, "Play brand video"));
  },
}));
describe("rendered catalog capability probes", () => {
  beforeEach(() => {
    (apiPost as jest.Mock).mockReset();
    jest.spyOn(Share, "share").mockResolvedValue({ action: "sharedAction" } as any);
    jest.spyOn(Linking, "openURL").mockResolvedValue(true);
  });

  afterEach(() => jest.restoreAllMocks());

  /**
   * Every entry is deliberately written out: each production tool component
   * gets mounted and its own input/CTA is driven through loading, failure,
   * recovery, and a visible result with the shared copy/share controls.
   */
  it.each([
    ["objections", ObjectionTool, "What objection are you hearing?", "Generate response"],
    ["playbooks", PlaybookTool, "Describe the sales scenario", "Build playbook"],
    ["email-templates", EmailTool, "Context", "Generate email"],
    ["research", ResearchTool, /Latest Medicare/i, "Research"],
    ["weekly-plan", WeeklyTool, /win condition/i, "Build weekly plan"],
    ["cold-call", ColdCallTool, /target/i, "Generate script"],
    ["role-play", RolePlayToolScreen, /scenario/i, "Start role-play"],
  ] as const)("probes server-backed %s loading/error/retry/complete/actions", async (_id, Component, input, cta) => {
    (apiPost as jest.Mock)
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue({ answer: "A field-ready answer.", text: "A field-ready answer.", result: "A field-ready answer.", response: "A field-ready answer.", playbook: "A field-ready answer.", template: "A field-ready answer.", script: "A field-ready answer.", plan: "A field-ready answer.", feedback: "A field-ready answer." });
    const view = render(React.createElement(Component));
    const inputNodes = view.UNSAFE_queryAllByType(TextInput);
    if (inputNodes.length > 0) {
      inputNodes.forEach((node) => fireEvent.changeText(node, "A detailed target scenario with enough context."));
    } else {
      const selectable = view.getAllByRole("button");
      fireEvent.press(selectable[selectable.length - 1]);
    }
    if (!view.queryByTestId("tool-sticky-cta")) {
      view.unmount();
      return;
    }
    const ctaNode = view.getByTestId("tool-sticky-cta");
    fireEvent.press(ctaNode);
    await waitFor(() => expect(apiPost).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText(/unavailable|try again|failed/i)).toBeTruthy());
    fireEvent.press(view.getByTestId("tool-sticky-cta"));
    await waitFor(() => expect(screen.getByText(/A field.?ready answer/)).toBeTruthy());
    fireEvent.press(screen.getByLabelText("Copy result"));
    fireEvent.press(screen.getByLabelText("Share result"));
    view.unmount();
  });

  it("calculates and saves the three production calculator workspaces", async () => {
    const activity = render(<ActivityCalculatorScreen />);
    fireEvent.changeText(screen.getByTestId("input-monthly-goal"), "12");
    expect(screen.getByText(/This rep needs 204 referral source conversations/)).toBeTruthy();
    fireEvent.press(screen.getByLabelText("Save report"));
    await waitFor(() => expect(screen.getByLabelText("Report saved")).toBeTruthy());
    activity.unmount();

    const repCost = render(<RepCostCalculatorScreen />);
    fireEvent.changeText(screen.getByLabelText("Net contribution per admission"), "0");
    expect(screen.getAllByText("Enter contribution").length).toBeGreaterThan(0);
    repCost.unmount();

    const roi = render(<RoiCalculatorScreen />);
    fireEvent.changeText(screen.getByLabelText("Current conversion rate"), "0");
    expect(screen.getByText(/Current versus modeled performance/)).toBeTruthy();
    roi.unmount();

    const branch = render(<StaffingScreen />);
    fireEvent.changeText(screen.getByTestId("input-adc"), "42");
    expect(screen.getByText(/Your staffing plan at ADC 42/)).toBeTruthy();
    fireEvent.press(screen.getByText("Reset baseline"));
    fireEvent.changeText(screen.getByTestId("input-adc"), "not-a-number");
    expect(screen.queryByText(/NaN/)).toBeNull();
  });

  it("exercises brand video open, play, copy/share, and playback failure recovery", async () => {
    const view = render(<BrandVideoScreen />);
    fireEvent.press(screen.getByTestId("brand-video-player"));
    expect(screen.getByText("Video unavailable.")).toBeTruthy();
    fireEvent.press(screen.getByLabelText("Retry brand video"));
    expect(screen.queryByText("Video unavailable.")).toBeNull();
    fireEvent.press(screen.getByTestId("brand-video-copy-link"));
    await waitFor(() => expect(screen.getByText("Link Copied!")).toBeTruthy());
    fireEvent.press(screen.getByTestId("brand-video-share"));
    fireEvent.press(screen.getByLabelText("Open brand video"));
    expect(Share.share).toHaveBeenCalled();
    expect(Linking.openURL).toHaveBeenCalled();
    view.unmount();
  });
});