import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { apiGet } from "@/lib/api";
import ToolsScreen from "../app/(tabs)/tools";
import { router } from "expo-router";
import {
  FIELD_KIT_CAPABILITY_MATRIX,
  FIELD_KIT_TOOLS,
  type FieldKitToolId,
} from "@workspace/field-kit-catalog";
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

/**
 * This is intentionally a hand-authored catalog contract. Do not derive it
 * from FIELD_KIT_CAPABILITY_MATRIX: adding a catalog tool must force a human
 * to describe and exercise its native behavior here.
 */
type ProbeEvidence = {
  states: readonly string[];
  actions: readonly string[];
  probe: (view: ReturnType<typeof render>) => void;
};
const probe = (
  id: FieldKitToolId,
  title: string,
  states: readonly string[],
  actions: readonly string[],
): ProbeEvidence => ({
  states,
  actions,
  probe: (view) => {
    fireEvent.press(view.getByTestId(`tool-row-${id}`));
    expect(view.getByTestId(`catalog-workflow-${id}`)).toBeTruthy();
    fireEvent.press(view.getByText(`Open ${title}`));
    const expected = CATALOG_ID_TO_TAB[id];
    expect(router.push).toHaveBeenCalledWith(expected
      ? expect.objectContaining({ pathname: "/tool/[tab]", params: { tab: expected } })
      : FIELD_KIT_TOOLS.find((tool) => tool.id === id)?.mobileRoute);
  },
});

// Keep every entry explicit (including states/actions) so this suite fails
// closed when the product catalog gains a tool or capability.
const capabilityEvidence: Record<FieldKitToolId, ProbeEvidence> = {
  "sales-workflow": probe("sales-workflow", "Sales Command Center", ["empty", "ready", "loading", "complete", "error"], ["add account", "build plan", "complete call", "approve next step"]),
  "spartan-intelligence": probe("spartan-intelligence", "CMS Medicare Knowledge Hub", ["empty", "loading", "complete", "error"], ["search provider", "review sources", "copy brief"]),
  playbooks: probe("playbooks", "Playbook Generator", ["empty", "loading", "complete", "error"], ["generate playbook", "review", "copy or download"]),
  objections: probe("objections", "Objection Handler", ["empty", "loading", "complete", "error"], ["generate response", "review", "copy"]),
  research: probe("research", "Grounded Research", ["empty", "loading", "complete", "error"], ["ask question", "review sources", "copy insight"]),
  transcribe: probe("transcribe", "Call Transcriber", ["empty", "loading", "complete", "error"], ["upload or paste", "review transcript", "copy coaching moment"]),
  "email-templates": probe("email-templates", "Email Templates", ["empty", "loading", "complete", "error"], ["choose template", "generate draft", "copy or share"]),
  "role-play": probe("role-play", "Role-Play Practice", ["empty", "loading", "complete", "error"], ["choose scenario", "run role-play", "review feedback"]),
  "activity-calculator": probe("activity-calculator", "Activity Calculator", ["empty", "ready", "calculated", "error"], ["enter goal", "calculate", "reset"]),
  "rep-cost": probe("rep-cost", "Rep Cost Calculator", ["empty", "ready", "calculated", "error"], ["enter costs", "calculate", "reset"]),
  roi: probe("roi", "ROI Calculator", ["empty", "ready", "calculated", "error"], ["enter baseline", "calculate", "reset"]),
  branch: probe("branch", "Branch Profitability Simulator", ["empty", "ready", "calculated", "error"], ["enter branch inputs", "calculate", "reset"]),
  "cold-call": probe("cold-call", "Cold Call Script Generator", ["empty", "loading", "complete", "error"], ["describe target", "generate script", "copy or download"]),
  "weekly-plan": probe("weekly-plan", "Weekly Plan Builder", ["empty", "loading", "complete", "error"], ["set win condition", "generate plan", "copy or download"]),
  "brand-video": probe("brand-video", "Brand Video", ["ready", "playing", "paused", "error"], ["open video", "play", "copy or share link"]),
};

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
      const toolId = capability.toolId as FieldKitToolId;
      const evidence = capabilityEvidence[toolId];
      expect(evidence).toBeDefined();
      expect(evidence.states).toEqual(expect.arrayContaining(capability.requiredStates));
      expect(evidence.actions).toEqual(expect.arrayContaining(capability.requiredActions));
      evidence.probe(view);
    }
  });

  it("requires explicit evidence for every declared state and action", () => {
    const declaredIds = FIELD_KIT_CAPABILITY_MATRIX.map(({ toolId }) => toolId).sort();
    expect(Object.keys(capabilityEvidence).sort()).toEqual(declaredIds);
    for (const id of declaredIds as FieldKitToolId[]) {
      const evidence = capabilityEvidence[id];
      expect(evidence.states.length).toBeGreaterThan(0);
      expect(evidence.actions.length).toBeGreaterThan(0);
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