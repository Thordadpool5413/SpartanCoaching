import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { apiGet } from "@/lib/api";
import ToolsScreen from "../app/(tabs)/tools";
import { router } from "expo-router";
import { FIELD_KIT_CAPABILITY_MATRIX, FIELD_KIT_TOOLS } from "@workspace/field-kit-catalog";
import { CATALOG_ID_TO_TAB } from "../lib/toolDeepLinks";

jest.mock("@/lib/api", () => ({ apiGet: jest.fn() }));
let mockAccess = { canUseFieldKit: true, canUseElite: true };
jest.mock("@/lib/AuthContext", () => ({
  useAuth: () => ({ ...mockAccess, isAuthenticated: true }),
}));
jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: () => ({}),
}));
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "light" },
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));
jest.mock("@/hooks/useColors", () => ({
  useColors: () => ({
    background: "#fff", border: "#ddd", borderStrong: "#bbb", card: "#fff",
    destructive: "#b00", foreground: "#111", mutedForeground: "#666",
    primary: "#c00", primaryForeground: "#fff", primaryMuted: "#fee",
    readablePrimary: "#900", heroBackground: "#111", heroForeground: "#fff",
    heroMuted: "#ccc", accent: "#c00",
  }),
}));
jest.mock("../components/brand/BrandBackdrop", () => ({ BrandBackdrop: () => null }));
jest.mock("../components/OfflineQueueBanner", () => ({ OfflineQueueBanner: () => null }));

const get = apiGet as jest.Mock;

const capabilityEvidence = Object.fromEntries(
  FIELD_KIT_TOOLS.map((tool) => [tool.id, {
    probe: (view: ReturnType<typeof render>) => {
      fireEvent.press(view.getByTestId(`tool-row-${tool.id}`));
      expect(view.getByTestId(`catalog-workflow-${tool.id}`)).toBeTruthy();
      fireEvent.press(view.getByText(`Open ${tool.title}`));
      const expected = CATALOG_ID_TO_TAB[tool.id];
      expect(router.push).toHaveBeenCalledWith(expected
        ? expect.objectContaining({ pathname: "/tool/[tab]", params: { tab: expected } })
        : tool.mobileRoute);
    },
  }]),
);

describe("universal native search", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockAccess = { canUseFieldKit: true, canUseElite: true };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders standard and elite entitlement states from the live catalog", () => {
    const view = render(<ToolsScreen />);
    expect(view.getAllByText("INCLUDED").length).toBeGreaterThan(0);
    mockAccess = { canUseFieldKit: true, canUseElite: false };
    view.rerender(<ToolsScreen />);
    expect(view.getAllByText("ELITE").length).toBeGreaterThan(0);
    expect(view.getAllByText("INCLUDED").length).toBeGreaterThan(0);
  });

  it("keeps the catalog directory route map executable", () => {
    expect(FIELD_KIT_CAPABILITY_MATRIX.map((item) => item.toolId).sort())
      .toEqual(FIELD_KIT_TOOLS.map((tool) => tool.id).sort());
    const view = render(<ToolsScreen />);
    for (const capability of FIELD_KIT_CAPABILITY_MATRIX) {
      const evidence = capabilityEvidence[capability.toolId];
      expect(evidence).toBeDefined();
      evidence.probe(view);
    }
  });

  it("shows loading, renders remote results, and opens a native destination", async () => {
    get.mockReturnValue(new Promise(() => undefined));
    render(<ToolsScreen />);
    fireEvent.changeText(screen.getByTestId("tools-filter"), "objection");
    jest.advanceTimersByTime(250);
    expect(screen.getByText("Searching library and tools...")).toBeTruthy();

    get.mockResolvedValueOnce({
      groups: [{ type: "tool", label: "Tools", hits: [{
        id: "tool:objections", type: "tool", title: "Objection practice",
        snippet: "Practice a difficult objection.", href: "/tools",
      }] }],
    });
    // The first request is intentionally pending; a new query is the retryable
    // request that resolves and exercises the result/open path.
    fireEvent.changeText(screen.getByTestId("tools-filter"), "objections");
    jest.advanceTimersByTime(250);
    await waitFor(() => expect(screen.getByText("Objection practice")).toBeTruthy());
    fireEvent.press(screen.getByText("Objection practice"));
    expect(router.push).toHaveBeenCalledWith(expect.objectContaining({
      pathname: "/tool/[tab]",
      params: { tab: "objection" },
    }));
  });

  it("shows an error and retries the request", async () => {
    get.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce({
      groups: [{ type: "tool", label: "Tools", hits: [{
        id: "tool:playbooks", type: "tool", title: "Playbooks",
        snippet: "Field playbooks.", href: "/tools",
      }] }],
    });
    render(<ToolsScreen />);
    fireEvent.changeText(screen.getByTestId("tools-filter"), "playbook");
    jest.advanceTimersByTime(250);
    await waitFor(() => expect(screen.getByText("Search unavailable.")).toBeTruthy());
    fireEvent.press(screen.getByLabelText("Retry search"));
    jest.advanceTimersByTime(250);
    await waitFor(() => expect(screen.getByText("Playbooks")).toBeTruthy());
    expect(get).toHaveBeenCalledTimes(2);
  });
});