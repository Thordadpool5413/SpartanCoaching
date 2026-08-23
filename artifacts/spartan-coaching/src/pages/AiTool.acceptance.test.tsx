import React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  SPARTAN_AI_TOOLS,
  getAiToolExperience,
  type AiToolExperience,
} from "@workspace/spartan-ai-tools";
import AiToolPage from "./AiTool";

const routeState = vi.hoisted(() => ({ toolId: "" }));

vi.mock("wouter", () => ({
  Link: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  useParams: () => ({ toolId: routeState.toolId }),
  useLocation: () => ["/tools/ai/test", vi.fn()],
}));

vi.mock("@/components/FieldKitToolLayout", () => ({
  FieldKitToolLayout: ({ children }: { children: React.ReactNode }) => (
    <main>{children}</main>
  ),
}));

vi.mock("@/components/SEO", () => ({ SEO: () => null }));

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    blob: async () => new Blob([JSON.stringify(body)], { type: "application/json" }),
  } as Response;
}

function completeRequiredFields(experience: AiToolExperience) {
  for (const field of experience.fields.filter((item) => item.required)) {
    if (field.kind === "single-choice" || field.kind === "multi-choice") {
      const option = field.options?.[0];
      if (!option) throw new Error(`${field.key} needs a test option`);
      const role = field.kind === "single-choice" ? "radio" : "checkbox";
      const control = screen.getAllByRole(role, { name: option })[0];
      if (control.getAttribute("aria-checked") !== "true") fireEvent.click(control);
      continue;
    }
    const control = screen.getByLabelText(`${field.label} *`);
    if (!(control as HTMLInputElement).value) {
      fireEvent.change(control, {
        target: { value: field.kind === "number" ? "5" : `Useful ${field.label.toLowerCase()} context` },
      });
    }
  }
}

describe("AI tool web acceptance", () => {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = String(input);
    if (path.endsWith("/ephemeral-runs")) {
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
    if (path.endsWith("/runs") && init?.method === "POST") {
      return jsonResponse({
        run: {
          id: "30000000-0000-4000-8000-000000000001",
          toolId: routeState.toolId,
          status: "completed",
          output: { acceptance: "passed" },
          reviewStatus: routeState.toolId.includes("lcd") ? "pending" : "not_required",
          createdAt: "2030-01-01T00:00:00.000Z",
        },
      }, 201);
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
    "$id renders its guided form and submits through its API contract",
    async (tool) => {
      routeState.toolId = tool.id;
      const experience = getAiToolExperience(tool.id);
      render(<AiToolPage />);

      expect(screen.getByRole("heading", { name: experience.title ?? tool.name, level: 1 })).toBeTruthy();
      for (const field of experience.fields) {
        expect(screen.getByText(field.required ? `${field.label} *` : field.label)).toBeTruthy();
      }
      expect(document.body.textContent).not.toContain("Structured data is supported here");
      expect(document.body.textContent).not.toContain("Learner ID");

      completeRequiredFields(experience);
      if (tool.containsPhi) {
        fireEvent.click(screen.getByLabelText("I confirm this input is deidentified and contains no patient documents."));
      }
      const runButton = screen.getByRole("button", { name: experience.submitLabel });
      await waitFor(() => expect((runButton as HTMLButtonElement).disabled).toBe(false));
      fireEvent.click(runButton);

      await waitFor(() => {
        const expectedPath = tool.containsPhi
          ? `/api/ai-tools/${tool.id}/ephemeral-runs`
          : `/api/ai-tools/${tool.id}/runs`;
        expect(fetchMock).toHaveBeenCalledWith(
          expectedPath,
          expect.objectContaining({
            method: "POST",
            ...(tool.containsPhi ? {} : {
              headers: expect.objectContaining({
                "Idempotency-Key": "40000000-0000-4000-8000-000000000001",
              }),
            }),
          }),
        );
      });
      expect(await screen.findByText(/^Acceptance$/i)).toBeTruthy();
      expect(screen.getByText("passed")).toBeTruthy();
      expect(screen.getByTestId("ai-tool-result-actions")).toBeTruthy();
      expect(
        screen.getByText(/one-time, deidentified result|retained in recent runs/i),
      ).toBeTruthy();
    },
  );

  it("shows a safe retryable error without exposing provider details", async () => {
    routeState.toolId = "email-optimizer";
    const experience = getAiToolExperience("email-optimizer");
    fetchMock.mockImplementationOnce(async () => jsonResponse({ runs: [] }));
    fetchMock.mockImplementationOnce(async () => jsonResponse({
      error: {
        code: "PROVIDER_RATE_LIMITED",
        message: "AI service is busy. Try again shortly.",
        retryable: true,
      },
    }, 429));
    render(<AiToolPage />);
    completeRequiredFields(experience);
    fireEvent.click(screen.getByRole("button", { name: experience.submitLabel }));
    expect(await screen.findByText("AI service is busy. Try again shortly.")).toBeTruthy();
    expect(document.body.textContent).not.toContain("stack");
    expect(document.body.textContent).not.toContain("apiKey");
  });
});
