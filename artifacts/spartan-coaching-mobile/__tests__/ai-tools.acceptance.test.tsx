import React from "react";
import {
  cleanup,
  fireEvent,
  render,
  waitFor,
} from "@testing-library/react-native";
import { SPARTAN_AI_TOOLS } from "@workspace/spartan-ai-tools";
import { AiToolScreen } from "../components/ai-tool-screen";
import { apiGet, apiPost } from "../lib/api";

jest.mock("expo-router", () => ({
  router: { back: jest.fn(), push: jest.fn() },
}));

jest.mock("@expo/vector-icons", () => ({
  Feather: () => null,
}));

jest.mock("expo-crypto", () => ({
  randomUUID: () => "40000000-0000-4000-8000-000000000001",
  digest: jest.fn(),
  CryptoDigestAlgorithm: { SHA256: "SHA-256" },
}));

jest.mock("expo-document-picker", () => ({
  getDocumentAsync: jest.fn(async () => ({
    canceled: false,
    assets: [
      {
        uri: "file:///cache/de-identified.txt",
        name: "local-only.txt",
        mimeType: "text/plain",
        size: 16,
      },
    ],
  })),
}));

jest.mock("expo-file-system/legacy", () => ({
  deleteAsync: jest.fn(async () => undefined),
}));

jest.mock("expo-image-picker", () => ({
  requestCameraPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
}));

jest.mock("expo-local-authentication", () => ({
  hasHardwareAsync: jest.fn(async () => false),
  authenticateAsync: jest.fn(async () => ({ success: true })),
}));

jest.mock("../hooks/useColors", () => ({
  useColors: () => ({
    background: "#ffffff",
    border: "#d1d5db",
    card: "#ffffff",
    destructive: "#b91c1c",
    foreground: "#111827",
    mutedForeground: "#4b5563",
    primary: "#1d4ed8",
  }),
}));

jest.mock("../lib/api", () => ({
  ApiError: class ApiError extends Error {
    code: string;
    status: number;

    constructor(errorCode: string, message: string, httpStatus = 400) {
      super(message);
      this.code = errorCode;
      this.status = httpStatus;
    }
  },
  apiDelete: jest.fn(async () => undefined),
  apiGet: jest.fn(),
  apiPost: jest.fn(),
  uploadToSignedUrl: jest.fn(),
}));

const apiGetMock = apiGet as jest.MockedFunction<typeof apiGet>;
const apiPostMock = apiPost as jest.MockedFunction<typeof apiPost>;

beforeEach(() => {
  globalThis.fetch = jest.fn(async () => ({
    blob: async () => new Blob(["de-identified"]),
  })) as never;
  apiGetMock.mockImplementation(async (path: string) => {
    if (path === "/api/clinical/coverage/snapshots") {
      return {
        operationMode: "phi",
        required: true,
        allowsDocumentUpload: true,
        snapshots: [
          {
            id: "20000000-0000-4000-8000-000000000001",
            title: "Acceptance LCD",
            version: "1",
          },
        ],
      } as never;
    }
    return { runs: [] } as never;
  });
  apiPostMock.mockImplementation(async (path: string) => {
    if (path === "/api/clinical/ephemeral-sessions") {
      return {
        session: {
          id: "10000000-0000-4000-8000-000000000001",
          coverageSnapshotId: "20000000-0000-4000-8000-000000000001",
          expiresAt: "2030-01-01T00:00:00.000Z",
        },
      } as never;
    }
    if (path.endsWith("/documents/upload-url")) {
      return {
        documentToken: "50000000-0000-4000-8000-000000000001",
        uploadUrl: "https://upload.example.invalid/opaque",
        requiredHeaders: { "Content-Type": "text/plain" },
      } as never;
    }
    if (path.endsWith("/extract")) {
      return { text: "De-identified extracted acceptance text" } as never;
    }
    if (path.endsWith("/finalize") || path.endsWith("/ephemeral-runs")) {
      return {
        result: {
          output: { acceptance: "passed" },
          createdAt: "2030-01-01T00:00:00.000Z",
          watermark: "Educational decision support only.",
          retention: "ephemeral",
        },
      } as never;
    }
    if (path.includes("/runs")) {
      return {
        run: {
          id: "30000000-0000-4000-8000-000000000001",
          status: "completed",
          reviewStatus: "not_required",
          output: { acceptance: "passed" },
          createdAt: "2030-01-01T00:00:00.000Z",
        },
      } as never;
    }
    return {} as never;
  });
});

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

describe("native AI tool acceptance", () => {
  it.each(SPARTAN_AI_TOOLS)(
    "$id renders a native form and submits through the shared API contract",
    async (tool) => {
      const view = render(<AiToolScreen toolId={tool.id} />);

      expect(view.getByText(tool.name)).toBeTruthy();
      for (const field of tool.fields) {
        const expectedLabel =
          field.kind === "select"
            ? `${field.label}: ${String(tool.exampleInput[field.key])}`
            : field.label;
        expect(view.getByLabelText(expectedLabel)).toBeTruthy();
      }

      if (tool.containsPhi) {
        await waitFor(() => {
          // Title appends " · PHI operational" when coverage snapshots report
          // operationMode "phi" and runtime is ready (substring / regex match).
          expect(
            view.getByText(/Ephemeral clinical workspace/),
          ).toBeTruthy();
          expect(view.getByText("Acceptance LCD · v1")).toBeTruthy();
        });
      }

      const runButton = view.getByLabelText(`Run ${tool.name}`);
      await waitFor(() => expect(runButton.props.disabled).not.toBe(true));
      if (tool.id === "medical-record-lcd-verifier") {
        fireEvent.press(view.getByText("Choose files"));
        await waitFor(() =>
          expect(apiPostMock).toHaveBeenCalledWith(
            expect.stringContaining(
              "/documents/50000000-0000-4000-8000-000000000001/extract",
            ),
            {},
          ),
        );
      }
      fireEvent.press(runButton);

      await waitFor(() => {
        const expectedPath = tool.containsPhi
          ? tool.id === "medical-record-lcd-verifier"
            ? "/api/clinical/ephemeral-sessions/10000000-0000-4000-8000-000000000001/finalize"
            : `/api/ai-tools/${tool.id}/ephemeral-runs`
          : `/api/ai-tools/${tool.id}/runs`;
        const expectedBody = expect.objectContaining({
          input: expect.any(Object),
        });
        if (tool.containsPhi) {
          expect(apiPostMock).toHaveBeenCalledWith(expectedPath, expectedBody);
        } else {
          expect(apiPostMock).toHaveBeenCalledWith(expectedPath, expectedBody, {
            idempotencyKey: "40000000-0000-4000-8000-000000000001",
          });
        }
      });
      await waitFor(() => {
        expect(view.getByText("acceptance")).toBeTruthy();
        expect(view.getByText("passed")).toBeTruthy();
      });
    },
  );
});
