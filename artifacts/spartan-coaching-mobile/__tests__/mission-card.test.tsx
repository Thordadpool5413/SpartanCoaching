import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium" },
  notificationAsync: jest.fn(),
  NotificationFeedbackType: { Success: "success" },
}));

jest.mock("@/hooks/useColors", () => ({
  useColors: () => ({
    foreground: "#fff",
    mutedForeground: "#aaa",
    primary: "#f00",
    primaryForeground: "#fff",
    card: "#111",
    border: "#333",
    background: "#000",
    borderStrong: "#444",
  }),
}));

jest.mock("@/hooks/useAccessibilityPrefs", () => ({
  useAccessibilityPrefs: () => ({ reduceMotion: true }),
}));

import { MissionCard } from "@/components/ui/MissionCard";

describe("MissionCard", () => {
  it("renders one primary CTA and fires onCta", () => {
    const onCta = jest.fn();
    const { getByTestId, getByText } = render(
      <MissionCard title="Open Command Center" subtitle="Today's visits" ctaLabel="Go" onCta={onCta} />,
    );
    expect(getByTestId("section-mission-next")).toBeTruthy();
    expect(getByText("Open Command Center")).toBeTruthy();
    fireEvent.press(getByTestId("button-mission-next"));
    expect(onCta).toHaveBeenCalled();
  });
});
