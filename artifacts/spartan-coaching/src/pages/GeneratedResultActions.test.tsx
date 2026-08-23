import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import Research from "./Research";
import Transcribe from "./Transcribe";

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
}));

vi.mock("@/components/FieldKitToolLayout", () => ({
  FieldKitToolLayout: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));
vi.mock("@/components/SEO", () => ({ SEO: () => null }));
vi.mock("@/components/CoachingCTA", () => ({ CoachingCTA: () => null }));
vi.mock("@/components/LeadGateDialog", () => ({ LeadGateDialog: () => null }));
vi.mock("@/hooks/use-lead-gate", () => ({
  useLeadGate: () => ({
    capture: (work: () => unknown) => work(),
    gateState: {},
  }),
}));

function jsonResponse(body: unknown) {
  return {
    ok: true,
    json: async () => body,
  } as Response;
}

describe("standalone generated-result actions", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    cleanup();
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("shows a visible research handoff after a successful result", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        text: "Verified referral-source insight.",
        sources: [{ title: "Source", uri: "https://example.com/source" }],
      }),
    );
    render(<Research />);

    fireEvent.change(screen.getByTestId("input-research-query"), {
      target: { value: "How do I prepare a physician follow-up?" },
    });
    fireEvent.click(screen.getByTestId("button-search"));

    const action = await screen.findByTestId("research-next-action-build-playbook");
    expect(action.getAttribute("href")).toBe("/tools/playbooks");
    expect(screen.getByText(/not automatically saved to my work/i)).toBeTruthy();
  });

  it("hands a completed transcript to coaching, then to role-play", async () => {
    fetchMock.mockImplementation(async (path: string) => {
      if (path === "/api/transcribe/analyze") {
        return jsonResponse({ analysis: "Lead with a clearer next-step ask." });
      }
      return jsonResponse({ transcript: "A short deidentified sales-call transcript." });
    });
    render(<Transcribe />);

    const recordTab = screen.getByTestId("tab-record");
    recordTab.focus();
    fireEvent.keyDown(recordTab, { key: "ArrowRight" });
    await waitFor(() =>
      expect(screen.getByTestId("tab-upload").getAttribute("data-state")).toBe("active"),
    );
    const file = new File(["audio"], "practice-call.webm", { type: "audio/webm" });
    fireEvent.change(screen.getByTestId("input-audio-file"), {
      target: { files: [file] },
    });

    const analyze = await screen.findByTestId("transcript-next-action-analyze");
    expect(analyze).toBeTruthy();
    expect(screen.getByText(/not automatically added to my work or synced to iphone/i)).toBeTruthy();
    fireEvent.click(analyze);

    const practice = await screen.findByTestId(
      "transcribe-analysis-next-action-practice-coaching-point",
    );
    expect(practice.getAttribute("href")).toBe("/tools/role-play");
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/transcribe/analyze",
        expect.objectContaining({ method: "POST" }),
      ),
    );
  });
});