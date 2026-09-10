import React from "react";
import { act, render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import { apiGet } from "@/lib/api";
import { trackMobileEvent } from "@/lib/analytics";
import HomeScreen from "../app/(tabs)/index";

let mockCanUseElite = false;
const mockListCoachMemory = jest.fn();
const mockLoadCachedCommitment = jest.fn();

jest.mock("@/lib/api", () => ({
  apiGet: jest.fn(),
  fetchOnboardingMobile: jest.fn(() => Promise.resolve({ member: {} })),
}));
jest.mock("@/lib/analytics", () => ({
  trackMobileEvent: jest.fn(),
}));
jest.mock("@/lib/AuthContext", () => ({
  useAuth: () => ({
    canUseFieldKit: true,
    canUseElite: mockCanUseElite,
    isAuthenticated: true,
    user: { member: { id: 1, name: "Test" } },
    refresh: jest.fn(),
  }),
}));
jest.mock("@/lib/coachApi", () => ({
  listCoachMemory: (...args: unknown[]) => mockListCoachMemory(...args),
}));
jest.mock("@/lib/commitmentCache", () => ({
  loadCachedCommitment: (...args: unknown[]) => mockLoadCachedCommitment(...args),
  cacheCommitment: jest.fn(() => Promise.resolve()),
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
    useLocalSearchParams: () => ({}),
    router: { push: jest.fn() },
    useFocusEffect: (cb: any) => React.useEffect(cb, []),
  };
});

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe("Home Command Center", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCanUseElite = false;
    mockListCoachMemory.mockResolvedValue([]);
    mockLoadCachedCommitment.mockResolvedValue(null);
  });

  it("renders server recommendation and tracks analytics", async () => {
    (apiGet as jest.Mock).mockImplementation((path) => {
      if (path === "/api/v1/workspace/next-move") {
        return Promise.resolve({
          recommendation: {
            id: "server-move-1",
            stage: "Prepare",
            title: "Server Title",
            description: "Server description",
            reason: "Server reason",
            mobileHref: "/some-server-route",
          },
          context: {
            contextAvailable: true,
            hasJobRole: true,
            hasCommitment: false,
            hasDraftWork: false,
            hasReviewableWork: false,
            canUseElite: false,
            alsoLeadsTeam: false,
          },
          generatedAt: "2023-01-01T00:00:00Z",
        });
      }
      return Promise.resolve({ items: [] });
    });

    render(<HomeScreen />);

    await waitFor(() => {
      expect(screen.getByText("Server Title")).toBeTruthy();
    });

    expect(screen.getByText("Server description")).toBeTruthy();
    expect(screen.getByText("Server reason")).toBeTruthy();

    await waitFor(() => {
      expect(trackMobileEvent).toHaveBeenCalledWith(
        "product",
        "NEXT_MOVE_SHOWN",
        expect.objectContaining({
          metadata: expect.stringContaining('"source":"server"'),
        })
      );
    });
  });

  it("falls back to local model honestly if server fails", async () => {
    (apiGet as jest.Mock).mockImplementation((path) => {
      if (path === "/api/v1/workspace/next-move") {
        return Promise.reject(new Error("Network Error"));
      }
      if (path === "/api/v1/member-work") {
        return Promise.reject(new Error("Network Error"));
      }
      return Promise.resolve({ items: [] });
    });

    render(<HomeScreen />);

    await waitFor(() => {
      // Local fallback title for no context
      expect(screen.getByText("Explore every tool")).toBeTruthy();
    });

    // Honest labeling
    expect(screen.getByText("Using what is saved on this iPhone")).toBeTruthy();

    await waitFor(() => {
      expect(trackMobileEvent).toHaveBeenCalledWith(
        "product",
        "NEXT_MOVE_SHOWN",
        expect.objectContaining({
          metadata: expect.stringContaining('"source":"fallback"'),
        })
      );
    });
  });

  it("waits for a cached commitment before showing or tracking the fallback", async () => {
    mockCanUseElite = true;
    mockListCoachMemory.mockRejectedValue(new Error("Offline"));
    let resolveCommitment: (value: string | null) => void = () => undefined;
    mockLoadCachedCommitment.mockReturnValue(
      new Promise<string | null>((resolve) => {
        resolveCommitment = resolve;
      }),
    );
    (apiGet as jest.Mock).mockImplementation((path) => {
      if (path === "/api/v1/workspace/next-move") return Promise.reject(new Error("Network Error"));
      if (path === "/api/v1/member-work") return Promise.resolve({ items: [] });
      return Promise.resolve({ items: [] });
    });

    render(<HomeScreen />);

    await waitFor(() => expect(screen.getByTestId("home-next-move-loading")).toBeTruthy());
    expect(trackMobileEvent).not.toHaveBeenCalledWith("product", "NEXT_MOVE_SHOWN", expect.anything());

    await act(async () => {
      resolveCommitment("Follow up on the agreed next step");
    });

    await waitFor(() => expect(screen.getByTestId("home-continue-commitment")).toBeTruthy());
    await waitFor(() => {
      expect(trackMobileEvent).toHaveBeenCalledWith(
        "product",
        "NEXT_MOVE_SHOWN",
        expect.objectContaining({ metadata: expect.stringContaining('"stepId":"commitment"') }),
      );
    });
  });

  it("does not let a stale cached commitment override a successful empty live response", async () => {
    mockCanUseElite = true;
    mockLoadCachedCommitment.mockResolvedValue("Old completed commitment");
    mockListCoachMemory.mockResolvedValue([]);
    (apiGet as jest.Mock).mockImplementation((path) => {
      if (path === "/api/v1/workspace/next-move") return Promise.reject(new Error("Network Error"));
      if (path === "/api/v1/member-work") return Promise.resolve({ items: [] });
      return Promise.resolve({ items: [] });
    });

    render(<HomeScreen />);

    await waitFor(() => expect(screen.getByTestId("home-complete-setup")).toBeTruthy());
    expect(trackMobileEvent).not.toHaveBeenCalledWith(
      "product",
      "NEXT_MOVE_SHOWN",
      expect.objectContaining({ metadata: expect.stringContaining('"stepId":"commitment"') }),
    );
  });
});
