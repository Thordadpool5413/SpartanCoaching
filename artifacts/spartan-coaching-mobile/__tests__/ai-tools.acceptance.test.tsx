import React from "react";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react-native";
import { SPARTAN_AI_TOOLS } from "@workspace/spartan-ai-tools";
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
jest.mock("../lib/api", () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
}));

const apiGetMock = apiGet as jest.MockedFunction<typeof apiGet>;
const apiPostMock = apiPost as jest.MockedFunction<typeof apiPost>;

beforeEach(() => {
  apiGetMock.mockImplementation(async (path: string) => {
    if (path === "/api/clinical/coverage/snapshots") {
      return { operationMode: "deidentified", required: false, allowsDocumentUpload: false, snapshots: [] } as never;
    }
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
    "$id renders a native workflow and submits through the shared API contract",
    async (tool) => {
      const view = render(<AiToolScreen toolId={tool.id} />);
      expect(view.getByText(tool.name)).toBeTruthy();

      for (const field of tool.fields) {
        if (field.kind === "select") {
          expect(view.getByText(String(tool.exampleInput[field.key]))).toBeTruthy();
        } else {
          expect(view.getByLabelText(field.label)).toBeTruthy();
        }
      }

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
          expect(apiPostMock).toHaveBeenCalledWith(expectedPath, expectedBody);
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
