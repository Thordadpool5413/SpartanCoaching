import React from "react";
import { render, screen, waitFor } from "@testing-library/react-native";
import { apiGet } from "@/lib/api";
import MyWorkScreen from "../app/(tabs)/my-work";

jest.mock("@/lib/api", () => ({
  apiGet: jest.fn(),
}));
jest.mock("@/lib/AuthContext", () => ({
  useAuth: () => ({
    canUseFieldKit: true,
    canUseElite: false,
    isAuthenticated: true,
    user: { member: { id: 1, name: "Test" } },
  }),
}));
jest.mock("@/hooks/useAccessibilityPrefs", () => ({
  useAccessibilityPrefs: () => ({ reduceMotion: false }),
}));
jest.mock("@/hooks/useColors", () => ({
  useColors: () => ({ primary: "#000", background: "#fff" }),
}));
jest.mock("expo-router", () => {
  const React = require("react");
  return {
    router: { push: jest.fn() },
    useFocusEffect: (cb: any) => React.useEffect(cb, []),
  };
});
jest.mock("@/lib/libraryDownloads", () => ({
  listDownloadedLibraryItems: () => Promise.resolve([]),
}));
jest.mock("@/lib/calculatorHistory", () => ({
  listCalculatorReports: () => Promise.resolve([]),
}));
jest.mock("@/lib/commitmentCache", () => ({
  loadCachedCommitment: () => Promise.resolve(null),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe("My Work Command Center", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the Command Center recommendation at the top", async () => {
    (apiGet as jest.Mock).mockImplementation((path) => {
      if (path === "/api/v1/workspace/next-move") {
        return Promise.resolve({
          recommendation: {
            id: "server-move-1",
            stage: "Prepare",
            title: "Command Center Recommendation",
            description: "Go to playbook",
            reason: "You have a meeting",
            mobileHref: "/tool/playbook",
          },
        });
      }
      return Promise.resolve({ items: [] });
    });

    render(<MyWorkScreen />);

    await waitFor(() => {
      expect(screen.getByText("COMMAND CENTER")).toBeTruthy();
    });

    expect(screen.getByText("Command Center Recommendation")).toBeTruthy();
    expect(screen.getByText("PREPARE · Go to playbook")).toBeTruthy();
  });

  it("shows an error and retry button if it fails", async () => {
    (apiGet as jest.Mock).mockImplementation((path) => {
      if (path === "/api/v1/workspace/next-move") {
        return Promise.reject(new Error("Failed"));
      }
      return Promise.resolve({ items: [] });
    });

    render(<MyWorkScreen />);

    await waitFor(() => {
      expect(screen.getByText("Using the daily Command fallback")).toBeTruthy();
    });

    expect(screen.getByText("Personalized context is unavailable, but your core field workflow is ready.")).toBeTruthy();
    expect(screen.getByText("Open Command")).toBeTruthy();
    expect(screen.getByText("Retry")).toBeTruthy();
  });
});
