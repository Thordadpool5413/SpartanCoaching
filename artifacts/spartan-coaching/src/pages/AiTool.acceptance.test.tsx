import React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SPARTAN_AI_TOOLS } from "@workspace/spartan-ai-tools";
import AiToolPage from "./AiTool";

const routeState = vi.hoisted(() => ({ toolId: "" }));

vi.mock("wouter", () => ({
  Link: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useParams: () => ({ toolId: routeState.toolId }),
  useLocation: () => ["/tools/ai/test", vi.fn()],
}));

vi.mock("@/components/FieldKitToolLayout", () => ({
  FieldKitToolLayout: ({ children }: { children: React.ReactNode }) => (
    <main>{children}</main>
  ),
}));

vi.mock("@/components/SEO", () => ({
  SEO: () => null,
}));

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    blob: async () =>
      new Blob([JSON.stringify(body)], { type: "application/json" }),
  } as Response;
}

describe("AI tool web acceptance", () => {
  const fetchMock = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = String(input);
      if (
        path === "/api/clinical/ephemeral-sessions" &&
        init?.method === "POST"
      ) {
        return jsonResponse(
          {
            session: {
              id: "10000000-0000-4000-8000-000000000001",
              coverageSnapshotId: "20000000-0000-4000-8000-000000000001",
              expiresAt: "2030-01-01T00:00:00.000Z",
            },
          },
          201,
        );
      }
      if (path.endsWith("/documents/upload-url")) {
        return jsonResponse(
          {
            documentToken: "50000000-0000-4000-8000-000000000001",
            uploadUrl: "https://upload.example.invalid/opaque",
            requiredHeaders: { "Content-Type": "text/plain" },
          },
          201,
        );
      }
      if (path === "https://upload.example.invalid/opaque") {
        return jsonResponse({});
      }
      if (path.endsWith("/complete"))
        return jsonResponse({ scanStatus: "safe" });
      if (path.endsWith("/extract")) {
        return jsonResponse({
          text: "De-identified extracted acceptance text",
        });
      }
      if (path.endsWith("/finalize") || path.endsWith("/ephemeral-runs")) {
        return jsonResponse({
          result: {
            toolId: routeState.toolId,
            output: { acceptance: "passed" },
            createdAt: "2030-01-01T00:00:00.000Z",
            watermark: "Educational decision support only.",
            retention: "ephemeral",
            recoverable: false,
          },
        });
      }
      if (path === "/api/clinical/coverage/snapshots") {
        return jsonResponse({
          operationMode: "phi",
          required: true,
          allowsDocumentUpload: true,
          snapshots: [
            {
              id: "20000000-0000-4000-8000-000000000001",
              title: "Acceptance LCD",
              documentId: "L00001",
              version: "1",
            },
          ],
        });
      }
      if (path.endsWith("/runs") && init?.method === "POST") {
        return jsonResponse(
          {
            run: {
              id: "30000000-0000-4000-8000-000000000001",
              toolId: routeState.toolId,
              status: "completed",
              output: { acceptance: "passed" },
              reviewStatus: routeState.toolId.includes("lcd")
                ? "pending"
                : "not_required",
              createdAt: "2030-01-01T00:00:00.000Z",
            },
          },
          201,
        );
      }
      if (path.endsWith("/runs")) return jsonResponse({ runs: [] });
      return jsonResponse({});
    },
  );

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("crypto", {
      randomUUID: () => "40000000-0000-4000-8000-000000000001",
    });
  });

  afterEach(() => {
    cleanup();
    fetchMock.mockClear();
    vi.unstubAllGlobals();
  });

  it.each(SPARTAN_AI_TOOLS)(
    "$id renders its dedicated form and submits through its API contract",
    async (tool) => {
      routeState.toolId = tool.id;
      render(<AiToolPage />);

      expect(
        screen.getByRole("heading", { name: tool.name, level: 1 }),
      ).toBeTruthy();
      for (const field of tool.fields) {
        expect(
          screen.getByLabelText(
            field.required ? `${field.label} *` : field.label,
          ),
        ).toBeTruthy();
      }

      const runButton = screen.getByRole("button", {
        name: `Run ${tool.name}`,
      });
      await waitFor(() =>
        expect((runButton as HTMLButtonElement).disabled).toBe(false),
      );
      if (tool.id === "medical-record-lcd-verifier") {
        const upload = document.querySelector(
          'input[type="file"]',
        ) as HTMLInputElement;
        const file = new File(["de-identified"], "local-only.txt", {
          type: "text/plain",
        });
        fireEvent.change(upload, { target: { files: [file] } });
        await waitFor(() =>
          expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining(
              "/documents/50000000-0000-4000-8000-000000000001/extract",
            ),
            expect.objectContaining({ method: "POST" }),
          ),
        );
      }
      fireEvent.click(runButton);

      await waitFor(() => {
        const expectedPath = tool.containsPhi
          ? tool.id === "medical-record-lcd-verifier"
            ? "/api/clinical/ephemeral-sessions/10000000-0000-4000-8000-000000000001/finalize"
            : `/api/ai-tools/${tool.id}/ephemeral-runs`
          : `/api/ai-tools/${tool.id}/runs`;
        expect(fetchMock).toHaveBeenCalledWith(
          expectedPath,
          expect.objectContaining({
            method: "POST",
            ...(tool.containsPhi
              ? {}
              : {
                  headers: expect.objectContaining({
                    "Idempotency-Key": "40000000-0000-4000-8000-000000000001",
                  }),
                }),
          }),
        );
      });
      expect(await screen.findByText("acceptance")).toBeTruthy();
      expect(screen.getByText("passed")).toBeTruthy();
    },
  );

  it("shows a safe retryable error without exposing provider details", async () => {
    routeState.toolId = "email-optimizer";
    fetchMock.mockImplementationOnce(async () => jsonResponse({ runs: [] }));
    fetchMock.mockImplementationOnce(async () =>
      jsonResponse(
        {
          error: {
            code: "PROVIDER_RATE_LIMITED",
            message: "AI service is busy. Try again shortly.",
            retryable: true,
          },
        },
        429,
      ),
    );
    render(<AiToolPage />);
    fireEvent.click(
      screen.getByRole("button", { name: "Run Email Optimizer" }),
    );
    expect(
      await screen.findByText("AI service is busy. Try again shortly."),
    ).toBeTruthy();
    expect(document.body.textContent).not.toContain("stack");
    expect(document.body.textContent).not.toContain("apiKey");
  });
});
