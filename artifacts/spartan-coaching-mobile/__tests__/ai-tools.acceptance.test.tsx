import React from "react";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react-native";
import {
  SPARTAN_AI_TOOLS,
  getAiToolExperience,
  type AiToolExperience,
} from "@workspace/spartan-ai-tools";
import { AiToolScreen } from "../components/ai-tool-screen";
import { apiGet, apiPost } from "../lib/api";

jest.mock("expo-router", () => ({ router: { back: jest.fn(), push: jest.fn() } }));
jest.mock("@expo/vector-icons", () => ({ Feather: () => null }));
jest.mock("expo-crypto", () => ({ randomUUID: () => "40000000-0000-4000-8000-000000000001" }));
jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn(),
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
  NotificationFeedbackType: { Success: "success", Warning: "warning", Error: "error" },
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 44, right: 0, bottom: 34, left: 0 }),
}));
jest.mock("../hooks/useColors", () => ({
  useColors: () => ({
    background: "#f8f7f3",
    border: "#d7d9df",
    borderStrong: "#c5c8d0",
    card: "#ffffff",
    destructive: "#b42318",
    foreground: "#111827",
    input: "#ffffff",
    muted: "#eceef2",
    mutedForeground: "#596170",
    primary: "#c9252d",
    primaryMuted: "#f9e5e6",
    success: "#2f7654",
  }),
}));
jest.mock("../hooks/useNetworkStatus", () => ({
  useNetworkStatus: () => ({ isOnline: true, isChecking: false, refresh: jest.fn() }),
}));
jest.mock("../lib/api", () => ({ apiGet: jest.fn(), apiPost: jest.fn() }));
jest.mock("../lib/jurisdictionApi", () => ({
  fetchJurisdictionContext: jest.fn(async () => ({
    state: "Florida",
    macRegion: "Jurisdiction M · Palmetto GBA",
  })),
}));

const apiGetMock = apiGet as jest.MockedFunction<typeof apiGet>;
const apiPostMock = apiPost as jest.MockedFunction<typeof apiPost>;

function completeRequiredFields(
  view: ReturnType<typeof render>,
  experience: AiToolExperience,
) {
  for (const field of experience.fields.filter((item) => item.required)) {
    if (field.kind === "single-choice" || field.kind === "multi-choice") {
      const option = field.options?.[0];
      if (!option) throw new Error(`${field.key} needs a test option`);
      const control = view.getByLabelText(`${field.label}: ${option}`);
      if (control.props.accessibilityState?.checked !== true) {
        fireEvent.press(control);
      }
      continue;
    }
    const control = view.getByLabelText(field.label);
    if (!String(control.props.value ?? "").trim()) {
      fireEvent.changeText(
        control,
        field.kind === "number" ? "5" : `Useful ${field.label.toLowerCase()} context`,
      );
    }
  }
}

beforeEach(() => {
  apiGetMock.mockImplementation(async (path: string) => {
    if (path === "/api/clinical/coverage/snapshots") {
      return { operationMode: "deidentified", required: false, allowsDocumentUpload: false, snapshots: [] } as never;
    }
    if (path === "/api/articles") return { articles: [] } as never;
    if (path === "/api/podcasts") return { podcasts: [] } as never;
    if (path === "/api/resources") return { resources: [] } as never;
    return { runs: [] } as never;
  });
  apiPostMock.mockImplementation(async (path: string) => {
    if (path.endsWith("/ephemeral-runs")) {
      return {
        result: {
          output: { assessment: "passed", recommendedActions: ["Review the result"] },
          createdAt: "2030-01-01T00:00:00.000Z",
          watermark: "Educational decision support only.",
          reviewStatus: "review_required",
          retention: "ephemeral",
        },
      } as never;
    }
    return {
      run: {
        id: "30000000-0000-4000-8000-000000000001",
        status: "completed",
        reviewStatus: "not_required",
        output: { assessment: "passed", recommendedActions: ["Use the result"] },
        createdAt: "2030-01-01T00:00:00.000Z",
      },
    } as never;
  });
});

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

describe("native advanced tool acceptance", () => {
  jest.setTimeout(20_000);

  it.each(SPARTAN_AI_TOOLS)(
    "$id renders a guided native workflow and submits through the shared API contract",
    async (tool) => {
      const experience = getAiToolExperience(tool.id);
      const view = render(<AiToolScreen toolId={tool.id} />);
      expect(view.getByText(experience.title ?? tool.name)).toBeTruthy();

      for (const field of experience.fields) {
        expect(view.getByText(field.required ? `${field.label} *` : field.label)).toBeTruthy();
      }
      expect(view.queryByText("Structured data is supported here.")).toBeNull();
      expect(view.queryByText("Learner ID *")).toBeNull();

      completeRequiredFields(view, experience);
      if (tool.containsPhi) {
        await waitFor(() => expect(view.getByText("Deidentified guidance workspace")).toBeTruthy());
        fireEvent(view.getByLabelText("Confirm input is deidentified"), "valueChange", true);
      }

      const runButton = view.getByLabelText(`Run ${tool.name}`);
      await waitFor(() => expect(runButton.props.disabled).not.toBe(true));
      fireEvent.press(runButton);

      await waitFor(() => {
        const expectedPath = tool.containsPhi
          ? `/api/ai-tools/${tool.id}/ephemeral-runs`
          : `/api/ai-tools/${tool.id}/runs`;
        const expectedBody = expect.objectContaining({ input: expect.any(Object) });
        if (tool.containsPhi) {
          expect(apiPostMock).toHaveBeenCalledWith(expectedPath, expectedBody, { retry: true });
        } else {
          expect(apiPostMock).toHaveBeenCalledWith(expectedPath, expectedBody, {
            idempotencyKey: "40000000-0000-4000-8000-000000000001",
          });
        }
      });

      await waitFor(() => {
        expect(view.getByText("Executive answer")).toBeTruthy();
        expect(view.getByText("passed")).toBeTruthy();
        expect(view.getByText("Next actions")).toBeTruthy();
      });
    },
  );
});
