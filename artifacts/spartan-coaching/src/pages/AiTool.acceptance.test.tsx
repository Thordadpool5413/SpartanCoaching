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
}));

vi.mock("@/components/FieldKitToolLayout", () => ({
  FieldKitToolLayout: ({
    children,
  }: {
    children: React.ReactNode;
  }) => <main>{children}</main>,
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
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = String(input);
    if (path === "/api/clinical/cases") {
      return jsonResponse({
        cases: [
          {
            id: "10000000-0000-4000-8000-000000000001",
            label: "De-identified acceptance case",
            retentionUntil: "2030-01-01T00:00:00.000Z",
          },
        ],
      });
    }
    if (path === "/api/clinical/coverage/snapshots") {
      return jsonResponse({
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
  });

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
      fireEvent.click(runButton);

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          `/api/ai-tools/${tool.id}/runs`,
          expect.objectContaining({
            method: "POST",
            headers: expect.objectContaining({
              "Idempotency-Key":
                "40000000-0000-4000-8000-000000000001",
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
